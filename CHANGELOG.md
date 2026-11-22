# Changelog

All notable milestones of the **Taiwan Energy System Model (`taiwan-energy-model`)** are documented here.
Release tags for this repository use the `tem-vX.Y.Z` prefix (to remain distinct from inherited upstream PyPSA-Earth `v0.x.y` tags), while `model.lock` pins the companion `BartonChenTW/pypsa-earth` fork commit.

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
