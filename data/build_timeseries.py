"""
Build ``pypsa_tw/data/taiwan_timeseries.csv``: Taiwan electricity data by year,
labelled as history, projection or target.

Inputs (``pypsa_tw/data/official/``):

- ``moeaea_generation_by_source_annual.csv``: Energy Administration, generation
  by source 2005-2025 (https://data.gov.tw/dataset/16481)
- ``moeaea_capacity_by_source_annual.csv``: capacity by source 2005-2025
  (https://data.gov.tw/dataset/16480)
- ``moeaea_energy_indicators_annual.csv``: energy indicators 2005-2025
  (https://data.gov.tw/dataset/8308)
- ``taipower_peak_load_by_year.csv``: Taipower peak load 1982-2025
  (https://data.gov.tw/dataset/8307)
- ``taiwan_projections_targets.csv``: projections and targets transcribed from the
  MOEA National Power Supply-Demand Report 113年度 (Tables 3-1, 3-2), plus policy targets

Every row carries a ``source_id`` (see ``sources.csv``: publisher, edition, links,
local copy, checksum) and a ``locator`` (table and page, or file column).
- ``moea_thermal_schedule_2024_2034.csv``: the same report's unit-by-unit plan of
  thermal additions and retirements (Figure 3-3)
- GEGIS demand projections shipped with PyPSA-Earth
  (``data/ssp2-2.6/<year>/era5_2013/Asia.csv``)

Run from the repository root:

    python pypsa_tw/data/build_timeseries.py
"""

from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
OFF = HERE / "official"
OUT = HERE / "taiwan_timeseries.csv"

# Source ids from sources.csv (the registry of every source used here, with its
# publisher, edition, links, local copy and checksum).
GEN, CAP, IND, PEAK = "moeaea_generation_annual", "moeaea_capacity_annual", "moeaea_indicators_annual", "taipower_peak_annual"
SOURCES_FILE = HERE / "sources.csv"

# (column stem in the Energy Administration files, series id, English, Chinese)
SOURCES = [
    ("火力_燃煤", "coal", "Coal", "燃煤"),
    ("火力_燃氣", "gas", "Gas", "燃氣"),
    ("火力_燃油", "oil", "Oil", "燃油"),
    ("核能", "nuclear", "Nuclear", "核能"),
    ("再生能源_慣常水力", "hydro", "Conventional hydro", "慣常水力"),
    ("再生能源_太陽光電", "solar", "Solar PV", "太陽光電"),
    ("再生能源_風力", "wind", "Wind", "風力"),
    ("再生能源_地熱", "geothermal", "Geothermal", "地熱"),
    ("再生能源_生質能", "biomass", "Biomass", "生質能"),
    ("再生能源_廢棄物", "waste", "Waste", "廢棄物"),
    ("抽蓄水力", "pumped_storage", "Pumped storage", "抽蓄水力"),
]

INDICATORS = [
    ("再生能源發電占總發電量比例(%)", "re_share", "Renewable share of generation", "再生能源發電占比", "%"),
    ("再生能源裝置容量占總裝置容量比例(%)", "re_capacity_share", "Renewable share of capacity", "再生能源裝置容量占比", "%"),
    ("電力排碳係數(公斤CO2e/度)", "grid_emission_factor", "Grid emission factor", "電力排碳係數", "kg CO2e/kWh"),
    ("燃料燃燒二氧化碳排放量(百萬公噸)", "co2_fuel_combustion", "CO2 from fuel combustion (all sectors)", "燃料燃燒二氧化碳排放量", "Mt"),
    ("負載率(%)", "load_factor", "System load factor", "負載率", "%"),
    ("線路損失率(%)", "line_losses", "Line losses", "線路損失率", "%"),
    ("進口能源依存度(%)", "import_dependence", "Imported energy dependence", "進口能源依存度", "%"),
]


def load_sources():
    """Source registry; checks that each local copy still matches its recorded checksum."""
    import hashlib

    src = pd.read_csv(SOURCES_FILE, dtype=str).fillna("").set_index("source_id")
    for sid, r in src.iterrows():
        if r.local_file and r.sha256:
            digest = hashlib.sha256((HERE / r.local_file).read_bytes()).hexdigest()
            assert digest == r.sha256, f"{sid}: {r.local_file} changed since it was registered"
    return src


