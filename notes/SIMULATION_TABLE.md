# Taiwan Simulation Table

This table proposes a simple progression of Taiwan simulations across four key dimensions:

- weather year
- horizon
- temporal resolution
- bus/cluster

The current active run is the small debug case based on [`config.yaml`](F:/Barton/Repositories/pypsa-earth/config.yaml:6):

- weather year: 2013
- horizon: 7 days
- temporal resolution: 4H
- bus/cluster: 6

## Simulation table

| Run | Purpose | Weather year | Horizon | Resolution | Bus/cluster | Run name | Solver | Solve time | Solve status | Example note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_highs_2013_7d_4h_6b` | `highs` | `8.5708 s` | Solved, inputs flawed | Fixed current-system test: no candidate renewable expansion and no load shedding. Rerun 2026-09-23 with the isolated-bus fix: 1 connected subnetwork, no load shedding, objective `8.18958195e+09`. Solver-only time `0.06 s`. **Caveat:** the cutout ends 2013-03-06 23:00, so the last 6 of 42 snapshots have renewable `p_max_pu = 1.0`. Lines are still extendable (`ll: copt`). |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_gurobi_2013_7d_4h_6b` | `gurobi` | `9.9515 s` | Solved, inputs flawed | Same fixed-system test case as above (solved 2026-07-23). Identical result to the HiGHS run: same objective and dispatch. Solver-only time `0.09 s`. Same cutout caveat. |
| 2 | Test 2 | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b` | `highs` | `20.7457 s` | **Invalid** | Rerun 2026-09-23 with the isolated-bus fix: 1 connected subnetwork, no load shedding, objective `5.3769645464e+09`, solver-only time `6.52 s`. **Invalid:** the cutout covers only 2013-03-01 to 03-06, so 98% of snapshots have renewable `p_max_pu = 1.0` (solar capacity factor 98.6%). Lines expanded by 4.4 GW (`ll: copt`). Needs a full-year cutout. The 2026-07-17 result is archived in `results/_archive/` and has the same cutout problem. |
| 3 | Reference year | 2025 | Full year | 4H | 6 buses/clusters | `tw_ref_2025_fullyear_4h_6b` | TBD | TBD | Pending | Reference-year run with coarse temporal resolution and small network size. |
| 4 | Reference year | 2025 | Full year | 1H | 6 buses/clusters | `tw_ref_2025_fullyear_1h_6b` | TBD | TBD | Pending | Same small network, but with hourly resolution for better operational detail. |
| 5 | Reference year | 2025 | Full year | 4H | 20 buses/clusters | `tw_ref_2025_fullyear_4h_20b` | TBD | TBD | Pending | Higher spatial detail while keeping 4-hour sampling to control runtime. |
| 6 | Reference year | 2025 | Full year | 1H | 20 buses/clusters | `tw_ref_2025_fullyear_1h_20b` | TBD | TBD | Pending | Highest complexity in this specific run list. This is the main high-detail Taiwan reference case here. |

## Notes

- `2013` is the weather year used in the current Taiwan files and cutout naming today.
- `2025` is listed here as the requested reference year. To run it consistently, the cutout and any weather-year-dependent inputs will need to be aligned to that year.
- If runtime becomes too large, the first dimension to relax is usually geospatial resolution, then horizon, while keeping `1H` for the more serious runs.
- For the current Taiwan artifacts, the simplified network maps to `81` unique buses before the final clustering step, so `81 buses/clusters` is the present practical upper bound for this setup.
