"""
Sandbox checks: the empty spec reproduces the base case, and each lever moves
the solved network in the expected direction.

    python -m pytest pypsa_tw/sandbox/test_levers.py -q

Scenarios come from the cache in results/sandbox/ (solve the grid first with
batch.py); a missing scenario is solved on the fly (about 30 s each).
"""

import logging
import sys
from functools import lru_cache
from pathlib import Path

import pandas as pd
import pypsa
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

from levers import BASES, normalise, scenario_key, spec_hash  # noqa: E402
from run_scenario import REPO, emissions_t, run  # noqa: E402

logging.disable(logging.WARNING)
SHED = "load shedding"


@lru_cache(maxsize=None)
def solved(**levers):
    _, nc = run({"base": "today", "levers": {k: list(v) if isinstance(v, tuple) else v for k, v in levers.items()}})
    return pypsa.Network(str(nc))


@lru_cache(maxsize=None)
def solved_variant(variant, **levers):
    _, nc = run({"base": "today", "levers": levers, "variant": variant})
    return pypsa.Network(str(nc))


@lru_cache(maxsize=None)
def base_solved():
    return pypsa.Network(str(REPO / BASES["today"]["solved"]))


def energy(n, carriers):
    w = n.snapshot_weightings.generators
    g = n.generators.index[n.generators.carrier.isin(carriers)]
    s = n.storage_units.index[n.storage_units.carrier.isin(carriers)]
    return float(n.generators_t.p[g].mul(w, axis=0).sum().sum()
                 + n.storage_units_t.p[s].clip(lower=0).mul(w, axis=0).sum().sum())


def capacity(n, carriers):
    return float(n.generators.loc[n.generators.carrier.isin(carriers), "p_nom"].sum()
                 + n.storage_units.loc[n.storage_units.carrier.isin(carriers), "p_nom"].sum())


def demand(n):
    return float(n.loads_t.p_set.sum(axis=1).mul(n.snapshot_weightings.generators).sum())


# ---------- spec format ----------
def test_hash_ignores_defaults_order_and_label():
    a = spec_hash({})
    assert spec_hash({"base": "today", "levers": {"add_solar_GW": 0}}) == a
    assert spec_hash({"label": "anything", "levers": {"line_rating": 0.7}}) == a
    x = {"levers": {"add_solar_GW": 5, "demand_scale": 1.1}}
    y = {"levers": {"demand_scale": 1.1, "add_solar_GW": 5.0}}
    assert spec_hash(x) == spec_hash(y) != a


@pytest.mark.parametrize("levers", [{"add_solar_GW": -16}, {"demand_scale": 2}, {"co2_cap_frac": 0.1},
                                    {"nuclear_restart": ["lungmen"]}, {"no_such_lever": 1}])
def test_invalid_specs_are_rejected(levers):
    with pytest.raises(ValueError):
        normalise({"levers": levers})


# ---------- base case ----------
def test_empty_spec_reproduces_base_objective():
    n, b = solved(), base_solved()
    assert abs(n.objective - b.objective) / abs(b.objective) < 1e-6


# ---------- one test per lever ----------
def test_add_solar():
    n, b = solved(add_solar_GW=10), solved()
    assert capacity(n, ["solar"]) == pytest.approx(capacity(b, ["solar"]) + 10e3, rel=1e-9)
    assert energy(n, ["solar"]) > energy(b, ["solar"])
    assert emissions_t(n) < emissions_t(b)


def test_add_onwind():
    n, b = solved(add_onwind_GW=2), solved()
    assert capacity(n, ["onwind"]) == pytest.approx(capacity(b, ["onwind"]) + 2e3, rel=1e-9)
    assert energy(n, ["onwind"]) > energy(b, ["onwind"])


def test_add_offwind():
    n, b = solved(add_offwind_GW=10), solved()
    off = ["offwind-ac", "offwind-dc"]
    assert capacity(n, off) == pytest.approx(capacity(b, off) + 10e3, rel=1e-9)
    assert energy(n, off) > energy(b, off)
    assert emissions_t(n) < emissions_t(b)


def test_add_battery():
    n, b = solved(add_battery_GW=5), solved()
    assert capacity(n, ["battery"]) == pytest.approx(capacity(b, ["battery"]) + 5e3, rel=1e-9)
    assert energy(n, ["battery"]) >= energy(b, ["battery"])


