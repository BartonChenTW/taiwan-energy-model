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

# County seats (lat, lon), in approximate order of county population; only used to label a
# region by the first two seats that fall inside its onshore polygon (orientation, not data).
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


# Plants whose capacity comes from news reports (pypsa_tw/data/supplementary_units.csv)
SUPPLEMENTARY = {"Taichung new CC": ["cna_20260904_taichung_cc"],
                 "Hsinta new CC": ["taipower_units_realtime", "einfo_hsinta_new_cc"]}
OSM_KIND = {"r": "relation", "w": "way", "n": "node"}
RE_FUELS = {"Wind", "Solar", "Hydro", "Bioenergy", "Geothermal"}


def _location_source(coord):
    """'OSM r18726493' -> link to the OpenStreetMap object; otherwise the source id."""
    c = str(coord or "").strip()
    if c.startswith("OSM "):
        ref = c.split()[1]
        kind = OSM_KIND.get(ref[0])
        if kind and ref[1:].isdigit():
            return {"id": "osm_power_plants_tw", "url": f"https://www.openstreetmap.org/{kind}/{ref[1:]}", "label": f"OSM {kind} {ref[1:]}"}
    if c.startswith("powerplantmatching"):
        return {"id": "powerplantmatching_gotzens2019"}
    if c.startswith("thewindpower"):
        return {"id": "thewindpower"}
    if c:
        return {"id": None, "label": c}
    return None


def _year_source(text):
    t = str(text or "")
    if t.startswith("powerplantmatching"):
        return {"id": "powerplantmatching_gotzens2019"}
    if t.startswith("CNA"):
        return {"id": "cna_20260904_taichung_cc"}
    if t.startswith("placeholder"):
        return {"id": None, "label": "placeholder (2025)"}
    return None


