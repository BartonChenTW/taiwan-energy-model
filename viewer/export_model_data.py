"""Detailed model inputs for docs/model-data.html: the grid (full and 6-region), every power
plant of each fleet, renewable potential (map grid, substations, regions) and technology costs
by year. Writes docs/data/model_data.json.

Run on its own (python pypsa_tw/viewer/export_model_data.py) or through
export_dashboard_data.py. Everything exported is either an input the model reads from public
data (Taipower open data, powerplantmatching, technology-data, ERA5-based profiles) or a sum of
model inputs; no solver output is needed.
"""

import json
import logging
import warnings
from datetime import datetime, timezone
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import pypsa
import xarray as xr
from shapely.geometry import Point, mapping

BASE_RUN = "tw_test2_highs_2013_fullyear_4h_6b"  # today's system, 2013 weather, 6 regions
FLOAT_RUN = "tw_path2050_D_w2013_6b"  # same grid, adds floating offshore wind profiles
COST_RUN = "tw_path2050_D_w2013_6b"  # pathway cost files (incl. the geothermal override)
FLEETS = [
    ("today", "Today's fleet (2025)", "現有機組（2025）", BASE_RUN),
    ("plan2030", "2030 plan (MOEA)", "2030 年規劃（經濟部）", "tw_future2030_highs_w2013_4h_6b_ls"),
    ("plan2034", "2034 plan (MOEA)", "2034 年規劃（經濟部）", "tw_future2034_highs_w2013_4h_6b_ls"),
]
RE_CARRIERS = [("solar", BASE_RUN), ("onwind", BASE_RUN), ("offwind-ac", BASE_RUN), ("offwind-dc", BASE_RUN),
               ("offwind-float", FLOAT_RUN)]
COST_YEARS = [2030, 2040, 2050]

# County seats (lat, lon), ordered by population (Ministry of the Interior, 2024, rounded):
# a region is labelled by the first two that fall inside its onshore polygon.
CITIES = [
    ("New Taipei", "新北", 25.012, 121.465), ("Taichung", "台中", 24.148, 120.674),
    ("Kaohsiung", "高雄", 22.627, 120.301), ("Taipei", "台北", 25.033, 121.565),
    ("Taoyuan", "桃園", 24.993, 121.301), ("Tainan", "台南", 22.999, 120.227),
    ("Changhua", "彰化", 24.081, 120.538), ("Pingtung", "屏東", 22.672, 120.488),
    ("Yunlin", "雲林", 23.709, 120.543), ("Hsinchu", "新竹", 24.804, 120.971),
    ("Miaoli", "苗栗", 24.560, 120.821), ("Chiayi", "嘉義", 23.480, 120.449),
    ("Nantou", "南投", 23.910, 120.684), ("Yilan", "宜蘭", 24.757, 121.753),
    ("Keelung", "基隆", 25.128, 121.740), ("Hualien", "花蓮", 23.992, 121.601),
    ("Taitung", "台東", 22.755, 121.144), ("Penghu", "澎湖", 23.566, 119.579),
]

