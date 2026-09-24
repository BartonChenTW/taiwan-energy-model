"""
Sandbox levers: the scenario spec format, its validation and its hash.

A spec is a small JSON diff against a named base case::

    {"base": "today", "levers": {"add_offwind_GW": 10, "co2_cap_frac": 0.5}}

Levers left out take their default, which leaves the base case unchanged.
``normalise`` fills the defaults and checks every value against the ranges
below. ``spec_hash`` of the normalised spec is the cache key: two specs that
mean the same thing get the same hash and are solved once.
"""

import hashlib
import json

# Bump when the meaning of a lever changes, so old cached results are not reused.
SPEC_VERSION = 1

# Base cases the sandbox can start from. Paths are relative to the repository root.
BASES = {
    "today": {
        "label": "Today's system (Test 2, 2013 weather, load shedding allowed)",
        # The prepared network does not depend on load shedding (added at solve time),
        # so the Test 2 network is the one the _ls run solved.
        "prepared": "networks/tw_test2_highs_2013_fullyear_4h_6b/elec_s_6_ec_lv1.0_Co2L-4H.nc",
        "solved": "results/tw_test2_highs_2013_fullyear_4h_6b_ls/networks/elec_s_6_ec_lv1.0_Co2L-4H.nc",
        "run": "tw_test2_highs_2013_fullyear_4h_6b_ls",
        "configs": ["config.default.yaml", "pypsa_tw/config/config_tw_test2_highs.yaml"],
        # The one-off overlay of the _ls run (see pypsa_tw/log.md).
        "overrides": {"solving": {"options": {"load_shedding": True}}},
        "costs": "resources/tw_test2_highs_2013_fullyear_4h_6b/costs_2030_elec.csv",
        "case": "elec_s_6_ec_lv1.0_Co2L-4H",
    },
}

# Existing nuclear plants that could restart, at their OpenStreetMap sites
# (osm_power_plants_tw_20260924.json; capacity = plant:output:electricity).
NUCLEAR_PLANTS = {
    "chinshan": {"name": "Chinshan (核一)", "MW": 1208, "lat": 25.2855, "lon": 121.5883, "osm": "way 207641187"},
    "kuosheng": {"name": "Kuosheng (核二)", "MW": 1896, "lat": 25.2025, "lon": 121.6627, "osm": "way 203381069"},
    "maanshan": {"name": "Maanshan (核三)", "MW": 1780, "lat": 21.9584, "lon": 120.7512, "osm": "relation 7565672"},
}
# New nuclear goes to the Lungmen site (核四, never operated), OSM way 546051675.
NUCLEAR_NEW_SITE = {"name": "Lungmen site (核四)", "lat": 25.0458, "lon": 121.9282, "osm": "way 546051675"}

# name: (default, min, max, unit, description)
LEVERS = {
    # Capacity levers: positive adds, negative removes existing capacity (every plant of that
    # type scaled down by the same share). The lower bound is today's capacity, rounded to the
    # slider step; a removal larger than what exists removes all of it.
    # Today (base network): solar 15.39, onshore 0.81, offshore 3.38, battery 0.85, CCGT 26.03 GW.
    "add_solar_GW": (0.0, -15.0, 20.0, "GW", "Solar PV added (+) or removed (-); additions by remaining technical potential"),
    "add_onwind_GW": (0.0, -0.8, 10.0, "GW", "Onshore wind added (+) or removed (-); additions by remaining potential"),
    "add_offwind_GW": (0.0, -3.4, 20.0, "GW", "Offshore wind added (+) or removed (-); additions by remaining potential (AC and DC sites)"),
    "add_battery_GW": (0.0, -0.9, 10.0, "GW", "Battery storage added (+, 4 h, by peak demand) or removed (-)"),
    "add_ccgt_GW": (0.0, -26.0, 10.0, "GW", "Gas CCGT added (+, by peak demand) or removed (-)"),
    "nuclear_restart": ([], None, None, "plants", "Existing nuclear plants restarted: chinshan, kuosheng, maanshan"),
    "add_nuclear_new_GW": (0.0, 0.0, 5.0, "GW", "New nuclear at the Lungmen site"),
    "coal_retire_frac": (0.0, 0.0, 1.0, "fraction", "Share of coal capacity retired (every coal plant scaled down)"),
    "co2_cap_frac": (None, 0.3, 1.0, "fraction", "CO2 cap as a fraction of the base case's emissions; null = no cap"),
    "demand_scale": (1.0, 0.9, 1.3, "x", "Annual demand relative to the base case (hourly shape unchanged)"),
    "gas_price_mult": (1.0, 0.5, 2.0, "x", "Gas fuel price multiplier (O&M unchanged)"),
    "coal_price_mult": (1.0, 0.5, 2.0, "x", "Coal fuel price multiplier (O&M unchanged)"),
    "line_rating": (0.7, 0.5, 1.0, "s_max_pu", "Usable share of each line's rating (0.7 = N-1 margin in the base)"),
}


