# GitHub Pages Setup

This repo now has a simple static GitHub Pages site in:

```text
docs/
```

The site entry point is `docs/index.html`, the landing page. The pages are:

| Page | File | Script |
| --- | --- | --- |
| Home (landing) | `docs/index.html` | `assets/pages.js` |
| Taiwan's energy challenges | `docs/challenges.html` | `assets/pages.js` |
| Sandbox | `docs/sandbox.html` | `assets/sandbox.js` |
| Model dashboard | `docs/dashboard.html` (was `index.html`; old `index.html?case=...` links redirect) | `assets/app.js` |
| Taiwan energy data | `docs/taiwan-data.html` | `assets/taiwan-data.js` |
| Request a simulation | `docs/request.html` | `assets/request.js` |
| About | `docs/about.html` | `assets/pages.js` |

The text pages hold both languages in the HTML (`.t-en` / `.t-zh`), and `pages.js` switches them. The language and theme choices are shared across all pages.

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

Then open http://127.0.0.1:8765/. Add `?lang=zh` for Traditional Chinese; `dashboard.html?case=<id>` opens a specific case.

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

## Energy security page

`docs/energy-security.html` (with `docs/assets/security.js`) shows the blockade cases from the sandbox's blockade mode.

1. Solve them with `python pypsa_tw/sandbox/batch.py --security`: 28 cases, about 2 minutes. After a model change, add `--force`.
2. Rerun the exporter. `export_security` writes:
   - `docs/data/security/index.json`: cases, metrics, and each case's no-blockade reference in the same window;
   - `docs/data/security/cases/<hash>.json`: daily supply by source, stock levels and unmet demand.

The controls select fuel imports, length, start and one option. The page shows the nearest computed case, and the match box turns red when that case is not an exact match. The query string (`?type=full&days=30&season=summer&option=nuclear`) reproduces the view.

## Request form

`request.html` sends a request in the background to a form service, which emails it to the author. Visitors need no account and stay on the site.

**To switch it on:** create a free form and fill in `FORM` at the top of `docs/assets/request.js`:
- **Formspree:** `{provider: "formspree", endpoint: "https://formspree.io/f/<id>"}`.
- **Web3Forms:** `{provider: "web3forms", accessKey: "<key>"}`.

Both identifiers are designed to be public. Until `FORM` is set, the page says online requests are not open yet.

**How a request flows:**
- The sandbox links to the request page with the current levers, so a request carries the exact spec (`scenario`, JSON) and a sandbox link.
- To answer one, solve it with `pypsa_tw/sandbox/run_scenario.py --levers '...'`, export, push, and reply with the sandbox link.

## Cache busting

GitHub Pages lets browsers cache files for 10 minutes or longer, so visitors could keep an old script after a change. `pypsa_tw/viewer/stamp_assets.py` gives each CSS/JS link in `docs/*.html` a content hash (`assets/sandbox.js?v=d1d94db0`), so a changed file gets a new URL.

The exporter runs it at the end. After editing only a page's JS or CSS, run it by hand:

```powershell
python pypsa_tw/viewer/stamp_assets.py
```

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
