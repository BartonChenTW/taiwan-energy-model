"""
Export Taiwan run results to compact JSON for the GitHub Pages dashboard.

Reads every solved network under ``results/<run>/networks/*.nc`` and writes

- ``docs/data/index.json``: one summary record per case, with sanity warnings
- ``docs/data/cases/<run>__<case>.json``: inputs, technology data and results

Run from anywhere inside the repository:

    python pypsa_tw/viewer/export_dashboard_data.py

Only aggregated numbers are exported; no local paths end up in the output.
"""

import json
import logging
import re
import warnings
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import pypsa

from viewer_helper import resolve_repo

# Case the dashboard opens with: the full-year run with standard settings.
FEATURED_CASE = "tw_test2_highs_2013_fullyear_4h_6b_ls__elec_s_6_ec_lv1.0_Co2L-4H"
# Model costs are in EUR (technology-data). The dashboard shows electricity prices in
# NT$/kWh using this rate: Bank of Taiwan spot EUR, midpoint of buy 35.885 / sell 36.485.
CURRENCY = {"eur_twd": 36.185, "date": "2026-09-24 17:01", "basis": "Bank of Taiwan spot rate, buy/sell midpoint",
            "source": "https://rate.bot.com.tw/xrt?Lang=zh-TW"}
RENEWABLE_CARRIERS = ["solar", "onwind", "offwind-ac", "offwind-dc", "ror"]
# Capacity factors above these are not physically plausible for Taiwan.
# pypsa-earth names the load-shedding carrier "load shedding"; PyPSA-Eur uses "load".
SHED_CARRIERS = ["load shedding", "load"]
MAX_PLAUSIBLE_CF = {"solar": 0.30, "onwind": 0.60, "offwind-ac": 0.70, "offwind-dc": 0.70}


def _r(x, nd=3):
    """Round for JSON; map NaN/inf to None."""
    if x is None:
        return None
    x = float(x)
    return round(x, nd) if np.isfinite(x) else None


def _series(s, nd=3):
    return {str(k): _r(v, nd) for k, v in s.items()}


def _list(s, nd=1):
    return [_r(v, nd) for v in s]


def read_benchmark_seconds(repo, run, case):
    path = repo / "benchmarks" / run / "solve_network" / case
    if not path.exists():
        return None
    df = pd.read_csv(path, sep="\t")
    return _r(df["s"].iloc[0], 2) if "s" in df else None


def read_solver_log(repo, run, case):
    """Return (solver_name, solver_seconds, status) parsed from the solver log."""
    path = repo / "logs" / run / "solve_network" / f"{case}_solver.log"
    if not path.exists():
        return None, None, None
    text = path.read_text(errors="ignore")
    if m := re.search(r"HiGHS run time\s*:\s*([\d.]+)", text):
        status = re.search(r"Model status\s*:\s*(\w+)", text)
        return "highs", _r(m.group(1), 2), status.group(1) if status else None
    if m := re.search(r"solved model in \d+ iterations and ([\d.]+) seconds", text):
        status = "Optimal" if "Optimal objective" in text else None
        return "gurobi", _r(m.group(1), 2), status
    return None, None, None


def energy_by_carrier(n, w):
    gen = n.generators_t.p.mul(w, axis=0).sum().groupby(n.generators.carrier).sum()
    su = pd.Series(dtype=float)
    if not n.storage_units_t.p.empty:
        su = (
            n.storage_units_t.p.clip(lower=0)
            .mul(w, axis=0)
            .sum()
            .groupby(n.storage_units.carrier)
            .sum()
        )
    return gen.add(su, fill_value=0.0)


def capacity_by_carrier(n):
    # Load-shedding generators ("load") have a huge nominal capacity; leave them out.
    gen = n.generators[~n.generators.carrier.isin(SHED_CARRIERS)].groupby("carrier").p_nom_opt.sum()
    su = n.storage_units.groupby("carrier").p_nom_opt.sum()
    return gen.add(su, fill_value=0.0)


def national_dispatch(n):
    """Dispatch per snapshot by carrier in MW; storage charging is negative."""
    gen = n.generators_t.p.T.groupby(n.generators.carrier).sum().T
    if not n.storage_units_t.p.empty:
        su = n.storage_units_t.p.T.groupby(n.storage_units.carrier).sum().T
        gen = gen.add(su, fill_value=0.0)
    return gen


