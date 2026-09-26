# Getting started: using the Taiwan energy system model

This guide shows how to run the model yourself. It uses **PyPSA-Earth**, an open energy system
model, together with the Taiwan data and settings in this repository (TEM, taiwan-energy-model).

> **繁體中文摘要：** 本模型由兩個資料夾組成：本儲存庫（台灣資料、設定、網站）與 PyPSA-Earth 模型分支（程式）。
> 將兩者放在同一層資料夾，建立 conda 環境，第一次執行時下載資料包並建立 2013 年氣象資料，之後即可執行測試與情境模擬。
> 以下步驟以英文說明；若有問題歡迎開 issue（中英文皆可）。

To look at results without running anything, see the website:
https://bartonchentw.github.io/taiwan-energy-model/.

## 1. What you need

| Item | Notes |
| --- | --- |
| Computer | Windows, Linux or macOS. The one-week test runs on a laptop; the full-year and sector-coupled runs were made on a workstation (memory needs not measured). About 30 GB of free disk space (data bundle, weather, outputs). |
| Git and conda | [Miniforge](https://github.com/conda-forge/miniforge) (conda + mamba) is recommended. |
| Copernicus CDS account | Free. Needed once, to download 2013 weather (ERA5): https://cds.climate.copernicus.eu |
| Solver | HiGHS is installed with the environment and runs all electricity cases. The sector-coupled pathway was run with Gurobi (a licence is needed); HiGHS works but is slower (not benchmarked). |

## 2. Get the two repositories, side by side

```bash
mkdir tem && cd tem
git clone https://github.com/BartonChenTW/taiwan-energy-model.git
git clone --branch taiwan https://github.com/BartonChenTW/pypsa-earth.git
```

The folders must sit next to each other:

```
tem/
  taiwan-energy-model/   Taiwan configs, data, sandbox, exporter, website (this repository)
  pypsa-earth/           the model: PyPSA-Earth with the Taiwan options (branch taiwan)
```

- **Model version:** `taiwan-energy-model/model.lock` names the model commit the published results
  were made with. To use exactly that version, run `git checkout <commit>` in `pypsa-earth/`.
- **Another layout:** set `PYPSA_EARTH_DIR` if the model folder is elsewhere. The configs themselves
  assume the side-by-side layout, e.g. `../taiwan-energy-model/data/fleet/...`.

## 3. Create the Python environment

```bash
cd pypsa-earth
mamba env create -f envs/environment.yaml      # or a lock file for your system, e.g. envs/win-64.lock.yaml
conda activate pypsa-earth
```

The environment includes PyPSA, Snakemake, atlite and HiGHS.

## 4. Download data and build the weather file (once)

1. **Copernicus key:** save your CDS API key in `~/.cdsapirc` (on Windows `C:\Users\<you>\.cdsapirc`):
   ```
   url: https://cds.climate.copernicus.eu/api
   key: <your key>
   ```
2. **First run:** run the short Test 1 once, adding the one-off overlay that builds the cutout (run
   these commands in `pypsa-earth/`):
   ```bash
   C=../taiwan-energy-model/config
   python -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test1_highs.yaml $C/scenarios/build_cutout.yaml
   ```
   - **Downloads:** this run fetches PyPSA-Earth's data bundle (several GB), OpenStreetMap data for
     Taiwan, the cost data, and ERA5 weather for 2013. The weather is written to
     `cutouts/cutout-2013-era5-tw.nc`.
   - **Time:** the first run takes from about an hour to several hours, depending on the download
     speed. Later runs reuse all of this.
   - **Parallel jobs:** `-j 1` runs one job at a time; raise it if your machine has the memory.

## 5. Run the model

All Snakemake commands run in `pypsa-earth/`, with configs from `taiwan-energy-model/config/`:

```bash
C=../taiwan-energy-model/config
python -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test1_highs.yaml -n   # dry run: what would run
python -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test1_highs.yaml      # one week of 2013, minutes
python -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test2_highs.yaml      # full year 2013
```

| Config (in `config/`) | What it models |
| --- | --- |
| `config_tw_test1_highs.yaml` | Today's system, 1-8 March 2013, 4-hour steps, 6 regions (quick check) |
| `config_tw_test2_highs.yaml` | Today's system, full year 2013 (the base case of the website) |
| `+ scenarios/future_2030.yaml`, `future_2034.yaml` | The MOEA plans for 2030 and 2034 |
| `+ scenarios/weather_2011.yaml`, `weather_2018.yaml` | Other weather years (each needs its own cutout) |
| `+ scenarios/sector_path_2050*.yaml` | Sector-coupled pathway 2030 → 2050 (see `notes/TAIWAN_2050_PATHWAY.md`) |

Scenario overlays go after the base config: `--configfile $C/config_tw_test2_highs.yaml $C/scenarios/future_2030.yaml`.

- **Results:** they are written to `pypsa-earth/results/<run name>/`. The networks are PyPSA files
  (`.nc`); open them with `pypsa.Network(path)` in Python.
- **Settings:** to see or change a setting, read the config files in `config/`. Every change that
  the Taiwan configs make to PyPSA-Earth's defaults is written there.

## 6. What-if scenarios without Snakemake (the sandbox)

The sandbox changes today's system in memory and re-solves it with HiGHS in about 20 seconds. It
needs Test 2 to have run first. Run these commands in `taiwan-energy-model/`:

```bash
python sandbox/run_scenario.py --levers '{"add_offwind_GW": 10, "co2_cap_frac": 0.5}'
python sandbox/batch.py --list      # the predefined grid of scenarios
python -m pytest sandbox/test_levers.py -q
```

The levers are listed in `sandbox/levers.py`.

## 7. Refresh the website data (optional)

```bash
python viewer/export_dashboard_data.py      # reads the model's results, writes docs/data/
cd docs && python -m http.server 8000       # then open http://localhost:8000
```

## Where to read more

| Topic | File |
| --- | --- |
| Which inputs come from PyPSA-Earth and which from Taiwan sources | `notes/DATA_PROVENANCE.md` |
| What the model fork changes in PyPSA-Earth | [FORK_CHANGES.md](https://github.com/BartonChenTW/pypsa-earth/blob/taiwan/FORK_CHANGES.md) |
| The 2050 net-zero pathway | `notes/TAIWAN_2050_PATHWAY.md` |
| Every data source, with links and checksums | `data/sources.csv`, and the Model data page of the website |
| Contributing data or code | `CONTRIBUTING.md` |

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `build_renewable_profiles` fails to read GEBCO (HDF5 plugin) | Activate the environment with `conda activate`, which sets `GDAL_DATA`, `GDAL_DRIVER_PATH` and `PROJ_DATA`. Setting them by hand is shown in `AGENTS.md`. |
| `add_electricity` fails while reading IRENA statistics | Delete the cached `IRENASTAT_capacities_2000-2023.csv` in powerplantmatching's data folder and run again. The fork downloads it from Zenodo. |
| `prepare_ports` fails with a certificate error | Save the World Port Index CSV to `pypsa-earth/data/ports/UpdatedPub150.csv`; the fork then uses the local copy. |
| A profile does not cover the snapshots | The cutout is missing or covers another period. Build it with `scenarios/build_cutout.yaml`. |
| Anything else | Open an issue at https://github.com/BartonChenTW/taiwan-energy-model/issues and include the Snakemake log. |