# Technologies shown in the cost table: (cost-file row, group, English, Chinese)
COST_TECHS = [
    ("solar-utility", "renewable", "Solar PV, utility-scale", "太陽光電（地面型）"),
    ("solar-rooftop", "renewable", "Solar PV, rooftop", "太陽光電（屋頂型）"),
    ("onwind", "renewable", "Onshore wind", "陸域風電"),
    ("offwind", "renewable", "Offshore wind, fixed", "離岸風電（固定式）"),
    ("offwind-float", "renewable", "Offshore wind, floating", "離岸風電（浮動式）"),
    ("geothermal", "renewable", "Geothermal", "地熱"),
    ("ror", "renewable", "Run-of-river hydro", "川流式水力"),
    ("hydro", "renewable", "Reservoir hydro", "水庫式水力"),
    ("biomass", "renewable", "Biomass power", "生質能發電"),
    ("CCGT", "thermal", "Gas combined cycle (CCGT)", "燃氣複循環"),
    ("OCGT", "thermal", "Gas turbine (OCGT)", "燃氣渦輪（單循環）"),
    ("coal", "thermal", "Coal", "燃煤"),
    ("oil", "thermal", "Oil", "燃油"),
    ("nuclear", "thermal", "Nuclear", "核能"),
    ("battery storage", "storage", "Battery (energy, per kWh)", "電池（能量，每 kWh）"),
    ("battery inverter", "storage", "Battery (inverter, per kW)", "電池（變流器，每 kW）"),
    ("PHS", "storage", "Pumped hydro", "抽蓄水力"),
    ("hydrogen storage underground", "storage", "Hydrogen storage, underground (per kWh)", "地下儲氫（每 kWh）"),
    ("hydrogen storage tank type 1 including compressor", "storage", "Hydrogen storage, tank (per kWh)", "儲氫槽（每 kWh）"),
    ("electrolysis", "hydrogen", "Electrolyser", "電解槽"),
    ("fuel cell", "hydrogen", "Fuel cell", "燃料電池"),
    ("Haber-Bosch", "hydrogen", "Ammonia synthesis (Haber-Bosch)", "合成氨（哈柏法）"),
    ("Ammonia cracker", "hydrogen", "Ammonia cracker", "氨裂解"),
    ("Fischer-Tropsch", "hydrogen", "Synthetic oil (Fischer-Tropsch)", "合成燃油（費托合成）"),
    ("methanation", "hydrogen", "Synthetic methane (methanation)", "合成甲烷（甲烷化）"),
    ("direct air capture", "carbon", "Direct air capture (per t CO₂/h)", "直接空氣捕捉（每 t CO₂/h）"),
    ("central air-sourced heat pump", "heat", "Heat pump, air, district", "空氣源熱泵（區域）"),
    ("decentral air-sourced heat pump", "heat", "Heat pump, air, building", "空氣源熱泵（建築）"),
    ("decentral gas boiler", "heat", "Gas boiler, building", "燃氣鍋爐（建築）"),
    ("HVAC overhead", "grid", "AC overhead line (per MW·km)", "交流架空線（每 MW·km）"),
    ("HVDC submarine", "grid", "DC submarine cable (per MW·km)", "直流海纜（每 MW·km）"),
]
# Options derived in this fork from the CCGT row (scripts/prepare_sector_network.py,
# add_taiwan_power_options; factors from pypsa_tw/config/scenarios/sector_path_2050_official*.yaml)
DERIVED = [
    ("CCGT CC", "thermal", "Gas combined cycle with 95% capture", "燃氣複循環搭配 95% 碳捕捉", 2.041, 0.885,
     "CCGT row × NETL Rev. 4a H-class ratios (investment 1,980/970 $/kW, efficiency 54.0/61.0%)"),
    ("H2 CCGT", "hydrogen", "Hydrogen-fired combined cycle", "氫能複循環", 1.0, 1.0, "CCGT cost and efficiency"),
    ("NH3 CCGT", "hydrogen", "Ammonia-fired combined cycle", "氨複循環", 1.0, 0.95,
     "CCGT cost; efficiency × 0.95 (Ammonia Energy Association, to verify)"),
]


def _r(x, nd=2):
    if x is None or (isinstance(x, float) and not np.isfinite(x)):
        return None
    return round(float(x), nd)


def _geom(g, tol=0.005, nd=3):
    """Simplified GeoJSON geometry with rounded coordinates (keeps the file small)."""
    g = g.simplify(tol, preserve_topology=True)
    def rnd(c):
        return [rnd(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], nd), round(c[1], nd)]
    m = mapping(g)
    return {"type": m["type"], "coordinates": rnd(json.loads(json.dumps(m["coordinates"])))}


def region_labels(regions):
    labels = {}
    for name, geom in zip(regions["name"], regions.geometry):
        inside = [(en, zh) for en, zh, lat, lon in CITIES if geom.contains(Point(lon, lat))]
        if not inside:  # fall back to the nearest seat to the centroid
            c = geom.centroid
            en, zh, _, _ = min(CITIES, key=lambda t: (t[3] - c.x) ** 2 + (t[2] - c.y) ** 2)
            inside = [(en, zh)]
        top = inside[:2]
        labels[name] = {"en": ", ".join(e for e, _ in top), "zh": "、".join(z for _, z in top)}
    return labels


