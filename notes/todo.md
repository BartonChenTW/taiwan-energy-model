# this is the TODO list for PyPSA-Earth/Taiwan

aim:
 - stage 1: make the PyPSA-Earth/Taiwan runable for today's (2025) energy system, and make sure the results make sense
 - stage 2: vistulise the key/all of input/output data of today's model
 - stage 3: implement updated/customised input data
 - stage 4: run/test future scenarios

Framework:
 - test the model with predefined config files (under pypsa_tw/confg), from simple to complicated
 - a review ipynb (`pypsa_tw/viewer/simulation_viewer.ipynb`) is defined
 - a raw input viewer ipynb (`pypsa_tw/viewer/raw_input_viewer.ipynb`) is defined

Simulation runs: see SIMULATION_TABLE.md

Rule:
 - new finding or key changes are logged in 'log.md'



## Phase 1: baseline model (today's 2025 energy system runs, results make sense)

1. [x] run test 1 with today's configuration (no expansion for RE and load shedding) and see why some doesn't work (bus TW1 0 and TW2 0 are isolated)
   - Completed 2026-07-23: `tw_test1_highs_2013_7d_4h_6b` has a solved result and uses fixed current-system settings.
   - Finding: `TW1 0` and `TW2 0` are inherited from disconnected OSM/base-network subnetworks before final clustering. See `pypsa_tw/log.md`.
2. [x] why two buses in TW are isolated?
   - Answer: they came from disconnected OSM/base-network subnetworks and were preserved by clustering before the Test 1 config fix.
3. [x] solve the bus isolated issue for Test 1 clustering
   - Completed 2026-07-23: added `cluster_options.simplify_network.p_threshold_merge_isolated: false` and `s_threshold_fetch_isolated: 0.05` to both Test 1 configs.
   - Verified after rerunning `tw_test1_gurobi_2013_7d_4h_6b`: `elec_s.nc`, `elec_s_6.nc`, and the prepared solve network each have one connected component and no isolated buses.
4. [x] does the gurobi solver work?
   - Answer: yes, `results/tw_test1_gurobi_2013_7d_4h_6b/networks/elec_s_6_ec_lcopt_Co2L-4H.nc` was produced after the Test 1 Gurobi run.
5. [ ] with no RE and load shedding extendable, can bus TW0 meet demand? Check whether the remaining issue is feasibility/capacity rather than physical connectivity.
   - 2026-09-23: after the isolated-bus fix, `tw_test1_highs` and `tw_test1_gurobi` both solve on 1 connected subnetwork with no load shedding, so the earlier problem was connectivity. Not yet conclusive: the cutout ends 2013-03-06, so 6 of 42 snapshots have renewables at full availability, and lines are still extendable (`ll: copt`). Rerun with a full-year cutout and `ll: ["v1.0"]`.
6. [ ] what is the performance difference between Gurobi and Highs?
   - Test 1 (2026-09-23): identical results (objective `8.18958195e+09`). Solver-only time HiGHS `0.06 s` vs Gurobi `0.09 s`; rule wall time `8.57 s` vs `9.95 s`. Too small to separate them, so compare on the full-year Test 2.
7. [ ] rerun `tw_test2_highs_2013_fullyear_4h_6b` with valid weather data
   - 2026-09-23: rerun with the isolated-bus fix completed (1 subnetwork, no load shedding, `20.7 s`), but the result is invalid. `cutouts/cutout-2013-era5-tw.nc` covers only 2013-03-01 to 03-06, so 98% of snapshots have renewable `p_max_pu = 1.0` (solar capacity factor 98.6%).
8. [ ] build a full-year 2013 Taiwan cutout (ERA5 via CDS), then rerun Test 1 (both solvers) and Test 2
9. [ ] fix the transmission grid for current-system runs: set `scenario.ll: ["v1.0"]` in the Test configs. The default `copt` lets lines expand, and Test 2 added 4.4 GW.
10. [ ] add a check that the cutout time range covers the snapshots, so a short cutout can't silently set renewables to full availability again


## Phase 2: visualise input/output data of today's model

1. [x] create raw input viewer for PyPSA Taiwan
   - Completed 2026-07-23: `pypsa_tw/viewer/raw_input_viewer.ipynb` now shows raw OSM inputs, base-network CSVs, PyPSA network elements, renewable profiles, busmaps, isolated-bus counts, and per-network bus maps.
   - Helper functions are consolidated in `pypsa_tw/viewer/viewer_helper.py`.
2. [x] update the GitHub Page to show the latest results (in both English and Traditional Chinese for Taiwan)
   - Completed 2026-07-23: refreshed `docs/index.html` and `docs/assets/results-data.js`.
3. [ ] run more runs and check the results, then put them on the GitHub Page!
4. [ ] review input data, time series
   - demand profiles per bus (annual total, peak, daily and seasonal shape)
   - renewable availability `p_max_pu` for solar, onwind, offwind and ror, with capacity factors
   - hydro inflow and storage
   - check that the cutout time range covers the snapshots (see Phase 1 #10)
5. [ ] review input data, technology
   - cost data: capital cost, marginal cost, efficiency, lifetime, CO2 intensity per carrier
   - power plant fleet: capacity by carrier and bus, commissioning year
   - transmission lines: capacity, length, voltage
6. [ ] review results data
   - installed capacity, generation mix and capacity factors by carrier
   - dispatch time series
   - electricity prices by bus
   - line loading and expansion
   - emissions and system cost
   - side-by-side comparison between runs


## Phase 3: implement updated/customised input data

(not started)


## Phase 4: run/test future scenarios

(not started)


NOTE:
 - [2026-07-23] it seems gurobi can run
