# AGENTS.md

Notes for working with this repo locally on Windows.

## Environment

Preferred setup from the project docs:

```powershell
mamba env create -f envs/win-64.lock.yaml
conda activate pypsa-earth
```

Repo-local environment found in this workspace:

- Path: `F:\Barton\Repositories\pypsa-earth\.venv`
- Type: conda-style environment (`conda-meta` is present)
- Python: `3.11.13`
- Snakemake: `7.32.4`

If using the repo-local environment directly in PowerShell:

```powershell
& .\.venv\python.exe --version
& .\.venv\python.exe -m snakemake --version
```

## How To Run

Dry-run the main workflow:

```powershell
snakemake -j 1 solve_all_networks -n
```

Tutorial run from the docs:

```powershell
snakemake -call results/NG/networks/elec_s_6_ec_lcopt_Co2L-4H.nc --configfile config.tutorial.yaml
```

Equivalent tutorial dry-run that was previously tried in this repo:

```powershell
python -m snakemake -j 1 solve_all_networks --configfile config.tutorial.yaml -n
```

If you want to force the repo-local environment without activating it, set the GDAL/PROJ variables that `conda activate` would set. Without them, `build_renewable_profiles` fails because GDAL cannot load its HDF5 plugin for `data/gebco/GEBCO_2025_sub_ice.nc`:

```powershell
$env:GDAL_DATA = "$PWD\.venv\Library\share\gdal"
$env:GDAL_DRIVER_PATH = "$PWD\.venv\Library\lib\gdalplugins"
$env:PROJ_DATA = "$PWD\.venv\Library\share\proj"
$env:PATH = "$PWD\.venv;$PWD\.venv\Library\bin;$PWD\.venv\Scripts;$env:PATH"
& .\.venv\python.exe -m snakemake -j 1 solve_all_networks -n
```

## Taiwan Configs

`config.yaml` is gitignored. Copy one of the Taiwan test configs into it before running:

```powershell
Copy-Item pypsa_tw\config\config_tw_test2_highs.yaml config.yaml
```

| Config | Period | Solver |
| --- | --- | --- |
| `config_tw_test1_highs.yaml` | 2013-03-01 to 03-08, 4H | HiGHS |
| `config_tw_test1_gurobi.yaml` | 2013-03-01 to 03-08, 4H | Gurobi |
| `config_tw_test2_highs.yaml` | full year 2013, 4H | HiGHS |

All three model today's fixed system on 6 buses: no extendable generators, no load shedding, `ll: ["v1.0"]` (fixed transmission), and small isolated subnetworks fetched into the main grid.

They share the full-year weather cutout `cutouts/cutout-2013-era5-tw.nc` (`atlite.cutouts.cutout-2013-era5-tw.time: 2013-01-01 to 2013-12-31`) with `build_cutout: false`. To rebuild it, move the old file aside and run with a one-off overlay that sets `enable: {build_cutout: true}`. `scripts/add_electricity.py` stops with an error if a profile doesn't cover the snapshots.

Scenario overlays in `pypsa_tw/config/scenarios/` go on top of the Test 2 config (other weather years, future years 2030/2034):

```powershell
& .\.venv\python.exe -m snakemake -j 1 solve_all_networks --configfile pypsa_tw/config/config_tw_test2_highs.yaml pypsa_tw/config/scenarios/future_2030.yaml
```

Future-year fleets come from `python pypsa_tw/data/build_future_powerplants.py`; a config picks its fleet file with `electricity.custom_powerplants_file`.

After solving, refresh the dashboard data with `python pypsa_tw/viewer/export_dashboard_data.py` (see `pypsa_tw/GITHUB_PAGES.md`).

## Sector-coupled pathway 2030 → 2050

Myopic (brownfield) chain from the official 2030 system to net zero in 2050. It is a local research run: Gurobi overlay, about 25 minutes, one job at a time.

