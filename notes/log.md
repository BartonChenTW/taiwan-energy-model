# LOG of testing PyPSA-Earth for Taiwan

## how to run?
1. activate conda venv via `conda activate pypsa-earth`
2. copy the right config file to `config.yaml`, for example `Copy-Item pypsa_tw/config.tw.fixed.yaml config.yaml`
3. for Taiwan, make sure `config.yaml` uses a real Taiwan cutout setup:
   - `tutorial: false`
   - `enable.retrieve_cutout: false`
   - `enable.build_cutout: true`
   - `atlite.default: cutout-2013-era5-tw`
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

## 2026-07-23
 - Completed the Test 1 isolated-bus troubleshooting TODO for the fixed current-system Taiwan configuration.
 - `pypsa_tw/config/config_tw_test1_highs.yaml` already disables candidate expansion through empty `electricity.extendable_carriers` and disables load shedding with `solving.options.load_shedding: false`.
 - Local solved Test 1 result exists at `results/tw_test1_highs_2013_7d_4h_6b/networks/elec_s_6_ec_lcopt_Co2L-4H.nc`; benchmark solve time is `8.1613 s`.
 - `TW1 0` and `TW2 0` are not caused by the solver. They already exist as isolated singleton subnetworks before final clustering:
   - `elec.nc`: 193 buses, components `[186, 2, 2, 1, 1, 1]`
   - `elec_s.nc`: 81 buses, components `[79, 1, 1]`
   - `elec_s_6.nc`: 6 buses, components `[4, 1, 1]`, isolated buses `TW1 0` and `TW2 0`
 - Source mapping:
   - `TW1 0` comes from pre-cluster bus `153`, representing original buses `153` and `154`, a disconnected 69 kV island connected only to itself.
   - `TW2 0` comes from pre-cluster bus `54`, representing original buses `53`, `54`, `77`, `78`, and `135`; these are small disconnected components collapsed during simplification.
 - Voltage-threshold check:
   - The built Taiwan network starts at 69 kV.
   - `threshold_voltage` values of 35 kV, 51 kV, and 69 kV keep the same built buses and lines.
   - Raising the threshold above 69 kV removes 69 kV assets and still does not precisely fix every source of `TW2 0`.
 - Practical next fix: correct or supplement the Taiwan input transmission topology for the source buses above, or deliberately configure isolated subnetwork handling in `cluster_options.simplify_network` such as `s_threshold_fetch_isolated` or dropping/merging thresholds.
 - Updated the static GitHub Pages dashboard in `docs/` with the latest local Taiwan run inventory and bilingual English/Traditional Chinese notes.


TODO:
 - to run PyPSA-Earth Taiwan!
