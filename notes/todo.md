# this is the TODO list for PyPSA-Earth/Taiwan

aim: 
 - stage 1: make the PyPSA-Earth/Taiwan runable for today's (2025) energy system, and make sure the results make sense
 - stage 2: vistulise the key/all of input/output data of today's model
 - stage 3: implement updated/customised input data
 - stage 4: run/test future scenarios

Framework:
 - test the model with predefined config files (under pypsa_tw/confg), from simple to complicated
 - a review ipynb (taiwan_simulation_results.ipynb) is defined

Simulation runs: see SIMULATION_TABLE.md

Rule:
 - new finding or key changes are logged in 'log.md'


TODO:
1. [x] run test 1 with today's configuration (no expansion for RE and load shedding) and see why some doesn't work (bus TW1 0 and TW2 0 are isolated)
   - Completed 2026-07-23: `tw_test1_highs_2013_7d_4h_6b` has a solved result and uses fixed current-system settings.
   - Finding: `TW1 0` and `TW2 0` are inherited from disconnected OSM/base-network subnetworks before final clustering. See `pypsa_tw/log.md`.
2. [x] update the GitHub Page to show the latest results (in both English and Traditional Chinese for Taiwan)
   - Completed 2026-07-23: refreshed `docs/index.html` and `docs/assets/results-data.js`.


TO BE CHECK:
 - [] does the gurobi solver works?
 - [] with no RE and load shedding extendable, can bus TW0 meet demand? Check whether the remaining issue is feasibility/capacity rather than physical connectivity.


TO BE INVESTIGATE:
 - [] what is the performance difference between Gurobi and Highs
