"""
Build future Taiwan power plant files (2030, 2034) from today's fleet.

Starts from ``data/custom_powerplants.csv`` (today's fleet, built by
``build_custom_powerplants.py``) and applies the government plan in the MOEA
National Power Supply-Demand Report, 2025 edition
(https://data.gov.tw/dataset/16437):

- Thermal units: ``official/moea_thermal_schedule_2024_2034.csv``, transcribed
  from Figure 3-3 (additions and retirements by unit and month). A unit counts
  for model year Y if it is in service on 1 July of Y, at the summer peak.
  Units already in today's fleet (``in_base_fleet = yes``) are not added again,
  and retirements of units no longer in the fleet are skipped.
- Renewables: ``official/taiwan_projections_targets.csv`` (Table 3-1 targets for
  2030 and 2032; the 2032 targets are held for 2034). Existing solar, wind and
  conventional hydro rows are scaled to the target, so new capacity goes where
  today's capacity is. Pumped hydro and batteries stay as they are.
- Geothermal and biomass are added as new rows (today's fleet leaves them out):
  geothermal at the Yilan Qingshui site, biomass and waste split evenly over the
  six special municipalities. Both locations are assumptions.

Nuclear stays at 0, as in the report.

Run from the repository root:

    python pypsa_tw/data/build_future_powerplants.py

Writes ``data/custom_powerplants_tw<year>.csv`` and
``pypsa_tw/data/future_fleet_summary.csv``. Point a config at a file with
``electricity.custom_powerplants_file``.
"""

from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
BASE = REPO / "data" / "custom_powerplants.csv"
SCHEDULE = HERE / "official" / "moea_thermal_schedule_2024_2034.csv"
TARGETS = HERE / "official" / "taiwan_projections_targets.csv"
YEARS = [2030, 2034]
# The report gives renewable targets for 2030 and 2032; later years hold the 2032 value.
TARGET_YEAR = {2030: 2030, 2034: 2032}

GEOTHERMAL_SITE = (24.6121, 121.6369)  # Qingshui geothermal plant, Yilan (OSM w709894062)
BIOMASS_COUNTIES = ["臺北市", "新北市", "桃園市", "臺中市", "臺南市", "高雄市"]


def before_july(year, month, model_year):
    """The event (addition, or retirement at the end of that month) happens before 1 July of the model year."""
    return (year, month) < (model_year, 7)


def target_mw(targets, series, model_year):
    row = targets[(targets.series == series) & (targets.year == str(TARGET_YEAR[model_year]))]
    assert len(row) == 1, (series, model_year)
    return float(row.value.iloc[0]) * 1000


def scale_rows(ppl, mask, total_mw):
    current = ppl.loc[mask, "Capacity"].sum()
    ppl.loc[mask, "Capacity"] = (ppl.loc[mask, "Capacity"] * total_mw / current).round(1)
    return current


def new_row(template, **values):
    row = {c: None for c in template.columns}
    row.update(Set="PP", Country="TW", **values)
    return row


def build(model_year, base, schedule, targets):
    ppl = base.copy()
    log = []

    retire = schedule[(schedule.action == "retire") & (schedule.in_base_fleet == "yes")]
    for r in retire.itertuples():
        if before_july(r.year, r.month, model_year):
            idx = ppl.index[ppl.Name == r.plant]
            assert len(idx) == 1, r.plant
            ppl.loc[idx, "Capacity"] -= r.mw
            log.append(("retire", r.unit_en, -r.mw))
    ppl["Capacity"] = ppl.Capacity.round(1)
    ppl = ppl[ppl.Capacity > 0.05]

    add = schedule[(schedule.action == "add") & (schedule.in_base_fleet == "no")]
    rows = []
    for r in add.itertuples():
        if before_july(r.year, r.month, model_year):
            rows.append(new_row(ppl, Name=r.plant, Fueltype=r.fueltype, Technology=r.technology,
                                Capacity=r.mw, DateIn=r.year, lat=r.lat, lon=r.lon))
            log.append(("add", r.unit_en, r.mw))

    for label, mask, series in [
        ("solar", ppl.Fueltype == "Solar", "re_capacity_solar"),
        ("offshore wind", (ppl.Fueltype == "Wind") & (ppl.Technology == "Offshore"), "re_capacity_offwind"),
        ("onshore wind", (ppl.Fueltype == "Wind") & (ppl.Technology == "Onshore"), "re_capacity_onwind"),
        ("hydro", (ppl.Fueltype == "Hydro") & (ppl.Technology != "Pumped Storage"), "re_capacity_hydro"),
    ]:
        total = target_mw(targets, series, model_year)
        before = scale_rows(ppl, mask, total)
        log.append(("scale", label, round(total - before, 1)))

    geo = target_mw(targets, "re_capacity_geothermal", model_year)
    rows.append(new_row(ppl, Name="Geothermal (Yilan, assumed)", Fueltype="Geothermal", Technology="Geothermal",
                        Capacity=geo, DateIn=model_year, lat=GEOTHERMAL_SITE[0], lon=GEOTHERMAL_SITE[1]))
    log.append(("add", "geothermal", geo))
    bio = target_mw(targets, "re_capacity_biomass", model_year)
    for county in BIOMASS_COUNTIES:
        solar = ppl[ppl.Name == f"Solar {county}"]
        assert len(solar) == 1, county
        rows.append(new_row(ppl, Name=f"Biomass and waste {county} (assumed)", Fueltype="Bioenergy",
                            Technology="Steam Turbine", Capacity=round(bio / len(BIOMASS_COUNTIES), 1),
                            DateIn=model_year, lat=solar.lat.iloc[0], lon=solar.lon.iloc[0]))
    log.append(("add", "biomass and waste", bio))

    ppl = pd.concat([ppl, pd.DataFrame(rows)], ignore_index=True)[base.columns]
    return ppl, log


def main():
    base = pd.read_csv(BASE, index_col=0)
    schedule = pd.read_csv(SCHEDULE)
    targets = pd.read_csv(TARGETS, dtype={"year": str})

    # Figure 3-3 totals for 2025-2034 as stated in the report (Section 3.3): +25,163 MW, -12,941 MW.
    later = schedule[schedule.year >= 2025]
    assert round(later[later.action == "add"].mw.sum()) == 25163
    assert round(later[later.action == "retire"].mw.sum()) == 12941

    summary = []
    for year in YEARS:
        ppl, log = build(year, base, schedule, targets)
        out = REPO / "data" / f"custom_powerplants_tw{year}.csv"
        ppl.to_csv(out)
        by_type = ppl.groupby("Fueltype").Capacity.sum() / 1000
        print(f"{year}: {len(ppl)} plants, {ppl.Capacity.sum() / 1000:.2f} GW -> {out.relative_to(REPO)}")
        print(by_type.round(2).to_string())
        for step in log:
            print("   ", *step)
        for fueltype, gw in by_type.items():
            summary.append({"year": year, "fueltype": fueltype, "capacity_gw": round(gw, 3)})
    today = base.groupby("Fueltype").Capacity.sum() / 1000
    summary += [{"year": "today", "fueltype": f, "capacity_gw": round(gw, 3)} for f, gw in today.items()]
    pd.DataFrame(summary).to_csv(HERE / "future_fleet_summary.csv", index=False)


if __name__ == "__main__":
    main()
