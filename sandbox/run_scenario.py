"""
Solve one sandbox scenario: a base case plus a lever spec (see levers.py).

    python pypsa_tw/sandbox/run_scenario.py spec.json
    python pypsa_tw/sandbox/run_scenario.py --levers '{"add_offwind_GW": 10}'

Loads the base case's prepared network, applies the levers in memory, then
solves it with ``scripts/solve_network.py`` (its ``prepare_network`` and
``solve_network``, so load shedding, the CO2 constraint and the solver options
are exactly those of a Snakemake run). No Snakemake run and no intermediate
files are created.

Writes ``results/sandbox/<hash>/networks/<case>.nc``, ``spec.json`` next to
it, and the solver log to ``logs/sandbox/<hash>/solve_network/``. A spec that
has already been solved is not solved again (``--force`` overrides).

HiGHS only: the sandbox may later be triggered by a web service, and the
Gurobi licence does not cover that.
"""

import argparse
import json
import sys
import time
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pandas as pd
import pypsa
import yaml

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(REPO / "scripts"))

from levers import BASES, NUCLEAR_NEW_SITE, NUCLEAR_PLANTS, describe, normalise, spec_hash  # noqa: E402

SANDBOX = REPO / "results" / "sandbox"
NEW_BATTERY_HOURS = 4.0  # storage duration of added batteries
NUCLEAR_AVAILABILITY = 0.9  # constant p_max_pu for nuclear (outages and refuelling)


def _deep_update(base, extra):
    for k, v in extra.items():
        base[k] = _deep_update(base.get(k, {}), v) if isinstance(v, dict) and isinstance(base.get(k), dict) else v
    return base


def base_config(base):
    """The merged config the base run was solved with."""
    cfg = {}
    for rel in BASES[base]["configs"]:
        cfg = _deep_update(cfg, yaml.safe_load((REPO / rel).read_text(encoding="utf-8")))
    return _deep_update(cfg, BASES[base]["overrides"])


def emissions_t(n):
    """CO2 in t, counted as the CO2Limit constraint does (fuel use x carrier emissions)."""
    w = n.snapshot_weightings.generators
    fuel = n.generators_t.p.mul(w, axis=0).sum() / n.generators.efficiency
    return float((fuel * n.generators.carrier.map(n.carriers.co2_emissions).fillna(0)).sum())


def _share(weights, total):
    weights = weights.clip(lower=0)
    if weights.sum() <= 0:
        raise ValueError("nothing to spread the addition over")
    return weights / weights.sum() * total


def _peak_load_by_bus(n):
    load = n.loads_t.p_set.T.groupby(n.loads.bus).sum().T
    return load.max().reindex(n.buses.index, fill_value=0.0)


def _nearest_bus(n, lat, lon):
    d = (n.buses.x - lon) ** 2 + (n.buses.y - lat) ** 2
    return d.idxmin()


def add_renewables(n, carriers, total_mw, record):
    """Raise p_nom of existing renewable generators, in proportion to remaining potential."""
    gens = n.generators[n.generators.carrier.isin(carriers)]
    headroom = (gens.p_nom_max - gens.p_nom).replace(np.inf, np.nan).fillna(0)
    if total_mw > headroom.sum() + 1e-6:
        raise ValueError(f"{carriers}: {total_mw:.0f} MW exceeds the remaining potential of {headroom.sum():.0f} MW")
    add = _share(headroom, total_mw)
    n.generators.loc[add.index, "p_nom"] += add
    record.update({f"{g}": round(v, 1) for g, v in add.items() if v > 0})


def add_ccgt(n, total_mw, record):
    """New CCGT units by bus, in proportion to peak demand; costs of the existing CCGT fleet."""
    ref = n.generators[n.generators.carrier == "CCGT"]
    add = _share(_peak_load_by_bus(n), total_mw)
    for bus, mw in add.items():
        if mw <= 0:
            continue
        name = f"{bus} CCGT sandbox"
        n.add("Generator", name, bus=bus, carrier="CCGT", p_nom=mw,
              marginal_cost=ref.marginal_cost.mean(), efficiency=ref.efficiency.mean())
        record[name] = round(mw, 1)