REG = load_sources()


def row(series, en, zh, kind, year, value, unit, scope, source_id, locator="", note="", evidence=None):
    src = REG.loc[source_id]
    return {"series": series, "indicator_en": en, "indicator_zh": zh, "kind": kind, "year": year,
            "value": round(float(value), 4), "unit": unit, "scope": scope, "source_id": source_id,
            "source_name": src.short_cite, "locator": locator, "link": src.landing_url,
            "evidence": evidence or src.evidence, "note": note}


def main():
    rows = []
    gen = pd.read_csv(OFF / "moeaea_generation_by_source_annual.csv", encoding="utf-8-sig").set_index("西元年")
    cap = pd.read_csv(OFF / "moeaea_capacity_by_source_annual.csv", encoding="utf-8-sig").set_index("西元年")
    ind = pd.read_csv(OFF / "moeaea_energy_indicators_annual.csv", encoding="utf-8-sig").set_index("西元年")
    peak = pd.read_csv(OFF / "taipower_peak_load_by_year.csv", encoding="utf-8-sig").set_index("年度")

    for year in gen.index:
        rows.append(row("generation_total", "Total generation", "總發電量", "history", year,
                        gen.loc[year, "總發電量_全國(統計數值)"] / 1e3, "TWh", "Taiwan (national)", GEN, "column 總發電量_全國(統計數值)",
                        note="Gross generation including self-generation"))
        tpc = gen.loc[year, "總發電量_台電(統計數值)"] + gen.loc[year, "總發電量_民營電廠(統計數值)"]
        rows.append(row("generation_taipower_ipp", "Generation, Taipower + IPPs", "台電及民營電廠發電量", "history", year,
                        tpc / 1e3, "TWh", "Taipower system", GEN, "columns 總發電量_台電 + 總發電量_民營電廠 (統計數值)",
                        note="Taipower-owned plus independent power producers; excludes power bought from self-generators"))
        for stem, sid, en, zh in SOURCES:
            col = f"{stem}_全國(統計數值)"
            if col in gen.columns:
                rows.append(row(f"generation_{sid}", f"Generation: {en}", f"發電量：{zh}", "history", year,
                                gen.loc[year, col] / 1e3, "TWh", "Taiwan (national)", GEN, f"column {col}"))
    for year in cap.index:
        rows.append(row("capacity_total", "Installed capacity", "裝置容量", "history", year,
                        cap.loc[year, "總發電裝置容量_全國(統計數值)"] / 1e3, "GW", "Taiwan (national)", CAP, "column 總發電裝置容量_全國(統計數值)",
                        note="Includes self-generation"))
        for stem, sid, en, zh in SOURCES:
            col = f"{stem}_全國(統計數值)"
            if col in cap.columns:
                rows.append(row(f"capacity_{sid}", f"Capacity: {en}", f"裝置容量：{zh}", "history", year,
                                cap.loc[year, col] / 1e3, "GW", "Taiwan (national)", CAP, f"column {col}"))
    for year in ind.index:
        for col, sid, en, zh, unit in INDICATORS:
            if pd.notna(ind.loc[year, col]):
                rows.append(row(sid, en, zh, "history", year, ind.loc[year, col], unit, "Taiwan (national)", IND, f"column {col}"))
    for year in peak.index:
        rows.append(row("peak_load", "Peak load (day)", "尖峰負載（日間）", "history", year,
                        peak.loc[year, "尖峰負載(MW)"] / 1e3, "GW", "Taipower system", PEAK, "column 尖峰負載(MW)"))
        rows.append(row("reserve_margin", "Reserve margin", "備用容量率", "history", year,
                        peak.loc[year, "備用容量率(％)"], "%", "Taipower system", PEAK, "column 備用容量率(％)",
                        note="Night-time reserve margin from 2022" if year >= 2022 else ""))

    # Projections and targets transcribed from the report (numeric years only here).
    pt = pd.read_csv(OFF / "taiwan_projections_targets.csv", dtype={"year": str})
    for _, r in pt.iterrows():
        if not r.year.isdigit():
            continue
        try:
            value = float(r.value)
        except ValueError:
            continue
        unit, v = r.unit, value
        if unit == "MW":
            unit, v = "GW", value / 1e3
        series = {"re_capacity_solar": "capacity_solar", "re_capacity_offwind": "capacity_offshore_wind",
                  "re_capacity_onwind": "capacity_onshore_wind", "re_capacity_geothermal": "capacity_geothermal",
                  "re_capacity_biomass": "capacity_biomass_waste", "re_capacity_hydro": "capacity_hydro",
                  "re_capacity_total": "capacity_renewables"}.get(r.series, r.series)
        rows.append(row(series, r.indicator_en, r.indicator_zh, r.kind, int(r.year), v, unit, r.scope,
                        r.source_id, r.locator if isinstance(r.locator, str) else "",
                        note=r.note if isinstance(r.note, str) else "", evidence=r.evidence))

    # Thermal plan by year (Figure 3-3 of the report, transcribed unit by unit).
    sched = pd.read_csv(OFF / "moea_thermal_schedule_2024_2034.csv")
    fuel = {"CCGT": ("gas", "gas", "燃氣"), "Hard Coal": ("coal", "coal", "燃煤"), "Oil": ("oil", "oil", "燃油")}
    for (action, ft, year), g in sched.groupby(["action", "fueltype", "year"]):
        sid, en, zh = fuel[ft]
        verb_en, verb_zh = ("additions", "新增") if action == "add" else ("retirements", "除役")
        rows.append(row(f"planned_{action}_{sid}", f"Planned {en} {verb_en}", f"{zh}機組{verb_zh}規劃", "projection",
                        int(year), g.mw.sum() / 1e3, "GW", "Taipower system", "moea_psd_fy2024",
                        "Figure 3-3, p. 18 (PDF p. 22); transcribed in official/moea_thermal_schedule_2024_2034.csv",
                        note="Units: " + ", ".join(f"{u} ({m:g} MW, month {mo})"
                                                   for u, m, mo in zip(g.unit_en, g.mw, g.month))))

    # PyPSA-Earth default demand projection (GEGIS, SSP2-2.6, 2013 weather).
    for year in [2030, 2040, 2050]:
        f = REPO / "data" / "ssp2-2.6" / str(year) / "era5_2013" / "Asia.csv"
        if not f.exists():
            continue
        d = pd.read_csv(f, sep=";")
        tw = d[d.region_code.astype(str) == "TW"]["Electricity demand"]
        rows.append(row("gegis_demand", "Electricity demand (PyPSA-Earth default)", "電力需求（PyPSA-Earth 預設）",
                        "projection", year, tw.sum() / 1e6, "TWh", "Taiwan (national)", "gegis_ssp2_26",
                        "data/ssp2-2.6/<year>/era5_2013/Asia.csv, region TW, sum of hourly values",
                        note="Unscaled GEGIS projection; the model scales the 2030 profile by 0.749"))
        rows.append(row("gegis_peak", "Peak demand (PyPSA-Earth default)", "尖峰需求（PyPSA-Earth 預設）",
                        "projection", year, tw.max() / 1e3, "GW", "Taiwan (national)", "gegis_ssp2_26",
                        "data/ssp2-2.6/<year>/era5_2013/Asia.csv, region TW, maximum hourly value",
                        note="Hourly peak of the unscaled GEGIS profile"))

    # Official demand path: the report's 1.7%/yr growth applied to 2024 national generation.
    base = gen.loc[2024, "總發電量_全國(統計數值)"] / 1e3
    for year in range(2025, 2035):
        rows.append(row("generation_forecast", "Generation, official growth rate applied", "發電量（依官方成長率推估）",
                        "projection", year, base * 1.017 ** (year - 2024), "TWh", "Taiwan (national)",
                        "derived_moea_growth", "1.7%/yr: moea_psd_fy2024, Section 3.1(1), p. 7 (PDF p. 11); 2024 base: moeaea_generation_annual",
                        note="Not published as such: the report's average growth rate applied to 2024 national generation"))

    out = pd.DataFrame(rows).sort_values(["series", "year", "kind"])
    out.to_csv(OUT, index=False, encoding="utf-8")
    print(f"wrote {len(out)} rows, {out.series.nunique()} series to {OUT.relative_to(REPO)}")
    print(out.groupby("kind").size().to_string())


if __name__ == "__main__":
    main()