def busmaps(repo, run):
    """elec.nc bus -> 6-region bus."""
    res = repo / "resources" / run
    s = pd.read_csv(res / "bus_regions" / "busmap_elec_s.csv", index_col=0).squeeze("columns").astype(str)
    s6 = pd.read_csv(res / "bus_regions" / "busmap_elec_s_6.csv", index_col=0).squeeze("columns").astype(str)
    s.index = s.index.astype(str)
    s6.index = s6.index.astype(str)
    return s.map(s6)


def export_network(repo):
    n = pypsa.Network(str(repo / "networks" / BASE_RUN / "elec.nc"))
    n6 = pypsa.Network(str(repo / "networks" / BASE_RUN / "elec_s_6_ec.nc"))
    to6 = busmaps(repo, BASE_RUN)
    res = repo / "resources" / BASE_RUN / "bus_regions"
    on = gpd.read_file(res / "regions_onshore_elec_s_6.geojson")
    off = gpd.read_file(res / "regions_offshore_elec_s_6.geojson")
    labels = region_labels(on)

    w = n6.snapshot_weightings.generators
    load = n6.loads_t.p_set.T.groupby(n6.loads.bus).sum().T
    regions = []
    for b in n6.buses.index:
        gen = n6.generators[n6.generators.bus == b]
        su = n6.storage_units[n6.storage_units.bus == b]
        cap = (gen.groupby("carrier").p_nom.sum() / 1e3).add(su.groupby("carrier").p_nom.sum() / 1e3, fill_value=0)
        regions.append({
            "id": b, "label": labels.get(b, {"en": b, "zh": b}), "x": _r(n6.buses.at[b, "x"], 3), "y": _r(n6.buses.at[b, "y"], 3),
            "demand_TWh": _r(float(load[b].mul(w).sum() / 1e6), 1) if b in load else 0.0,
            "peak_GW": _r(float(load[b].max() / 1e3), 2) if b in load else 0.0,
            "capacity_GW": {c: _r(v, 2) for c, v in cap.items() if v > 0.001},
            "substations": int((to6 == b).sum()),
            "onshore": _geom(on.set_index("name").geometry[b]) if b in set(on.name) else None,
            "offshore": _geom(off.set_index("name").geometry[b]) if b in set(off.name) else None,
        })
    links6 = [{"bus0": l.bus0, "bus1": l.bus1, "s_nom_GW": _r(l.s_nom / 1e3, 2), "length_km": _r(l.length, 0),
               "circuits": _r(l.num_parallel, 1)} for l in n6.lines.itertuples()]
    buses = [{"id": str(b), "x": _r(r.x, 3), "y": _r(r.y, 3), "v_nom": _r(r.v_nom, 0), "region": to6.get(str(b))}
             for b, r in n.buses.iterrows()]
    xy = n.buses[["x", "y"]]
    lines = [{"bus0": str(l.bus0), "bus1": str(l.bus1), "v_nom": _r(l.v_nom, 0), "s_nom_MVA": _r(l.s_nom, 0),
              "length_km": _r(l.length, 1),
              "coords": [[_r(xy.at[l.bus0, "x"], 3), _r(xy.at[l.bus0, "y"], 3)], [_r(xy.at[l.bus1, "x"], 3), _r(xy.at[l.bus1, "y"], 3)]]}
             for l in n.lines.itertuples()]
    return {"regions": regions, "region_lines": links6, "buses": buses, "lines": lines,
            "run": BASE_RUN, "snapshots": int(len(n6.snapshots))}


FUEL_GROUP = {"CCGT": "gas", "OCGT": "gas", "Hard Coal": "coal", "Lignite": "coal", "Oil": "oil", "Nuclear": "nuclear",
              "Hydro": "hydro", "Wind": "wind", "Solar": "solar", "Bioenergy": "biomass", "Geothermal": "geothermal",
              "Battery": "storage"}


def _region_of(lon, lat, polys):
    """6-region id of a point: inside an onshore or offshore polygon, else the nearest one.
    Each run clusters its own grid, so region ids are only comparable within one run; plants of
    every fleet are therefore placed in the base run's regions by their coordinates."""
    pt = Point(lon, lat)
    for name, geom in polys:
        if geom.contains(pt):
            return name
    return min(polys, key=lambda t: t[1].distance(pt))[0]


