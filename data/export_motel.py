"""
Export the collected Taiwan energy data as MOTEL staging records.

MOTEL (https://github.com/uesl-empa/motel-platform) is an open technology
database for energy system models. Its Step 1 ("ingest") format is the
*unmapped* staging record: raw values with provenance, before harmonisation
into MOTEL's controlled vocabularies. This script writes:

- ``motel/unmapped_entity/unmapped_entities_taiwan_fleet.yaml``: one
  technology-bound record per technology in Taiwan's power plant fleet
  (installed capacity, plant list, storage hours, new-unit ratings).
- ``motel/unmapped_entity/unmapped_entities_taiwan_solar_approvals.yaml``: one
  record per county with yearly solar PV approvals, 2015-2025.
- ``motel/unmapped_carrier_data/unmapped_carrier_data_taiwan_electricity.yaml``:
  carrier-bound records for Taiwan electricity (peak load, annual generation,
  generation mix).
- ``motel/unmapped_entity/unmapped_entities_taiwan_capacity_history.yaml``:
  national capacity per technology by year, 2005-2025, plus 2030/2032 targets.
- ``motel/unmapped_carrier_data/unmapped_carrier_data_taiwan_history_projections.yaml``:
  generation by source (history), demand and peak outlook, emissions and
  indicators, from ``taiwan_timeseries.csv``.

Run from the repository root after ``build_custom_powerplants.py``, then check
the output with MOTEL's validator (vendored in ``motel/tools``):

    python pypsa_tw/data/export_motel.py
    python pypsa_tw/data/motel/tools/validate_unmapped.py pypsa_tw/data/motel \
        --schema-dir pypsa_tw/data/motel/tools/schema
"""

import json
from pathlib import Path

import pandas as pd
import yaml

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
OUT = HERE / "motel"
OFFICIAL = HERE / "official"

SCHEMA_VERSION = "0.2.0"
ACCESS_DATE = "2026-09-24"
PROJECT = "PyPSA-Earth Taiwan (pypsa_tw)"

TAIPOWER_UNITS = {
    "source_name": "Taipower_realtime_units_2026-09-24",
    "source_description": "Taiwan Power Company, real-time generation by unit including purchased power "
                          "(台灣電力公司各機組發電量即時資訊(含外購電力)), government open data dataset 8931.",
    "link": "https://data.gov.tw/dataset/8931",
    "source_type": "dataset",
    "access_date": ACCESS_DATE,
    "confidence_level": "high (official operator data)",
    "reference_year": 2026,
    "assessment_method": "Downloaded JSON snapshot; units summed per plant. Units shown as '-' are not "
                         "counted, except new units added with sourced ratings.",
    "source_locator": "pypsa_tw/data/official/taipower_units_20260924.json, field 裝置容量(MW)",
}

# Fleet technologies: (Fueltype, Technology) -> MOTEL-style description fields.
FLEET_TECHNOLOGIES = {
    ("CCGT", "CCGT"): ("Natural gas combined cycle (CCGT)", "conversion", "fossil_fuel", "natural gas", "electricity"),
    ("OCGT", "OCGT"): ("Natural gas open cycle gas turbine (OCGT)", "conversion", "fossil_fuel", "natural gas", "electricity"),
    ("Hard Coal", "Steam Turbine"): ("Hard coal steam turbine", "conversion", "fossil_fuel", "hard coal", "electricity"),
    ("Oil", "Steam Turbine"): ("Fuel oil steam turbine", "conversion", "fossil_fuel", "fuel oil", "electricity"),
    ("Oil", "OCGT"): ("Oil-fired gas turbine", "conversion", "fossil_fuel", "fuel oil", "electricity"),
    ("Solar", "Pv"): ("Solar photovoltaic", "conversion", "renewable", "solar irradiation", "electricity"),
    ("Wind", "Onshore"): ("Onshore wind turbine", "conversion", "renewable", "wind", "electricity"),
    ("Wind", "Offshore"): ("Offshore wind turbine", "conversion", "renewable", "wind", "electricity"),
    ("Hydro", "Run-Of-River"): ("Run-of-river hydropower", "conversion", "renewable", "water inflow", "electricity"),
    ("Hydro", "Reservoir"): ("Reservoir hydropower", "conversion", "renewable", "water inflow", "electricity"),
    ("Hydro", "Pumped Storage"): ("Pumped hydro storage", "storage", "renewable", "electricity", "electricity"),
    ("Battery", "Battery"): ("Battery energy storage system", "storage", "other", "electricity", "electricity"),
}


