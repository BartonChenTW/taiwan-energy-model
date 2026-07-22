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

If you want to force the repo-local environment without activating it:

```powershell
& .\.venv\python.exe -m snakemake -j 1 solve_all_networks --configfile config.tutorial.yaml -n
```

## Current Config In Repo

`config.yaml` is currently set for Taiwan:

- `countries: ["TW"]`
- `tutorial: false`
- Solver: `glpk`
- `retrieve_databundle: true`
- `retrieve_databundle_sector: true`
- `build_cutout: true`

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
