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
   - **Prices in two units** (follow-up request): EUR/MWh is the main value, as in the model's cost data, with NT$/kWh in brackets in the key-figure tile, the bus table and the chart tooltip. The chart axis stays in EUR/MWh. The exchange-rate note gives 1 EUR/MWh = 0.0362 NT$/kWh.
   - **Explanations behind an (i) icon** (follow-up request): the price, renewable-potential and comparison-mix notes open on hover, keyboard focus or tap, instead of being shown as paragraphs.
   - **"Data comparison" section:** PyPSA-Earth default inputs vs Taiwan data vs reported statistics (capacity by technology, key inputs, generation mix). The data is `docs/data/comparison.json`; the default-data side is the archived old-fleet full-year run. The mix colour order (gas, nuclear, coal, renewables, storage, other) passes the palette's adjacent-pair checks in both modes.

 - **Taiwan energy data page** (`docs/taiwan-data.html`, Barton's request for a tab with all the Taiwan data, sources and summaries):
   - Key figures (`pypsa_tw/data/taiwan_key_facts.csv`): 45 figures on capacity, demand, generation, emissions, prices, policy targets and renewable resource. Each has its source, link and evidence. 26 still need checking because they came from search summaries.
     - new: grid emission factor 0.474 kg CO2e/kWh (2024) and 0.494 (2023)
     - new: average tariffs H1 2025: overall 3.75, residential 2.77, industrial 4.27 NT$/kWh
     - new: electricity use by sector in 2024 (industry 55.2%, residential 18.8%, services 17.6%, energy 6.5%; 283.8 TWh)
     - new: 2025 targets (renewables 20%, solar 20 GW, offshore wind 5.7 GW) and 15.7 GW offshore wind by 2035
     - new: 2050 net-zero pathway (renewables 60-70%, hydrogen 9-12%, thermal with CCUS 20-27%) and forecast demand growth of 2.5%/yr for 2026-2035
   - Data sources (`pypsa_tw/data/taiwan_energy_catalog.csv`): 35 sources, from Taipower open data, the Energy Administration, MOEA, MOENV, NDC, the Central Weather Administration, OSM, GADM, ERA5, IRENA, GEGIS, technology-data, Ember, EIA, GEM, OWID, thewindpower.net, Bank of Taiwan and MOTEL.
     - 11 used in the model or dashboard, the rest marked as candidates or references.
     - Candidates worth adding next: Taipower daily supply-demand (19995) for the demand shape, unit historical generation (37331) and daily solar generation (29938) for validation, electricity use by county (38959) for spatial demand, and the Energy Administration statistics database to replace the search-summary figures.
   - Links: 42/44 reachable by script on 2026-09-24 (`official/link_check_20260924.csv`). Copernicus CDS timed out and IRENA returned 403 (bot protection); both are known sites. data.nat.gov.tw/dataset/157114 returned 502 and was replaced by data.gov.tw/dataset/157114.

 - **History and projections** (Barton's request: the data should cover history and projections, not only today):
   - Downloaded official annual data (Energy Administration): generation by source (16481), capacity by source (16480) and 33 energy indicators (8308), all for 2005–2025. Also the MOEA National Power Supply-Demand Report PDF (16437, 2025 edition, 28 pages). Text extracted with pypdf installed into the scratchpad only, not into `.venv`.
   - Transcribed from the report: Table 3-2 (night peak 36.9 → 46.0 GW, night capability and reserve margin, 2025–2034; the reserve margins recompute exactly) and Table 3-1 (renewable targets for 2030 and 2032, which sum to the stated totals). Also 1.7%/yr demand growth, gas +25.2 GW with 12.9 GW retired, the 1 GW grid-storage target, and Taipower's capacity-credit rules (solar 25% day / 0% night, offshore wind 11% night).
   - `pypsa_tw/data/build_timeseries.py` → `taiwan_timeseries.csv`: 826 rows, 45 series (762 history, 46 projection, 18 target). It includes the PyPSA-Earth default GEGIS demand for 2030/2040/2050: 335.7 / 411.2 / 528.9 TWh with 2013 weather. That is about 7% above the official 1.7%/yr path in 2030.
   - Taiwan energy data page: new "History and projections" section with 6 charts (generation by source, capacity by source, peak load and capability, renewable capacity vs targets, renewable share vs targets, grid emission factor) and a filterable series table with CSV download.
   - MOTEL: 15 new technology records (national capacity by year plus targets) and 4 carrier records (generation history, demand and peak outlook, emissions, indicators). All 5 files pass the validator with `--strict`.
   - **Key facts upgraded:** 14 figures that came from search summaries are now marked downloaded after checking them against the official files, so 12 remain to verify (was 26). New figures: emission factor 2025 of 0.467, the 2025–2034 outlook, and the 2030 targets.
   - **Correction:** the catalogue listed `data.gov.tw/dataset/157114` as the capacity dataset, but it is an unrelated de-listed dataset. The link check passed only because the page exists. Replaced with 16480, and every data.gov.tw link was then checked against its page title.
   - The 251.44 TWh Taipower-system figure stays unconfirmed. Official data: Taipower + IPPs 243.2 TWh, national 289.4 TWh (2024).


## 2026-09-24: scenarios (other weather years, 2030 and 2034)

Barton asked what "2013" means and asked for other years. Chosen: other weather years and future years 2030/2034.

 - **What 2013 means:** only the weather (ERA5 cutout) and the shape of the demand profile (GEGIS computed with 2013 temperatures). The fleet is today's (Taipower list 2026-09-24), the annual demand is 2024's Taipower-system level, and the grid is today's. The dashboard now has a "Model setup" panel per run, read from the config that produced it.
 - **Scenario overlays** in `pypsa_tw/config/scenarios/`. Each sits on top of `config_tw_test2_highs.yaml` and allows load shedding, as in the 2013 diagnostic:
   - `weather_2011.yaml`, `weather_2018.yaml`: today's system under 2011 or 2018 weather. Demand is rescaled to 251.44 TWh (GEGIS 2030 profile: 334.3 TWh with 2011 weather, scale 0.752; 331.0 TWh with 2018 weather, scale 0.7596).
   - `future_2030.yaml`, `future_2034.yaml`: the planned system under 2013 weather. Demand is 251.44 × 1.017^n (278.2 and 297.6 TWh). Costs are technology-data 2030 and 2035 (the nearest published year to 2034). The grid stays fixed, with nothing investable.
 - **Snakefile:** `build_powerplants` now reads `electricity.custom_powerplants_file` (default `data/custom_powerplants.csv`), so each scenario can use its own fleet file.
 - **Future fleets** (`pypsa_tw/data/build_future_powerplants.py`, details in `pypsa_tw/data/README.md`):
   - Figure 3-3 of the MOEA 2025 report (p. 22) transcribed unit by unit into `official/moea_thermal_schedule_2024_2034.csv`. The image was extracted with pypdf and read. The transcription matches the report's totals for 2025–2034 (+25,163 MW, −12,941 MW), and the script asserts both.
   - A unit counts if it is in service on 1 July of the model year.
   - Renewables at the Table 3-1 targets (2032 held for 2034). Geothermal and biomass added.
   - Totals: 94.25 GW (2030) and 104.38 GW (2034), against 64.00 GW today.
   - 2034 first failed in `add_electricity` (IndexError in `get_grouping_year`): units commissioned 2031–2034 fall outside `existing_capacities.grouping_years_power`, which ends at 2030. `future_2034.yaml` adds a 2035 bin.
 - **Results** (full year, 4H, 6 buses, HiGHS):

   | | today | 2030 | 2034 |
   | --- | --- | --- | --- |
   | Demand | 251.4 TWh | 278.2 TWh | 297.6 TWh |
   | Peak | 41.4 GW | 45.8 GW | 49.0 GW |
   | Renewables | 13.9% | 35.8% | 38.4% |
   | Coal | 40% | 30% | 19% |
   | Gas | 46% | 34% | 43% |
   | CO₂ | 134.1 Mt | 113.4 Mt | 96.9 Mt |
   | Unserved | 834.9 GWh | 364.2 GWh | 826.0 GWh |
   | Mean price | 87.7 EUR/MWh | 77.9 EUR/MWh | 84.1 EUR/MWh |

   Solve times: 12.8 s (2030) and 13.5 s (2034), solver only.
 - **Reading the future results:**
   - The unserved energy is again all at the Taipei bus in June–August, with the aggregated Taipei corridor (13.93 GW × 0.7) at its limit. In 2034 the bus holds only 1.3 GW of gas (Hsieh-ho new #1). Tatan, Kuokuang and the two unsited units connect at the Taoyuan bus, on the far side of the same line. So this is the known 6-bus corridor issue (Phase 3 #9), not a shortage of capacity.
   - Renewables exceed the 30% target for 2030 in the model. Three reasons: national capacity targets are applied to the smaller Taipower-system demand; geothermal (1.2 GW) and biomass (0.81 GW) run at a capacity factor of about 100%; and there is no curtailment.
   - Coal still runs at about 99%, because technology-data puts coal (30 EUR/MWh) below gas (47 EUR/MWh). The coal-reduction policy is not modelled (Phase 3 #6).
   - Pumped hydro starts to be used in 2030 (0.87 TWh), when solar at midday creates a surplus.
 - **Weather years 2011 and 2018:** cutouts requested from CDS (about 87 MB per request; the queue was slow). Runs follow when the downloads finish.
 - **Dashboard:**
   - New "Scenarios" section: generation mix and key results per weather year and per future year, plus installed capacity today / 2030 / 2034. Rows open the run.
   - Geothermal and biomass have their own group, "Geothermal, biomass".
   - The Taiwan energy data page has a new chart of planned thermal additions and retirements by year, built from the schedule (4 new series in `taiwan_timeseries.csv`, now 850 rows).

 - **Colours (Barton: coal, gas and pumped storage all looked red; wind and geothermal looked alike):**
   - The earlier palette was only checked on neighbouring pairs in the stack.
   - New technology colours in `docs/assets/site.css`, used by both pages: coal warm grey, gas orange, pumped storage and battery magenta, onshore/offshore wind light/dark teal, geothermal and biomass light blue (their own group), oil light grey, unserved demand near-black.
   - Light mode was checked on every pair with the dataviz validator: all pass with normal vision (at least 15 apart), and the worst colour-blind pair is 8.5.
   - Dark mode has its own values. Its worst normal-vision pairs (about 11–13) are between colours that never sit next to each other in a chart.
   - The planned-additions chart is no longer red-dominated: coal retirements are grey, and gas retirements are a lighter gas colour.

## 2026-09-24: sources for every projection

Barton: "in the projection, where is it from? Identifying the source is important."

 - **Source registry** `pypsa_tw/data/sources.csv`: one row per source, with original title, publisher, edition, publication date, landing page, direct file URL, local copy and SHA-256, access date, licence and evidence. Every row of `taiwan_timeseries.csv` now has a `source_id` and a `locator`:
   - projections and targets: table or section, printed page and PDF page;
   - history: the column of the downloaded file.

   `build_timeseries.py` stops if a local copy no longer matches its checksum, and the exporter stops if a row points to an unknown source.
 - **The MOEA report, identified properly:**
   - From the cover: 經濟部《全國電力資源供需報告 113年度》, prepared by 經濟部能源署, i.e. the FY2024 report with the 2025–2034 outlook.
   - Direct file: `https://www.moeaea.gov.tw/ECW/populace/opendata/wHandOpenData_File.ashx?set_id=365` (data.gov.tw 16437, identifier 313210000G-000048, updated 2026-06-09). SHA-256 `03b879cf…fc84`.
   - Earlier notes called it the "2025 edition", which is ambiguous; it is now named 113年度 everywhere. The press-release outlook is the 114年度 report.
   - Printed page = PDF page − 4. Figure 3-3 is p. 18 (PDF p. 22), Table 3-1 p. 19 (PDF 23), Table 3-2 p. 20 (PDF 24), demand growth p. 7 (PDF 11). Each was confirmed against the extracted text. (The earlier "Figure 3-3, p. 22" was a PDF page number.)
 - **Correction:**
   - The 2026–2035 night-peak growth (2.7%/yr) was labelled as the MOEA report, but its link and evidence were a search summary of a Science Media Center Taiwan article. It is now attributed to that article (`smctw_2026_outlook`, search summary).
   - Titles of the MOEA news release and the SMC article are left empty rather than guessed.
 - **Not verified:** the NDC 2050 pathway PDF returns HTTP 403 to scripts, so the 60–70% renewable-share figure stays "to verify" (checklist).
 - **Website:**
   - Every chart on the Taiwan energy data page has a "Sources" line built from the series it plots: kind, years, source, table/page, link and evidence badge.
   - The series table shows the locator.
   - A new "References for history and projections" table has the full registry (`docs/data/taiwan_sources.csv`).
   - The dashboard's Scenarios section cites the report's figure, table and pages.
 - **Also updated:** the key facts from the report now carry pages, and the MOTEL records use the registry (full citation plus locations; all 5 files pass `--strict`).

## 2026-09-24: energy-planning sandbox, Phase 1

Barton's choices: all four lever groups plus nuclear (restart Chinshan, Kuosheng or Maanshan, or new build at the Lungmen site); today's system as the base; fixed additions only (no expansion mode).

 - **Code** in `pypsa_tw/sandbox/`:
   - `levers.py`: spec format, ranges, validation and hash.
   - `run_scenario.py`: runner. It uses the prepared Test 2 network, applies the levers in memory, and calls `scripts/solve_network.py`'s `prepare_network` and `solve_network` through a stand-in `snakemake` object. HiGHS only.
   - `batch.py`: grid of 33 scenarios.
   - `test_levers.py`: 20 tests.
   - `PHASE2_LIVE_SOLVING.md`: design for live solving, not built.
 - **Acceptance:**
   - The empty spec reproduces the base objective: 9.4118907280e+09 in both, relative difference under 1e-6 (tested).
   - Every lever moves the network in the expected direction (tested).
   - 33 scenarios solved one at a time in 692 s (17–38 s each).
 - **Found:** the base network's existing battery has charge and discharge efficiency 1.0 (lossless, a pypsa-earth default). Added batteries use technology-data's 0.96 (checklist).
 - **Exporter:** `docs/data/sandbox/` (9.3 MB for 33 scenarios) holds the case JSON plus spec, metrics and deltas.
   - System cost = operating cost + annualised investment (technology-data 2030) of the added capacity.
   - The load-shedding warnings are the known Taipei corridor. They vanish where supply lands inside Taipei (CCGT +5 GW, restarting Chinshan and Kuosheng, new nuclear at Lungmen) or the line limit is lifted (85% or 100% rating).
 - **Selected results:**
   - Offshore +10 GW: renewables 31%, −15.8 Mt CO2, system cost +169 M€/yr.
   - Coal −100% without replacement: 7.4 TWh unserved.
   - CO2 caps are met exactly (at 60%: 80.5 Mt).
   - Gas ×0.5 and coal ×2 both switch coal to gas: CO2 80.6 Mt.
   - Restarting all three nuclear plants: −13.3 Mt, no unserved energy.
 - **Page:** `docs/sandbox.html`.
   - Levers, nearest computed scenario (with differences shown as yours → shown), tiles with deltas, capacity chart, week dispatch, line-loading map, scenario table.
   - The levers are kept in the URL.
   - Checked when served locally at desktop width and in a 375 px frame: no page overflow. Edge headless has a minimum window of about 496 px, so the phone check used a frame.

## 2026-09-24: landing page, challenges, about, request form

Barton asked for a landing page, an About page, a page on the challenges of the energy system, and a way to request a simulation run.

 - **Structure:** `docs/index.html` is now the landing page and the dashboard moved to `docs/dashboard.html`. Old `index.html?case=...` links redirect there.
 - **New pages:** `challenges.html` (8 challenges, each with official figures and sources, a model finding and a "Try it" link to the matching sandbox scenario), `about.html` and `request.html`. All are bilingual. The top navigation is shared.
 - **Request method:**
   - GitHub issues need a visitor account and show GitHub's interface; Barton wanted requests sent in the background.
   - So the form posts to a form service (Formspree or Web3Forms) with `fetch`; the visitor stays on the page and the author gets an email. The form has a spam trap and a consent box.
   - The service is not configured yet (checklist).
   - In the sandbox, when the levers match no computed scenario exactly, a "Request exactly these settings" link pre-fills the form with the levers.
 - **About text** comes from public sources only: GitHub profile (name, Empa, bio, location, projects) and the public part of LinkedIn. For Barton to review (checklist).

## 2026-09-24: first sector-coupled test (draft)

Barton asked to try PyPSA-Earth's sector-coupled model. Overlay: `pypsa_tw/config/scenarios/sector_test.yaml` (overnight, 2030, 6 buses, 144 h steps, no H2 export, load shedding allowed).

 - **Runs end to end** after four small fixes in PyPSA-Earth's scripts (commented in the code):
   1. The UN Energy Statistics Database reports Taiwan as "Other Asia", which was dropped (all Taiwan demand was 0). `build_base_energy_totals.py` and `build_base_industry_totals.py` now map it to Taiwan. Checked: 2019 gross production 274.2 TWh, nuclear 3,872 MW, pumped hydro 2,602 MW.
   2. `prepare_urban_percent.py`: UNCTAD's bulk file id 355 no longer exists; the current id is looked up (2301 at the time).
   3. `prepare_urban_percent.py`: "China, Taiwan Province of" converts to both CN and TW and was dropped; mapped to Taiwan.
   4. `prepare_ports.py`: msi.nga.mil fails Python's certificate check; falls back to a local copy in `data/ports/UpdatedPub150.csv` (downloaded with curl, not committed).
 - **The result is not credible yet**, and is shown only on a draft page (`docs/sector-draft.html`, not in the menus, noindex):
   - Coal 31.9 GW, CCGT 44.9 GW and oil 3.7 GW in the sector network, against 11.4, 26.0 and 1.3 GW in the official fleet. The source of the extra capacity is still to trace.
   - Electricity demand is 353 TWh, against 284 TWh national consumption (2024) and 251 TWh in the electricity model.
   - CO2 is 280 Mt, against 239.5 Mt fuel combustion (2025).
   - 40.6 GW of rooftop solar was built (extendable by default in the sector model); fossil supply is unlimited; there is no CO2 cap; 6-day time steps.
 - **Plausible:** the non-electric demand from the UN balance (road oil 149 TWh, aviation 54 TWh, gas for industry 56 TWh, petrochemical naphtha).
 - **Exporter:** `export_sector_draft` writes `docs/data/sector_draft.json` (aggregated numbers only).
 - **Correction:** the "too much coal and gas" finding was wrong.
   - PyPSA-Earth's `convert_conventional_generators_to_links` (`scripts/prepare_sector_network.py`) turns each plant into a link rated on its fuel side: `p_nom = MW_el / efficiency`.
   - 31.9 GW coal is 11.36 / 0.356, and 44.9 GW CCGT is 26.03 / 0.58. The electric capacities are the official fleet's.
   - The export now reports link capacity × efficiency.
 - **Draft page:** technology and demand names are translated (EN and ZH) instead of PyPSA-Earth codes in monospace.

## 2026-09-24: sector-coupled 2025 reference, daily steps

 - **Overlay** `pypsa_tw/config/scenarios/sector_2025_24h.yaml`: planning year 2025, `sopts: 24h` (365 steps), 2013 weather, 6 buses. It shares the run name with the test, so the electricity network is reused.
 - **Config:** 2025 needed its own entries for the road-transport fuel-cell and electric shares and the shipping hydrogen share (PyPSA-Earth only defines 2030 and 2050). Set to 0, 0.5% and 0, as assumptions.
 - **Found in the log:** PyPSA-Earth has no growth, efficiency, fuel-share or heating data for TW and uses its defaults.
 - **Solve:**
   - HiGHS (IPM) failed numerically after 300 s, at a 0.6% gap. The LP has 630k rows and 306k columns; costs range up to 1e6 and RHS up to 2e8.
   - Re-solved with Gurobi (local test only; the sandbox and any web service stay on HiGHS): optimal, 1.441e10 EUR, about 50 s.
 - **Results vs official 2025:**
   - Electricity demand 297.6 TWh (national generation 289.7 TWh).
   - Mix: gas 41.6% (47.7%), coal 33.4% (35.3%), solar 12.6% (5.8%), wind 4.7% (4.2%), oil 3.8% (1.5%), biomass 3.0% (1.4%), hydro 0.9% (1.9%).
   - CO2 259 Mt (fuel combustion 239.5 Mt).
   - Solar is too high because the model builds 16.4 GW of rooftop solar (extendable by default); the rooftop setting should be fixed for a reference year.
 - **Draft page:** run selector (2025 reference and 2030 test) and an electricity-mix chart against official 2025 generation.

## 2026-09-24: sandbox usability (Barton's review)

 - **New nuclear** is set as a number of plants (0-5). One plant is one Lungmen-design reactor unit, 1,350 MW; Lungmen was built with 2 × 1,350 MW.
   - The lever stays in GW (max 6.75), so the existing 2.7 GW scenario is "2 plants" and stays cached.
   - Added 1, 3 and 5 plants with their uncertainty variants (12 solves, 242 s). One plant still leaves 19 GWh unserved; 2 or more leave none.
 - **Today's values on every lever:** capacities, coal, demand (251 TWh), fuel prices (gas 24.6 and coal 9.6 EUR/MWh of fuel, technology-data 2030) and line rating (70 %). Each is shown with the resulting value, e.g. "+5 GW → 20.4 GW".
 - **New chart:** dispatch over the whole year as daily averages (365 points from the 4-hourly results).
 - **Not computed:** when the levers match no computed scenario, the match box is red, with an icon and the heading "Not computed yet". It lists the differences compactly and links to the request form.
 - **Cache busting:**
   - Barton did not see the "today" values after they were pushed. GitHub Pages lets browsers cache assets (`max-age=600`).
   - `pypsa_tw/viewer/stamp_assets.py` gives every CSS/JS link a content hash (`?v=`); the exporter runs it.

## 2026-09-24: energy security, blockade scenarios

Barton asked whether the model considers LNG and coal stocks, and for a wartime scenario tab.
 - **Before:** neither model limited fuel. Gas, coal and oil plants could burn any amount.
 - **Blockade mode** in the sandbox (`levers.SECURITY_LEVERS`, `run_scenario.apply_security`):
   - Only the blockade window is solved (14/30/60 days from 1 July or 7 January), at the base 4-hour steps.
   - The plants draw from one national fuel bus per fuel. Each stock is a Store that can only be drawn down.
     - Stock = stock days × the plants' average daily fuel use in the base year: LNG 11 d, coal 41 d, oil 100 d.
     - Imports = a share of the base case's fuel use in the same window. 100% reproduces the base case: 1.3% of summer demand not met, the same as the base.
   - Options: 20% rationing, LNG stock 14 d, nuclear restart, solar +10 GW with batteries +5 GW, standby/retired coal restart (Hsinta 1–3, Mailiao 1–3), and damage (Taichung, Tatan, or half of the lines into Taipei).
   - Old sandbox hashes are unchanged: security levers enter the spec only when set.
 - **28 cases** (`batch.py --security`): about 2 s each, 110 s in total.
 - **Main results** (share of demand not met, full blockade):

   | Window | Result |
   | --- | --- |
   | 14 d summer | 21.7% |
   | 30 d summer | 41.4% |
   | 60 d summer | 59.8% |
   | 30 d winter | 19.6% |
   | 60 d winter | 43.2% |

   - Restarting the three nuclear plants brings the 30-day summer case to 28.5% and the 30-day winter case to 2.8%.
   - Gas is limited by fuel, not plants: losing Tatan or half the Taipei lines changes nothing.
   - Coal is limited by plants: 27% of the coal stock is left after 30 summer days.
   - Losing Taichung raises the 30-day summer case to 57.7%.
   - Rationing does not reduce the total shortfall, because the model already sheds load optimally.
 - **Caveats:**
   - The model knows when the blockade ends (perfect foresight), so each stock is spread to zero by the last day.
   - Transport and industrial fuel use are not modelled.
   - Stocks are secondary-source figures, still to verify.
 - **Website:**
   - New page `docs/energy-security.html` with `assets/security.js`.
   - Data in `docs/data/security/` (264 KB); the exporter's `export_security` writes it.
   - Linked from every menu and the home page.

## 2026-09-25: Taiwan energy data, all sectors

Barton asked for data on sectors other than electricity (heating, transport, industry, cooling), with references.
- **Sources found and downloaded:**
  - Energy Administration energy balance 1982–2025 (table 3-02, toe; published 2026-09-07 on the energy statistics site, which also has an open API);
  - CO2 from fuel combustion by sector 1990–2025 (Tables A1.1, A2.1);
  - Residential Sector Energy Statistics 2024 (household electricity by appliance);
  - DGBAS household equipment 2025.
- **`build_timeseries.py`** now also writes:
  - energy use by sector and fuel;
  - transport by mode and fuel;
  - industry by branch;
  - CO2 by sector (direct and with electricity allocated);
  - household appliance shares.

  That makes 2,342 rows and 131 series, each checked against its source's totals.
- **Main numbers for 2025:**
  - Domestic energy use was 812 TWh, of which electricity was about 35%.
  - Industry used 272 TWh, transport 132 TWh (97% road; gasoline 81, diesel 48, electricity 2.0), homes 70 TWh (76% electricity) and services 69 TWh.
  - Non-energy use (petrochemical feedstock) was 189 TWh.
  - Industry bought 14.4 TWh of steam from cogeneration plants.
- **Households (2024 survey):**
  - air conditioners use 29.6% of household electricity over the year and 50.4% in June to September;
  - there are 2.8 air conditioners per household (DGBAS 2025).
- **Website:** a new "Energy use in all sectors" section on `docs/taiwan-data.html`:
  - six charts, with palettes validated in light and dark;
  - notes on heating, cooling and hot water;
  - 11 new key figures and 7 new catalogue entries.
- **Useful for the sector-coupled model:** the balance is the official reference for its demand rows (todo: compare the model's 2025 run with it).

## 2026-09-25: sector-coupled pathway 2030 → 2040 → 2050 (first pass, daily steps)

Barton asked for sector-coupled runs for 2040/2050.
- **Setup** (`pypsa_tw/config/scenarios/sector_path_2050.yaml`):
  - myopic chain on a new run `tw_path2050_w2013_6b`;
  - starts from the official 2030 fleet;
  - CO₂ cap on a straight line from the model's 2025 level (258.9 Mt) to 0 in 2050;
  - Taiwan demand rows: electricity and electronics +2.5%/yr, other demand flat (`pypsa_tw/data/build_sector_growth_tw.py`);
  - CO₂ storage 40 Mt/yr; EV shares 5/45/85%;
  - new nuclear at the Lungmen and Maanshan buses.
- **PyPSA-Earth fixes needed to make the chain meaningful** (each commented "Taiwan fork"):
  - `add_existing_baseyear.py`: new-build names clashed with existing plants grouped in the base year's bin ("TW0 1 CCGT-2030"). PyPSA then dropped the whole Link table on reading, leaving no heat or gas plants, and the solve was infeasible.
  - `add_brownfield.py`: existing plants never retired, because every horizon's prenetwork is rebuilt from today's fleet. They now retire at build year + lifetime; hydro and pumped hydro are kept.
  - `solve_network.py`: the land-use limit subtracted base-year existing capacity from its own generator, which cut the planned 2030 offshore wind from 9.3 to 1.3 GW at TW0 1.
  - `prepare_sector_network.py`: converting the existing biomass plants created an unlimited zero-carbon biomass supply at 7.4 €/MWh. The 2050 run burned 1,400 TWh of it against a 40 TWh potential.
  - `prepare_transport_data_input.py`: Taiwan is missing from the vehicle data (0 cars, no EV chargers), so all EV demand was shed. New `transport_data_override` option, set to 7.2 million cars.
  - `add_electricity.py`: new nuclear had no bus once no nuclear plant was left (`nuclear_candidate_sites`).
- **Offshore wind:** AC covers sites up to 60 km from shore and DC beyond 60 km, since Taiwan's farms lie 35–60 km out.
- **Result (24 h steps):**

  | Year | System cost | Net CO₂ | CO₂ price |
  | --- | --- | --- | --- |
  | 2030 | €10.4 bn/yr | 195 Mt | – |
  | 2040 | €12.5 bn/yr | 102 Mt | €51/t |
  | 2050 | €65.5 bn/yr | net zero | about €1,040/t |

  - Solar reaches its land-use potential (106 GW including rooftops), and wind reaches 78 GW.
  - The rest comes from 41 GW of new nuclear (the model has no limit per site), plus 27 Mt of direct air capture, 95 TWh of hydrogen from electrolysis and CO₂ storage at its 40 Mt limit.
- **Solve times:** about 1–2 minutes per horizon with Gurobi (local research run). A full chain from seeded electricity inputs takes about 25 minutes.
- **Page:** a "Pathway to net zero" section on `docs/sector-draft.html` (data `docs/data/sector_pathway.json`, exporter `export_sector_pathway`).
- **Next:**
  - a 4-hour rerun;
  - sensitivities: a nuclear limit (e.g. the sandbox's 5 plants), floating offshore wind, lower demand growth;
  - rerun the 2025 reference with the Taiwan demand rows and car numbers.

TODO:
 - to run PyPSA-Earth Taiwan!