def test_add_ccgt():
    n, b = solved(add_ccgt_GW=5), solved()
    assert capacity(n, ["CCGT"]) == pytest.approx(capacity(b, ["CCGT"]) + 5e3, rel=1e-9)
    assert energy(n, [SHED]) <= energy(b, [SHED]) + 1e-3


def test_remove_solar():
    n, b = solved(add_solar_GW=-5), solved()
    assert capacity(n, ["solar"]) == pytest.approx(capacity(b, ["solar"]) - 5e3, rel=1e-9)
    assert energy(n, ["solar"]) < energy(b, ["solar"])
    assert emissions_t(n) > emissions_t(b)


def test_remove_all_offwind():
    n = solved(add_offwind_GW=-3.4)  # more than the 3.38 GW that exists: removes all
    assert capacity(n, ["offwind-ac", "offwind-dc"]) == pytest.approx(0, abs=1e-6)


def test_remove_ccgt():
    n, b = solved(add_ccgt_GW=-5), solved()
    assert capacity(n, ["CCGT"]) == pytest.approx(capacity(b, ["CCGT"]) - 5e3, rel=1e-9)
    # About 5 GW of gas is unused in the base (the shortfall is the Taipei corridor), so
    # unserved energy does not fall, and the remaining plants cost a little more to run.
    assert energy(n, [SHED]) >= energy(b, [SHED]) - 1e-3
    assert n.objective > b.objective


def test_remove_battery():
    n = solved(add_battery_GW=-0.9)
    assert capacity(n, ["battery"]) == pytest.approx(0, abs=1e-6)


def test_nuclear_restart():
    n, b = solved(nuclear_restart=("maanshan",)), solved()
    assert capacity(n, ["nuclear"]) == pytest.approx(1780)
    assert energy(n, ["nuclear"]) > 0
    assert emissions_t(n) < emissions_t(b)


def test_nuclear_new():
    n = solved(add_nuclear_new_GW=2.7)
    assert capacity(n, ["nuclear"]) == pytest.approx(2700)
    assert energy(n, ["nuclear"]) > 0


def test_coal_retire():
    n, b = solved(coal_retire_frac=0.5), solved()
    assert capacity(n, ["coal"]) == pytest.approx(0.5 * capacity(b, ["coal"]), rel=1e-9)
    assert energy(n, ["coal"]) < energy(b, ["coal"])


def test_co2_cap():
    n, b = solved(co2_cap_frac=0.75), solved()
    assert emissions_t(n) <= 0.75 * emissions_t(b) * (1 + 1e-6)
    assert n.objective > b.objective


def test_demand_scale():
    n, b = solved(demand_scale=1.1), solved()
    assert demand(n) == pytest.approx(1.1 * demand(b), rel=1e-9)
    assert n.objective > b.objective


def test_gas_price():
    hi, lo, b = solved(gas_price_mult=2.0), solved(gas_price_mult=0.5), solved()
    gas = ["CCGT", "OCGT"]
    assert energy(hi, gas) <= energy(b, gas) + 1e-3 <= energy(lo, gas) + 2e-3
    assert hi.objective > b.objective > lo.objective


def test_coal_price():
    n, b = solved(coal_price_mult=2.0), solved()
    assert energy(n, ["coal"]) <= energy(b, ["coal"]) + 1e-3
    assert n.objective > b.objective


def test_line_rating():
    n, b = solved(line_rating=1.0), solved()
    assert (n.lines.s_max_pu == 1.0).all()
    assert energy(n, [SHED]) < energy(b, [SHED])


# ---------- uncertainty variants ----------
def test_variant_hashes():
    assert spec_hash({"variant": "central"}) == spec_hash({})
    assert spec_hash({"variant": "low"}) != spec_hash({})
    assert scenario_key({"variant": "low", "levers": {"add_solar_GW": 5}}) == spec_hash({"levers": {"add_solar_GW": 5}})
    with pytest.raises(ValueError):
        normalise({"variant": "w1999"})


def test_low_high_variants_scale_demand():
    lo, hi, b = solved_variant("low"), solved_variant("high"), solved()
    assert demand(lo) == pytest.approx(0.9 * demand(b), rel=1e-9)
    assert demand(hi) == pytest.approx(1.1 * demand(b), rel=1e-9)


def test_weather_variant_uses_other_weather():
    w, b = solved_variant("w2018"), solved()
    assert demand(w) == pytest.approx(demand(b), rel=1e-3)  # same annual demand ...
    assert float(w.loads_t.p_set.sum(axis=1).max()) < float(b.loads_t.p_set.sum(axis=1).max())  # ... flatter 2018 peak


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))
