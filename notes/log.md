# LOG of testing PyPSA-Earth for Taiwan

## how to run?
1. activate conda venv via `conda activate pypsa-earth`
2. copy the right config file to `config.yaml`, for example `Copy-Item pypsa_tw/config.tw.fixed.yaml config.yaml`
3. for Taiwan, make sure `config.yaml` uses a real Taiwan cutout setup:
   - `tutorial: false`
   - `enable.retrieve_cutout: false`
   - `enable.build_cutout: true`
   - `atlite.default: cutout-2013-era5`
4. make sure CDS/ERA5 credentials exist at `C:\Users\chyi\.cdsapirc`
   - required because Taiwan uses `build_cutout`, which downloads ERA5 data through `cdsapi`
   - expected format:
```yaml
url: https://cds.climate.copernicus.eu/api
key: YOUR_CDS_API_KEY
```
5. run a try run first `snakemake -j 1 solve_all_networks -n`
6. if it is okay, run full process `snakemake -j 1 solve_all_networks`
7. if `add_electricity` fails while reading IRENASTAT, replace the cached IRENA CSV:
   - expected cache file: `C:\Users\chyi\AppData\Roaming\powerplantmatching\data\in\IRENASTAT_capacities_2000-2023.csv`
   - direct download: `https://zenodo.org/records/10952917/files/IRENASTAT_capacities_2000-2023.csv?download=1`
   - this is needed when the cached file is corrupted or is not the real CSV
   - `scripts/add_electricity.py` has been patched to use this direct URL but not overwrite a manually replaced cache file

## 2026-06-04
 - run the tutorial.yaml (with "NG", "BJ")
    - the process is completed (21 stesp)
 - now run the same conf but with "TW"
    - failed at step 9, re pull the latest repo from pypsa-earth, and try to run again....
    - still have problem at 'retrieve_databundle_light.py'??


TODO:
 - to run PyPSA-Earth Taiwan!