def export_plants(repo):
    res = repo / "resources" / BASE_RUN / "bus_regions"
    polys = [(r.name, r.geometry) for f in ("regions_onshore_elec_s_6", "regions_offshore_elec_s_6")
             for r in gpd.read_file(res / f"{f}.geojson").itertuples()]
    fleets = []
    for fid, en, zh, run in FLEETS:
        f = repo / "resources" / run / "powerplants.csv"
        if not f.exists():
            continue
        p = pd.read_csv(f, index_col=0)
        rows = []
        for r in p.itertuples():
            rows.append({"name": r.Name, "fuel": r.Fueltype, "group": FUEL_GROUP.get(r.Fueltype, "other"),
                         "technology": r.Technology if isinstance(r.Technology, str) else "",
                         "MW": _r(r.Capacity, 1), "efficiency": _r(r.Efficiency, 3),
                         "year_in": int(r.DateIn) if pd.notna(r.DateIn) else None,
                         "year_out": int(r.DateOut) if pd.notna(r.DateOut) else None,
                         "lat": _r(r.lat, 4), "lon": _r(r.lon, 4),
                         "region": _region_of(r.lon, r.lat, polys) if pd.notna(r.lat) else None})
        fleets.append({"id": fid, "label": en, "label_zh": zh, "run": run, "plants": rows,
                       "total_GW": _r(p.Capacity.sum() / 1e3, 1)})
    return fleets


RE_CONFIGS = {BASE_RUN: ["config.default.yaml", "pypsa_tw/config/config_tw_test2_highs.yaml"],
              FLOAT_RUN: ["config.default.yaml", "pypsa_tw/config/config_tw_test2_highs.yaml",
                          "pypsa_tw/config/scenarios/sector_path_2050.yaml",
                          "pypsa_tw/config/scenarios/sector_path_2050_D_float_geothermal.yaml"]}
RE_KEYS = ["capacity_per_sqkm", "min_depth", "max_depth", "min_shore_distance", "max_shore_distance", "natura",
           "copernicus", "resource", "correction_factor"]


