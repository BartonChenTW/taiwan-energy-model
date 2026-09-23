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

## 2026-09-23
 - Added the Test 1 isolated-bus fix (`cluster_options.simplify_network.p_threshold_merge_isolated: false`, `s_threshold_fetch_isolated: 0.05`) to `pypsa_tw/config/config_tw_test2_highs.yaml`. Test 2 now differs from Test 1 only in run name and snapshot range.
 - Stale results found: the stored `tw_test1_highs` (2026-07-22) and `tw_test2_highs` (2026-07-17) results predated the current configs. The old Test 1 HiGHS result had 3 subnetworks and 32,490 MWh of load shedding; the old Test 2 result had 15 subnetworks and extendable generators. The old Test 2 result is archived in `results/_archive/tw_test2_highs_2013_fullyear_4h_6b_2026-07-17/`.
 - Reran `tw_test1_highs_2013_7d_4h_6b` with the current config:
   - 6 buses, 1 connected subnetwork, no load shedding, no extendable generators.
   - Identical to `tw_test1_gurobi_2013_7d_4h_6b`: same buses, generators, `p_nom` and load; objective `8.18958195e+09` for both (relative difference 1.4e-15); dispatch by carrier matches exactly.
 - Solver performance, Test 1 (7 days, 4H, 6 buses):
   - Solver-only time: HiGHS IPM `0.06 s` (21 iterations), Gurobi barrier `0.09 s` (17 iterations).
   - `solve_network` rule wall time: HiGHS `8.5708 s`, Gurobi `9.9515 s`, mostly model build and I/O.
   - Test 1 is too small to separate the solvers.
 - Reran `tw_test2_highs_2013_fullyear_4h_6b` with the isolated-bus fix: 1 subnetwork, no load shedding, HiGHS optimal in `6.52 s` (rule `20.7457 s`), objective `5.3769645464e+09`. **The result is invalid** (next point).
 - **Cutout too short.** `cutouts/cutout-2013-era5-tw.nc` (built 2026-07-16) covers only 2013-03-01 00:00 to 2013-03-06 23:00, 144 hourly steps. Outside that range the renewable profiles are missing, and solar, onwind, offwind and ror get `p_max_pu = 1.0`.
   - Test 2: 98% of snapshots are affected. Solar capacity factor 98.6% (12.4 GW producing 107 TWh), so the full-year generation mix is meaningless.
   - Test 1 (03-01 to 03-08): the last 6 of 42 snapshots are affected, so renewables are overstated on the last day.
   - The archived 2026-07-17 Test 2 result has the same problem.
   - Fix: build a full-year 2013 cutout, then rerun Test 1 and Test 2. Consider a check that the cutout covers the snapshot range.
 - **Snapshot weighting.** Test 1's 42 snapshots are weighted `208.57 h` each (sum 8760 h), so its objective is annualised from one March week. That is why the 7-day objective (`8.19e9`) is higher than the full-year one (`5.38e9`): the extrapolated week overstates CCGT (EUR 2.9 bn vs 0.84 bn).
 - **Lines still extendable.** The Taiwan configs inherit `scenario.ll: ["copt"]` from `config.default.yaml`, so `prepare_network.set_transmission_limit` makes lines extendable. Test 2 expanded line `TW0 0`–`TW0 3` from 13,927 to 18,338 MVA (+4.4 GW in total). To keep today's grid fixed, set `ll: ["v1.0"]`.
 - Consequence: TODO Phase 1 #5 is not conclusive yet. Connectivity is solved (1 subnetwork, no load shedding), but adequacy needs a full-year cutout and `ll: ["v1.0"]`.
 - **Environment pitfall.** Running `.venv\python.exe` directly without `conda activate` leaves `GDAL_DATA` and `GDAL_DRIVER_PATH` unset. `build_renewable_profiles` for `offwind-ac` then fails because GDAL cannot load the HDF5 plugin for `data/gebco/GEBCO_2025_sub_ice.nc`, although the plugins exist in `.venv/Library/lib/gdalplugins`. Fix: activate the env, or set `GDAL_DATA=<env>/Library/share/gdal`, `GDAL_DRIVER_PATH=<env>/Library/lib/gdalplugins` and `PROJ_DATA=<env>/Library/share/proj`.
 - Harmless: `add_electricity` logs a `UnicodeEncodeError` on the Windows console for a `≥` character in the hydro-classification message; the step itself completes.
 - **File permissions.** Files that Codex created or rewrote were owned by the local account `CodexSandboxOffline`, and `EMPA\chyi` had read-only access (the folders' `CREATOR OWNER` rule gives full control only to the creator). Fixed by renaming `pypsa_tw/` and `docs/` aside and copying them back, so the copies are owned by `EMPA\chyi`. The contents were verified identical.


TODO:
 - to run PyPSA-Earth Taiwan!
