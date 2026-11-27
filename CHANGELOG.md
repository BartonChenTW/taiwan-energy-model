# Changelog

All notable milestones of the **Taiwan Energy System Model (`taiwan-energy-model`)** are documented here.
Release tags for this repository use the `tem-vX.Y.Z` prefix (to remain distinct from inherited upstream PyPSA-Earth `v0.x.y` tags), while `model.lock` pins the companion `BartonChenTW/pypsa-earth` fork commit.

## [Unreleased]

### Added
- **`setup.sh`:** one-command setup for a new machine. It clones the model fork next to this
  repository at the `model.lock` commit, creates the conda environment from the matching lock file,
  checks the Copernicus key and disk space, writes `.tem-env.sh` (`$PY`, `$M`, `$C`), and dry-runs
  Test 1; `--run-test` also runs it.

### Changed
- **README:** opens with "What do you want to do?" (see results, use the Taiwan data, run the model,
  sandbox, contribute) and a short "run the model" section. GETTING_STARTED, CONTRIBUTING and
  AGENTS point to `setup.sh`.

## [tem-v0.3.0] - 2026-11-24

### Added
- **Track B1 — High-resolution grid & 345 kV cutset diagnostics (`docs/grid.html`, `config/scenarios/clusters_12.yaml`):**
  - Added 12-region spatial resolution scenario overlay (`config/scenarios/clusters_12.yaml`).
  - Exported latitudinal cutset analysis (`Taipei Basin 24.95°N`, `Central→North 24.65°N`, `South→Central 23.50°N`) comparing OSM `elec.nc` (`345 kV` vs `161/69 kV`), a 12-subregion clustering of 79-bus `elec_s.nc`, and the 6-region sandbox grid (showing how `6 nodes` collapses Taipei Basin imports to `3,053 MVA` / `2,137 MW` usable vs. `9,250 MVA` / `6,475 MW` usable at `12 nodes`).
- **Track B2 — Hydro drought, 2018 weather & calibrated onshore wind stress tests (`docs/weather-re.html`, `config/scenarios/calibrated_onwind.yaml`):**
  - Added `"drought"` (`-50%` hydro/RoR inflow) and `"tw_wind"` (`+27%` clustered onshore wind toward `28.5%` MOEA FiT benchmark) variants in `sandbox/levers.py` & `sandbox/run_scenario.py`, plus `config/scenarios/calibrated_onwind.yaml` (`correction_factor: 2.38` for unclustered ERA5 national potential with physical cap clip at `1.0`).
- **Track B3 — Sub-national LNG terminal & northbound pipeline disruption modeling (`sandbox/levers.py`, `sandbox/run_scenario.py`, `docs/grid.html`):**
  - Added `"yongan_lng"` (`-58%`), `"taichung_lng"` (`-28%`), `"guantang_lng"` (`-14%`), and `"subsea_gas_pipeline"` regional damage sites in `DAMAGE_SITES`, splitting Taiwan gas supply into South/Central/North pools connected by figure-8 trunk pipelines during blockades while preserving all existing single-pool hashes.

### Fixed
- **Track A1 (`data/check_data.py`):** Registered all 8 unregistered files in `data/official/`, linked `moeaea_household_appliances_2024` to its transcribed CSV, and added Taipower URL to `taiwan_key_facts.csv` (`68 sources checked: 0 errors, 0 warnings`).
- **Track A2 (Model fork):** Patched OSM `way/1331526157` (`690000 -> 69000` V) in `scripts/clean_osm_data.py` and clipped `correction_factor` capacity factors at `<= 1.0` in `scripts/build_renewable_profiles.py` (documented in `FORK_CHANGES.md` and `model.lock`).
- **Track A3 (Sector pathway diagnostics):** Explained why 2050 ×1 synthetic-oil import runs pin `CO2Limit` dual at `467 €/t` (`120 €/MWh ÷ 0.2571 tCO₂/MWh`) and exposed `co2_stored_price_EUR_t` and load-weighted `elec_price_EUR_MWh` across all pathways in `viewer/export_dashboard_data.py` and `docs/assets/sector-pathway.js`.

## [tem-v0.2.0] - 2026-11-22

### Added
- Detailed **Taiwan weather and renewable energy (RE) potential** dataset, exporter (`viewer/export_weather_re_data.py` -> `docs/data/weather_re_data.json`), technical note (`notes/TAIWAN_WEATHER_RE_DATA.md`), and dedicated interactive website tab (`docs/weather-re.html` + `docs/assets/weather-re.js`).
- ERA5 2013 vs. 2018 spatial weather maps (100 m wind speed, winter vs. summer monsoon shift, solar GHI & direct/diffuse split, 2 m temperature, runoff, wind roses), diurnal & seasonal solar–wind complementarity, 30-plant hydro inflow, Dunkelflaute & typhoon high-wind cut-out analysis, 5-carrier technical potential (`solar`, `onwind`, `offwind-ac`, `offwind-dc`, `offwind-float`), Copernicus/GEBCO/WDPA exclusion rules, and 22-county official solar PV approvals (2015–2025).
- Repository release tagging convention (`tem-vX.Y.Z`) and `CHANGELOG.md`.

## [tem-v0.1.0] - 2026-11-22

### Added
- Detailed **Taiwan electrical grid and energy network data** (`notes/TAIWAN_GRID_DATA.md`, `viewer/export_grid_data.py` -> `docs/data/grid_data.json`, and dedicated `docs/grid.html` + `docs/assets/grid.js` tab): Taipower 345/161/69 kV transmission & substation stats, 2005–2025 MOEA line losses & load factors, OpenStreetMap (`734` substations, `1,876` lines, `253` cables) vs. PyPSA-Earth `elec.nc`/`elec_s_6_ec.nc` analysis (including root-cause identification of Hualien `690 kV` Bus `91` from OSM `way/1331526157`), 10-Year Grid Resilience Plan (`NT$564.5B`), 345 kV trunk upgrades, storage & smart-grid KPIs, and all 7 LNG terminals + figure-8 gas pipeline corridors & fuel stockpiles.
- Unified two-row navigation header across all website pages (consistent Row 1 `Pages` tabs + Row 2 `Sections` anchors inside `.topbar`).
- Updated and cross-linked project log (`notes/log.md`) and roadmap (`notes/todo.md`) across `README.md`, `AGENTS.md`, `GETTING_STARTED.md`, and `notes/GITHUB_PAGES.md`.

### Fixed
- Resolved `.status.info` CSS class collision with the `17px` `.info` tooltip icon and aligned `.tile` child classes on `docs/grid.html`.
- Ignored low-voltage `<1,000 V` tags (e.g., `750 V` traction, `220 V`) when parsing OSM kV tiers in `viewer/export_grid_data.py`.

## [pre-split-2026-09] - 2026-09-26

- Baseline state before splitting the Taiwan study repository (`taiwan-energy-model`) from the PyPSA-Earth model fork (`BartonChenTW/pypsa-earth`, commit `82cfd1a2`).
