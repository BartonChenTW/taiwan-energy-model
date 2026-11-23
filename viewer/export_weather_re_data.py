"""Export detailed Taiwan weather (ERA5 2013 & 2018) and renewable energy (RE)
potential data for docs/weather-re.html.

Reads ERA5 cutouts (cutout-2013-era5-tw.nc, cutout-2018-era5-tw.nc),
PyPSA-Earth renewable profiles (solar, onwind, offwind-ac, offwind-dc,
offwind-float, hydro), exclusion config parameters, and official county-level
solar PV approvals, writing docs/data/weather_re_data.json.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
for p in (str(ROOT), str(ROOT / "viewer")):
    if p not in sys.path:
        sys.path.insert(0, p)

import geopandas as gpd  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import pypsa  # noqa: E402
import xarray as xr  # noqa: E402
import yaml  # noqa: E402

from export_grid_data import simplify_region_shapes  # noqa: E402
from export_model_data import BASE_RUN, _r, busmaps, region_labels  # noqa: E402
from paths import MODEL_DIR  # noqa: E402

RUN_2013 = BASE_RUN
RUN_2018 = "tw_weather2018_highs_fullyear_4h_6b_ls"
RUN_FLOAT = "tw_path2050_D_w2013_6b"

# Taiwan + offshore EEZ map box (0.3 deg ERA5 grid)
MAP_X = slice(118.5, 123.0)
MAP_Y = slice(21.0, 26.0)
# Tighter Taiwan + Strait summary box
TW_X = slice(119.3, 122.3)
TW_Y = slice(21.7, 25.5)

COPERNICUS_LABELS = {
    20: ("Shrubs", "灌木林"),
    30: ("Herbaceous vegetation", "草本植被"),
    40: ("Cultivated / cropland", "農田／耕地"),
    50: ("Urban / built-up", "都市／建築用地"),
    60: ("Bare / sparse vegetation", "裸地／稀疏植被"),
    80: ("Permanent water bodies", "永久水體"),
    90: ("Herbaceous wetland", "草本濕地"),
    100: ("Moss and lichen", "苔蘚與地衣"),
    111: ("Closed evergreen needleleaf forest", "密閉常綠針葉林"),
    112: ("Closed evergreen broadleaf forest", "密閉常綠闊葉林"),
    113: ("Closed deciduous needleleaf forest", "密閉落葉針葉林"),
    114: ("Closed deciduous broadleaf forest", "密閉落葉闊葉林"),
    115: ("Closed mixed forest", "密閉混合林"),
    116: ("Closed unknown forest", "密閉其他森林"),
    121: ("Open evergreen needleleaf forest", "開放常綠針葉林"),
    122: ("Open evergreen broadleaf forest", "開放常綠闊葉林"),
    123: ("Open deciduous needleleaf forest", "開放落葉針葉林"),
    124: ("Open deciduous broadleaf forest", "開放落葉闊葉林"),
    125: ("Open mixed forest", "開放混合林"),
    126: ("Open unknown forest", "開放其他森林"),
    200: ("Oceans / seas", "海洋／海域"),
}

WIND_ROSE_SITES = [
    {"id": "strait", "name_en": "Taiwan Strait (Changhua Offshore)", "name_zh": "台灣海峽（彰化外海）", "lon": 120.0, "lat": 24.0},
    {"id": "north", "name_en": "Northern Taiwan (Taipei / Keelung)", "name_zh": "北部地區（台北／基隆）", "lon": 121.5, "lat": 25.0},
    {"id": "south", "name_en": "Southern Taiwan (Tainan / Kaohsiung)", "name_zh": "南部地區（台南／高雄）", "lon": 120.3, "lat": 22.8},
    {"id": "east", "name_en": "Eastern Coast (Hualien)", "name_zh": "東部海岸（花蓮）", "lon": 121.6, "lat": 24.0},
]

COUNTY_EN = {
    "基隆市": "Keelung City", "臺北市": "Taipei City", "新北市": "New Taipei City",
    "桃園市": "Taoyuan City", "新竹縣": "Hsinchu County", "新竹市": "Hsinchu City",
    "宜蘭縣": "Yilan County", "苗栗縣": "Miaoli County", "臺中市": "Taichung City",
    "彰化縣": "Changhua County", "雲林縣": "Yunlin County", "南投縣": "Nantou County",
    "嘉義縣": "Chiayi County", "嘉義市": "Chiayi City", "臺南市": "Tainan City",
    "高雄市": "Kaohsiung City", "屏東縣": "Pingtung County", "花蓮縣": "Hualien County",
    "臺東縣": "Taitung County", "澎湖縣": "Penghu County", "金門縣": "Kinmen County",
    "連江縣": "Lienchiang County",
}

SECTORS_8 = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]


def _weighted_hourly(ds: xr.Dataset) -> pd.Series:
    """Capacity-weighted national hourly capacity factor series from profile_*.nc."""
    w = ds["p_nom_max"].fillna(0.0)
    tot = float(w.sum())
    if tot <= 0:
        return pd.Series(dtype=float)
    prof = (ds["profile"] * w).sum("bus") / tot
    return pd.Series(prof.values, index=pd.to_datetime(ds["time"].values))


def analyze_cutout(repo: Path, year: int) -> dict:
    ds = xr.open_dataset(repo / "cutouts" / f"cutout-{year}-era5-tw.nc")
    sub_map = ds.sel(x=MAP_X, y=MAP_Y)
    sub_tw = ds.sel(x=TW_X, y=TW_Y)

    time_idx = pd.to_datetime(ds["time"].values)
    winter_mask = time_idx.month.isin([11, 12, 1, 2])
    summer_mask = time_idx.month.isin([6, 7, 8, 9])

    # Summary stats over tight Taiwan box
    tw_wnd = sub_tw["wnd100m"]
    tw_ghi = sub_tw["influx_direct"] + sub_tw["influx_diffuse"]
    tw_temp_c = sub_tw["temperature"] - 273.15
    tw_runoff = sub_tw["runoff"]

    # High-wind cut-out hours (any Taiwan-box cell >= 25 m/s, typical offshore turbine cut-out)
    max_per_hour = tw_wnd.max(dim=("x", "y")).values
    cutout_hours = int((max_per_hour >= 25.0).sum())
    peak_i = int(np.argmax(max_per_hour))
    peak_gust_time = str(time_idx[peak_i])[:16]
    peak_gust_ms = _r(float(max_per_hour[peak_i]), 2)

    summary = {
        "year": year,
        "resolution_deg": 0.3,
        "hours": int(len(time_idx)),
        "wnd100m_mean_ms": _r(float(tw_wnd.mean()), 2),
        "wnd100m_winter_ms": _r(float(tw_wnd.isel(time=winter_mask).mean()), 2),
        "wnd100m_summer_ms": _r(float(tw_wnd.isel(time=summer_mask).mean()), 2),
        "wnd100m_max_ms": _r(float(tw_wnd.max()), 2),
        "ghi_mean_wm2": _r(float(tw_ghi.mean()), 1),
        "ghi_kwh_m2_yr": _r(float(tw_ghi.mean() * 8.76), 1),
        "direct_share": _r(float(sub_tw["influx_direct"].sum() / tw_ghi.sum()), 3),
        "temp_mean_c": _r(float(tw_temp_c.mean()), 2),
        "temp_min_c": _r(float(tw_temp_c.min()), 1),
        "temp_max_c": _r(float(tw_temp_c.max()), 1),
        "runoff_mm_yr": _r(float(tw_runoff.sum("time").mean() * 1000.0), 1),
        "high_wind_25ms_hours": cutout_hours,
        "peak_wind_time_utc": peak_gust_time,
        "peak_wind_ms": peak_gust_ms,
    }

    # Spatial grid (map box)
    m_wnd_ann = sub_map["wnd100m"].mean("time").values
    m_wnd_win = sub_map["wnd100m"].isel(time=winter_mask).mean("time").values
    m_wnd_sum = sub_map["wnd100m"].isel(time=summer_mask).mean("time").values
    m_dir = sub_map["influx_direct"].mean("time").values
    m_dif = sub_map["influx_diffuse"].mean("time").values
    m_ghi = m_dir + m_dif
    m_temp = (sub_map["temperature"] - 273.15).mean("time").values
    m_runoff = sub_map["runoff"].sum("time").values * 1000.0
    m_height = sub_map["height"].values
    xs = sub_map.x.values
    ys = sub_map.y.values

    grid_cells = []
    for i, yv in enumerate(ys):
        for j, xv in enumerate(xs):
            ghi_v = float(m_ghi[i, j])
            dir_sh = float(m_dir[i, j]) / ghi_v if ghi_v > 0 else 0.0
            grid_cells.append({
                "lon": _r(float(xv), 2),
                "lat": _r(float(yv), 2),
                "wnd_ann": _r(float(m_wnd_ann[i, j]), 2),
                "wnd_win": _r(float(m_wnd_win[i, j]), 2),
                "wnd_sum": _r(float(m_wnd_sum[i, j]), 2),
                "ghi_kwh": _r(ghi_v * 8.76, 0),
                "dir_share": _r(dir_sh, 2),
                "temp_c": _r(float(m_temp[i, j]), 1),
                "runoff_mm": _r(float(m_runoff[i, j]), 0),
                "height_m": _r(float(m_height[i, j]), 0),
            })

    # Monthly weather averages over Taiwan box
    monthly = []
    for m in range(1, 13):
        mm = time_idx.month == m
        monthly.append({
            "month": m,
            "wnd100m_ms": _r(float(tw_wnd.isel(time=mm).mean()), 2),
            "ghi_wm2": _r(float(tw_ghi.isel(time=mm).mean()), 1),
            "temp_c": _r(float(tw_temp_c.isel(time=mm).mean()), 1),
            "runoff_mm": _r(float(tw_runoff.isel(time=mm).sum("time").mean() * 1000.0), 1),
        })

    # Wind roses at 4 representative sites
    roses = []
    for site in WIND_ROSE_SITES:
        pt = ds.sel(x=site["lon"], y=site["lat"], method="nearest")
        spd = pt["wnd100m"].values
        az_rad = pt["wnd_azimuth"].values
        # Convert radians -> degrees [0, 360)
        deg = (np.degrees(az_rad) % 360.0)
        bins = ((deg + 22.5) // 45.0).astype(int) % 8
        freq = []
        mean_spd = []
        n = len(spd)
        for b in range(8):
            mask = bins == b
            freq.append(_r(100.0 * float(mask.sum()) / n, 1))
            mean_spd.append(_r(float(spd[mask].mean()) if mask.any() else 0.0, 2))
        roses.append({
            **site,
            "grid_lon": _r(float(pt.x.values), 2),
            "grid_lat": _r(float(pt.y.values), 2),
            "mean_ms": _r(float(spd.mean()), 2),
            "p90_ms": _r(float(np.percentile(spd, 90)), 2),
            "sectors": SECTORS_8,
            "freq_pct": freq,
            "mean_spd_ms": mean_spd,
        })

    ds.close()
    return {"summary": summary, "grid": grid_cells, "monthly": monthly, "wind_roses": roses}


def analyze_variability(repo: Path, run: str, year: int, include_float: bool = False) -> dict:
    rp = repo / "resources" / run / "renewable_profiles"
    carriers = ["solar", "onwind", "offwind-ac", "offwind-dc"]
    series = {}
    for c in carriers:
        pf = rp / f"profile_{c}.nc"
        if pf.exists():
            ds = xr.open_dataset(pf)
            series[c] = _weighted_hourly(ds)
            ds.close()

    if include_float:
        pf_f = repo / "resources" / RUN_FLOAT / "renewable_profiles" / "profile_offwind-float.nc"
        if pf_f.exists():
            ds = xr.open_dataset(pf_f)
            series["offwind-float"] = _weighted_hourly(ds)
            ds.close()

    # Hydro inflow (30 plants, MWh -> GWh/month)
    hydro_monthly_gwh = []
    hydro_total_twh = None
    hf = rp / "profile_hydro.nc"
    if hf.exists():
        ds = xr.open_dataset(hf)
        inflow_h = pd.Series(ds["inflow"].sum("plant").values, index=pd.to_datetime(ds["time"].values))
        hydro_total_twh = _r(float(inflow_h.sum()) / 1e6, 2)
        hydro_monthly_gwh = [_r(float(inflow_h[inflow_h.index.month == m].sum()) / 1e3, 1) for m in range(1, 13)]
        ds.close()

    # Monthly capacity factors
    monthly_cf = {
        c: [_r(float(s[s.index.month == m].mean()), 3) for m in range(1, 13)]
        for c, s in series.items()
    }

    # Diurnal 24-hour profiles in Taiwan local time (UTC+8) for Summer (Jun-Sep) & Winter (Nov-Feb)
    diurnal = {"summer": {}, "winter": {}}
    for c in ["solar", "onwind", "offwind-ac", "offwind-dc"]:
        if c not in series:
            continue
        s_tw = series[c].copy()
        s_tw.index = s_tw.index + pd.Timedelta(hours=8)
        sum_s = s_tw[s_tw.index.month.isin([6, 7, 8, 9])]
        win_s = s_tw[s_tw.index.month.isin([11, 12, 1, 2])]
        diurnal["summer"][c] = [_r(float(sum_s[sum_s.index.hour == h].mean()), 3) for h in range(24)]
        diurnal["winter"][c] = [_r(float(win_s[win_s.index.hour == h].mean()), 3) for h in range(24)]

    # Solar-wind complementarity (Pearson r, monthly and hourly)
    comp = {}
    if "solar" in series:
        sol_m = pd.Series(monthly_cf["solar"])
        for w in ["offwind-dc", "offwind-ac", "onwind"]:
            if w in series:
                comp[f"solar_vs_{w}"] = {
                    "monthly_r": _r(float(sol_m.corr(pd.Series(monthly_cf[w]))), 3),
                    "hourly_r": _r(float(series["solar"].corr(series[w])), 3),
                }

    # Dunkelflaute / low-RE extreme windows (50/50 solar + offwind-dc combined index)
    extremes = []
    if "solar" in series and "offwind-dc" in series:
        comb = 0.5 * series["solar"] + 0.5 * series["offwind-dc"]
        for hours, label_en, label_zh in [
            (24, "Worst 24-hour lull (1 day)", "最嚴峻 24 小時低風光時段（1 日）"),
            (72, "Worst 72-hour Dunkelflaute (3 days)", "最嚴峻 72 小時無風無光期（3 日）"),
            (168, "Worst 168-hour lull (7 days)", "最嚴峻 168 小時低風光週（7 日）"),
        ]:
            roll = comb.rolling(hours).mean().dropna()
            end_ts = roll.idxmin()
            start_ts = end_ts - pd.Timedelta(hours=hours - 1)
            sl_sol = series["solar"].loc[start_ts:end_ts]
            sl_wdc = series["offwind-dc"].loc[start_ts:end_ts]
            sl_wac = series["offwind-ac"].loc[start_ts:end_ts] if "offwind-ac" in series else None
            extremes.append({
                "window_h": hours,
                "label_en": label_en,
                "label_zh": label_zh,
                "start_utc": str(start_ts)[:16],
                "end_utc": str(end_ts)[:16],
                "solar_cf": _r(float(sl_sol.mean()), 3),
                "offwind_dc_cf": _r(float(sl_wdc.mean()), 3),
                "offwind_ac_cf": _r(float(sl_wac.mean()), 3) if sl_wac is not None else None,
                "combined_50_50_cf": _r(float(roll.loc[end_ts]), 3),
            })

    return {
        "year": year,
        "monthly_cf": monthly_cf,
        "hydro_monthly_gwh": hydro_monthly_gwh,
        "hydro_total_twh": hydro_total_twh,
        "diurnal_tw_local": diurnal,
        "complementarity": comp,
        "extremes": extremes,
    }


def build_potential_and_exclusions(repo: Path, labels: dict) -> dict:
    default_cfg = yaml.safe_load((repo / "config.default.yaml").read_text(encoding="utf-8"))["renewable"]
    float_cfg = yaml.safe_load((ROOT / "config" / "scenarios" / "sector_path_2050_D_float_geothermal.yaml").read_text(encoding="utf-8"))["renewable"]

    carrier_specs = [
        ("solar", RUN_2013, RUN_2018, default_cfg.get("solar", {}), "Solar PV (utility + eligible land)", "太陽光電（可用土地）"),
        ("onwind", RUN_2013, RUN_2018, default_cfg.get("onwind", {}), "Onshore wind", "陸域風電"),
        ("offwind-ac", RUN_2013, RUN_2018, default_cfg.get("offwind-ac", {}), "Offshore wind (fixed-bottom AC, <=30 km)", "固定式離岸風電 AC（離岸 <=30 km）"),
        ("offwind-dc", RUN_2013, RUN_2018, default_cfg.get("offwind-dc", {}), "Offshore wind (fixed-bottom DC, >=30 km)", "固定式離岸風電 DC（離岸 >=30 km）"),
        ("offwind-float", RUN_FLOAT, None, float_cfg.get("offwind-float", {}), "Offshore wind (floating, 50–1,000 m depth)", "浮動式離岸風電（水深 50–1,000 m）"),
    ]

    carriers_out = []
    for cid, run13, run18, cfg, en, zh in carrier_specs:
        pf13 = repo / "resources" / run13 / "renewable_profiles" / f"profile_{cid}.nc"
        if not pf13.exists():
            continue
        ds13 = xr.open_dataset(pf13)
        pmax = ds13["p_nom_max"].to_series()
        cf13_bus = ds13["profile"].mean("time").to_series()
        total_gw = _r(float(pmax.sum()) / 1e3, 2)
        wcf13 = _r(float((cf13_bus * pmax).sum() / pmax.sum()), 3) if float(pmax.sum()) > 0 else 0.0
        twh13 = _r(total_gw * wcf13 * 8.76, 1)

        avg_dist = _r(float((ds13["average_distance"].to_series() * pmax).sum() / pmax.sum()) / 1000.0, 1) if "average_distance" in ds13 else None
        uw_frac = _r(float((ds13["underwater_fraction"].to_series() * pmax).sum() / pmax.sum()), 2) if "underwater_fraction" in ds13 else None

        # 2018 comparison
        wcf18, twh18, cf18_bus = None, None, None
        if run18:
            pf18 = repo / "resources" / run18 / "renewable_profiles" / f"profile_{cid}.nc"
            if pf18.exists():
                ds18 = xr.open_dataset(pf18)
                cf18_bus = ds18["profile"].mean("time").to_series()
                pmax18 = ds18["p_nom_max"].to_series()
                wcf18 = _r(float((cf18_bus * pmax18).sum() / pmax18.sum()), 3) if float(pmax18.sum()) > 0 else 0.0
                twh18 = _r(total_gw * wcf18 * 8.76, 1)
                ds18.close()

        # Spatial cells [lon, lat, potential_MW]
        pot = ds13["potential"]
        xs, ys = pot.x.values, pot.y.values
        cells = [[_r(float(xs[j]), 2), _r(float(ys[i]), 2), _r(float(v), 0)]
                 for (i, j), v in np.ndenumerate(pot.values) if v > 1.0]

        # 6-region aggregation from elec_s_6_ec.nc
        n6_13 = pypsa.Network(str(repo / "networks" / run13 / "elec_s_6_ec.nc"))
        g13 = n6_13.generators[n6_13.generators.carrier == cid]
        pu13 = n6_13.generators_t.p_max_pu.reindex(columns=g13.index)
        pu18 = None
        if run18 and (repo / "networks" / run18 / "elec_s_6_ec.nc").exists():
            n6_18 = pypsa.Network(str(repo / "networks" / run18 / "elec_s_6_ec.nc"))
            g18 = n6_18.generators[n6_18.generators.carrier == cid]
            pu18 = n6_18.generators_t.p_max_pu.reindex(columns=g18.index)

        reg_rows = []
        for gid, r in g13.iterrows():
            rid = str(r.bus)
            lbl = labels.get(rid, {"en": rid, "zh": rid})
            c13 = float(pu13[gid].mean()) if gid in pu13 and pu13[gid].notna().any() else None
            c18 = float(pu18[gid].mean()) if pu18 is not None and gid in pu18 and pu18[gid].notna().any() else None
            pm_gw = _r(r.p_nom_max / 1e3, 2) if np.isfinite(r.p_nom_max) else None
            reg_rows.append({
                "region": rid,
                "name_en": lbl["en"],
                "name_zh": lbl["zh"],
                "p_nom_max_GW": pm_gw,
                "existing_GW": _r(r.p_nom / 1e3, 2),
                "cf_2013": _r(c13, 3),
                "cf_2018": _r(c18, 3),
                "potential_TWh_2013": _r(pm_gw * c13 * 8.76, 1) if pm_gw is not None and c13 is not None else None,
            })

        cop = cfg.get("copernicus", {})
        codes = cop.get("grid_codes", [])
        code_desc = [
            {"code": c, "en": COPERNICUS_LABELS.get(c, (f"Code {c}", f"代碼 {c}"))[0],
             "zh": COPERNICUS_LABELS.get(c, (f"Code {c}", f"代碼 {c}"))[1]}
            for c in codes
        ]
        res_cfg = cfg.get("resource", {})
        carriers_out.append({
            "carrier": cid,
            "name_en": en,
            "name_zh": zh,
            "run_2013": run13,
            "total_GW": total_gw,
            "cf_2013": wcf13,
            "cf_2018": wcf18,
            "potential_TWh_2013": twh13,
            "potential_TWh_2018": twh18,
            "avg_distance_km": avg_dist,
            "underwater_fraction": uw_frac,
            "cells": cells,
            "regions": reg_rows,
            "exclusions": {
                "method": res_cfg.get("method", ""),
                "model": res_cfg.get("turbine") or res_cfg.get("panel") or "",
                "orientation": res_cfg.get("orientation", ""),
                "capacity_per_sqkm": cfg.get("capacity_per_sqkm"),
                "correction_factor": cfg.get("correction_factor", 1.0),
                "natura_excluded": bool(cfg.get("natura", False)),
                "min_depth_m": cfg.get("min_depth"),
                "max_depth_m": cfg.get("max_depth"),
                "min_shore_km": _r(cfg["min_shore_distance"] / 1000.0, 0) if "min_shore_distance" in cfg else None,
                "max_shore_km": _r(cfg["max_shore_distance"] / 1000.0, 0) if "max_shore_distance" in cfg else None,
                "urban_buffer_m": cop.get("distance"),
                "copernicus_codes": code_desc,
            },
        })
        ds13.close()
    return carriers_out


def build_county_solar() -> dict:
    df = pd.read_csv(ROOT / "data" / "official" / "moeaea_solar_approvals_by_county_kW.csv", encoding="utf-8-sig")
    years = [c for c in df.columns if c != "county"]
    rows = []
    for _, r in df.iterrows():
        cz = str(r["county"]).strip()
        vals_mw = [_r(float(r[y]) / 1000.0, 2) for y in years]
        tot_mw = round(sum(vals_mw), 2)
        rows.append({
            "county_zh": cz,
            "county_en": COUNTY_EN.get(cz, cz),
            "total_MW": tot_mw,
            "annual_MW": vals_mw,
        })
    grand_tot = sum(x["total_MW"] for x in rows)
    for x in rows:
        x["share_pct"] = _r(100.0 * x["total_MW"] / grand_tot, 1) if grand_tot > 0 else 0.0
    rows.sort(key=lambda x: x["total_MW"], reverse=True)
    return {"years": [int(y) for y in years], "total_MW": round(grand_tot, 1), "counties": rows}


def build_policy_vs_potential(carriers: list[dict]) -> list[dict]:
    by_c = {c["carrier"]: c for c in carriers}
    sol = by_c.get("solar", {})
    onw = by_c.get("onwind", {})
    oac = by_c.get("offwind-ac", {})
    odc = by_c.get("offwind-dc", {})
    ofl = by_c.get("offwind-float", {})
    fixed_gw = round((oac.get("total_GW") or 0) + (odc.get("total_GW") or 0), 2)
    fixed_twh = round((oac.get("potential_TWh_2013") or 0) + (odc.get("potential_TWh_2013") or 0), 1)
    return [
        {
            "tech_en": "Solar PV (rooftop + utility)",
            "tech_zh": "太陽光電（屋頂＋地面）",
            "model_gw": f"{sol.get('total_GW', '—')} GW",
            "model_twh": f"{sol.get('potential_TWh_2013', '—')} TWh/yr",
            "target_2030": "31.0 GW",
            "target_2050": "40–80 GW (50–100 TWh/yr)",
            "note_en": "Model excludes protected land & uses 4.6 MW/km2; official 2050 target relies heavily on rooftop & agrivoltaic dual-use.",
            "note_zh": "模型採 4.6 MW/km² 並排除保護區；官方 2050 目標仰賴新建物屋頂光電與漁電／農電共生。",
        },
        {
            "tech_en": "Offshore wind (fixed-bottom <=50 m)",
            "tech_zh": "固定式離岸風電（水深 <=50 m）",
            "model_gw": f"{fixed_gw} GW (AC {oac.get('total_GW')} + DC {odc.get('total_GW')})",
            "model_twh": f"{fixed_twh} TWh/yr",
            "target_2030": "10.9–13.1 GW",
            "target_2050": "40–55 GW (combined fixed + floating)",
            "note_en": "World-class Taiwan Strait wind speeds (CF 36–53% in ERA5 2013); near-shore <50 m sites approach saturation in 2030s.",
            "note_zh": "台灣海峽具世界級風能條件（ERA5 2013 容量因數 36–53%）；近岸淺水場址於 2030 年代趨近飽和。",
        },
        {
            "tech_en": "Offshore wind (floating 50–1,000 m)",
            "tech_zh": "浮動式離岸風電（水深 50–1,000 m）",
            "model_gw": f"{ofl.get('total_GW', '—')} GW",
            "model_twh": f"{ofl.get('potential_TWh_2013', '—')} TWh/yr",
            "target_2030": "Demo / pilot",
            "target_2050": "Core of 40–55 GW offshore target",
            "note_en": "Added in Taiwan fork (sector_path_2050_D); unlocks deep EEZ potential (>3.5× current Taiwan electricity use).",
            "note_zh": "由台灣分支新增；釋放深海專屬經濟區龐大風能（逾台灣現行總用電量 3.5 倍）。",
        },
        {
            "tech_en": "Onshore wind",
            "tech_zh": "陸域風電",
            "model_gw": f"{onw.get('total_GW', '—')} GW",
            "model_twh": f"{onw.get('potential_TWh_2013', '—')} TWh/yr",
            "target_2030": "~1.2 GW (existing + modest growth)",
            "target_2050": "Limited by land / siting",
            "note_en": "Low average onshore CF (11.6% in 2013) due to mountainous terrain; coastal flats already heavily utilised.",
            "note_zh": "受限山地地形平均容量因數偏低（2013 年 11.6%），沿海平地多已開發。",
        },
        {
            "tech_en": "Hydropower (conventional + ROR)",
            "tech_zh": "慣常水力（川流與水庫）",
            "model_gw": "Existing fleet (~2.1 GW + 2.6 GW PHS)",
            "model_twh": "4.36 TWh/yr inflow (HydroBASINS L6)",
            "target_2030": "Small hydro + Guangming/Shimen PHS",
            "target_2050": "~1% pumped hydro / flexible hydro",
            "note_en": "Steep catchments & typhoon-driven summer runoff require HydroBASINS level 6 resolution.",
            "note_zh": "台灣河川短促陡峭、夏季颱風集中降雨，模型採 HydroBASINS 第 6 級流域切分。",
        },
        {
            "tech_en": "Geothermal (firm baseload RE)",
            "tech_zh": "地熱發電（基載型再生能源）",
            "model_gw": "Up to 6.0 GW cap (Sensitivity D)",
            "model_twh": "~42–47 TWh/yr (at 80–90% CF)",
            "target_2030": "0.2 GW (200 MW)",
            "target_2050": "3.0–6.2 GW (NDC / Flagship plan)",
            "note_en": "MOEA/ITRI theoretical onshore potential estimated at 30–40 GW across Tatun, Yilan, Hualien-Taitung & central belts.",
            "note_zh": "經濟部與工研院推估陸域理論潛能達 30–40 GW（大屯、宜蘭、花東等），2050 官方目標 3–6.2 GW。",
        },
        {
            "tech_en": "Biomass & ocean energy (Kuroshio / wave)",
            "tech_zh": "生質能與海洋能（黑潮／波浪／溫差）",
            "model_gw": "Not spatially bounded in model",
            "model_twh": "—",
            "target_2030": "R&D / pilot arrays",
            "target_2050": "Biomass 1.4–1.8 GW; Ocean 1.3–7.5 GW",
            "note_en": "Official targets from NDC Strategy 2 (ndc_2050_forward_energy, PDF p. 6).",
            "note_zh": "取自 2050 淨零「前瞻能源」關鍵戰略行動計畫（PDF 第 6 頁）。",
        },
    ]


def build_taiwan_local_benchmarks(carriers: list[dict]) -> dict:
    """Compute empirical Taiwan RE capacity factors (2016–2025) from official MOEA CSVs,
    load official FiT full-load-hour benchmarks, and bundle Taiwan-origin resource surveys."""
    gen = pd.read_csv(ROOT / "data" / "official" / "moeaea_generation_by_source_annual.csv", encoding="utf-8-sig").set_index("西元年")
    cap = pd.read_csv(ROOT / "data" / "official" / "moeaea_capacity_by_source_annual.csv", encoding="utf-8-sig").set_index("西元年")
    col_map = {
        "solar": "再生能源_太陽光電_全國(統計數值)",
        "wind": "再生能源_風力_全國(統計數值)",
        "hydro": "再生能源_慣常水力_全國(統計數值)",
        "geothermal": "再生能源_地熱_全國(統計數值)",
        "biomass": "再生能源_生質能_全國(統計數值)",
    }
    empirical = []
    for yr in range(2016, 2026):
        row = {"year": yr}
        for k, col in col_map.items():
            g_gwh = float(gen.loc[yr, col])
            c_mid_mw = 0.5 * (float(cap.loc[yr - 1, col]) + float(cap.loc[yr, col]))
            cf = (g_gwh * 1000.0) / (c_mid_mw * 8760.0) if c_mid_mw > 0 else None
            row[f"{k}_cf"] = _r(cf, 3) if cf is not None else None
            row[f"{k}_gwh"] = _r(g_gwh, 1)
            row[f"{k}_mw"] = _r(c_mid_mw, 1)
        empirical.append(row)

    # Read MOEA FiT benchmark kWh/kW/yr from data/taiwan_cost_benchmarks.csv
    cb = pd.read_csv(ROOT / "data" / "taiwan_cost_benchmarks.csv", encoding="utf-8-sig").set_index("key")
    fit_flh = {k: float(cb.loc[k, "kWh_per_kW"]) for k in ["fit_solar_ground", "fit_onwind", "fit_offwind", "fit_geothermal", "fit_small_hydro", "fit_biomass"] if k in cb.index}

    by_c = {c["carrier"]: c for c in carriers}
    sol_cfs = [r["solar_cf"] for r in empirical if r["solar_cf"] is not None]
    wnd_on_cfs = [r["wind_cf"] for r in empirical if r["year"] <= 2018 and r["wind_cf"] is not None]
    wnd_recent = [r["wind_cf"] for r in empirical if r["year"] >= 2024 and r["wind_cf"] is not None]
    hyd_cfs = [r["hydro_cf"] for r in empirical if r["hydro_cf"] is not None]
    bio_cfs = [r["biomass_cf"] for r in empirical if r["biomass_cf"] is not None]

    comparison = [
        {
            "tech_en": "Solar PV",
            "tech_zh": "太陽光電",
            "era5_cf": f"{_r((by_c.get('solar', {}).get('cf_2013') or 0)*100, 1)}% (2013) / {_r((by_c.get('solar', {}).get('cf_2018') or 0)*100, 1)}% (2018)",
            "fit_benchmark": f"{int(fit_flh.get('fit_solar_ground', 1250)):,} h/yr ({_r(fit_flh.get('fit_solar_ground', 1250)/87.6, 1)}% CF, 2026 FiT)",
            "actual_taiwan": f"{_r(min(sol_cfs)*100, 1)}–{_r(max(sol_cfs)*100, 1)}% (2024: {_r(empirical[-2]['solar_cf']*100, 1)}%, 2025: {_r(empirical[-1]['solar_cf']*100, 1)}%)",
            "finding_en": "ERA5 closely matches Taiwan's national fleet average (~13%), though CWA stations show a ~2× north–south gap (2.2–2.6 vs. 3.9–4.7 kWh/m²/day).",
            "finding_zh": "ERA5 與全台實績（約 13%）高度吻合；惟氣象署測站顯示南北日射量差距近一倍（2.2–2.6 vs. 3.9–4.7 kWh/m²/日）。",
        },
        {
            "tech_en": "Onshore wind",
            "tech_zh": "陸域風電",
            "era5_cf": f"{_r((by_c.get('onwind', {}).get('cf_2013') or 0)*100, 1)}% (2013) / {_r((by_c.get('onwind', {}).get('cf_2018') or 0)*100, 1)}% (2018)",
            "fit_benchmark": f"{int(fit_flh.get('fit_onwind', 2500)):,} h/yr ({_r(fit_flh.get('fit_onwind', 2500)/87.6, 1)}% CF, 2026 FiT)",
            "actual_taiwan": f"{_r(min(wnd_on_cfs)*100, 1)}–{_r(max(wnd_on_cfs)*100, 1)}% (2016–2018 onshore-only fleet)",
            "finding_en": "Key ERA5 bias: 0.3° grid averages coastal wind strips with inland mountains, understating real coastal onshore CF (~25–29%) by >2×.",
            "finding_zh": "ERA5 主要偏差：0.3° 網格將西部海岸與山區平均，低估台灣實際沿海陸域風機容量因數（25–29%）逾兩倍。",
        },
        {
            "tech_en": "Offshore wind",
            "tech_zh": "離岸風電",
            "era5_cf": f"AC {_r((by_c.get('offwind-ac', {}).get('cf_2013') or 0)*100, 1)}% / DC {_r((by_c.get('offwind-dc', {}).get('cf_2013') or 0)*100, 1)}% / Float {_r((by_c.get('offwind-float', {}).get('cf_2013') or 0)*100, 1)}%",
            "fit_benchmark": f"{int(fit_flh.get('fit_offwind', 3750)):,} h/yr ({_r(fit_flh.get('fit_offwind', 3750)/87.6, 1)}% CF, 2023 FiT)",
            "actual_taiwan": f"Combined wind {_r(wnd_recent[0]*100, 1)}% (2024) / {_r(wnd_recent[-1]*100, 1)}% (2025); Strait parks ~35–45%",
            "finding_en": "ERA5 AC (34–36%) and DC/Float (49–53%) bracket MOEA's 42.8% FiT benchmark and operational Strait parks (3,500–4,000 h/yr).",
            "finding_zh": "ERA5 近岸 AC（34–36%）與遠岸 DC／浮動（49–53%）涵蓋能源署 42.8% 躉購基準與實務風場（3,500–4,000 小時/年）。",
        },
        {
            "tech_en": "Conventional hydro",
            "tech_zh": "慣常水力",
            "era5_cf": "Normalized 4.36 TWh/yr (~23.4% CF, HydroBASINS L6)",
            "fit_benchmark": f"Small hydro {int(fit_flh.get('fit_small_hydro', 4000)):,} h/yr ({_r(fit_flh.get('fit_small_hydro', 4000)/87.6, 1)}% CF, 2026 FiT)",
            "actual_taiwan": f"{_r(min(hyd_cfs)*100, 1)}% (2020 drought) – {_r(max(hyd_cfs)*100, 1)}% (2016); 2025: {_r(empirical[-1]['hydro_cf']*100, 1)}%",
            "finding_en": "Actual Taiwan hydro output swings >2× between drought years (3.0 TWh in 2020) and wet typhoon years (6.6 TWh in 2016).",
            "finding_zh": "台灣實際水力發電隨枯水年（2020 年 3.0 TWh）與豐水年（2016 年 6.6 TWh）劇烈擺盪逾兩倍。",
        },
        {
            "tech_en": "Geothermal",
            "tech_zh": "地熱發電",
            "era5_cf": "Not weather-driven (dispatchable baseload in Sensitivity D)",
            "fit_benchmark": f"{int(fit_flh.get('fit_geothermal', 6700)):,} h/yr ({_r(fit_flh.get('fit_geothermal', 6700)/87.6, 1)}% CF, 2026 FiT)",
            "actual_taiwan": "39–60% on early pilot plants (7.5 MW installed in 2025)",
            "finding_en": "GSMMA GeoTEX estimates ~989 MW shallow (1–3 km) and ~40 GW deep (3–6 km) potential, 80% in Tatun, Yilan, Hualien & Taitung.",
            "finding_zh": "經濟部地礦中心評估淺層約 989 MW、深層約 40 GW，八成集中於大屯、宜蘭、花蓮與台東。",
        },
        {
            "tech_en": "Biomass (solid / ag.)",
            "tech_zh": "生質能",
            "era5_cf": "Not weather-driven",
            "fit_benchmark": f"{int(fit_flh.get('fit_biomass', 5600)):,} h/yr ({_r(fit_flh.get('fit_biomass', 5600)/87.6, 1)}% CF, 2026 FiT)",
            "actual_taiwan": f"{_r(min(bio_cfs)*100, 1)}–{_r(max(bio_cfs)*100, 1)}% (2025: {_r(empirical[-1]['biomass_cf']*100, 1)}%)",
            "finding_en": "Real biomass fleet operates mainly as industrial cogeneration and biogas (~84 MW in 2025).",
            "finding_zh": "實務多為工業汽電共生與沼氣發電（2025 年裝置約 84 MW）。",
        },
    ]

    surveys = [
        {
            "agency_en": "CWA (Central Weather Administration)",
            "agency_zh": "交通部中央氣象署 (CODiS / OpenData)",
            "resource_en": "Ground-station solar radiation (O-A0091-001) & wind",
            "resource_zh": "全測站實測日射量與風速風向",
            "figures_en": "North/NE 2.2–2.6 vs. South/Hengchun 3.9–4.7 kWh/m²/day (~2× north–south gap)",
            "figures_zh": "北部／東北部 2.2–2.6 vs. 南部／恆春 3.9–4.7 kWh/m²/日（南北差距近一倍）",
            "evidence": "search_summary",
            "url": "https://codis.cwa.gov.tw/",
        },
        {
            "agency_en": "MOEA Energy Administration",
            "agency_zh": "經濟部能源署（統計與躉購費率基準）",
            "resource_en": "Annual generation/capacity (2005–2025), 22-county solar approvals & FiT FLH",
            "resource_zh": "全國歷年發電／裝置統計、22 縣市光電同意備案與躉購年發電時數",
            "figures_en": "20,989 MW county solar (2015–2025); FiT FLH: solar 1,250, onwind 2,500, offwind 3,750, geothermal 6,700 h/yr",
            "figures_zh": "累計光電備案 20,989 MW；躉購基準：光電 1,250、陸風 2,500、離岸 3,750、地熱 6,700 小時/年",
            "evidence": "downloaded",
            "url": "https://data.gov.tw/dataset/16481",
        },
        {
            "agency_en": "MOEA Energy Administration / ITRI",
            "agency_zh": "經濟部能源署／工研院（海域潛力盤點）",
            "resource_en": "36 Offshore Wind Potential Zones & Phase 3 Block Development",
            "resource_zh": "離岸風電 36 處潛力場址與第三階段區塊開發",
            "figures_en": "Phase 2: 5.5 GW (36 western-coast zones); Phase 3 (2026–2039): +15–18 GW planned; 3,500–4,000 h/yr (35–45% CF)",
            "figures_zh": "二階段潛力場址 5.5 GW；三階段區塊開發（2026–2039）規劃新增 15–18 GW；實績約 3,500–4,000 小時/年",
            "evidence": "search_summary",
            "url": "https://www.moeaea.gov.tw/",
        },
        {
            "agency_en": "MOEA GSMMA (GeoTEX Platform)",
            "agency_zh": "經濟部地質調查及礦業管理中心 (GeoTEX)",
            "resource_en": "National shallow & deep geothermal 3D exploration (405 wells)",
            "resource_zh": "全台淺層與深層地熱潛能區立體探勘（405 口井）",
            "figures_en": "Shallow (1–3 km) ~989 MW; Deep (3–6 km) ~40 GW theoretical. Drilled temps: Tatun 245 °C, Hualien Ruisui 184 °C, Taitung 140–174 °C, Yilan >4,000 m well",
            "figures_zh": "淺層約 989 MW、深層理論潛能約 40 GW；實鑽溫度：大屯馬槽 245°C、花蓮瑞穗 184°C、台東 140–174°C、宜蘭員山逾 4,000 m 深井",
            "evidence": "search_summary",
            "url": "https://www.gsmma.gov.tw/",
        },
    ]

    return {
        "empirical_cf_2016_2025": empirical,
        "era5_vs_taiwan_benchmarks": comparison,
        "taiwan_resource_surveys": surveys,
    }


def load_weather_re_sources() -> list[dict]:
    wanted = [
        "era5_hersbach2020",
        "atlite_hofmann2021",
        "copernicus_lc100_2019",
        "wdpa",
        "gebco_2025",
        "marineregions_eez_v11",
        "gadm_41",
        "moeaea_generation_annual",
        "moeaea_capacity_annual",
        "moeaea_fit_2026_params",
        "moeaea_fit_2023_params",
        "moeaea_solar_approvals_county",
        "ndc_2050_wind_solar",
        "ndc_2050_geothermal",
        "ndc_2050_forward_energy",
        "moea_psd_fy2024",
        "moea_tw_re_potential",
        "cwa_codis_opendata",
        "gsmma_geotex_geothermal",
        "moea_offshore_36_zones",
    ]
    src_df = pd.read_csv(ROOT / "data" / "sources.csv", dtype=str, keep_default_na=False)
    by_id = src_df.set_index("source_id").to_dict("index")
    out = []
    for sid in wanted:
        r = by_id.get(sid)
        if not r:
            continue
        out.append({
            "source_id": sid,
            "short_cite": r["short_cite"],
            "title_zh": r["title"],
            "title_en": r["title_en"],
            "publisher": r["publisher"],
            "url": r["file_url"] or r["landing_url"],
            "evidence": r["evidence"],
            "origin": r["origin"],
            "note": r["note"],
        })
    return out


def export_weather_re_data(repo: Path, out: Path) -> Path:
    reg6 = gpd.read_file(repo / "resources" / RUN_2013 / "bus_regions" / "regions_onshore_elec_s_6.geojson")
    labels = region_labels(reg6)

    cutouts = {
        "2013": analyze_cutout(repo, 2013),
        "2018": analyze_cutout(repo, 2018),
    }
    variability = {
        "2013": analyze_variability(repo, RUN_2013, 2013, include_float=True),
        "2018": analyze_variability(repo, RUN_2018, 2018, include_float=False),
    }
    potential = build_potential_and_exclusions(repo, labels)

    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "cutouts": cutouts,
        "variability": variability,
        "potential": potential,
        "regions": simplify_region_shapes(reg6, labels),
        "county_solar": build_county_solar(),
        "taiwan_local": build_taiwan_local_benchmarks(potential),
        "policy_vs_potential": build_policy_vs_potential(potential),
        "sources": load_weather_re_sources(),
    }
    target = out / "weather_re_data.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    size_kb = round(target.stat().st_size / 1024.0, 1)
    print(f"wrote {target.relative_to(ROOT)} ({size_kb} KB): "
          f"2 ERA5 cutouts (2013 & 2018), {len(potential)} RE carriers, "
          f"{len(payload['county_solar']['counties'])} counties")
    return target


if __name__ == "__main__":
    export_weather_re_data(MODEL_DIR, ROOT / "docs" / "data")
