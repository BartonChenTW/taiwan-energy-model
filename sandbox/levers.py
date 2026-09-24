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
        # Same system under other weather years (Snakemake runs of pypsa_tw/config/scenarios/weather_*.yaml),
        # used for the uncertainty ranges.
        "weather_variants": {
            "2011": "networks/tw_weather2011_highs_fullyear_4h_6b_ls/elec_s_6_ec_lv1.0_Co2L-4H.nc",
            "2018": "networks/tw_weather2018_highs_fullyear_4h_6b_ls/elec_s_6_ec_lv1.0_Co2L-4H.nc",
        },
    },
}

# Uncertainty variants: each scenario is also solved under these, and the page shows the
# range. "low"/"high" multiply the scenario's own gas price, coal price and demand.
FUEL_DEMAND_SPREAD = 0.10
VARIANTS = {
    "central": {},
    "w2011": {"weather": "2011"},
    "w2018": {"weather": "2018"},
    "low": {"mult": 1 - FUEL_DEMAND_SPREAD},
    "high": {"mult": 1 + FUEL_DEMAND_SPREAD},
}
# Technology-cost uncertainty, applied to the annualised investment of added capacity
# without extra solves: investment +-30%, discount rate 5-10% (base 7.1%).
INVESTMENT_SPREAD = 0.30
DISCOUNT_RATES = (0.05, 0.10)

# Existing nuclear plants that could restart, at their OpenStreetMap sites
# (osm_power_plants_tw_20260924.json; capacity = plant:output:electricity).
NUCLEAR_PLANTS = {
    "chinshan": {"name": "Chinshan (核一)", "MW": 1208, "lat": 25.2855, "lon": 121.5883, "osm": "way 207641187"},
    "kuosheng": {"name": "Kuosheng (核二)", "MW": 1896, "lat": 25.2025, "lon": 121.6627, "osm": "way 203381069"},
    "maanshan": {"name": "Maanshan (核三)", "MW": 1780, "lat": 21.9584, "lon": 120.7512, "osm": "relation 7565672"},
}
# New nuclear goes to the Lungmen site (核四, never operated), OSM way 546051675. The page counts it
# in plants of one Lungmen-design reactor unit (ABWR, 1,350 MW; Lungmen was built with two).
NUCLEAR_NEW_SITE = {"name": "Lungmen site (核四)", "lat": 25.0458, "lon": 121.9282, "osm": "way 546051675",
                    "unit_MW": 1350, "max_units": 5}

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
    "add_nuclear_new_GW": (0.0, 0.0, 6.75, "GW", "New nuclear at the Lungmen site (the page sets it in plants of 1.35 GW, 0-5)"),
    "coal_retire_frac": (0.0, 0.0, 1.0, "fraction", "Share of coal capacity retired (every coal plant scaled down)"),
    "co2_cap_frac": (None, 0.3, 1.0, "fraction", "CO2 cap as a fraction of the base case's emissions; null = no cap"),
    "demand_scale": (1.0, 0.9, 1.3, "x", "Annual demand relative to the base case (hourly shape unchanged)"),
    "gas_price_mult": (1.0, 0.0, 2.0, "x", "Gas fuel price multiplier (O&M unchanged)"),
    "coal_price_mult": (1.0, 0.0, 2.0, "x", "Coal fuel price multiplier (O&M unchanged)"),
    "line_rating": (0.7, 0.5, 1.0, "s_max_pu", "Usable share of each line's rating (0.7 = N-1 margin in the base)"),
}


# ---------- Energy security: blockade, damage, restarts ----------
# Fuel stocks in Taiwan (secondary sources, to verify; see pypsa_tw/data/sources.csv):
# LNG about 11 days (legal minimum 7 days, 14 days from 2027), coal about 41 days
# (Taipower, 2022), oil 100+ days (Petroleum Administration Act: 60 days industry + 30 government).
BLOCKADE_SEASONS = {"summer": "2013-07-01", "winter": "2013-01-07"}

# Plant sites that can be lost (capacity removed at the nearest bus, from data/custom_powerplants.csv).
DAMAGE_SITES = {
    "tatan": {"name": "Tatan gas plant (大潭)", "lat": 25.0253, "lon": 121.0458, "remove_MW": {"CCGT": 7544.5}},
    "taichung": {"name": "Taichung power plant (台中)", "lat": 24.2152, "lon": 120.4815,
                 "remove_MW": {"coal": 5500.0, "CCGT": 2600.0}},
    "hsinta": {"name": "Hsinta power plant (興達)", "lat": 22.8523, "lon": 120.1973,
               "remove_MW": {"coal": 550.0, "CCGT": 4826.0}},
    # Half the capacity of every line into the Taipei bus.
    "taipei_corridor": {"name": "Taipei transmission corridor, half lost", "lat": 25.04, "lon": 121.70, "line_factor": 0.5},
}

# Mothballed or recently retired coal units that could be brought back.
STANDBY_UNITS = {
    "hsinta_3": {"name": "Hsinta coal #3 (興達#3, retired Dec 2025)", "MW": 550, "lat": 22.8523, "lon": 120.1973,
                 "source": "MOEA supply-demand report 113年度, Figure 3-3"},
    "mailiao_1_3": {"name": "Mailiao coal #1-3 (麥寮, retired 2024-25)", "MW": 1800, "lat": 23.8031, "lon": 120.1905,
                    "source": "MOEA supply-demand report 113年度, Figure 3-3 (3 x 600 MW)"},
    "hsinta_1_2": {"name": "Hsinta coal #1-2 (興達#1-2, standby)", "MW": 1000, "lat": 22.8523, "lon": 120.1973,
                   "source": "to verify: assumed 2 x 500 MW; listed as standby in Taipower's unit list"},
}