def taiwan_scope(temporal, temporal_description, capacity="national fleet",
                 capacity_description="All plants of this technology counted in the Taipower system"):
    return {
        "geographic_scope": "TW",
        "geographic_scope_description": "Taiwan main-island grid (Taipower system including IPPs); "
                                        "outlying islands (Penghu, Kinmen, Matsu) excluded.",
        "temporal_scope": temporal,
        "temporal_scope_description": temporal_description,
        "capacity_scope": capacity,
        "capacity_scope_description": capacity_description,
        "system_boundary": "net installed capacity as counted by Taipower",
        "system_boundary_description": "Capacity figure published by Taipower per unit; excludes industrial "
                                       "self-generation not sold to Taipower (e.g. Mailiao).",
    }


def metadata(tags, note):
    return {"related_project": PROJECT, "tags": ["taiwan", *tags],
            "other_notes": [f"{ACCESS_DATE}: exported by pypsa_tw/data/export_motel.py", note]}


def fleet_records():
    fleet = pd.read_csv(REPO / "data" / "custom_powerplants.csv", index_col=0)
    supplement = pd.read_csv(HERE / "supplementary_units.csv").query("include == 'yes'")
    # Several Taipower entries can share a display name (e.g. Talin coal units 1 and 2).
    mapping = pd.read_csv(HERE / "taipower_plant_mapping.csv").drop_duplicates("name").set_index("name")
    snapshot = json.loads((OFFICIAL / "taipower_units_20260924.json").read_bytes().decode("utf-8-sig"))["DateTime"]
    records = []
    for (fuel, tech), plants in fleet.groupby(["Fueltype", "Technology"], sort=False):
        name, ttype, category, carrier_in, carrier_out = FLEET_TECHNOLOGIES[(fuel, tech)]
        sources = [TAIPOWER_UNITS]
        attributes = [
            {"attribute_name": "installed_capacity", "value": f"{plants.Capacity.sum():.1f} MW",
             "time_index": snapshot[:10],
             "attribute_notes": f"Unit MW. Sum over {len(plants)} plants or plant groups in the fleet file."},
            {"attribute_name": "number_of_plants", "value": int(len(plants)), "time_index": snapshot[:10],
             "attribute_notes": "Plants or plant groups as aggregated in data/custom_powerplants.csv."},
        ]
        for _, p in plants.sort_values("Capacity", ascending=False).iterrows():
            src = mapping["coord_source"].get(p.Name, "county representative point (GADM 4.1)")
            attributes.append({
                "attribute_name": "installed_capacity_plant", "value": f"{p.Capacity:.1f} MW",
                "time_index": snapshot[:10],
                "attribute_notes": f"Plant: {p.Name}; location {p.lat:.4f} N, {p.lon:.4f} E ({src}); "
                                   f"commissioning year {int(p.DateIn)} "
                                   f"({mapping['datein_source'].get(p.Name, 'approval-weighted year')}).",
            })
        if tech == "Pumped Storage":
            attributes.append({"attribute_name": "storage_duration", "value": "6 h", "time_index": snapshot[:10],
                               "attribute_notes": "Full-load hours for all 10 units with Sun Moon Lake at 732 m."})
            sources.append({"source_name": "e-info_231256_Sun_Moon_Lake_pumped_storage",
                            "source_description": "環境資訊中心: 缺水如何影響供電？水力發電那些小而重要的事",
                            "link": "https://e-info.org.tw/node/231256", "source_type": "article",
                            "access_date": ACCESS_DATE, "confidence_level": "medium (secondary, news)",
                            "assessment_method": "Search result summary", "linked_attribute": ["storage_duration"]})
        if fuel == "CCGT":
            for _, u in supplement.iterrows():
                attributes.append({"attribute_name": "unit_rating", "value": f"{u.capacity_mw:.0f} MW",
                                   "time_index": str(u.source_date),
                                   "attribute_notes": f"Unit {u.unit} (not yet counted by Taipower): {u.note}"})
            for link in sorted(set(supplement.source)):
                sources.append({"source_name": link.split("/")[2] + "_" + link.rstrip("/").split("/")[-1].split(".")[0],
                                "link": link, "source_type": "article", "access_date": ACCESS_DATE,
                                "confidence_level": "medium (secondary, news)",
                                "assessment_method": "Search result summary", "linked_attribute": ["unit_rating"]})
        if fuel == "Solar":
            sources.append({"source_name": "MOEAEA_solar_approvals_by_county",
                            "link": "https://data.gov.tw/dataset/16423", "source_type": "dataset",
                            "access_date": ACCESS_DATE,
                            "assessment_method": "Taipower's solar total spread over counties by their share of "
                                                 "2015-2025 approvals.",
                            "linked_attribute": ["installed_capacity_plant"]})
        records.append({
            "schema_version": SCHEMA_VERSION,
            "technology_name": f"{name} - Taiwan fleet {snapshot[:10]}",
            "technology": {
                "technology_description": f"{name} plants in the Taiwan power system.",
                "technology_type": ttype,
                "technology_category": category,
                "technology_notes": f"PyPSA-Earth fuel type '{fuel}', technology '{tech}'.",
                "process_name": f"{carrier_in} to {carrier_out}" if ttype == "conversion" else "electricity storage",
                "process_type": ttype,
                "process_category": "power",
            },
            "scope": taiwan_scope(snapshot[:10], f"Taipower real-time snapshot {snapshot}"),
            "sources": sources,
            "attributes": attributes,
            "metadata": metadata(["power_plant_fleet", fuel.lower().replace(" ", "_")],
                                 "Same data as data/custom_powerplants.csv used by the PyPSA-Earth Taiwan model."),
            "harmonisation_record": {"mapping_status": "to_be_mapped"},
        })
    return records