def _merged(repo, files):
    import yaml

    def merge(a, b):
        out = dict(a)
        for k, v in (b or {}).items():
            out[k] = merge(out.get(k, {}), v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
        return out
    cfg = {}
    for f in files:
        cfg = merge(cfg, yaml.safe_load((repo / f).read_text(encoding="utf-8")))
    return cfg


def export_potential(repo):
    out = []
    cfgs = {run: _merged(repo, files) for run, files in RE_CONFIGS.items()}
    for carrier, run in RE_CARRIERS:
        pf = repo / "resources" / run / "renewable_profiles" / f"profile_{carrier}.nc"
        if not pf.exists():
            continue
        ds = xr.open_dataset(pf)
        pot = ds["potential"]
        xs, ys = pot.x.values, pot.y.values
        cells = [[_r(xs[j], 2), _r(ys[i], 2), _r(v, 0)] for (i, j), v in np.ndenumerate(pot.values) if v > 1]
        cf = ds["profile"].mean("time").to_series()
        pmax = ds["p_nom_max"].to_series()
        base = pypsa.Network(str(repo / "networks" / run / "elec.nc"))
        to6 = busmaps(repo, run)
        subs = []
        for b in pmax.index:
            bb = str(b)
            if pmax[b] < 1 or bb not in base.buses.index:
                continue
            subs.append({"bus": bb, "x": _r(base.buses.at[bb, "x"], 3), "y": _r(base.buses.at[bb, "y"], 3),
                         "p_nom_max_MW": _r(pmax[b], 0), "cf": _r(cf[b], 3), "region": to6.get(bb)})
        n6 = pypsa.Network(str(repo / "networks" / run / "elec_s_6_ec.nc"))
        g = n6.generators[n6.generators.carrier == carrier]
        pu = n6.generators_t.p_max_pu.reindex(columns=g.index)
        monthly = pu.groupby(pu.index.month).mean()
        regions = []
        for gid, r in g.iterrows():
            cfm = float(pu[gid].mean()) if gid in pu and pu[gid].notna().any() else None
            regions.append({"region": r.bus, "p_nom_max_GW": _r(r.p_nom_max / 1e3, 2) if np.isfinite(r.p_nom_max) else None,
                            "existing_GW": _r(r.p_nom / 1e3, 2), "cf": _r(cfm, 3),
                            "potential_TWh": _r(r.p_nom_max * cfm * 8760 / 1e6, 1) if cfm and np.isfinite(r.p_nom_max) else None,
                            "monthly_cf": [_r(v, 3) for v in monthly[gid].tolist()] if gid in monthly else []})
        rc = cfgs[run]["renewable"].get(carrier, {})
        settings = {k: rc[k] for k in RE_KEYS if k in rc}
        out.append({"carrier": carrier, "run": run, "settings": settings, "cell_deg": _r(float(abs(pot.x.values[1] - pot.x.values[0])), 2),
                    "cells": cells, "substations": subs, "regions": regions,
                    "total_GW": _r(float(pmax.sum()) / 1e3, 1)})
    return out


def export_costs(repo):
    years = []
    for y in COST_YEARS:
        proc = pd.read_csv(repo / "resources" / COST_RUN / f"costs_{y}_sec.csv", index_col=0)
        raw = pd.read_csv(repo / "resources" / COST_RUN / f"costs_{y}.csv")
        inv = raw[raw.parameter == "investment"].drop_duplicates("technology").set_index("technology")
        rows = []

        def row(tech, key, group, en, zh, inv_factor=1.0, eff_factor=1.0, note=""):
            if tech not in proc.index:
                return None
            p = proc.loc[tech]
            unit = str(inv.at[tech, "unit"]) if tech in inv.index else "EUR/kW_e"
            # The processed file is per MW or MWh: show per kW or kWh like technology-data. Units per
            # km or per t CO2/h are not power-based and stay as they are.
            per_k = not ("/km" in unit or "tCO2" in unit or unit.strip() == "EUR")
            scale = 1e3 if per_k else 1.0
            unit = unit.replace("EUR/MW", "EUR/kW") if per_k else unit.replace("EUR/kW/km", "EUR/MW/km")
            rows.append({"key": key, "tech": tech, "group": group, "en": en, "zh": zh,
                         "investment": _r(p.get("investment") * inv_factor / scale, 1), "unit": unit,
                         "FOM_pct": _r(p.get("FOM"), 2), "VOM_EUR_MWh": _r(p.get("VOM"), 2),
                         "efficiency": _r(p.get("efficiency") * eff_factor, 3), "lifetime": _r(p.get("lifetime"), 0),
                         "fuel_EUR_MWh": _r(p.get("fuel"), 2),
                         "fixed_per_unit_yr": _r(p.get("fixed") * inv_factor / scale, 1),
                         "source": (inv.at[tech, "source"] if tech in inv.index and not note else note) or "",
                         "currency_year": int(inv.at[tech, "currency_year"]) if tech in inv.index and pd.notna(inv.at[tech, "currency_year"]) and not note else None})

        for tech, group, en, zh in COST_TECHS:
            note = "Taiwan fork: IRENA 2023 global weighted average (costs.investment.geothermal)" if tech == "geothermal" else ""
            row(tech, tech, group, en, zh, note=note)
        for key, group, en, zh, fi, fe, note in DERIVED:
            row("CCGT", key, group, en, zh, fi, fe, note="Taiwan fork: " + note)
        fuels = {k: _r(proc.at[k, "fuel"], 2) for k in ("gas", "coal", "oil", "uranium", "solid biomass") if k in proc.index}
        co2 = {k: _r(proc.at[k, "CO2 intensity"], 3) for k in ("gas", "coal", "oil") if k in proc.index}
        years.append({"year": y, "rows": rows, "fuel_EUR_MWh": fuels, "co2_t_MWh": co2,
                      "discount_rate": _r(proc["discount rate"].dropna().iloc[0], 3) if "discount rate" in proc else None})
    return {"run": COST_RUN, "years": years}


def export_model_data(repo, out):
    payload = {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
               "network": export_network(repo), "fleets": export_plants(repo),
               "potential": export_potential(repo), "costs": export_costs(repo)}
    (out / "model_data.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size = (out / "model_data.json").stat().st_size / 1e3
    print(f"wrote model_data.json ({len(payload['fleets'])} fleets, {len(payload['potential'])} renewable carriers, "
          f"{len(payload['costs']['years'])} cost years, {size:.0f} kB)")


if __name__ == "__main__":
    logging.disable(logging.WARNING)
    warnings.filterwarnings("ignore")
    repo = Path(__file__).resolve().parents[2]
    export_model_data(repo, repo / "docs" / "data")