# Only written into a spec when they differ from the default, so specs without them keep their hashes.
# name: (default, min, max, unit, description)
SECURITY_LEVERS = {
    "blockade_days": (0, 0, 90, "days", "Length of the blockade window (0 = normal year)"),
    "blockade_season": ("summer", None, None, "", "Start of the window: summer (1 July) or winter (7 January)"),
    "lng_import_frac": (1.0, 0.0, 1.0, "fraction", "LNG imports during the blockade, share of normal"),
    "coal_import_frac": (1.0, 0.0, 1.0, "fraction", "Coal imports during the blockade, share of normal"),
    "oil_import_frac": (1.0, 0.0, 1.0, "fraction", "Oil imports during the blockade, share of normal"),
    "lng_stock_days": (11.0, 0.0, 60.0, "days", "LNG stock at the start, in days of normal use"),
    "coal_stock_days": (41.0, 0.0, 120.0, "days", "Coal stock at the start, in days of normal use"),
    "oil_stock_days": (100.0, 0.0, 200.0, "days", "Oil stock at the start, in days of normal use"),
    "rationing_frac": (0.0, 0.0, 0.5, "fraction", "Planned demand reduction during the window"),
    "damage": ([], None, None, "sites", "Plant sites or grid links lost: " + ", ".join(DAMAGE_SITES)),
    "standby_restart": ([], None, None, "units", "Standby or retired coal units restarted: " + ", ".join(STANDBY_UNITS)),
}


def _normalise_security(given):
    out = {}
    for name, (default, lo, hi, _, _) in SECURITY_LEVERS.items():
        value = given.get(name, default)
        if name in ("damage", "standby_restart"):
            allowed = DAMAGE_SITES if name == "damage" else STANDBY_UNITS
            value = sorted(set(value or []))
            bad = set(value) - set(allowed)
            if bad:
                raise ValueError(f"{name}: unknown {sorted(bad)}")
        elif name == "blockade_season":
            if value not in BLOCKADE_SEASONS:
                raise ValueError(f"blockade_season must be one of {sorted(BLOCKADE_SEASONS)}")
        else:
            value = float(value)
            if not lo <= value <= hi:
                raise ValueError(f"{name}={value} outside [{lo}, {hi}]")
            value = round(value, 6)
        if value != default:
            out[name] = value
    # Import shares, stocks and the season only matter inside a blockade window.
    if not out.get("blockade_days"):
        for k in ("blockade_season", "lng_import_frac", "coal_import_frac", "oil_import_frac",
                  "lng_stock_days", "coal_stock_days", "oil_stock_days"):
            out.pop(k, None)
    return out


def security(spec):
    """All security levers of a normalised spec, defaults filled."""
    given = spec["levers"]
    return {k: given.get(k, d[0]) for k, d in SECURITY_LEVERS.items()}


def normalise(spec):
    """Return a complete, validated copy of a spec (defaults filled, values checked)."""
    spec = dict(spec or {})
    unknown = set(spec) - {"base", "levers", "label", "version", "variant"}
    if unknown:
        raise ValueError(f"unknown spec keys: {sorted(unknown)}")
    if spec.get("version", SPEC_VERSION) != SPEC_VERSION:
        raise ValueError(f"spec version {spec['version']} does not match SPEC_VERSION {SPEC_VERSION}")
    base = spec.get("base", "today")
    if base not in BASES:
        raise ValueError(f"unknown base {base!r}; choose from {sorted(BASES)}")
    given = dict(spec.get("levers") or {})
    unknown = set(given) - set(LEVERS) - set(SECURITY_LEVERS)
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
    levers.update(_normalise_security(given))
    out = {"version": SPEC_VERSION, "base": base, "levers": levers}
    # The variant is only part of the spec (and its hash) when it is not the central case,
    # so central scenarios keep the hashes they had before variants existed.
    variant = spec.get("variant", "central")
    if variant not in VARIANTS:
        raise ValueError(f"unknown variant {variant!r}; choose from {sorted(VARIANTS)}")
    if variant != "central":
        out["variant"] = variant
    return out


def scenario_key(spec):
    """Hash of the scenario without its variant: groups a scenario with its uncertainty variants."""
    norm = normalise(spec)
    norm.pop("variant", None)
    return spec_hash(norm)


def spec_hash(spec):
    """Cache key: short SHA-256 of the normalised spec (the label is not part of it)."""
    norm = normalise(spec)
    text = json.dumps(norm, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]


def changed(spec):
    """Levers that differ from their default, e.g. for labels."""
    norm = normalise(spec)["levers"]
    return {k: v for k, v in norm.items() if k in SECURITY_LEVERS or v != LEVERS[k][0]}


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
        elif k == "blockade_days":
            parts.append(f"blockade {v:g} days")
        elif k == "blockade_season":
            parts.append(v)
        elif k.endswith("_import_frac"):
            parts.append(f"{ {'lng': 'LNG'}.get(k.split('_')[0], k.split('_')[0])} imports {v:.0%}")
        elif k.endswith("_stock_days"):
            parts.append(f"{ {'lng': 'LNG'}.get(k.split('_')[0], k.split('_')[0])} stock {v:g} d")
        elif k == "rationing_frac":
            parts.append(f"rationing {v:.0%}")
        elif k == "damage":
            parts.append("lost " + " + ".join(v))
        elif k == "standby_restart":
            parts.append("restart " + " + ".join(v))
    return ", ".join(parts) or "base case"