def solar_approval_records():
    approvals = pd.read_csv(OFFICIAL / "moeaea_solar_approvals_by_county_kW.csv", index_col=0)
    source = {
        "source_name": "MOEAEA_solar_approvals_by_county",
        "source_description": "經濟部能源署 各年度各縣市太陽光電發電設備同意備案核准情形 (Energy Administration, "
                              "solar PV approvals by county and year), government open data dataset 16423.",
        "link": "https://data.gov.tw/dataset/16423",
        "source_type": "dataset",
        "access_date": ACCESS_DATE,
        "confidence_level": "high (official statistics); approvals, not grid-connected capacity",
        "reference_year": 2025,
        "assessment_method": "Transcribed from the yearly PDFs (column 總計); each year's county sum matches "
                             "the published total.",
        "source_locator": "pypsa_tw/data/official/moeaea_solar_approvals_by_county_pdfs_20251120.zip",
        "linked_attribute": ["approved_capacity"],
    }
    records = []
    for county, row in approvals.iterrows():
        records.append({
            "schema_version": SCHEMA_VERSION,
            "technology_name": f"Solar photovoltaic - approved capacity {county}",
            "technology": {"technology_description": "Solar PV installations approved (同意備案) per year.",
                           "technology_type": "conversion", "technology_category": "renewable",
                           "process_name": "solar irradiation to electricity", "process_type": "conversion",
                           "process_category": "power"},
            "scope": {"geographic_scope": county,
                      "geographic_scope_description": f"{county}, Taiwan (county or special municipality)",
                      "temporal_scope": "2015-2025", "temporal_scope_description": "Calendar years (ROC 104-114)",
                      "capacity_scope": "all approved projects",
                      "system_boundary": "approved capacity (同意備案)",
                      "system_boundary_description": "Capacity of approved projects; differs from completed, "
                                                     "grid-connected capacity.",
                      "scope_notes": "The PDFs were last updated 2021-05-04 to 2026-06-22 depending on the year."},
            "sources": [source],
            "attributes": [{"attribute_name": "approved_capacity", "value": f"{v:.3f} kW", "time_index": str(year),
                            "attribute_notes": "Unit kW. Annual total of monthly approvals."}
                           for year, v in row.items()],
            "metadata": metadata(["solar_pv", "approvals", "county"], "Used as geographic shares for solar."),
            "harmonisation_record": {"mapping_status": "to_be_mapped"},
        })
    return records