def normalise(spec):
    """Return a complete, validated copy of a spec (defaults filled, values checked)."""
    spec = dict(spec or {})
    unknown = set(spec) - {"base", "levers", "label", "version"}
    if unknown:
        raise ValueError(f"unknown spec keys: {sorted(unknown)}")
    if spec.get("version", SPEC_VERSION) != SPEC_VERSION:
        raise ValueError(f"spec version {spec['version']} does not match SPEC_VERSION {SPEC_VERSION}")
    base = spec.get("base", "today")
    if base not in BASES:
        raise ValueError(f"unknown base {base!r}; choose from {sorted(BASES)}")
    given = dict(spec.get("levers") or {})
    unknown = set(given) - set(LEVERS)
    if unknown:
        raise ValueError(f"unknown levers: {sorted(unknown)}")
    levers = {}
    for name, (default, lo, hi, _, _) in LEVERS.items():
        value = given.get(name, default)
        if name == "nuclear_restart":
            value = sorted(set(value or []))
            bad = set(value) - set(NUCLEAR_PLANTS)
            if bad:
                raise ValueError(f"nuclear_restart: unknown plants {sorted(bad)}")
        elif value is None:
            if default is not None:
                raise ValueError(f"{name} cannot be null")
        else:
            value = float(value)
            if not lo <= value <= hi:
                raise ValueError(f"{name}={value} outside [{lo}, {hi}]")
            value = round(value, 6)
        levers[name] = value
    return {"version": SPEC_VERSION, "base": base, "levers": levers}


def spec_hash(spec):
    """Cache key: short SHA-256 of the normalised spec (the label is not part of it)."""
    norm = normalise(spec)
    text = json.dumps(norm, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def changed(spec):
    """Levers that differ from their default, e.g. for labels."""
    norm = normalise(spec)["levers"]
    return {k: v for k, v in norm.items() if v != LEVERS[k][0]}


def describe(spec):
    """Short human-readable label such as 'offwind +10 GW, CO2 cap 50%'."""
    parts = []
    for k, v in changed(spec).items():
        if k.startswith("add_") and k.endswith("_GW"):
            parts.append(f"{k[4:-3].replace('_', ' ')} {v:+g} GW")
        elif k == "nuclear_restart":
            parts.append("restart " + " + ".join(v))
        elif k == "coal_retire_frac":
            parts.append(f"coal -{v:.0%}")
        elif k == "co2_cap_frac":
            parts.append(f"CO2 cap {v:.0%}")
        elif k == "demand_scale":
            parts.append(f"demand x{v:g}")
        elif k.endswith("_price_mult"):
            parts.append(f"{k.split('_')[0]} price x{v:g}")
        elif k == "line_rating":
            parts.append(f"lines {v:.0%} of rating")
    return ", ".join(parts) or "base case"