def availability_profiles(n):
    """Capacity-weighted national p_max_pu per carrier (input availability)."""
    out = {}
    pmax = n.generators_t.p_max_pu
    for carrier in RENEWABLE_CARRIERS:
        gens = n.generators.index[n.generators.carrier == carrier]
        gens = [g for g in gens if g in pmax.columns]
        if not gens:
            continue
        cap = n.generators.loc[gens, "p_nom_opt"]
        if cap.sum() <= 0:
            continue
        out[carrier] = pmax[gens].mul(cap, axis=1).sum(axis=1) / cap.sum()
    return pd.DataFrame(out, index=n.snapshots)


def renewable_potential(n, avail, energy, hours):
    """
    Per renewable technology: installed and technical potential (GW), the potential
    capacity factor from the weather data (mean availability), the realised capacity
    factor from dispatch, and curtailment (the share of available energy not used).
    """
    out = {}
    for carrier in RENEWABLE_CARRIERS:
        g = n.generators[n.generators.carrier == carrier]
        if g.empty or g.p_nom.sum() <= 0:
            continue
        potential = g.p_nom_max.replace(float("inf"), float("nan")).sum(min_count=1)
        cf_pot = float(avail[carrier].mean()) if carrier in avail else None
        cf_real = float(energy.get(carrier, 0.0)) / (g.p_nom_opt.sum() * hours)
        out[carrier] = {
            "installed_GW": _r(g.p_nom.sum() / 1e3),
            "potential_GW": _r(potential / 1e3) if pd.notna(potential) else None,
            "cf_potential": _r(cf_pot),
            "cf_realised": _r(cf_real),
            "curtailment": _r(max(0.0, 1 - cf_real / cf_pot)) if cf_pot else None,
        }
    return out


def technology_table(n):
    g = n.generators
    rows = []
    for carrier, df in g[~g.carrier.isin(SHED_CARRIERS)].groupby("carrier"):
        cap = df.p_nom_opt
        wmean = lambda col: (df[col] * cap).sum() / cap.sum() if cap.sum() > 0 else df[col].mean()
        rows.append(
            {
                "carrier": carrier,
                "count": int(len(df)),
                "p_nom_GW": _r(df.p_nom.sum() / 1e3),
                "marginal_cost": _r(wmean("marginal_cost"), 2),
                "capital_cost": _r(wmean("capital_cost"), 1),
                "efficiency": _r(wmean("efficiency"), 3),
                "co2_t_per_MWh_fuel": _r(n.carriers.co2_emissions.get(carrier, 0.0), 3),
                "lifetime": _r(df["lifetime"].replace(np.inf, np.nan).mean(), 1)
                if "lifetime" in df
                else None,
                "build_year_mean": _r(df["build_year"].replace(0, np.nan).mean(), 0)
                if "build_year" in df
                else None,
                "extendable": bool(df.p_nom_extendable.any()),
            }
        )
    for carrier, df in n.storage_units.groupby("carrier"):
        rows.append(
            {
                "carrier": carrier,
                "count": int(len(df)),
                "p_nom_GW": _r(df.p_nom.sum() / 1e3),
                "marginal_cost": _r(df.marginal_cost.mean(), 2),
                "capital_cost": _r(df.capital_cost.mean(), 1),
                "efficiency": _r(df.efficiency_dispatch.mean(), 3),
                "co2_t_per_MWh_fuel": _r(n.carriers.co2_emissions.get(carrier, 0.0), 3),
                "lifetime": None,
                "build_year_mean": None,
                "extendable": bool(df.p_nom_extendable.any()),
                "max_hours": _r(df.max_hours.mean(), 1),
            }
        )
    return rows


def sanity_warnings(n, energy, cap, hours, avail):
    """
    Return structured warnings; the dashboard formats them per language.

    ``severity`` is "critical" when the result should not be trusted and
    "warning" when it departs from a fixed current-system setup.
    """
    warn = []
    n.determine_network_topology()
    n_sub = n.buses.sub_network.nunique()
    if n_sub > 1:
        warn.append({"code": "subnetworks", "severity": "critical", "n": int(n_sub)})
    shed = n.generators.index[n.generators.carrier.isin(SHED_CARRIERS)]
    if len(shed):
        shed_e = float(n.generators_t.p[shed].mul(n.snapshot_weightings.generators, axis=0).sum().sum())
        if shed_e > 1:
            warn.append({"code": "load_shedding", "severity": "critical", "gwh": _r(shed_e / 1e3, 1)})
    for carrier, limit in MAX_PLAUSIBLE_CF.items():
        if carrier in energy and cap.get(carrier, 0) > 0:
            cf = energy[carrier] / (cap[carrier] * hours)
            if cf > limit:
                warn.append(
                    {"code": "cf_implausible", "severity": "critical", "carrier": carrier,
                     "cf": _r(cf), "limit": limit}
                )
    if "solar" in avail:
        saturated = float((avail["solar"] > 0.99).mean())
        if saturated > 0.01:
            warn.append({"code": "availability_saturated", "severity": "critical", "share": _r(saturated)})
    if n.generators.p_nom_extendable.any():
        warn.append({"code": "gens_extendable", "severity": "warning"})
    if n.lines.s_nom_extendable.any():
        added = float((n.lines.s_nom_opt - n.lines.s_nom).clip(lower=0).sum())
        warn.append({"code": "lines_extendable", "severity": "warning", "added_gw": _r(added / 1e3, 1)})
    return warn