def electricity_carrier_records():
    carrier = {"carrier_description": "Grid electricity, Taiwan", "carrier_type": "electricity",
               "carrier_category": "other"}
    peak = pd.read_csv(OFFICIAL / "taipower_peak_load_by_year.csv", encoding="utf-8-sig")
    stats = pd.read_csv(OFFICIAL / "taiwan_electricity_statistics.csv")
    records = [{
        "schema_version": SCHEMA_VERSION,
        "carrier_name": "Electricity",
        "carrier": carrier,
        "data_category": "demand",
        "scope": {"geographic_scope": "TW", "geographic_scope_description": "Taipower system",
                  "temporal_scope": f"{peak['年度'].min()}-{peak['年度'].max()}",
                  "system_boundary": "net peak load (尖峰負載)",
                  "scope_notes": "From 2022 (ROC 111) the reserve margin is the night-time reserve margin."},
        "sources": [{"source_name": "Taipower_peak_load_by_year",
                     "source_description": "台灣電力公司歷年尖峰負載及備用容量率, government open data dataset 8307.",
                     "link": "https://data.gov.tw/dataset/8307", "source_type": "dataset",
                     "access_date": ACCESS_DATE, "confidence_level": "high (official operator data)",
                     "source_locator": "pypsa_tw/data/official/taipower_peak_load_by_year.csv",
                     "linked_attribute": ["peak_load", "reserve_margin"]}],
        "attributes": [a for _, r in peak.iterrows() for a in (
            {"attribute_name": "peak_load", "value": f"{int(r['尖峰負載(MW)'])} MW", "time_index": str(int(r['年度'])),
             "attribute_notes": "Unit MW."},
            {"attribute_name": "reserve_margin", "value": f"{r['備用容量率(％)']} %", "time_index": str(int(r['年度'])),
             "attribute_notes": "Unit %."})],
        "metadata": metadata(["peak_load", "demand"], "Used to check the calibrated demand profile."),
        "harmonisation_record": {"mapping_status": "to_be_mapped"},
    }]
    for (scope, category), group in stats.assign(
        category=stats.statistic.str.startswith("share").map({True: "other", False: "demand"})
    ).groupby(["scope", "category"], sort=False):
        sources, seen = [], set()
        for _, r in group.iterrows():
            if r.source_name in seen:
                continue
            seen.add(r.source_name)
            src = {"source_name": r.source_name.replace(" ", "_"), "source_type": "report or website",
                   "access_date": ACCESS_DATE, "assessment_method": "Search result summary; page not opened",
                   "confidence_level": "to be verified",
                   "linked_attribute": sorted(set(group.loc[group.source_name == r.source_name, "statistic"]))}
            if isinstance(r.link, str):
                src["link"] = r.link
            sources.append(src)
        records.append({
            "schema_version": SCHEMA_VERSION,
            "carrier_name": "Electricity",
            "carrier": carrier,
            "data_category": category,
            "scope": {"geographic_scope": "TW", "geographic_scope_description": scope,
                      "temporal_scope": f"{group.year.min()}-{group.year.max()}",
                      "system_boundary": "annual generation" if category == "demand" else "share of annual generation",
                      "scope_notes": "Taipower system excludes industrial self-generation; national totals include it."},
            "sources": sources,
            "attributes": [{"attribute_name": r.statistic, "value": f"{r.value} {r.unit}", "time_index": str(r.year),
                            "attribute_notes": f"Unit {r.unit}. {r.note}".strip() if isinstance(r.note, str)
                            else f"Unit {r.unit}."} for _, r in group.iterrows()],
            "metadata": metadata(["generation", scope.split()[0].lower()],
                                 "Values were taken from search summaries; verify against the source before reuse."),
            "harmonisation_record": {"mapping_status": "to_be_mapped"},
        })
    return records


