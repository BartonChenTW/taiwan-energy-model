# Taiwan Simulation Table

This table proposes a simple progression of Taiwan simulations across four key dimensions:

- weather year
- horizon
- temporal resolution
- bus/cluster

All Taiwan test runs share these settings (see `pypsa_tw/config/`):

- weather: full-year 2013 ERA5 cutout `cutout-2013-era5-tw`
- today's fixed system: no extendable generators, no load shedding, transmission fixed (`ll: v1.0`)
- demand: GEGIS 2030 profile scaled by 0.86 to Taiwan's 2024 total of 288.6 TWh
- network: 6 buses/clusters, with small isolated subnetworks fetched into the main grid

Results as of 2026-09-24 (network file `elec_s_6_ec_lv1.0_Co2L-4H.nc`). Solve time is solver-only; the whole `solve_network` step is in brackets.

## Simulation table

| Run | Purpose | Weather year | Horizon | Resolution | Bus/cluster | Run name | Solver | Solve time | Solve status | Example note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_highs_2013_7d_4h_6b` | `highs` | `0.05 s` (8.3 s) | Optimal | 1 connected network, no load shedding, no warnings. Objective `7.06520467e+09`. The week (2013-03-01 to 03-08) is weighted to represent a full year. |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_gurobi_2013_7d_4h_6b` | `gurobi` | `0.04 s` (9.3 s) | Optimal | Identical to the HiGHS run: same objective and dispatch. |
| 2 | Test 2 | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b` | `highs` | `0.28 s` | **Infeasible** | Detected in presolve. Today's fixed system cannot meet demand at summer peaks without load shedding; see the diagnostic rows. |
| 2d | Test 2 diagnostic | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b_ls` | `highs` | `9.26 s` (24.2 s) | Optimal | Test 2 with load shedding allowed (one-off overlay; the config is unchanged). 409.7 GWh unserved (0.14% of demand) over 800 h in June–August, peak 2.18 GW, 97% at `TW0 0`. No line at its limit, so it is a capacity shortfall. Mix: coal 55%, gas 21%, nuclear 15%, renewables 9%. |
| 2d | Test 2 diagnostic | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_gurobi_2013_fullyear_4h_6b_ls` | `gurobi` | `0.84 s` (16.1 s) | Optimal | Same as above; identical objective `8.59217309e+09`. Gurobi is about 11× faster than HiGHS on the full year. |
| 3 | Reference year | 2025 | Full year | 4H | 6 buses/clusters | `tw_ref_2025_fullyear_4h_6b` | TBD | TBD | Pending | Reference-year run with coarse temporal resolution and small network size. |
| 4 | Reference year | 2025 | Full year | 1H | 6 buses/clusters | `tw_ref_2025_fullyear_1h_6b` | TBD | TBD | Pending | Same small network, but with hourly resolution for better operational detail. |
| 5 | Reference year | 2025 | Full year | 4H | 20 buses/clusters | `tw_ref_2025_fullyear_4h_20b` | TBD | TBD | Pending | Higher spatial detail while keeping 4-hour sampling to control runtime. |
| 6 | Reference year | 2025 | Full year | 1H | 20 buses/clusters | `tw_ref_2025_fullyear_1h_20b` | TBD | TBD | Pending | Highest complexity in this specific run list. This is the main high-detail Taiwan reference case here. |

## Notes

- `2013` is the weather year used in the current Taiwan files and cutout naming today.
- `2025` is listed here as the requested reference year. To run it consistently, the cutout and any weather-year-dependent inputs will need to be aligned to that year.
- If runtime becomes too large, the first dimension to relax is usually geospatial resolution, then horizon, while keeping `1H` for the more serious runs.
- For the current Taiwan artifacts, the simplified network maps to `81` unique buses before the final clustering step, so `81 buses/clusters` is the present practical upper bound for this setup.