```powershell
& .\.venv\python.exe -m snakemake -j 1 solve_sector_networks_myopic --configfile pypsa_tw/config/config_tw_test2_highs.yaml pypsa_tw/config/scenarios/sector_path_2050.yaml pypsa_tw/config/scenarios/solver_gurobi_local.yaml
```

- The Taiwan demand growth rows in `data/demand/*_cagr.csv` come from `python pypsa_tw/data/build_sector_growth_tw.py`.
- Several PyPSA-Earth scripts carry "Taiwan fork" fixes needed for this chain (see `pypsa_tw/log.md`, 2026-09-25).
- The exporter writes `docs/data/sector_pathway.json` for the draft page.
- Taiwan's official 2050 pathway (no new nuclear; gas with carbon capture; hydrogen and ammonia imports; the action plans' 2050 ranges) layers `sector_path_2050_D_float_geothermal.yaml` and `sector_path_2050_official.yaml` on top, plus `sector_path_2050_official_mix.yaml` for the official power mix. The design, sources and commands are in `pypsa_tw/TAIWAN_2050_PATHWAY.md`.

## Data provenance

Which inputs are PyPSA-Earth defaults and which this fork adds (Taiwan data, other sources, code changes): `pypsa_tw/DATA_PROVENANCE.md`. New sources go into `pypsa_tw/data/sources.csv` with an `origin` (`pypsa-earth`, `taiwan` or `fork`).

## Sandbox (what-if scenarios)

`pypsa_tw/sandbox/` solves "what if" scenarios without Snakemake:
- It loads the base case's prepared network (`networks/tw_test2_highs_2013_fullyear_4h_6b/elec_s_6_ec_lv1.0_Co2L-4H.nc`).
- It applies a lever spec in memory (`levers.py`: capacity additions, nuclear restart or new build, coal retirement, CO2 cap, demand, fuel prices, line rating).
- It solves with `scripts/solve_network.py`'s own `prepare_network` and `solve_network`, with HiGHS only.

Results go to `results/sandbox/<hash>/` (the hash of the normalised spec is the cache key) and solver logs to `logs/sandbox/<hash>/`. With the GDAL/PROJ variables above set:

```powershell
& .\.venv\python.exe pypsa_tw\sandbox\run_scenario.py --levers '{"add_offwind_GW": 10, "co2_cap_frac": 0.5}'
& .\.venv\python.exe pypsa_tw\sandbox\batch.py --list   # the Phase 1 grid (42 scenarios)
& .\.venv\python.exe pypsa_tw\sandbox\batch.py          # solve what is not cached (about 20 s each, one at a time)
& .\.venv\python.exe pypsa_tw\sandbox\batch.py --variants low high w2018   # uncertainty variants (about 45 min)
& .\.venv\python.exe pypsa_tw\sandbox\batch.py --security   # the 28 blockade cases (about 2 min)
& .\.venv\python.exe pypsa_tw\sandbox\batch.py --security --base plan2034   # the same cases on the MOEA 2034 plan system
& .\.venv\python.exe -m pytest pypsa_tw\sandbox\test_levers.py -q
```

- The full grid takes about 15 minutes on DDM06479. Tell the other users of the machine before starting it.
- The exporter picks up `results/sandbox/*` automatically.
- Blockade (energy security) cases: `batch.py --security` (28 cases, about 2 minutes; `--force` re-solves them after a model change). They solve only the blockade window, with national fuel stocks. The website page is `docs/energy-security.html`.
- Live solving (Phase 2) is designed in `pypsa_tw/sandbox/PHASE2_LIVE_SOLVING.md`, not built.

## Previously Tried

From `my_note.md`:

- Tried activating `F:\Barton\Repositories\pypsa-earth\env` with `mamba activate`
- Tried `python -m snakemake -j 1 solve_all_networks --configfile config.tutorial.yaml -n`

Known issues previously noted:

- `googledrivedownloader` was missing before one run
- There was a reported mismatch between `powerplantmatching` and the downloaded IRENASTAT CSV structure

Recent local note from `log.md`:

- On `2026-07-22`, test 1 and test 2 results were visualized
- Follow-up TODO: change the test config so capacity is not extendable
