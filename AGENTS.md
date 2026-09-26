# AGENTS.md

Notes for working with this repository on Windows (DDM06479).

## Layout: two folders side by side

| Folder | Repository | Holds |
| --- | --- | --- |
| `F:\Barton\Repositories\taiwan-energy-model` | this one | Taiwan configs (`config/`), Taiwan data (`data/`), sandbox, exporter (`viewer/`), website (`docs/`), notes |
| `F:\Barton\Repositories\pypsa-earth` | [BartonChenTW/pypsa-earth](https://github.com/BartonChenTW/pypsa-earth) (model fork) | the PyPSA-Earth workflow, its Python environment `.venv`, data bundle, cutouts and all outputs (`resources/`, `networks/`, `results/`, `logs/`) |

- `paths.py` finds the model folder: `PYPSA_EARTH_DIR`, or `../pypsa-earth` by default.
- `model.lock` records the model commit this study was last run with.
- `notes/DATA_PROVENANCE.md` says which inputs are PyPSA-Earth defaults and which this study adds.

## Environment

Use the model folder's conda environment. Set the GDAL/PROJ variables that `conda activate` would
set (without them `build_renewable_profiles` cannot read GEBCO). In Git Bash:

```bash
M=/f/Barton/Repositories/pypsa-earth; P="$(cd $M && pwd -W)/.venv"
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1 CONDA_PREFIX="$P" GDAL_DATA="$P/Library/share/gdal" \
  GDAL_DRIVER_PATH="$P/Library/lib/gdalplugins" PROJ_DATA="$P/Library/share/proj" CPL_ZIP_ENCODING=UTF-8 \
  PATH="$M/.venv:$M/.venv/Library/bin:$M/.venv/Scripts:$PATH"
PY=$M/.venv/python.exe
```

Avoid the PowerShell tool on DDM06479 (Cortex XDR); use Git Bash or Python.

## Model runs (Snakemake runs in the model folder)

Configs come from this repository; paths inside them are relative to the model folder
(for example `electricity.custom_powerplants_file: ../taiwan-energy-model/data/fleet/custom_powerplants.csv`).

```bash
cd /f/Barton/Repositories/pypsa-earth
C=../taiwan-energy-model/config
$PY -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test2_highs.yaml -n
$PY -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test2_highs.yaml $C/scenarios/future_2030.yaml
```

| Config | Period | Solver |
| --- | --- | --- |
| `config_tw_test1_highs.yaml` | 2013-03-01 to 03-08, 4H | HiGHS |
| `config_tw_test1_gurobi.yaml` | 2013-03-01 to 03-08, 4H | Gurobi |
| `config_tw_test2_highs.yaml` | full year 2013, 4H | HiGHS |

- **Test configs:** all three model today's fixed system on 6 buses: no extendable generators, no load shedding, fixed transmission (`ll: ["v1.0"]`).
- **Weather:** they share the full-year cutout `cutouts/cutout-2013-era5-tw.nc` in the model folder, with `build_cutout: false`.
- **Scenario overlays** in `config/scenarios/` go on top of Test 2: other weather years, and the future years 2030 and 2034.
- **Future fleets** come from `$PY data/build_future_powerplants.py`, run in this folder; it writes `data/fleet/`.

### Sector-coupled pathway 2030 → 2050

A myopic chain from the official 2030 system to net zero in 2050. It is a local research run: Gurobi overlay, about 12-25 minutes, one job at a time.

```bash
cd /f/Barton/Repositories/pypsa-earth
C=../taiwan-energy-model/config/scenarios
$PY -m snakemake -j 1 solve_sector_networks_myopic --configfile ../taiwan-energy-model/config/config_tw_test2_highs.yaml \
  $C/sector_path_2050.yaml $C/sector_path_2050_D_float_geothermal.yaml $C/sector_path_2050_official_imports.yaml \
  $C/solver_gurobi_local.yaml --rerun-triggers mtime
```

- **Official pathway:** the official runs and the import-price sweep are described in `notes/TAIWAN_2050_PATHWAY.md`.
- **Taiwan demand growth:** the rows in the model's `data/demand/*_cagr.csv` come from `$PY data/build_sector_growth_tw.py`, which writes into the model folder.
- **Fork patches:** several PyPSA-Earth scripts carry "Taiwan fork" changes; see `notes/DATA_PROVENANCE.md`.
- **Shared Gurobi licence:** the limit is 3 concurrent uses; retry on "use limit (3) exceeded".

## Sandbox (what-if scenarios, run in this folder)

`sandbox/` solves "what if" scenarios without Snakemake, with HiGHS only:
- It loads the base case's prepared network from the model folder.
- It applies a lever spec (`levers.py`).
- It solves with the model's `scripts/solve_network.py`.

Results go to the model folder's `results/sandbox/<hash>/`.

```bash
cd /f/Barton/Repositories/taiwan-energy-model
$PY sandbox/run_scenario.py --levers '{"add_offwind_GW": 10, "co2_cap_frac": 0.5}'
$PY sandbox/batch.py --list        # the Phase 1 grid (42 scenarios)
$PY sandbox/batch.py               # solve what is not cached (about 20 s each)
$PY sandbox/batch.py --security    # the 28 blockade cases (about 2 min)
$PY sandbox/batch.py --security --base plan2034
$PY -m pytest sandbox/test_levers.py -q
```

- The full grid takes about 15 minutes on DDM06479. Tell the other users of the machine before starting it.
- Live solving (Phase 2) is designed in `sandbox/PHASE2_LIVE_SOLVING.md`, not built.

## Website

`docs/` is the website, published by GitHub Pages at https://bartonchentw.github.io/taiwan-energy-model/.

- **Refresh the data:** `$PY viewer/export_dashboard_data.py` reads the model folder's results and writes `docs/data/`. It also stamps asset versions.
- **Unchanged regenerated files:** the exporter rewrites files whose only change is the timestamp. Commit only files whose content changed; `notes/GITHUB_PAGES.md` has the details.
- **Public:** everything in `docs/data/` is public.

## Working rules

- **Shared workstation:** run one Snakemake job at a time (`-j 1`), and give a heads-up before any batch over about 15 minutes.
- **Solver:** use HiGHS for anything a web service could trigger. Gurobi is for local research only (`solver_gurobi_local.yaml`).
- **Credentials:** keep them out of the repository.
- **Sources:** register new sources in `data/sources.csv`, with evidence and origin.
