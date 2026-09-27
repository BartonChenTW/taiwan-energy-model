# Design: blockade exposure of the 2050 net-zero system

Status: proposal, 2026-09-27. Nothing is built yet. Decisions needed are at the end.

## Question

Taiwan's 2050 pathway depends heavily on imports, and nuclear changes that dependence:

| 2050 case | Imports (TWh/yr) | New nuclear (GW) |
| --- | --- | --- |
| Official options, all imports (no new nuclear) | about 310 (Taiwan costs 379) | 0 |
| Taiwan costs, nuclear allowed | 315 | 6.7 |
| Early test (not realistic: no imports possible) | 0 | 41 |

The cost difference between these routes is small. What differs is how exposed each system is if
ships stop arriving. The question: in a 14-, 30- or 60-day blockade in 2050, how much demand goes
unmet in each system, in which sectors, and after how many days?

This extends the existing energy-security page (`docs/energy-security.html`), which covers today's
system and the MOEA 2034 plan with the electricity-only model.

## What the 2050 networks contain

Checked on `tw_sector_path2050_24h_official_imp` (2050).

- **Imports:**
  - `H2 import` and `NH3 import` generators on the hydrogen and ammonia buses;
  - `synthetic oil import` and `synthetic gas import` links from the atmosphere to the oil and gas buses;
  - fossil `gas`, `oil` and `coal` generators, all but unused in 2050 under the net-zero cap;
  - uranium, implicit in the nuclear generators' marginal cost.
- **Stores:**
  - `gas` and `oil` stores with very large, freely sized, cyclic capacity (hundreds of TWh). They stand in
    for the world market, not for Taiwan's tanks, so the blockade model must replace them.
  - `ammonia store`, `H2` and `H2 Store Tank` stores, sized by the optimisation (about 0 in this run).
- **Unmet demand:** `load shedding` generators exist on almost every bus: electricity, heat,
  hydrogen, ammonia, gas, oil and industry fuels. So shortages outside the power sector can be
  measured too.
- **CO₂:** a yearly cap (`CO2Limit`). It is dropped for a window of a few weeks, so emergency
  fossil use is allowed and reported.

## Method

The same approach as today's blockade cases (`sandbox/run_scenario.py`, `apply_security`):

1. **Fix the capacities:** take a solved 2050 network, set every capacity to its optimised value,
   and make nothing extendable. A blockade tests the system that was built; nothing new can be
   built in a few weeks.
2. **Solve only the window:** 14, 30 or 60 days, starting 1 July or 7 January (`BLOCKADE_SEASONS`),
   at the network's own time step (daily or 4-hourly; both exist for the import runs).
3. **Cut imports:** set the import generators and links, and the fossil supply generators, to a
   share of normal. 0% is a full blockade; the partial cases are 25% and 50%. Normal is their use in
   the same window of the annual solution.
4. **Replace the free stores with real stocks.** Cap each fuel store at a stock of "days of normal
   use", filled at the start of the window and not refilled: `e_initial` = stock,
   `e_nom` = stock, not cyclic.
5. **Priorities:** unmet demand costs the existing load-shedding price everywhere, optionally with a
   priority order (e.g. electricity and heat before industrial fuels) set by different prices.
6. **Report, per case:**
   - unmet demand by sector (electricity, heat, transport fuels, industry);
   - the day each stock runs empty;
   - emergency fossil use and its CO₂;
   - the same daily series as today's cases.
7. **Solver:** HiGHS, like the sandbox (the windows are small).

## Stock assumptions

These have the largest effect, so each needs a source.

| Carrier | Today | Proposed for 2050 | Basis |
| --- | --- | --- | --- |
| Synthetic methane (LNG terminals) | LNG about 11 days; legal target 14 days from 2027 | 14 days | Same terminals and tanks as LNG; the 14-day target (`moeaea_lng_safety_stock`) |
| Synthetic oil | oil about 100-146 days (90-day stockpiling law) | 90 days | The oil stockpiling obligation would apply to synthetic fuels (assumption) |
| Ammonia | no power-sector stock today | 14 / 30 days (sensitivity) | No rule exists; tank sizes for ammonia co-firing are unknown |
| Hydrogen | none | what the model built (about 0) | Storage chosen by the optimisation |
| Uranium | reactors refuel every 18 months | full (no shortage within 60 days) | Fuel stays in the reactor core for months |

## Cases

| Case | 2050 system | Window | Imports | Stocks |
| --- | --- | --- | --- | --- |
| Main | official all imports; Taiwan costs, nuclear allowed; early test | 14, 30, 60 days × summer, winter | 0% | proposed column above |
| Partial | the same | 30 days, summer | 25%, 50% | proposed |
| Stock sensitivity | official all imports | 30 days, summer | 0% | ammonia 14/30/60 days; synthetic methane 14/30 days |

That makes 18 + 6 + 5 = 29 small solves, about the size of today's 28 blockade cases (a few minutes
in total).

## Build steps (after approval)

1. **`sandbox/blockade_2050.py`:** load a solved 2050 postnetwork, apply steps 1-5, solve with
   HiGHS, and write `results/sandbox/blockade2050/<case>/` in the model folder.
2. **Tests:**
   - with imports at 100% and free stores, the window reproduces the annual solution's dispatch;
   - with imports at 0%, stocks deplete and are never refilled.
3. **Exporter:** a `blockade_2050` block for the energy-security page.
4. **Energy-security page:** a "2050" choice next to "Today" and "2034 plan", with unmet demand by
   sector and the day each stock runs out, comparing the no-nuclear and nuclear-allowed systems.
5. **Sources:** register the stock assumptions in `data/sources.csv`, with evidence levels.

About one working day; the solves themselves take minutes.

## Decisions for you

1. **Stocks for new fuels:** 14 days of synthetic methane (like the LNG target), 90 days of
   synthetic oil (like the oil law), and ammonia as a 14/30/60-day sensitivity. OK?
2. **Priorities:** one shortage price for every sector (simplest), or protect electricity and heat
   before industry and transport fuels?
3. **Which 2050 systems:** the three in the table, or also the official power mix and the
   high-import-price run?
4. **Time step:** the 4-hour networks now exist for the three import runs (their 2050 results are within
   1% of the daily ones in cost). Use them (recommended: they resolve day and night, and nights matter
   when stocks are short), or the daily networks, which also cover the early test?
