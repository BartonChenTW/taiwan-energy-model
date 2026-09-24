# GitHub Pages Setup

This repo now has a simple static GitHub Pages site in:

```text
docs/
```

The site entry point is:

```text
docs/index.html
```

## Enable GitHub Pages

1. Push this branch to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings`.
4. In the left sidebar, open `Pages`.
5. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
6. Select the branch that contains this `docs/` folder.
7. Select the folder `/docs`.
8. Click `Save`.

GitHub's official Pages documentation says branch publishing can use either the repository root `/` or `/docs` folder as the publishing source.

The live site is https://bartonchentw.github.io/pypsa-earth/ (built from `/docs` on `pypsa-taiwan-dev`).

## Refresh the data after new runs

The page reads JSON files generated from the solved networks, so nothing is typed in by hand:

```powershell
python pypsa_tw/viewer/export_dashboard_data.py
```

This reads every `results/<run>/networks/*.nc` (skipping `results/_archive`) and writes:

- `docs/data/index.json`: one summary per case, including automatic sanity warnings
- `docs/data/cases/<run>__<case>.json`: input time series, technology data and results for one case

The console prints each case with its warnings, so it doubles as a quick check of the runs. The warnings cover disconnected subnetworks, load shedding, implausible renewable capacity factors, renewable availability stuck at 1.0 (a weather-data gap), and extendable generators or lines.

Only aggregated numbers are exported, and the repository is public, so everything in `docs/data/` is public too.

## Taiwan energy data page

`docs/taiwan-data.html` lists key figures and data sources for Taiwan's electricity system. The exporter builds it into `docs/data/taiwan_catalog.json` from:

- `pypsa_tw/data/taiwan_key_facts.csv`: figures with value, unit, year, scope, source, link and evidence. Evidence is `downloaded`, `page_opened`, `search_summary` (still to verify) or `model_output`.
- `pypsa_tw/data/taiwan_energy_catalog.csv`: data sources with provider, content, format, update frequency, licence, link and model use (`used`, `candidate`, `reference`).
- `pypsa_tw/data/official/link_check_<date>.csv`: HTTP status of every link at the last check.

To add a figure or a source, add a row to the CSV and rerun the exporter.

## Preview locally

The page loads its data with `fetch`, which browsers block for files opened directly from disk. Serve the folder instead, bound to localhost:

```powershell
python -m http.server 8765 --bind 127.0.0.1 -d docs
```

Then open http://127.0.0.1:8765/. Add `?lang=zh` for Traditional Chinese and `?case=<id>` to open a specific case.

## Sandbox page

`docs/sandbox.html` (with `docs/assets/sandbox.js`) lets visitors explore what-if scenarios. In Phase 1 every scenario is pre-computed:

1. Solve the grid: `python pypsa_tw/sandbox/batch.py`, or one scenario with `python pypsa_tw/sandbox/run_scenario.py --levers '{...}'`. See `AGENTS.md`.
2. Rerun the exporter. It writes `docs/data/sandbox/index.json` (scenarios, lever ranges, metrics and deltas against the base case) and `docs/data/sandbox/cases/<hash>.json` (the usual case format plus the spec). That is about 0.3 MB per scenario, about 10 MB for the grid.

**How the page works:**
- It maps the levers to the nearest computed scenario (each lever normalised by its range) and says when it is not an exact match.
- It puts the levers in the query string, e.g. `sandbox.html?add_offwind_GW=10&co2_cap_frac=0.5&nuclear_restart=maanshan`, so a link reproduces the view.

**Metrics shown:**
- System cost = model operating cost + annualised investment in the added capacity (technology-data 2030). Added capacity is fixed, so its cost is not in the model's objective; restarts of closed nuclear plants are not costed.
- CO2, renewable share, curtailment, unserved demand, capacity added, and peak line loading.

## Publish

```powershell
git add docs pypsa_tw
git commit -m "Refresh Taiwan dashboard data"
git push origin pypsa-taiwan-dev
```

GitHub Pages rebuilds within a minute or two of the push.

## Notes

- Plotly is loaded from a CDN, so the browser needs internet access.
- The network map uses Plotly `scattergeo`, which needs no map tiles or WebGL.
- Chart colours follow a palette validated for colour-vision deficiency in light and dark mode. Every chart has a table view.
- For deeper analysis, use `pypsa_tw/viewer/simulation_viewer.ipynb` and `pypsa_tw/viewer/raw_input_viewer.ipynb`.