def describe_warning(w):
    """English one-liner for console output."""
    c = w["code"]
    if c == "subnetworks":
        return f"{w['n']} disconnected subnetworks"
    if c == "load_shedding":
        return f"load shedding used: {w['gwh']} GWh"
    if c == "cf_implausible":
        return f"{w['carrier']} capacity factor {w['cf']:.0%} is implausible (> {w['limit']:.0%})"
    if c == "availability_saturated":
        return f"solar availability is 1.0 in {w['share']:.0%} of snapshots (weather data gap?)"
    if c == "gens_extendable":
        return "some generators are extendable"
    if c == "lines_extendable":
        return f"lines extendable; {w['added_gw']} GW added"
    return c


def export_case(repo, run, nc_path):
    case = nc_path.stem
    n = pypsa.Network(str(nc_path))
    w = n.snapshot_weightings.generators
    w_obj = n.snapshot_weightings.objective
    hours = float(w.sum())
    step_h = pd.Series(n.snapshots).diff().median() / pd.Timedelta("1h") if len(n.snapshots) > 1 else 1

    energy = energy_by_carrier(n, w)
    energy = energy[energy.abs() > 1e-3]
    cap = capacity_by_carrier(n)
    load_t = n.loads_t.p_set.sum(axis=1)
    demand = float((load_t * w).sum())
    avail = availability_profiles(n)

    cf = {c: energy[c] / (cap[c] * hours) for c in energy.index if cap.get(c, 0) > 0}
    opex = (
        (n.generators_t.p.mul(w_obj, axis=0) * n.generators.marginal_cost)
        .sum()
        .groupby(n.generators.carrier)
        .sum()
    )
    fuel = n.generators_t.p.mul(w, axis=0).sum() / n.generators.efficiency
    co2 = (fuel * n.generators.carrier.map(n.carriers.co2_emissions).fillna(0)).groupby(
        n.generators.carrier
    ).sum()

    # Prices
    price = n.buses_t.marginal_price
    bus_load = n.loads_t.p_set.T.groupby(n.loads.bus).sum().T.reindex(columns=price.columns, fill_value=0)
    nat_price = (price * bus_load).sum(axis=1) / bus_load.sum(axis=1).replace(0, np.nan)

    # Lines
    lines = []
    for name, l in n.lines.iterrows():
        flow = n.lines_t.p0[name].abs() if name in n.lines_t.p0 else pd.Series(0.0, index=n.snapshots)
        s = l.s_nom_opt if l.s_nom_opt > 0 else l.s_nom
        lines.append(
            {
                "name": str(name),
                "bus0": l.bus0,
                "bus1": l.bus1,
                "s_nom_MVA": _r(l.s_nom, 0),
                "s_nom_opt_MVA": _r(l.s_nom_opt, 0),
                "length_km": _r(l.length, 1),
                "v_nom_kV": _r(n.buses.v_nom.get(l.bus0), 0),
                "loading_mean": _r(flow.mean() / s if s else None),
                "loading_max": _r(flow.max() / s if s else None),
            }
        )

    buses = []
    gen_by_bus = n.generators_t.p.mul(w, axis=0).sum().groupby(n.generators.bus).sum()
    for name, b in n.buses.iterrows():
        bl = bus_load[name] if name in bus_load else pd.Series(0.0, index=n.snapshots)
        buses.append(
            {
                "name": str(name),
                "x": _r(b.x, 4),
                "y": _r(b.y, 4),
                "demand_TWh": _r((bl * w).sum() / 1e6),
                "peak_GW": _r(bl.max() / 1e3),
                "generation_TWh": _r(gen_by_bus.get(name, 0.0) / 1e6),
                "price_mean": _r(price[name].mean(), 2) if name in price else None,
            }
        )

    dispatch = national_dispatch(n)
    solver, solver_s, solver_status = read_solver_log(repo, run, case)
    ll = re.search(r"_l([cv](?:opt|[\d.]+))_", case)
    summary = {
        "id": f"{run}__{case}",
        "run": run,
        "case": case,
        "transmission": ll.group(1) if ll else None,
        "solver": solver,
        "solver_status": solver_status,
        "solve_rule_s": read_benchmark_seconds(repo, run, case),
        "solver_s": solver_s,
        "objective": _r(n.objective, 0),
        "snapshots": int(len(n.snapshots)),
        "start": str(n.snapshots[0]),
        "end": str(n.snapshots[-1]),
        "step_h": _r(step_h, 2),
        "weight_h_per_snapshot": _r(w.mean(), 3),
        "represented_hours": _r(hours, 1),
        "buses": int(len(n.buses)),
        "demand_TWh": _r(demand / 1e6),
        "generation_TWh": _r(energy.drop(SHED_CARRIERS, errors="ignore").sum() / 1e6),
        "co2_Mt": _r(co2.sum() / 1e6),
        "unserved_GWh": _r(energy.reindex(SHED_CARRIERS).fillna(0).sum() / 1e3, 1),
        "unserved_peak_GW": _r(dispatch.reindex(columns=SHED_CARRIERS).fillna(0).sum(axis=1).max() / 1e3, 2),
        "price_mean": _r(nat_price.mean(), 2),
        "warnings": sanity_warnings(n, energy, cap, hours, avail),
    }

    detail = {
        "summary": summary,
        "inputs": {
            "time": [t.strftime("%Y-%m-%d %H:%M") for t in n.snapshots],
            "demand_MW": _list(load_t, 0),
            "availability": {c: _list(avail[c], 3) for c in avail.columns},
            "availability_mean": _series(avail.mean()),
            "renewable_potential": renewable_potential(n, avail, energy, hours),
            "technology": technology_table(n),
        },
        "results": {
            "capacity_GW": _series(cap / 1e3),
            "energy_TWh": _series(energy / 1e6),
            "capacity_factor": _series(pd.Series(cf)),
            "opex_MEUR": _series(opex[opex.abs() > 0] / 1e6, 2),
            "co2_Mt": _series(co2[co2 > 0] / 1e6),
            "dispatch_MW": {c: _list(dispatch[c], 0) for c in dispatch.columns},
            "price_national": _list(nat_price, 2),
            "buses": buses,
            "lines": lines,
        },
    }
    return summary, detail


