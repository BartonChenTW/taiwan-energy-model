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

After solving, refresh the dashboard data with `python pypsa_tw/viewer/export_dashboard_data.py` (see `pypsa_tw/GITHUB_PAGES.md`).

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
