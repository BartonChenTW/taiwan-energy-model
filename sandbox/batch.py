"""
Solve the Phase 1 scenario grid: one lever at a time, plus a few combinations.

    python pypsa_tw/sandbox/batch.py            # solve what is not cached yet
    python pypsa_tw/sandbox/batch.py --list     # print the grid and exit
    python pypsa_tw/sandbox/batch.py --variants low high w2018   # uncertainty variants too

Scenarios are solved one after another (shared workstation: one solve at a
time, HiGHS). Each takes about 20-35 s, so the full grid of 42 takes about
15-20 minutes. Cached scenarios are skipped.
"""

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
REPO = Path(__file__).resolve().parents[2]

from levers import BASES, VARIANTS, describe, spec_hash  # noqa: E402

GRID = [
    {},
    # Capacity additions
    *({"add_solar_GW": v} for v in (5, 10, 20)),
    *({"add_offwind_GW": v} for v in (5, 10, 15)),
    *({"add_onwind_GW": v} for v in (2, 5)),
    *({"add_battery_GW": v} for v in (2, 5)),
    *({"add_ccgt_GW": v} for v in (2, 5)),
    # Capacity removals (negative values take existing capacity away)
    {"add_solar_GW": -5},
    {"add_offwind_GW": -3.4},
    {"add_onwind_GW": -0.8},
    {"add_battery_GW": -0.9},
    *({"add_ccgt_GW": v} for v in (-2, -5)),
    # Nuclear
    {"nuclear_restart": ["maanshan"]},
    {"nuclear_restart": ["chinshan", "kuosheng", "maanshan"]},
    *({"add_nuclear_new_GW": round(n * 1.35, 2)} for n in (1, 2, 3, 5)),  # 1, 2, 3, 5 plants of 1.35 GW
    # Coal retirement and CO2 cap
    *({"coal_retire_frac": v} for v in (0.25, 0.5, 0.75, 1.0)),
    *({"co2_cap_frac": v} for v in (0.9, 0.75, 0.6)),
    # Demand and fuel prices
    *({"demand_scale": v} for v in (0.9, 1.1, 1.2, 1.3)),
    *({"gas_price_mult": v} for v in (0.5, 2.0)),
    {"coal_price_mult": 2.0},
    # Transmission
    *({"line_rating": v} for v in (0.85, 1.0)),
    # Combinations
    {"add_offwind_GW": 10, "co2_cap_frac": 0.5},
    {"coal_retire_frac": 1.0, "add_ccgt_GW": 5},
    {"add_solar_GW": 10, "add_battery_GW": 5},
]


# Energy-security cases (docs/energy-security.html): blockade windows with fuel stocks.
CUT = {"lng_import_frac": 0, "coal_import_frac": 0, "oil_import_frac": 0}
SECURITY_GRID = []
for season in ("summer", "winter"):
    for days in (14, 30, 60):
        window = {"blockade_days": days, "blockade_season": season}
        SECURITY_GRID += [window, {**window, **CUT}]
    w30 = {"blockade_days": 30, "blockade_season": season}
    SECURITY_GRID += [
        {**w30, "lng_import_frac": 0},
        {**w30, **CUT, "rationing_frac": 0.2},
        {**w30, **CUT, "nuclear_restart": ["chinshan", "kuosheng", "maanshan"]},
        {**w30, **CUT, "add_solar_GW": 10, "add_battery_GW": 5},
        {**w30, **CUT, "standby_restart": ["hsinta_1_2", "hsinta_3", "mailiao_1_3"]},
        {**w30, **CUT, "damage": ["taichung"]},
        {**w30, **CUT, "lng_stock_days": 14},
    ]
SECURITY_GRID += [
    {"blockade_days": 30, "blockade_season": "summer", **CUT, "damage": ["tatan"]},
    {"blockade_days": 30, "blockade_season": "summer", **CUT, "damage": ["taipei_corridor"]},
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--security", action="store_true", help="solve the energy-security (blockade) grid instead")
    ap.add_argument("--base", default="today", choices=sorted(BASES), help="system the scenarios start from")
    ap.add_argument("--force", action="store_true", help="solve again even if cached (after a model change)")
    ap.add_argument("--variants", nargs="*", default=[], choices=[v for v in VARIANTS if v != "central"],
                    help="also solve these uncertainty variants of every scenario")
    a = ap.parse_args()
    central = [{"base": a.base, "levers": levers} for levers in (SECURITY_GRID if a.security else GRID)]
    assert len({spec_hash(s) for s in central}) == len(central), "duplicate scenarios in the grid"
    specs = list(central)
    for v in a.variants:
        weather = VARIANTS[v].get("weather")
        if weather and not (REPO / BASES[a.base]["weather_variants"].get(weather, "missing")).exists():
            print(f"[skip] variant {v}: no prepared network for {weather} weather yet")
            continue
        specs += [{**s, "variant": v} for s in central]
    if a.list:
        for s in specs:
            print(spec_hash(s), describe(s))
        print(f"{len(specs)} scenarios")
        return
    from run_scenario import run

    t0 = time.perf_counter()
    for i, s in enumerate(specs, 1):
        print(f"--- {i}/{len(specs)} {s.get('variant', 'central')}", flush=True)
        run(s, force=a.force)
    print(f"done in {time.perf_counter() - t0:.0f} s")


if __name__ == "__main__":
    main()
