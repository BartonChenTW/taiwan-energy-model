# Taiwan Simulation Table

This table proposes a simple progression of Taiwan simulations across four key dimensions:

- weather year
- horizon
- temporal resolution
- geospatial resolution

The current active run is the small debug case based on [`config.yaml`](F:/Barton/Repositories/pypsa-earth/config.yaml:6):

- weather year: 2013
- horizon: 7 days
- temporal resolution: 4H
- geospatial resolution: 6 clusters

## Proposed stages

| Stage | Purpose | Weather year | Horizon | Resolution | Geospatial | Example note |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Debug / smoke test | 2013 | 7 days | 4H | 6 clusters | Very fast check that the Taiwan workflow, cutout, and solver all run end-to-end. This is essentially the current setup. |
| 2 | Small exploratory study | 2013 or 2016 | 1 month | 4H | 10 clusters | First useful comparison case with broader weather coverage and a slightly richer network. |
| 3 | Medium-detail study | 2013 or 2016 | 3 months | 1H | 20 clusters | Better for checking storage behavior, solar and wind variability, and transmission congestion patterns. |
| 4 | Highest complexity / reference run | 2016 | Full year | 1H | 20 clusters or max feasible clusters | Highest proposed resolution in this plan. Use this when you want the main Taiwan reference scenario. |

## Recommended sequence

1. Start from Stage 1 to confirm everything is stable.
2. Move to Stage 2 for quick scenario exploration.
3. Use Stage 3 when time-series behavior starts to matter.
4. Reserve Stage 4 for the final high-confidence run.

## Notes

- `2013` is the weather year used in the current Taiwan files and cutout naming today.
- `2016` is a reasonable alternate weather year to test sensitivity, but it will require aligning the cutout and any weather-year-dependent inputs.
- If runtime becomes too large, the first dimension to relax is usually geospatial resolution, then horizon, while keeping `1H` for the more serious runs.
- If you later want a stricter "maximum clusters" target, we can replace `20 clusters or max feasible clusters` with a specific number after checking memory and runtime limits on this machine.