# National capacity series (build_timeseries.py) -> MOTEL technology description.
CAPACITY_SERIES = {
    "capacity_coal": ("Hard coal steam turbine", "conversion", "fossil_fuel"),
    "capacity_gas": ("Natural gas power plants (CCGT and OCGT)", "conversion", "fossil_fuel"),
    "capacity_oil": ("Fuel oil power plants", "conversion", "fossil_fuel"),
    "capacity_nuclear": ("Nuclear power plants", "conversion", "nuclear"),
    "capacity_solar": ("Solar photovoltaic", "conversion", "renewable"),
    "capacity_wind": ("Wind turbines (onshore and offshore)", "conversion", "renewable"),
    "capacity_offshore_wind": ("Offshore wind turbine", "conversion", "renewable"),
    "capacity_onshore_wind": ("Onshore wind turbine", "conversion", "renewable"),
    "capacity_hydro": ("Conventional hydropower", "conversion", "renewable"),
    "capacity_pumped_storage": ("Pumped hydro storage", "storage", "renewable"),
    "capacity_geothermal": ("Geothermal power", "conversion", "renewable"),
    "capacity_biomass": ("Biomass power", "conversion", "renewable"),
    "capacity_waste": ("Waste-to-energy", "conversion", "renewable"),
    "capacity_biomass_waste": ("Biomass and waste power", "conversion", "renewable"),
    "capacity_renewables": ("Renewable power (all technologies)", "conversion", "renewable"),
}

EVIDENCE_METHOD = {
    "downloaded": "Official file downloaded and read",
    "page_opened": "Source page opened and read",
    "search_summary": "Search result summary; to be verified",
    "model_input": "Read from PyPSA-Earth input data",
    "derived": "Derived from official figures (see attribute notes)",
}


def _ts_sources(group):
    """One MOTEL source per source id, with the full citation from sources.csv."""
    reg = pd.read_csv(HERE / "sources.csv", dtype=str).fillna("").set_index("source_id")
    out = []
    for sid, g in group.groupby("source_id", sort=False):
        r = reg.loc[sid]
        cite = "; ".join(x for x in [r.title, r.title_en, r.publisher, r.edition, f"published {r.published}" if r.published else ""] if x)
        if r.local_file:
            cite += f"; local copy pypsa_tw/data/{r.local_file}" + (f" (SHA-256 {r.sha256})" if r.sha256 else "")
        locators = sorted(set(x for x in g.locator if isinstance(x, str) and x))
        if locators and not all(x.startswith("column") for x in locators):
            cite += "; locations: " + " | ".join(locators)
        src = {
            "source_name": sid,
            "source_description": cite,
            "source_type": "dataset" if "dataset" in r.landing_url else "report",
            "access_date": r.accessed or ACCESS_DATE,
            "assessment_method": EVIDENCE_METHOD.get(r.evidence, r.evidence),
            "linked_attribute": sorted(set(g.series)),
        }
        if r.file_url or r.landing_url:
            src["link"] = r.file_url or r.landing_url
        out.append(src)
    return out


def _ts_attributes(group):
    attrs = []
    for _, r in group.sort_values(["series", "year"]).iterrows():
        note = f"{r.kind.capitalize()}. Unit {r.unit}. Source {r.source_id}" + (
            f", {r.locator}." if isinstance(r.locator, str) and r.locator else ".")
        if isinstance(r.note, str) and r.note:
            note += " " + r.note
        attrs.append({"attribute_name": r.series, "value": f"{r.value:g} {r.unit}",
                      "time_index": str(r.year), "attribute_notes": note})
    return attrs


