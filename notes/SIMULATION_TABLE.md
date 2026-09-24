# Taiwan Simulation Table

This table proposes a simple progression of Taiwan simulations across four key dimensions:

- weather year
- horizon
- temporal resolution
- bus/cluster

All Taiwan test runs share these settings (see `pypsa_tw/config/`):

- weather: full-year 2013 ERA5 cutout `cutout-2013-era5-tw`
- fleet: official Taipower fleet (`data/custom_powerplants.csv`, 64.0 GW, no nuclear; see `pypsa_tw/data/README.md`)
- today's fixed system: no extendable generators, no load shedding, transmission fixed (`ll: v1.0`), lines limited to `s_max_pu: 0.7` of their rating
- demand: GEGIS 2030 profile scaled by 0.749 to Taipower-system generation (251.44 TWh in 2024)
- network: 6 buses/clusters, with small isolated subnetworks fetched into the main grid

Results as of 2026-09-24 (network file `elec_s_6_ec_lv1.0_Co2L-4H.nc`). Solve time is solver-only; the whole `solve_network` step is in brackets. Diagnostic runs (2d) use one-off config overlays; the Test configs are unchanged.

## Simulation table

| Run | Purpose | Weather year | Horizon | Resolution | Bus/cluster | Run name | Solver | Solve time | Solve status | Example note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_highs_2013_7d_4h_6b` | `highs` | `0.05 s` (6.5 s) | Optimal | Official fleet: 1 connected network, no load shedding, no dashboard warnings. Objective `7.44479070e+09`. The week (2013-03-01 to 03-08) is weighted to represent a full year. |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_gurobi_2013_7d_4h_6b` | `gurobi` | `0.04 s` (7.6 s) | Optimal | Identical to the HiGHS run. |
| 2 | Test 2 | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b` | `highs` | `0.30 s` | **Infeasible** | Detected in presolve. The aggregated transmission corridor into Taipei cannot carry the summer peak; see the diagnostic rows. |
| 2d | Test 2 with load shedding | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b_ls` | `highs` | `9.82 s` (22.3 s) | Optimal | 834.9 GWh unserved (0.33%), all at bus `TW0 1` (Taipei, 87 TWh demand, 3.8 GW local generation), June–August. Line `TW0 1`–`TW0 4` is at its limit (0.7 × 13.93 GW = 9.75 GW) in every shedding snapshot, while 5.3 GW of gas elsewhere is unused. Mix: gas 46%, coal 40%, renewables 14%. |
| 2d | Test 2, full line rating | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b_smax1_ls` | `highs` | `11.21 s` (24.2 s) | Optimal | Same with `lines.s_max_pu: 1.0`: **no unserved energy**, and the Taipei corridor peaks at 89% of its rating. Mix: gas 46.6%, coal 39.6%, renewables 13.8%; CO₂ 134 Mt. |
| 2d | Test 2 with load shedding (old fleet) | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_gurobi_2013_fullyear_4h_6b_ls` (archived) | `gurobi` | `0.84 s` (16.1 s) | Optimal | powerplantmatching fleet, demand scale 0.86. Same objective as HiGHS (`8.59217309e+09`); Gurobi about 11× faster. Archived in `results/_archive/`. |
| S1 | Weather year 2011 (today's system) | 2011 | Full year | 4H | 6 buses/clusters | `tw_weather2011_highs_fullyear_4h_6b_ls` | `highs` | TBD | Pending | Overlay `scenarios/weather_2011.yaml`; waiting for the 2011 cutout. |
| S2 | Weather year 2018 (today's system) | 2018 | Full year | 4H | 6 buses/clusters | `tw_weather2018_highs_fullyear_4h_6b_ls` | `highs` | TBD | Pending | Overlay `scenarios/weather_2018.yaml`; waiting for the 2018 cutout. |
| F1 | Planned system 2030 | 2013 | Full year | 4H | 6 buses/clusters | `tw_future2030_highs_w2013_4h_6b_ls` | `highs` | `12.83 s` (28.6 s) | Optimal | Overlay `scenarios/future_2030.yaml`: 94.3 GW fleet, 278.2 TWh. Renewables 35.8%, coal 30%, gas 34%; CO₂ 113.4 Mt. 364.2 GWh unserved, all at the Taipei bus (corridor at its limit). |
| F2 | Planned system 2034 | 2013 | Full year | 4H | 6 buses/clusters | `tw_future2034_highs_w2013_4h_6b_ls` | `highs` | `13.52 s` (30.3 s) | Optimal | Overlay `scenarios/future_2034.yaml`: 104.4 GW fleet, 297.6 TWh, costs 2035. Renewables 38.4%, coal 19%, gas 43%; CO₂ 96.9 Mt. 826.0 GWh unserved at the Taipei bus: the new northern gas connects at Taoyuan, on the far side of the corridor. |
| 3 | Reference year | 2025 | Full year | 4H | 6 buses/clusters | `tw_ref_2025_fullyear_4h_6b` | TBD | TBD | Pending | Reference-year run with coarse temporal resolution and small network size. |
| 4 | Reference year | 2025 | Full year | 1H | 6 buses/clusters | `tw_ref_2025_fullyear_1h_6b` | TBD | TBD | Pending | Same small network, but with hourly resolution for better operational detail. |
| 5 | Reference year | 2025 | Full year | 4H | 20 buses/clusters | `tw_ref_2025_fullyear_4h_20b` | TBD | TBD | Pending | Higher spatial detail while keeping 4-hour sampling to control runtime. |
| 6 | Reference year | 2025 | Full year | 1H | 20 buses/clusters | `tw_ref_2025_fullyear_1h_20b` | TBD | TBD | Pending | Highest complexity in this specific run list. This is the main high-detail Taiwan reference case here. |

## Notes

- `2013` is the weather year used in the current Taiwan files and cutout naming today.
- `2025` is listed here as the requested reference year. To run it consistently, the cutout and any weather-year-dependent inputs will need to be aligned to that year.
- If runtime becomes too large, the first dimension to relax is usually geospatial resolution, then horizon, while keeping `1H` for the more serious runs.
- For the current Taiwan artifacts, the simplified network maps to `81` unique buses before the final clustering step, so `81 buses/clusters` is the present practical upper bound for this setup.