def export_plants(repo):
    mapping = pd.read_csv(repo / "pypsa_tw" / "data" / "taipower_plant_mapping.csv").drop_duplicates("name").set_index("name")
    # Chinese plant names (pypsa_tw/data/plant_names_zh.csv); county rows are named by rule
    names_zh = pd.read_csv(repo / "pypsa_tw" / "data" / "plant_names_zh.csv").set_index("name")["name_zh"].to_dict()

    def name_zh(name):
        if name in names_zh:
            return names_zh[name]
        if name.startswith("Solar "):
            return f"太陽光電（{name[6:]}）"
        if name.startswith("Biomass and waste "):
            return f"生質能與廢棄物（{name[18:].replace(' (assumed)', '')}，假設）"
        return None
    # planned plants (build_future_powerplants.py): coordinates from the thermal schedule file
    sched = pd.read_csv(repo / "pypsa_tw" / "data" / "official" / "moea_thermal_schedule_2024_2034.csv")
    sched_coord = sched.dropna(subset=["coord_source"]).drop_duplicates("plant").set_index("plant")["coord_source"].to_dict()
    sched_coord["Geothermal (Yilan, assumed)"] = "OSM w709894062"  # GEOTHERMAL_SITE, Qingshui geothermal plant
    res = repo / "resources" / BASE_RUN / "bus_regions"
    polys = [(r.name, r.geometry) for f in ("regions_onshore_elec_s_6", "regions_offshore_elec_s_6")
             for r in gpd.read_file(res / f"{f}.geojson").itertuples()]
    fleets = []
    today = None
    for fid, en, zh, run in FLEETS:
        f = repo / "resources" / run / "powerplants.csv"
        if not f.exists():
            continue
        p = pd.read_csv(f, index_col=0)
        if today is None:
            today = {(r.Name, round(r.Capacity, 1)) for r in p.itertuples()}
        rows = []
        for r in p.itertuples():
            if r.Name.startswith("Solar "):  # one row per county
                cap_src, loc = [{"id": "moeaea_solar_approvals_county"}], {"id": "gadm_41", "label": "county point (GADM 4.1)"}
                year = None
            else:
                m = mapping.loc[r.Name] if r.Name in mapping.index else None
                cap_src = [{"id": i} for i in SUPPLEMENTARY.get(r.Name, ["taipower_units_realtime"])]
                loc = _location_source(m["coord_source"]) if m is not None else None
                year = _year_source(m["datein_source"]) if m is not None else None
                if m is None and r.Name in sched_coord:
                    loc = _location_source(sched_coord[r.Name])
                    if loc and "assum" in r.Name.lower():
                        loc["label"] = loc.get("label", "") + " (assumed site)"
                if m is None and r.Name.startswith("Biomass and waste"):
                    loc = {"id": "gadm_41", "label": "county point, assumed site"}
                if m is None:  # planned unit: the year is the plan's commissioning year
                    year = {"id": "moea_psd_fy2024", "label": "Figure 3-3"} if r.Fueltype not in RE_FUELS else None
            if fid != "today" and (r.Name, round(r.Capacity, 1)) not in today:
                where = "Table 3-1 (renewable targets; existing rows scaled)" if r.Fueltype in RE_FUELS else "Figure 3-3 (thermal schedule)"
                cap_src = [{"id": "moea_psd_fy2024", "label": where}]
            rows.append({"name": r.Name, "name_zh": name_zh(r.Name), "fuel": r.Fueltype, "group": FUEL_GROUP.get(r.Fueltype, "other"),
                         "technology": r.Technology if isinstance(r.Technology, str) else "",
                         "MW": _r(r.Capacity, 1), "efficiency": _r(r.Efficiency, 3),
                         "year_in": int(r.DateIn) if pd.notna(r.DateIn) else None,
                         "year_out": int(r.DateOut) if pd.notna(r.DateOut) else None,
                         "lat": _r(r.lat, 4), "lon": _r(r.lon, 4),
                         "region": _region_of(r.lon, r.lat, polys) if pd.notna(r.lat) else None,
                         "src": {"capacity": cap_src, "location": loc, "year": year}})
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
    default_re = _merged(repo, ["config.default.yaml"])["renewable"]
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
        dflt = default_re.get(carrier)
        changed = sorted(settings) if dflt is None else sorted(k for k in settings if dflt.get(k) != settings[k])
        out.append({"carrier": carrier, "run": run, "settings": settings, "fork_carrier": dflt is None,
                    "changed_settings": changed, "cell_deg": _r(float(abs(pot.x.values[1] - pot.x.values[0])), 2),
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
                         "origin": "fork" if note else "pypsa-earth",
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


FX_TWD_EUR = 36.185  # Bank of Taiwan, 2026-09-24 (CURRENCY in export_dashboard_data.py)
COMPARE_YEAR = 2030  # PyPSA cost year nearest to Taiwan's 2026 figures


def _crf(r, n):
    return r / (1 - (1 + r) ** -n)


def export_comparison(repo, potential):
    """Taiwan's official cost figures next to the PyPSA technology-data rows the model uses."""
    bench = pd.read_csv(repo / "pypsa_tw" / "data" / "taiwan_cost_benchmarks.csv")
    proc = pd.read_csv(repo / "resources" / COST_RUN / f"costs_{COMPARE_YEAR}_sec.csv", index_col=0)
    rate = float(proc["discount rate"].dropna().iloc[0])
    fuel = {k: float(proc.at[k, "fuel"]) for k in ("gas", "coal", "oil", "uranium") if k in proc.index}
    fuel_of = {"CCGT": "gas", "OCGT": "gas", "coal": "coal", "oil": "oil", "nuclear": "uranium"}
    def mean_cf(carriers):  # potential-weighted mean capacity factor of the model's regions
        regs = [r for pot in potential if pot["carrier"] in carriers for r in pot["regions"] if r["cf"] and r["p_nom_max_GW"]]
        w = sum(r["p_nom_max_GW"] for r in regs)
        return sum(r["p_nom_max_GW"] * r["cf"] for r in regs) / w if w else None
    cf_of = {"solar-utility": mean_cf(["solar"]), "solar-rooftop": mean_cf(["solar"]), "onwind": mean_cf(["onwind"]),
             "offwind": mean_cf(["offwind-ac", "offwind-dc"])}

    def pypsa_cost(row, cf):
        """EUR/MWh from the model's annualised fixed cost at capacity factor cf, plus VOM and fuel."""
        pr = proc.loc[row]
        fixed = float(pr["fixed"]) / 1e3  # EUR/kW/yr
        eff = float(pr["efficiency"]) if pd.notna(pr["efficiency"]) and pr["efficiency"] > 0 else 1.0
        fuel_cost = fuel.get(fuel_of.get(row), 0.0) / eff
        return fixed * 1e3 / (cf * 8760) + float(pr["VOM"] if pd.notna(pr["VOM"]) else 0) + fuel_cost

    rows = []
    for b in bench.itertuples():
        pr = proc.loc[b.pypsa_row] if b.pypsa_row in proc.index else None
        entry = {"key": b.key, "pypsa_row": b.pypsa_row, "en": b.label_en, "zh": b.label_zh, "kind": b.kind, "year": int(b.year),
                 "source_id": b.source_id, "locator": b.locator, "note": b.note if isinstance(b.note, str) else ""}
        if pr is not None:
            entry.update({"pypsa_investment_EUR_kW": _r(pr["investment"] / 1e3, 0), "pypsa_FOM_pct": _r(pr["FOM"], 2),
                          "pypsa_lifetime": _r(pr["lifetime"], 0)})
        if b.kind == "fit":
            cf = b.kWh_per_kW / 8760
            tw_cost_twd = b.capex_TWD_kW * (_crf(b.wacc_pct / 100, b.years) + b.om_pct / 100) / b.kWh_per_kW
            entry.update({"capex_TWD_kW": int(b.capex_TWD_kW), "capex_EUR_kW": _r(b.capex_TWD_kW / FX_TWD_EUR, 0),
                          "om_pct": _r(b.om_pct, 2), "cf": _r(cf, 3), "wacc_pct": _r(b.wacc_pct, 2), "years": int(b.years),
                          "taiwan_EUR_MWh": _r(tw_cost_twd * 1e3 / FX_TWD_EUR, 1), "taiwan_TWD_kWh": _r(tw_cost_twd, 3),
                          "model_cf": _r(cf_of.get(b.pypsa_row), 3)})
            if pr is not None:
                entry["pypsa_EUR_MWh_at_taiwan_cf"] = _r(pypsa_cost(b.pypsa_row, cf), 1)
                entry["capex_ratio"] = _r(entry["capex_EUR_kW"] / entry["pypsa_investment_EUR_kW"], 2)
        else:
            entry.update({"actual_TWD_kWh": _r(b.cost_TWD_kWh, 2), "actual_EUR_MWh": _r(b.cost_TWD_kWh * 1e3 / FX_TWD_EUR, 1)})
            if pr is not None and b.pypsa_row in fuel_of:
                entry["pypsa_EUR_MWh_at_60pct"] = _r(pypsa_cost(b.pypsa_row, 0.6), 1)
        rows.append(entry)
    return {"pypsa_year": COMPARE_YEAR, "discount_rate": _r(rate, 3), "fx_TWD_EUR": FX_TWD_EUR, "fuel_EUR_MWh": {k: _r(v, 2) for k, v in fuel.items()},
            "rows": rows}


SECTION_SOURCES = {
    "grid": ["osm_grid_earth_osm", "gadm_41", "marineregions_eez_v11", "gegis_ssp2_26", "pypsa_earth_parzen2023"],
    "plants": ["taipower_units_realtime", "moeaea_solar_approvals_county", "osm_power_plants_tw", "powerplantmatching_gotzens2019",
               "thewindpower", "cna_20260904_taichung_cc", "einfo_hsinta_new_cc", "gadm_41", "moea_psd_fy2024"],
    "potential": ["era5_hersbach2020", "atlite_hofmann2021", "copernicus_lc100_2019", "wdpa", "gebco_2025", "gadm_41",
                  "marineregions_eez_v11"],
    "costs": ["technology_data_v0132", "irena_rpgc_2023_geothermal", "netl_baseline_rev4a_capture", "aea_ammonia_gas_turbines"],
    "compare": ["moeaea_fit_2026_params", "moeaea_fit_2023_params", "taipower_gen_cost_by_source", "technology_data_v0132",
                "bot_fx_20260924"],
}


def export_sources(repo):
    src = pd.read_csv(repo / "pypsa_tw" / "data" / "sources.csv", dtype=str).fillna("").set_index("source_id")
    ids = sorted({i for v in SECTION_SOURCES.values() for i in v} | {i for row in INPUT_OVERVIEW for i in row["sources"]})
    missing = [i for i in ids if i not in src.index]
    assert not missing, f"sources not in sources.csv: {missing}"
    keep = ["short_cite", "title", "title_en", "publisher", "edition", "published", "landing_url", "file_url", "local_file",
            "accessed", "license", "origin", "evidence", "note"]
    return {"records": {i: src.loc[i, keep].to_dict() for i in ids}, "sections": SECTION_SOURCES}


# Where each model input comes from. origin: "pypsa-earth" (the standard PyPSA-Earth workflow and
# its data), "taiwan" (Taiwanese data added in this fork), "fork" (other data or settings added in
# this fork), or a list when an input combines them. change: what this fork does differently.
INPUT_OVERVIEW = [
    {"input": ["Grid: substations and lines", "電網：變電所與線路"], "origin": ["pypsa-earth"],
     "used": ["OpenStreetMap via earth-osm", "OpenStreetMap（earth-osm）"],
     "change": ["Lines from 35 kV instead of 51 kV, so Taiwan's 69 kV grid is included", "納入 35 kV 以上線路（預設 51 kV），以包含台灣的 69 kV 電網"],
     "sources": ["osm_grid_earth_osm"]},
    {"input": ["Regions", "區域"], "origin": ["pypsa-earth"],
     "used": ["GADM 4.1 and Marine Regions EEZ, substations clustered", "GADM 4.1 與 Marine Regions EEZ，變電所分群"],
     "change": ["6 regions (default 10); isolated substations joined to the main grid", "6 個區域（預設 10）；孤立變電所併入主電網"],
     "sources": ["gadm_41", "marineregions_eez_v11"]},
    {"input": ["Electricity demand", "電力需求"], "origin": ["pypsa-earth", "fork"],
     "used": ["GEGIS hourly profile for 2030 (SSP2-2.6), 2013 weather", "GEGIS 2030 年逐時曲線（SSP2-2.6），2013 年氣象"],
     "change": ["Scaled by 0.749 to Taipower-system generation in 2024 (default: unscaled)", "乘以 0.749，符合 2024 年台電系統發電量（預設不縮放）"],
     "sources": ["gegis_ssp2_26", "taipower_peak_annual"]},
    {"input": ["Power plants today", "現有電廠"], "origin": ["taiwan"],
     "used": ["Taipower unit list, Energy Administration solar approvals, news reports for new gas units", "台電機組清單、能源署太陽光電同意備案、新燃氣機組新聞"],
     "change": ["Replaces PyPSA-Earth's powerplantmatching fleet and its IRENA top-up of renewables; powerplantmatching kept only for some years and coordinates",
                "取代 PyPSA-Earth 的 powerplantmatching 機組與 IRENA 再生能源補足；powerplantmatching 僅用於部分商轉年與座標"],
     "sources": ["taipower_units_realtime", "moeaea_solar_approvals_county", "osm_power_plants_tw", "powerplantmatching_gotzens2019"]},
    {"input": ["Power plants 2030 and 2034", "2030 與 2034 年電廠"], "origin": ["taiwan"],
     "used": ["MOEA supply-demand report 113年度 (Figure 3-3, Table 3-1)", "經濟部 113 年度電力資源供需報告（圖 3-3、表 3-1）"],
     "change": ["Added in this fork (PyPSA-Earth has no Taiwan plan)", "本分支新增（PyPSA-Earth 無台灣規劃）"], "sources": ["moea_psd_fy2024"]},
    {"input": ["Weather", "氣象"], "origin": ["pypsa-earth"],
     "used": ["ERA5 for 2013, converted with atlite", "2013 年 ERA5，以 atlite 轉換"],
     "change": ["A Taiwan cutout for 2013 built locally (same method)", "於本機建立 2013 年台灣氣象資料（方法相同）"],
     "sources": ["era5_hersbach2020", "atlite_hofmann2021"]},
    {"input": ["Renewable potential", "再生能源潛力"], "origin": ["pypsa-earth", "fork"],
     "used": ["Copernicus land cover, WDPA protected areas, GEBCO depths; PyPSA-Earth's densities and limits", "Copernicus 土地覆蓋、WDPA 保護區、GEBCO 水深；PyPSA-Earth 的密度與限制"],
     "change": ["Settings unchanged for solar, onshore and fixed offshore wind; floating offshore wind added (pathway runs)", "太陽光電、陸域與固定式離岸風電設定未改；新增浮動式離岸風電（路徑模擬）"],
     "sources": ["copernicus_lc100_2019", "wdpa", "gebco_2025"]},
    {"input": ["Technology costs", "技術成本"], "origin": ["pypsa-earth", "fork"],
     "used": ["PyPSA technology-data v0.13.2 (mostly Danish Energy Agency)", "PyPSA technology-data v0.13.2（多為丹麥能源署）"],
     "change": ["Overrides: geothermal investment (IRENA); gas with carbon capture (NETL ratios); hydrogen and ammonia turbines", "覆寫：地熱投資（IRENA）；燃氣碳捕捉（NETL 比例）；氫能與氨渦輪機"],
     "sources": ["technology_data_v0132", "irena_rpgc_2023_geothermal", "netl_baseline_rev4a_capture", "aea_ammonia_gas_turbines"]},
    {"input": ["Fuel and import prices", "燃料與進口價格"], "origin": ["pypsa-earth", "fork"],
     "used": ["technology-data fuel prices (gas, coal, oil, uranium)", "technology-data 燃料價格（天然氣、煤、油、鈾）"],
     "change": ["Import prices for hydrogen, ammonia and synthetic fuels added (Hampp et al., official pathway runs)", "新增氫氣、氨與合成燃料進口價格（Hampp 等人，官方路徑模擬）"],
     "sources": ["technology_data_v0132", "hampp2023_import_options"]},
    {"input": ["Taiwan cost benchmarks", "台灣成本參考"], "origin": ["taiwan"],
     "used": ["MOEA feed-in tariff parameters, Taipower cost by source", "經濟部躉購費率參數、台電各種發電方式成本"],
     "change": ["For comparison only; not used by the model", "僅供比較，模型未使用"],
     "sources": ["moeaea_fit_2026_params", "moeaea_fit_2023_params", "taipower_gen_cost_by_source"]},
]


def export_model_data(repo, out):
    payload = {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
               "network": export_network(repo), "fleets": export_plants(repo),
               "potential": export_potential(repo), "costs": export_costs(repo), "sources": export_sources(repo),
               "overview": INPUT_OVERVIEW}
    payload["comparison"] = export_comparison(repo, payload["potential"])
    (out / "model_data.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    size = (out / "model_data.json").stat().st_size / 1e3
    print(f"wrote model_data.json ({len(payload['fleets'])} fleets, {len(payload['potential'])} renewable carriers, "
          f"{len(payload['costs']['years'])} cost years, {size:.0f} kB)")


if __name__ == "__main__":
    logging.disable(logging.WARNING)
    warnings.filterwarnings("ignore")
    repo = Path(__file__).resolve().parents[2]
    export_model_data(repo, repo / "docs" / "data")