def add_battery(n, total_mw, costs, record):
    """New batteries by bus, in proportion to peak demand.

    Charge and discharge efficiency are technology-data's inverter efficiency
    (0.96 each way). The existing battery in the base network has 1.0, which
    would make new batteries lossless.
    """
    eff = costs.at["battery inverter", "efficiency"]
    add = _share(_peak_load_by_bus(n), total_mw)
    for bus, mw in add.items():
        if mw <= 0:
            continue
        name = f"{bus} battery sandbox"
        n.add("StorageUnit", name, bus=bus, carrier="battery", p_nom=mw, max_hours=NEW_BATTERY_HOURS,
              efficiency_store=eff, efficiency_dispatch=eff, cyclic_state_of_charge=True)
        record[name] = round(mw, 1)


def add_nuclear(n, name, mw, lat, lon, costs, record):
    bus = _nearest_bus(n, lat, lon)
    gen = f"{bus} nuclear {name}"
    n.add("Generator", gen, bus=bus, carrier="nuclear", p_nom=mw, p_max_pu=NUCLEAR_AVAILABILITY,
          marginal_cost=costs.at["nuclear", "marginal_cost"], efficiency=costs.at["nuclear", "efficiency"])
    record[gen] = mw


def remove_capacity(n, component, carriers, total_mw, record):
    """Remove existing capacity: every unit of these carriers scaled down by the same share.

    A removal larger than what exists (the lever bounds are rounded to the slider
    step) removes all of it. Returns the MW actually removed.
    """
    df = getattr(n, component)
    i = df.index[df.carrier.isin(carriers)]
    existing = float(df.loc[i, "p_nom"].sum())
    removed = min(total_mw, existing)
    if existing > 0:
        df.loc[i, "p_nom"] *= 1 - removed / existing
    record["+".join(carriers)] = round(removed, 1)
    return removed


def scale_fuel_price(n, carriers, mult, vom):
    """Multiply the fuel part of the marginal cost: VOM + mult * (marginal_cost - VOM)."""
    i = n.generators.index[n.generators.carrier.isin(carriers)]
    mc = n.generators.loc[i, "marginal_cost"]
    v = n.generators.loc[i, "carrier"].map(vom)
    n.generators.loc[i, "marginal_cost"] = v + mult * (mc - v)


def apply_levers(n, spec, base_emissions):
    """Apply a normalised spec to the prepared network in place. Returns what was changed."""
    lv = spec["levers"]
    costs = pd.read_csv(REPO / BASES[spec["base"]]["costs"], index_col=0)
    applied = {}

    if lv["demand_scale"] != 1.0:
        n.loads_t.p_set *= lv["demand_scale"]
    if lv["line_rating"] != 0.7:
        n.lines["s_max_pu"] = lv["line_rating"]
    if lv["coal_retire_frac"] > 0:
        i = n.generators.index[n.generators.carrier == "coal"]
        applied["coal_retired_MW"] = round(float(n.generators.loc[i, "p_nom"].sum() * lv["coal_retire_frac"]), 1)
        n.generators.loc[i, "p_nom"] *= 1 - lv["coal_retire_frac"]

    # Negative capacity levers remove existing capacity (before anything is added).
    removed = {}
    for lever, component, carriers in [("add_solar_GW", "generators", ["solar"]),
                                       ("add_onwind_GW", "generators", ["onwind"]),
                                       ("add_offwind_GW", "generators", ["offwind-ac", "offwind-dc"]),
                                       ("add_ccgt_GW", "generators", ["CCGT"]),
                                       ("add_battery_GW", "storage_units", ["battery"])]:
        if lv[lever] < 0:
            remove_capacity(n, component, carriers, -lv[lever] * 1e3, removed)
    if removed:
        applied["removed_MW"] = removed

    added = {}
    for lever, carriers in [("add_solar_GW", ["solar"]), ("add_onwind_GW", ["onwind"]),
                            ("add_offwind_GW", ["offwind-ac", "offwind-dc"])]:
        if lv[lever] > 0:
            add_renewables(n, carriers, lv[lever] * 1e3, added)
    if lv["add_ccgt_GW"] > 0:
        add_ccgt(n, lv["add_ccgt_GW"] * 1e3, added)
    if lv["add_battery_GW"] > 0:
        add_battery(n, lv["add_battery_GW"] * 1e3, costs, added)
    for plant in lv["nuclear_restart"]:
        p = NUCLEAR_PLANTS[plant]
        add_nuclear(n, plant, p["MW"], p["lat"], p["lon"], costs, added)
    if lv["add_nuclear_new_GW"] > 0:
        add_nuclear(n, "new", lv["add_nuclear_new_GW"] * 1e3, NUCLEAR_NEW_SITE["lat"], NUCLEAR_NEW_SITE["lon"],
                    costs, added)
    applied["added_MW"] = added

    vom = costs["VOM"]
    if lv["gas_price_mult"] != 1.0:
        scale_fuel_price(n, ["CCGT", "OCGT"], lv["gas_price_mult"], vom)
    if lv["coal_price_mult"] != 1.0:
        scale_fuel_price(n, ["coal"], lv["coal_price_mult"], vom)
    if lv["co2_cap_frac"] is not None:
        cap = lv["co2_cap_frac"] * base_emissions
        n.global_constraints.at["CO2Limit", "constant"] = cap
        applied["co2_cap_t"] = round(cap)
    return applied