# PyPSA-Earth default inputs: powerplantmatching fleet with IRENA top-up and the GEGIS
# 2030 demand projection. This archived full-year run used them with demand scale 0.86.
DEFAULT_DATA_RUN = "results/_archive/tw_test2_highs_2013_fullyear_4h_6b_ls_oldfleet_2026-09-24/networks/elec_s_6_ec_lv1.0_Co2L-4H.nc"
DEFAULT_DATA_SCALE = 0.86
MIX_GROUP = {"CCGT": "gas", "OCGT": "gas", "coal": "coal", "lignite": "coal", "nuclear": "nuclear", "oil": "other",
             "solar": "renewables", "onwind": "renewables", "offwind-ac": "renewables", "offwind-dc": "renewables",
             "ror": "renewables", "hydro": "renewables", "PHS": "storage", "battery": "storage"}
CAP_GROUP = {"CCGT": "gas", "OCGT": "gas", "coal": "coal", "lignite": "coal", "nuclear": "nuclear", "oil": "oil",
             "solar": "solar", "onwind": "onwind", "offwind-ac": "offwind", "offwind-dc": "offwind",
             "ror": "hydro", "hydro": "hydro", "PHS": "phs", "battery": "battery"}


def _fleet_and_mix(n):
    w = n.snapshot_weightings.generators
    g = n.generators[~n.generators.carrier.isin(SHED_CARRIERS)]
    cap = pd.concat([g.groupby("carrier").p_nom.sum(), n.storage_units.groupby("carrier").p_nom.sum()])
    e = pd.concat([n.generators_t.p[g.index].mul(w, axis=0).sum().groupby(g.carrier).sum(),
                   n.storage_units_t.p.clip(lower=0).mul(w, axis=0).sum().groupby(n.storage_units.carrier).sum()])
    mix = e.groupby(lambda c: MIX_GROUP.get(c, "other")).sum()
    load = n.loads_t.p_set.sum(axis=1)
    phs = n.storage_units[n.storage_units.carrier == "PHS"]
    return {
        "capacity_GW": _series(cap.groupby(lambda c: CAP_GROUP.get(c, "other")).sum() / 1e3, 2),
        "mix_share": _series(mix / mix.sum(), 4),
        "demand_TWh": float((load * w).sum() / 1e6),
        "peak_GW": float(load.max() / 1e3),
        "phs_hours": _r(phs.max_hours.mean(), 1) if len(phs) else None,
    }


