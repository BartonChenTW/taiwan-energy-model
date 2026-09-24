"""
Build ``data/custom_powerplants.csv`` for Taiwan from official sources.

Inputs (all in ``pypsa_tw/data/``):

- ``official/taipower_units_<date>.json``: Taipower real-time unit list,
  including purchased power from IPPs (https://data.gov.tw/dataset/8931).
  Only units that Taipower counts in installed capacity are used; units shown
  as "-" (new units in trial operation, units on standby) are left out.
- ``taipower_plant_mapping.csv``: Taipower plant name -> PyPSA-Earth fuel type,
  technology, storage hours and coordinates, with the source of each coordinate.
- ``official/moeaea_solar_approvals_by_county_kW.csv``: Energy Administration
  solar approvals by county, 2015-2025 (https://data.gov.tw/dataset/16423),
  used only as geographic shares for Taipower's solar total.
- GADM 4.1 county boundaries (``data/gadm/gadm41_TWN/gadm41_TWN.gpkg``).

Commissioning years (DateIn) come from the powerplantmatching list where the
plant matches; solar gets each county's capacity-weighted approval year; the
rest get a 2025 placeholder (see ``datein_source`` in the mapping). In a
single-year dispatch they only affect how plants are grouped.

Left out on purpose: outlying-island units (not connected to the main grid),
purchased cogeneration (no fuel or location published), and geothermal and
biomass (68 MW in total).

Run from the repository root:

    python pypsa_tw/data/build_custom_powerplants.py

Then set ``electricity.custom_powerplants: replace`` in the Taiwan config.
"""

import json
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
OUTPUT = REPO / "data" / "custom_powerplants.csv"

SUBTOTAL = "小計"
SKIP_TYPES = {"儲能負載(Energy Storage System Load)</b>"}
# Outlying islands are not connected to the Taiwan main-island grid.
ISLAND_UNITS = ("澎湖尖山", "金門塔山", "馬祖珠山", "離島其它")
ISLAND_COUNTIES = {"澎湖縣", "金門縣", "連江縣"}
# Left out: no location or fuel published, or negligible.
OMITTED_TYPES = {"汽電共生": "purchased cogeneration", "其它再生能源": "geothermal and biomass"}
SOLAR_TYPE = "太陽能"

COLUMNS = [
    "Name", "Fueltype", "Technology", "Set", "Country", "Capacity", "Efficiency",
    "Duration", "Volume_Mm3", "DamHeight_m", "StorageCapacity_MWh", "DateIn",
    "DateRetrofit", "DateOut", "lat", "lon", "EIC", "projectID", "bus",
]


def read_taipower_units(path):
    rows = json.loads(path.read_bytes().decode("utf-8-sig"))["aaData"]
    df = pd.DataFrame(rows).rename(
        columns={"機組類型": "type", "機組名稱": "unit", "裝置容量(MW)": "capacity", "備註": "note"}
    )
    df = df[~df.type.isin(SKIP_TYPES) & ~df.unit.str.contains(SUBTOTAL)]
    df["capacity"] = pd.to_numeric(df.capacity.str.replace(",", ""), errors="coerce")
    return df[["type", "unit", "capacity", "note"]]


def county_points():
    """Representative point (inside the polygon) for each county, keyed by name."""
    gadm = gpd.read_file(REPO / "data/gadm/gadm41_TWN/gadm41_TWN.gpkg", layer="ADM_ADM_2")
    key = gadm.NL_NAME_2.map(normalise_county)
    pts = gadm.geometry.representative_point()
    points = pd.DataFrame({"lat": pts.y.values, "lon": pts.x.values}, index=key.values)
    assert points.index.is_unique, f"duplicate county keys: {points.index[points.index.duplicated()].tolist()}"
    return points


def normalise_county(name):
    # The Energy Administration writes 臺; GADM writes 台, drops 市 for Taichung and
    # Tainan, and calls Lienchiang 馬祖列島. Keep 市/縣: 嘉義縣 and 嘉義市 differ.
    name = name.replace("臺", "台")
    return {"台中": "台中市", "台南": "台南市", "馬祖列島": "連江縣"}.get(name, name)


def solar_rows(total_mw):
    approvals = pd.read_csv(HERE / "official/moeaea_solar_approvals_by_county_kW.csv", index_col=0)
    approvals = approvals.drop(index=list(ISLAND_COUNTIES))
    years = approvals.columns.astype(int)
    # Commissioning year: the county's capacity-weighted mean approval year.
    mean_year = (approvals * years).sum(axis=1) / approvals.sum(axis=1)
    approvals = approvals.sum(axis=1)
    shares = approvals / approvals.sum()
    points = county_points()
    rows = []
    for county, share in shares.items():
        pt = points.loc[normalise_county(county)]
        rows.append(
            {"Name": f"Solar {county}", "Fueltype": "Solar", "Technology": "Pv", "Set": "PP",
             "Capacity": round(total_mw * share, 1), "DateIn": round(mean_year[county]),
             "lat": round(pt.lat, 4), "lon": round(pt.lon, 4)}
        )
    return rows


def main():
    units_file = sorted((HERE / "official").glob("taipower_units_*.json"))[-1]
    units = read_taipower_units(units_file)
    mapping = pd.read_csv(HERE / "taipower_plant_mapping.csv")

    counted = units.dropna(subset=["capacity"])
    not_counted = units[units.capacity.isna()]
    islands = counted[counted.unit.str.startswith(ISLAND_UNITS)]
    omitted = counted[counted.type.isin(OMITTED_TYPES)]
    solar = counted[counted.type == SOLAR_TYPE]
    rest = counted.drop(index=islands.index.union(omitted.index).union(solar.index))

    # Match every remaining unit to exactly one mapping row (longest prefix wins).
    keys = sorted(mapping["match"], key=len, reverse=True)
    rest = rest.assign(match=rest.unit.map(lambda u: next((k for k in keys if u.startswith(k)), None)))
    unmatched = rest[rest.match.isna()]
    if not unmatched.empty:
        sys.exit(f"Unmatched Taipower units, add them to the mapping:\n{unmatched.to_string()}")

    plants = rest.groupby("match", sort=False).capacity.sum().rename("Capacity").reset_index()
    plants = plants.merge(mapping, on="match", how="left")
    records = [
        {"Name": r["name"], "Fueltype": r.fueltype, "Technology": r.technology, "Set": r.set,
         "Capacity": round(r.Capacity, 1), "Duration": r.duration_h, "DateIn": r.datein,
         "lat": r.lat, "lon": r.lon}
        for _, r in plants.iterrows()
    ]
    records += solar_rows(solar.capacity.sum())

    out = pd.DataFrame(records).reindex(columns=COLUMNS)
    out["Country"] = "TW"
    out.to_csv(OUTPUT, index=True)

    snapshot = json.loads(units_file.read_bytes().decode("utf-8-sig"))["DateTime"]
    print(f"Taipower snapshot {snapshot} ({units_file.name})")
    print(f"wrote {len(out)} plants to {OUTPUT.relative_to(REPO)}\n")
    print((out.groupby(["Fueltype", "Technology"]).Capacity.sum() / 1e3).round(2).rename("GW").to_string())
    print(f"\ntotal {out.Capacity.sum() / 1e3:.2f} GW")
    print(f"\nleft out: outlying islands {islands.capacity.sum():.1f} MW; "
          + "; ".join(f"{label} {omitted[omitted.type == t].capacity.sum():.1f} MW" for t, label in OMITTED_TYPES.items())
          + f"; {len(not_counted)} units not counted by Taipower ('-')")


if __name__ == "__main__":
    main()