def load_solve_module(cfg, opts):
    """Import scripts/solve_network.py and give it the globals it reads from Snakemake."""
    import solve_network as sn

    sn.snakemake = SimpleNamespace(config=cfg, params=SimpleNamespace(policy_config=cfg["policy_config"],
                                                                      solving=cfg["solving"]))
    sn.opts = opts
    return sn


def run(spec, force=False):
    norm = normalise(spec)
    key = spec_hash(norm)
    b = BASES[norm["base"]]
    out_dir = SANDBOX / key
    nc = out_dir / "networks" / f"{b['case']}.nc"
    # spec.json is written last, so a solve that was interrupted is not taken as cached.
    if nc.exists() and (out_dir / "spec.json").exists() and not force:
        print(f"[cached] {key}: {describe(norm)}")
        return key, nc

    cfg = base_config(norm["base"])
    if cfg.get("augmented_line_connection", {}).get("add_to_snakefile"):
        raise NotImplementedError("augmented_line_connection is set in solve_network.py's main block only")
    opts = b["case"].split("_")[-1].split("-")  # e.g. ["Co2L", "4H"], as the {opts} wildcard
    sn = load_solve_module(cfg, opts)

    base_emissions = emissions_t(pypsa.Network(str(REPO / b["solved"])))
    n = pypsa.Network(str(REPO / b["prepared"]))
    applied = apply_levers(n, norm, base_emissions)

    log_dir = REPO / "logs" / "sandbox" / key / "solve_network"
    log_dir.mkdir(parents=True, exist_ok=True)
    n = sn.prepare_network(n, cfg["solving"]["options"], config=cfg["solving"]["options"])
    t0 = time.perf_counter()
    n = sn.solve_network(n, config=cfg, solving=cfg["solving"], log_fn=str(log_dir / f"{b['case']}_solver.log"))
    wall = time.perf_counter() - t0

    nc.parent.mkdir(parents=True, exist_ok=True)
    n.export_to_netcdf(str(nc))
    meta = {"hash": key, "label": (spec or {}).get("label") or describe(norm), "spec": norm, "applied": applied,
            "base_run": b["run"], "base_emissions_t": round(base_emissions), "objective": n.objective,
            "solve_wall_s": round(wall, 2), "solver": cfg["solving"]["solver"]["name"],
            "solved": time.strftime("%Y-%m-%d %H:%M:%S")}
    (out_dir / "spec.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"[solved] {key}: {meta['label']} | objective {n.objective:.6e} | {wall:.1f} s")
    return key, nc


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("spec", nargs="?", help="spec JSON file")
    ap.add_argument("--levers", help="levers as a JSON object (instead of a file)")
    ap.add_argument("--base", default="today")
    ap.add_argument("--force", action="store_true", help="solve again even if cached")
    a = ap.parse_args()
    if a.spec:
        spec = json.loads(Path(a.spec).read_text(encoding="utf-8"))
    else:
        spec = {"base": a.base, "levers": json.loads(a.levers) if a.levers else {}}
    run(spec, force=a.force)


if __name__ == "__main__":
    main()
