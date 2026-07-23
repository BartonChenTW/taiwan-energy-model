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


TODO:
1. [x] run test 1 with today's configuration (no expansion for RE and load shedding) and see why some doesn't work (bus TW1 0 and TW2 0 are isolated)
   - Completed 2026-07-23: `tw_test1_highs_2013_7d_4h_6b` has a solved result and uses fixed current-system settings.
   - Finding: `TW1 0` and `TW2 0` are inherited from disconnected OSM/base-network subnetworks before final clustering. See `pypsa_tw/log.md`.
2. [x] update the GitHub Page to show the latest results (in both English and Traditional Chinese for Taiwan)
   - Completed 2026-07-23: refreshed `docs/index.html` and `docs/assets/results-data.js`.
3. [x] solve the bus isolated issue for Test 1 clustering
   - Completed 2026-07-23: added `cluster_options.simplify_network.p_threshold_merge_isolated: false` and `s_threshold_fetch_isolated: 0.05` to both Test 1 configs.
   - Verified after rerunning `tw_test1_gurobi_2013_7d_4h_6b`: `elec_s.nc`, `elec_s_6.nc`, and the prepared solve network each have one connected component and no isolated buses.
4. [x] create raw input viewer for PyPSA Taiwan
   - Completed 2026-07-23: `pypsa_tw/viewer/raw_input_viewer.ipynb` now shows raw OSM inputs, base-network CSVs, PyPSA network elements, renewable profiles, busmaps, isolated-bus counts, and per-network bus maps.
   - Helper functions are consolidated in `pypsa_tw/viewer/viewer_helper.py`.
5. [] run more runs and check the results, then put them on the GitHub Page!

TO BE CHECK:
 - [x] why two buses in TW are isolated?
   - Answer: they came from disconnected OSM/base-network subnetworks and were preserved by clustering before the Test 1 config fix.
 - [x] does the gurobi solver works?
   - Answer: yes, `results/tw_test1_gurobi_2013_7d_4h_6b/networks/elec_s_6_ec_lcopt_Co2L-4H.nc` was produced after the Test 1 Gurobi run.
 - [] with no RE and load shedding extendable, can bus TW0 meet demand? Check whether the remaining issue is feasibility/capacity rather than physical connectivity.


TO BE INVESTIGATE:
  - [] what is the performance difference between Gurobi and Highs


NOTE:
 - [2026-07-23] it seems gurobi can run