def timeseries_records():
    """History (2005-2025), projections and targets from taiwan_timeseries.csv."""
    ts = pd.read_csv(HERE / "taiwan_timeseries.csv", dtype={"year": str})
    tech, carrier = [], []
    for series, (name, ttype, category) in CAPACITY_SERIES.items():
        g = ts[ts.series == series]
        if g.empty:
            continue
        kinds = sorted(set(g.kind))
        years = sorted(g.year)
        tech.append({
            "schema_version": SCHEMA_VERSION,
            "technology_name": f"{name} - Taiwan national capacity {years[0]}-{years[-1]} ({', '.join(kinds)})",
            "technology": {"technology_description": f"Installed capacity of {name.lower()} in Taiwan by year.",
                           "technology_type": ttype, "technology_category": category, "process_category": "power"},
            "scope": {"geographic_scope": "TW", "geographic_scope_description": g.scope.iloc[0],
                      "temporal_scope": f"{years[0]}-{years[-1]}",
                      "temporal_scope_description": "History: end-of-year statistics. Target: government target for that year.",
                      "capacity_scope": "national fleet", "system_boundary": "installed capacity",
                      "scope_notes": "National totals include self-generation (e.g. Mailiao)."},
            "sources": _ts_sources(g),
            "attributes": _ts_attributes(g.assign(series="installed_capacity")),
            "metadata": metadata(["capacity", "history" if "history" in kinds else "target",
                                  series.replace("capacity_", "")],
                                 "Built from pypsa_tw/data/taiwan_timeseries.csv."),
            "harmonisation_record": {"mapping_status": "to_be_mapped"},
        })
    groups = [
        ("demand", "Electricity generation by source, Taiwan national (history)",
         ts.series.str.startswith("generation_") & (ts.kind == "history"), "annual gross generation"),
        ("demand", "Electricity demand and peak load: history and outlook",
         ts.series.isin(["peak_load", "reserve_margin", "night_peak_load", "night_capability", "night_reserve_margin",
                         "generation_forecast", "gegis_demand", "gegis_peak"]), "annual peak and demand"),
        ("emission_intensity", "Electricity emissions: history",
         ts.series.isin(["grid_emission_factor", "co2_fuel_combustion"]),
         "grid emission factor of public supply; CO2 from fuel combustion (all sectors)"),
        ("other", "Electricity system indicators: history and targets",
         ts.series.isin(["re_share", "re_capacity_share", "load_factor", "line_losses", "import_dependence", "storage_grid"]),
         "national indicators and policy targets"),
    ]
    for category, label, mask, boundary in groups:
        g = ts[mask]
        if g.empty:
            continue
        years = sorted(g.year)
        carrier.append({
            "schema_version": SCHEMA_VERSION,
            "carrier_name": "Electricity",
            "carrier": {"carrier_description": f"Grid electricity, Taiwan: {label}", "carrier_type": "electricity",
                        "carrier_category": "other"},
            "data_category": category,
            "scope": {"geographic_scope": "TW", "geographic_scope_description": "; ".join(sorted(set(g.scope))),
                      "temporal_scope": f"{years[0]}-{years[-1]}", "system_boundary": boundary,
                      "scope_notes": "Attribute notes say whether each value is history, projection or target."},
            "sources": _ts_sources(g),
            "attributes": _ts_attributes(g),
            "metadata": metadata(["history_projection", category], "Built from pypsa_tw/data/taiwan_timeseries.csv."),
            "harmonisation_record": {"mapping_status": "to_be_mapped"},
        })
    return tech, carrier


class NoAliasDumper(yaml.SafeDumper):
    """Write shared dicts (e.g. a source used by many records) in full, without &id anchors."""

    def ignore_aliases(self, data):
        return True


def write(path, records, header):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(header)
        yaml.dump(records, f, Dumper=NoAliasDumper, allow_unicode=True, sort_keys=False, width=100)
    print(f"wrote {len(records):3d} records to {path.relative_to(REPO)}")


def main():
    header = (f"# MOTEL unmapped staging records (schema {SCHEMA_VERSION}), exported by "
              f"pypsa_tw/data/export_motel.py on {ACCESS_DATE}.\n"
              "# Raw values with provenance, before MOTEL harmonisation. See pypsa_tw/data/README.md.\n\n")
    write(OUT / "unmapped_entity" / "unmapped_entities_taiwan_fleet.yaml", fleet_records(), header)
    write(OUT / "unmapped_entity" / "unmapped_entities_taiwan_solar_approvals.yaml", solar_approval_records(), header)
    write(OUT / "unmapped_carrier_data" / "unmapped_carrier_data_taiwan_electricity.yaml",
          electricity_carrier_records(), header)
    tech, carrier = timeseries_records()
    write(OUT / "unmapped_entity" / "unmapped_entities_taiwan_capacity_history.yaml", tech, header)
    write(OUT / "unmapped_carrier_data" / "unmapped_carrier_data_taiwan_history_projections.yaml", carrier, header)


if __name__ == "__main__":
    main()
