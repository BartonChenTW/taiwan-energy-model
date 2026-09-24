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

## 2026-09-24
 - **Full-year cutout built.** `cutouts/cutout-2013-era5-tw.nc`: 2013-01-01 00:00 to 2013-12-31 23:00 (8,760 steps), same 0.3° grid as before (113.7–123.9°E, 16.8–27.3°N), no missing values, 374 MB. It took 2 h 14 min, mostly waiting in the Copernicus queue. The time range is now set explicitly in `atlite.cutouts.cutout-2013-era5-tw.time`. The old 6-day file is in `cutouts/_archive/`.
 - **Coverage check.** `scripts/add_electricity.py` now raises if a wind, solar or hydro profile does not cover the snapshots, instead of silently using `p_max_pu = 1.0`.
 - **Fixed grid.** The Test configs set `scenario.ll: ["v1.0"]`. Result files are now `elec_s_6_ec_lv1.0_Co2L-4H.nc`; the old `lcopt` files stay alongside.
 - **Demand calibrated to 2024.** GEGIS demand exists only as a projection (2030, 2040, 2050, 2100), and the default is 2030 (335.7 TWh). The Test configs set `load_options.scale: 0.86` to match Taiwan's 2024 total generation of 288.6 TWh (Taipower/EIA). The profile shape is unchanged: peak/mean is 1.44, and the 4H-average peak is 47.5 GW.
 - **Test 1 (week) with real weather:** optimal with both solvers and no dashboard warnings. Objective `7.06520467e+09` for both; solver time HiGHS `0.05 s`, Gurobi `0.04 s`.
 - **Test 2 (full year) is infeasible** (HiGHS presolve). Answer to Phase 1 #5: no. Today's fixed system as modelled cannot meet demand at summer peaks.
   - National adequacy check on the prepared network: generator availability falls below demand in 80 of 2,190 snapshots (max 2.4 GW short), and in 17 even with reservoir hydro at full power (max 1.0 GW). Before demand scaling it was 345 and 282 snapshots.
   - Pumped hydro (2.7 GW) has `max_hours = 0`, so it cannot store energy and does not help at peak.
   - After the infeasibility, `solve_network` crashes in `compute_infeasibilities`, which only supports Gurobi. That is a secondary error.
 - **Test 2 diagnostic with load shedding** (one-off overlay with `solving.options.load_shedding: true` under run names `tw_test2_{highs,gurobi}_2013_fullyear_4h_6b_ls`; the config is unchanged):
   - Unserved: 409.7 GWh (0.14% of demand) in 200 of 2,190 snapshots (800 h), all in June to August, peak 2.18 GW (2013-08-08 08:00). 97% at `TW0 0`, the largest demand bus. No line is at ≥ 99% loading during shedding, so the gap is generation capacity, not transmission.
   - Generation mix: coal 55.1%, gas 20.7%, nuclear 14.9%, renewables 9.3%, pumped storage 0%. Taiwan 2024: gas 42.4%, coal 39.3%, nuclear 4.2%, renewables 11.6%, pumped storage 1.1% (Taipower/EIA).
   - Capacity factors: coal 99.5%, CCGT 37.1%, nuclear 92%, solar 13.1%, offshore wind 43.5%, onshore wind 17.3%, run-of-river 2.8%.
   - Coal is dispatched before gas because its marginal cost (30.1 EUR/MWh) is below CCGT (46.8), and the model has no coal availability, maintenance or emission limits.
   - CO₂: 170.4 Mt; mean price 81.1 EUR/MWh, including 1,000 EUR/MWh scarcity prices during shedding.
 - **Solver comparison, full year** (answers Phase 1 #6): identical objective `8.59217309e+09`. Solver time Gurobi `0.84 s` (26 barrier iterations) vs HiGHS `9.26 s`, about 11× faster. `solve_network` step: `16.1 s` vs `24.2 s`. Gurobi uses the shared token server `du-lic-gurobi`.
 - **Input data to fix in Phase 3** (to make the reference year realistic):
   - Nuclear: 5.3 GW in the fleet, but Taiwan's last reactor (Maanshan 2) shut down in May 2025.
   - Gas 18.3 GW and solar 12.4 GW are below 2024 levels (about 20 GW and about 14 GW); offshore wind is 2.2 GW against about 3 GW.
   - Pumped hydro: `max_hours = 0`.
   - Run-of-river hydro: capacity factor 2.8%, which looks far too low.
   - Demand: the summer peak looks too high for the 2024 total (peak/mean 1.44).
   - Costs: `costs_2030.csv` (2030 projections), and no coal dispatch constraints.
 - **Dashboard rebuilt** (`docs/`, data from `pypsa_tw/viewer/export_dashboard_data.py`), with automatic sanity warnings per case. Checked in headless Edge screenshots, in English and Traditional Chinese and in light and dark mode.
 - `pypsa_tw/SIMULATION_TABLE.md` was found reverted to its pre-2026-09-23 content at 02:54:55, probably by a stale editor buffer. It was restored from git and updated.

## 2026-09-24 (afternoon): official power plant data
 - **Sources collected** (details in `pypsa_tw/data/README.md`):
   - Taipower real-time unit list, including IPPs ([data.gov.tw/dataset/8931](https://data.gov.tw/dataset/8931)), snapshot 2026-09-24 15:10: 215 rows with installed capacity per unit.
   - Energy Administration solar approvals by county, 2015–2025 ([data.gov.tw/dataset/16423](https://data.gov.tw/dataset/16423)): transcribed from PDFs, every yearly sum matches the published total.
   - OpenStreetMap power plants (Overpass) and GADM counties, for coordinates.
   - Taipower annual peak load ([data.gov.tw/dataset/8307](https://data.gov.tw/dataset/8307)): 40,882 MW in 2024, 40,752 MW in 2025.
 - **Draft fleet** `data/custom_powerplants.csv` (97 plants, 60.1 GW), built by `pypsa_tw/data/build_custom_powerplants.py` from `pypsa_tw/data/taipower_plant_mapping.csv`. No nuclear; gas 22.3, coal 11.4, solar 15.4, offshore wind 3.4, pumped hydro 2.6 GW at 6 h, batteries 0.85 GW. Not yet enabled in the Test configs; awaiting review.
 - **Pitfalls found while testing it:**
   - custom plants need `DateIn`, or `add_electricity` stops ("Could not fill 'datein'").
   - The default `powerplants_filter` (`DateIn <= 2023`) silently drops newer plants, so use a 2025 filter.
   - With `estimate_renewable_capacities.stats: irena`, pypsa-earth tops solar and wind up to IRENA 2023 and spreads the difference evenly over buses.
 - **Pumped hydro 0 h explained:** the powerplantmatching entries had no `Duration`, and `add_electricity` replaces only `max_hours == 0` with `PHS_max_hours`, not NaN.
 - **Diagnostics** (Test 2 with load shedding, one-off overlays, configs unchanged):
   - draft fleet, demand scale 0.86: mix gas 51%, coal 35%, renewables 12%; unserved 4.6 TWh, peak 8.4 GW. Firm capacity fell from 41.8 GW (old list, with nuclear and Mailiao) to 34.9 GW.
   - draft fleet, demand scale 0.749 (Taipower system): 250.9 TWh, peak 41.4 GW; mix gas 46%, coal 40%, renewables 14%; unserved 0.83 TWh (0.33%), peak 1.6 GW, June–August, no line at its limit.
 - **Demand scope mismatch:** a Taipower-system fleet needs Taipower-system demand, 251.44 TWh in 2024 (to confirm), not the national 288.6 TWh.
 - **Remaining gap:** units shown as "-" (new gas units in trial: Taichung CC #1–2, Hsinta new CC #3) were generating 3.1 GW at the snapshot but have no published rating.

## 2026-09-24 (evening): fleet enabled, correction, MOTEL export
Barton's instructions: keep developing; (1) enable the fleet; (2) research the missing ratings and record them; (3) push, with details here. Items to review later are in `pypsa_tw/REVIEW_CHECKLIST.md`.

 - **New gas units added with sourced ratings** (`pypsa_tw/data/supplementary_units.csv`, read by `build_custom_powerplants.py`):
   - Taichung new CC #1 and #2: 1,300 MW each. [CNA 2026-09-04](https://www.cna.com.tw/news/afe/202609040200.aspx) gives about 2,600 MW for the pair. Unit 1 has been in dispatch since May 2026, with commercial operation at the end of September 2026. Unit 2 is in test operation, enters dispatch in October 2026, and reaches commercial operation in March 2027.
   - Hsinta new CC #3: 1,300 MW, in trial grid operation ([e-info.org.tw](https://e-info.org.tw/node/243153); unit 1 is listed at 1,300.0 MW).
   - Hsinta new CC #2 is listed but excluded: it was not generating at the snapshot and is due by the end of 2026.
   - The same CNA article says two Taichung coal units will be dismantled from October 2026. This is not yet reflected in the fleet.
   - Fleet: 98 plants, 64.0 GW (gas 26.2 GW).
 - **Test configs switched to the official fleet** (all three):
   - `electricity.custom_powerplants: replace`
   - `powerplants_filter` up to `DateIn <= 2026`
   - `estimate_renewable_capacities.stats: false`
   - `load_options.scale: 0.749` (Taipower-system demand)
 - **Reruns:**
   - Test 1 with HiGHS and with Gurobi: optimal, identical objective `7.44479070e+09`, no dashboard warnings.
   - Test 2: still infeasible (presolve).
 - **CORRECTION: the full-year shortfall is transmission, not generation capacity.**
   - Earlier today I wrote "no line at its limit, so it is a capacity shortfall". That check compared line flows with `s_nom`, but pypsa-earth limits lines to `s_max_pu × s_nom` with `s_max_pu = 0.7`.
   - Rechecked against `s_max_pu × s_nom`, all three diagnostics were transmission-limited in 100% of their shedding snapshots:
     - old fleet: line `TW0 0`–`TW0 3`
     - official fleet without the new units: `TW0 1`–`TW0 3`
     - current fleet: `TW0 1`–`TW0 4`, at 9.75 GW
     - bus names differ between runs because clustering renumbers them.
   - Current run: all 834.9 GWh unserved is at `TW0 1`, the Taipei bus (25.04 N 121.70 E; 87 TWh demand, 3.8 GW local generation), while 5.3 GW of gas elsewhere is unused.
   - This is also why adding 3.9 GW of new gas left unserved energy unchanged at 834.9 GWh.
 - **Sensitivity** `tw_test2_highs_2013_fullyear_4h_6b_smax1_ls` (overlay `lines.s_max_pu: 1.0`, load shedding allowed):
   - no unserved energy; the Taipei corridor peaks at 89% of its rating
   - mix gas 46.6%, coal 39.6%, renewables 13.8%; CO₂ 134.0 Mt; HiGHS 11.21 s
   - So the full year is feasible once the Taipei corridor is not the bottleneck.
   - Open question: is it a real constraint, or an artefact of lumping Taipei's 345 kV corridors into one line with 6 buses? That is Phase 3 #9: check the OSM corridors, and run with 20 buses.
 - **Pumped hydro unused** (capacity factor 0%) in the full-year runs: coal runs at 100%, so there is no cheap surplus to pump with. Coal constraints are Phase 3 #6.
 - **Archived** superseded diagnostics in `results/_archive/`: old-fleet load shedding with HiGHS and with Gurobi, and the official fleet before the new units.
 - **MOTEL export** (Barton's request: store the collected data with the [MOTEL](https://github.com/uesl-empa/motel-platform) framework):
   - `pypsa_tw/data/export_motel.py` writes Step 1 staging records (`unmapped_entity`, `unmapped_carrier_data`, schema 0.2.0) to `pypsa_tw/data/motel/`:
     - 12 fleet technology records (installed capacity, every plant with location and commissioning year, pumped-hydro hours, new-unit ratings)
     - 22 county solar-approval records
     - 5 electricity carrier records (peak load and reserve margin 2020–2025, annual generation, generation mix)
   - The records pass MOTEL's own validator (`--strict`: 0 errors, 0 warnings). The validator and schemas are vendored unchanged from MOTEL commit `e3c6a976` (MIT / CC BY 4.0).
   - Headline statistics (`pypsa_tw/data/official/taiwan_electricity_statistics.csv`) came from search summaries, not pages I opened, so they are marked `evidence: search_summary` and `confidence_level: to be verified`.
 - **Dashboard:**
   - opens on the full-year diagnostic (`featured` in `docs/data/index.json`)
   - findings rewritten in English and Traditional Chinese
   - storage group relabelled "Storage (pumped hydro, battery)"
 - **Workflow note:** the run wrapper in the earlier batch reported `EXIT=1` for successful runs because `$?` was read after a command substitution. Fixed in later batches.
 - **Dashboard changes requested by Barton:**
   - **Prices in NT$/kWh (元/度):** model costs are in EUR (technology-data), converted at 36.185 NT$/€. That is the Bank of Taiwan spot midpoint (buy 35.885 / sell 36.485), quoted 2026-09-24 17:01 from [rate.bot.com.tw](https://rate.bot.com.tw/xrt?Lang=zh-TW), and stored as `CURRENCY` in the exporter and `currency` in `index.json`. The technology cost table stays in EUR.
   - **Price explanation:** the plotted price is the demand-weighted national marginal price, a modelled wholesale cost signal, not the retail tariff. Spikes are hours with unserved demand: the affected bus hits the 1,000 EUR/MWh (about 36 NT$/kWh) shortage penalty, which lifts the national average to about 13.6 NT$/kWh.
   - **Renewable potential:** the "availability" panel is renamed "Renewable potential (weather)". It explains that `p_max_pu` is weather-based available output, not plant outages. A table per technology gives installed capacity, technical potential (`p_nom_max`: solar 50.3, onshore wind 43.0, offshore AC 12.6 GW), potential and realised capacity factor, and curtailment (0% in the current runs).
   - **"Data comparison" section:** PyPSA-Earth default inputs vs Taiwan data vs reported statistics (capacity by technology, key inputs, generation mix). The data is `docs/data/comparison.json`; the default-data side is the archived old-fleet full-year run. The mix colour order (gas, nuclear, coal, renewables, storage, other) passes the palette's adjacent-pair checks in both modes.


TODO:
 - to run PyPSA-Earth Taiwan!