def build_comparison(repo, featured_path):
    """PyPSA-Earth default inputs vs Taiwan official inputs vs reported statistics."""
    default_path = repo / DEFAULT_DATA_RUN
    if not default_path.exists() or not featured_path.exists():
        return None
    default = _fleet_and_mix(pypsa.Network(str(default_path)))
    taiwan = _fleet_and_mix(pypsa.Network(str(featured_path)))
    stats = pd.read_csv(repo / "pypsa_tw/data/official/taiwan_electricity_statistics.csv")
    peak = pd.read_csv(repo / "pypsa_tw/data/official/taipower_peak_load_by_year.csv", encoding="utf-8-sig")
    actual = []
    for (scope, year), grp in stats[stats.statistic.str.startswith("share_")].groupby(["scope", "year"], sort=False):
        shares = {r.statistic.replace("share_", "").replace("pumped_storage", "storage"): r.value / 100
                  for _, r in grp.iterrows()}
        shares["other"] = max(0.0, 1 - sum(shares.values()))
        actual.append({"label": f"{scope} {year}", "scope": scope, "year": int(year),
                       "mix_share": {k: _r(v, 4) for k, v in shares.items()},
                       "source": grp.source_name.iloc[0], "evidence": grp.evidence.iloc[0]})
    peak_2024 = int(peak.loc[peak["年度"] == 2024, "尖峰負載(MW)"].iloc[0])
    total_2024 = stats.query("statistic == 'generation_total' and year == 2024")
    return {
        "default": {**default, "demand_TWh": _r(default["demand_TWh"] / DEFAULT_DATA_SCALE, 1),
                    "peak_GW": _r(default["peak_GW"] / DEFAULT_DATA_SCALE, 1),
                    "note": "powerplantmatching fleet + IRENA 2023 top-up; GEGIS 2030 demand (unscaled)"},
        "taiwan": {**taiwan, "demand_TWh": _r(taiwan["demand_TWh"], 1), "peak_GW": _r(taiwan["peak_GW"], 1),
                   "note": "Taipower unit list 2026-09-24 (+ new units); demand scaled to Taipower system 2024"},
        "actual_mix": actual,
        "reference": {
            "peak_GW_2024": _r(peak_2024 / 1e3, 2),
            "demand_TWh_2024": {r.scope: r.value for _, r in total_2024.iterrows()},
        },
    }


def main():
    logging.disable(logging.WARNING)
    warnings.filterwarnings("ignore")
    repo = resolve_repo(Path(__file__).parent)
    out = repo / "docs" / "data"
    (out / "cases").mkdir(parents=True, exist_ok=True)

    index = []
    for nc in sorted((repo / "results").glob("*/networks/*.nc")):
        run = nc.parent.parent.name
        if run.startswith("_"):  # skip results/_archive
            continue
        summary, detail = export_case(repo, run, nc)
        (out / "cases" / f"{summary['id']}.json").write_text(
            json.dumps(detail, separators=(",", ":")), encoding="utf-8"
        )
        index.append(summary)
        flag = "OK  " if not summary["warnings"] else "WARN"
        text = "; ".join(describe_warning(w) for w in summary["warnings"])
        print(f"[{flag}] {summary['id']}: {text or 'no warnings'}")

    featured = repo / "results" / FEATURED_CASE.split("__")[0] / "networks" / (FEATURED_CASE.split("__")[1] + ".nc")
    comparison = build_comparison(repo, featured)
    if comparison:
        (out / "comparison.json").write_text(json.dumps(comparison, indent=1), encoding="utf-8")
        print("wrote comparison.json (PyPSA-Earth default vs Taiwan data)")

    (out / "index.json").write_text(
        json.dumps(
            {"generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
             "featured": FEATURED_CASE if any(c["id"] == FEATURED_CASE for c in index) else None,
             "currency": CURRENCY,
             "cases": index},
            indent=1,
        ),
        encoding="utf-8",
    )
    print(f"wrote {len(index)} cases to {out.relative_to(repo)}")


if __name__ == "__main__":
    main()
