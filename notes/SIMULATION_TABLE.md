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
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_highs_2013_7d_4h_6b` | `highs` | `8.1613 s` | Success | Fixed current-system test: no candidate renewable expansion and no load shedding. `TW1 0` and `TW2 0` remain isolated because of upstream input topology. |
| 1 | Test 1 | 2013 | 7 days | 4H | 6 buses/clusters | `tw_test1_gurobi_2013_7d_4h_6b` | `gurobi` | TBD | Prepared only | Same fixed-system test case as above, but no solved result network is present under `results/`. |
| 2 | Test 2 | 2013 | Full year | 4H | 6 buses/clusters | `tw_test2_highs_2013_fullyear_4h_6b` | `highs` | `1397.9827 s` | Success | Full-year fixed current-system check with a still-small network size. The same isolated-bus topology issue is present. |
| 3 | Reference year | 2025 | Full year | 4H | 6 buses/clusters | `tw_ref_2025_fullyear_4h_6b` | TBD | TBD | Pending | Reference-year run with coarse temporal resolution and small network size. |
| 4 | Reference year | 2025 | Full year | 1H | 6 buses/clusters | `tw_ref_2025_fullyear_1h_6b` | TBD | TBD | Pending | Same small network, but with hourly resolution for better operational detail. |
| 5 | Reference year | 2025 | Full year | 4H | 20 buses/clusters | `tw_ref_2025_fullyear_4h_20b` | TBD | TBD | Pending | Higher spatial detail while keeping 4-hour sampling to control runtime. |
| 6 | Reference year | 2025 | Full year | 1H | 20 buses/clusters | `tw_ref_2025_fullyear_1h_20b` | TBD | TBD | Pending | Highest complexity in this specific run list. This is the main high-detail Taiwan reference case here. |

## Notes

- `2013` is the weather year used in the current Taiwan files and cutout naming today.
- `2025` is listed here as the requested reference year. To run it consistently, the cutout and any weather-year-dependent inputs will need to be aligned to that year.
- If runtime becomes too large, the first dimension to relax is usually geospatial resolution, then horizon, while keeping `1H` for the more serious runs.
- For the current Taiwan artifacts, the simplified network maps to `81` unique buses before the final clustering step, so `81 buses/clusters` is the present practical upper bound for this setup.
