# Taiwan Electrical Grid and Energy Network Data

Reference note documenting Taiwan's transmission/distribution system, OpenStreetMap representation, PyPSA-Earth 6-region simplification, resilience/storage programmes, and LNG/fossil fuel supply networks. Visualised on [`docs/grid.html`](../docs/grid.html) from [`docs/data/grid_data.json`](../docs/data/grid_data.json) (exported by [`viewer/export_grid_data.py`](../viewer/export_grid_data.py)).

---

## 1. Official Transmission & Substation Inventory

Source: `taipower_transmission_stats` (`search_summary` of Taipower operating/sustainability statistics — direct subpage URL and report year to confirm in `notes/todo.md`).

- **Transmission lines:** **18,782 circuit-km** total (overhead + underground, across 345 kV, 161 kV, and 69 kV).
- **Distribution lines:** **444,649 circuit-km**.
- **Underground transmission cables (subset of transmission):**
  - 345 kV: **122.591 circuit-km**
  - 161 kV: **3,451.525 circuit-km**
  - 69 kV: **1,869.180 circuit-km**
  - Total underground transmission cables: **5,443.296 circuit-km**
- **Substations in service: 627 sites** across four tiers:

| Tier | Name | Primary/Secondary Voltage | Official Count | Role |
| --- | --- | --- | ---: | --- |
| **E/S** | Extra-high voltage (超高壓變電所) | 345 / 161 kV | 37 | Link generation hubs & 345 kV north–south trunks to 161 kV |
| **P/S** | Primary (一次變電所) | 161 / 69 kV | 53 | Step 161 kV sub-transmission down to 69 kV |
| **D/S** | Distribution (一次配電變電所) | 161 / 22–11 kV | 257 | Direct 161 kV step-down for dense urban loads & science parks |
| **S/S** | Secondary (二次變電所) | 69 / 22–11 kV | 280 | Step 69 kV regional lines down to 22/11 kV feeders |

Open candidate dataset (`taipower_feeder_capacity`, `search_summary`): Taipower's Renewable Grid-Connection Portal and `data.gov.tw` county-level ZIP/CSV releases provide 11/22.8 kV distribution feeder remaining hosting capacities with TWD67 coordinates and 69/161 kV substation remaining capacity PDF tables.

---

## 2. Historical Line Losses, Load Factor & Peak Load (2005–2025)

Source: `moeaea_indicators_annual` (`downloaded`: `data/official/moeaea_energy_indicators_annual.csv`) cross-checked with `taipower_peak_annual` (`data/official/taipower_peak_load_by_year.csv`).

| Year | Peak Load (MW) | Average Load (MW) | Load Factor (%) | Line Loss Rate (%) | Reserve Margin (%) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2005 | 30,942.9 | 21,651.0 | 69.97% | 4.76% | 16.35% |
| 2013 (model weather yr) | 33,957.4 | 24,364.0 | 71.75% | 4.25% | 17.50% |
| 2022 | 40,592.6 | 28,752.9 | 70.83% | 3.82% | 12.19% |
| 2023 | 39,489.2 | 28,218.3 | 71.46% | 3.20% | 14.70% |
| 2024 | 40,881.6 | 28,966.7 | 70.86% | 2.93% | 11.00% |
| 2025 | 40,752.1 | 29,499.2 | 72.39% | 3.19% | 14.20% |

System line losses fell steadily from **4.76%** in 2005 to **2.93%** in 2024 and **3.19%** in 2025, while the system load factor averaged roughly 70–73.6% over the period.

---

## 3. OpenStreetMap Input vs. PyPSA-Earth Model Topology

Run inspected: `tw_test2_highs_2013_fullyear_4h_6b` (`osm_grid_earth_osm`, `model_input` extracted 2026-07-17; `config/config_tw_test2_highs.yaml` sets `threshold_voltage: 35000`).

### 3.1 Raw OpenStreetMap Extract (`resources/<run>/osm/raw/`)

- **Substations (`all_raw_substations.csv`):** **734** features (`733` polygon areas + `1` node; **594** named).
  - Classified tiers (after ignoring <1 kV traction/LV tags such as `750 V` and `220 V`): **31 E/S**, **56 P/S**, **203 D/S**, **181 S/S**, **263 Other**.
  - Tagged placements (`tags.location`): `86 indoor`, `71 outdoor`, `7 underground`, `1 surface` (remainder untagged).
- **Lines & Cables (`all_raw_lines.csv` + `all_raw_cables.csv`):** **1,876** overhead lines + **253** cables (**247** underground + **6** subsea, including **台澎海纜** Taiwan–Penghu 161 kV cable); **502** named ways.
  - Route lengths by max tagged voltage: **345 kV: 2,227.1 km**, **161 kV: 2,250.1 km**, **69 kV: 1,308.5 km**, **unspecified: 1,728.0 km**, plus `0.2 km` at `11 kV` and `0.2 km` at `690 kV` (anomaly below).
  - Gap: OSM commonly omits multi-circuit (`tags.circuits`) and cable bundling tags, and omits distribution networks below 35 kV.

### 3.2 PyPSA-Earth Networks (`elec.nc`, `elec_s.nc`, `elec_s_6_ec.nc`)

- **`elec.nc` (pre-simplification base AC network):**
  - **193 buses:** `69 kV: 75`, `161 kV: 73`, `345 kV: 44`, **`690 kV: 1`** (anomaly).
  - **243 lines:** `161 kV: 101`, `69 kV: 74`, `345 kV: 68`.
  - **69 transformers:** `2,000 MVA` step connections linking stacked voltage layers at multi-voltage substations (`0` HVDC links in `elec.nc`).
  - **Graph connectivity:** `[186, 2, 2, 1, 1, 1]` connected components when including transformers (`28` separate components considering lines alone: `[43, 36, 26, 15, 15, ...]`).

#### Root Cause of Hualien `690 kV` Bus `91` Anomaly

In OpenStreetMap, way `1331526157` (**初英分歧線**, Chuying branch line near Hualien at `~121.521°E, 23.950°N`) carries `tags.voltage = "690000"` instead of `"69000"` (one extra zero). PyPSA-Earth's `clean_osm_data` transfers that voltage to endpoint nodes `1344` and `2875` (`690000`), which cluster into `elec.nc` **Bus `91`** (`lon = 121.5008`, `lat = 23.96`, `v_nom = 690.0 kV`, `substation_off = True`), bridged to 69 kV **Bus `90`** by artificial `2,000 MVA` transformer `transf_41_0`.

### 3.3 Six-Region Clustering (`elec_s_6_ec.nc`) vs. Operational Bottlenecks

PyPSA-Earth first simplifies `elec.nc` to **`elec_s.nc`** (**79 buses**, **130 lines**, scaling all lines to equivalent 380 kV ratings) and then clusters into **6 regions** (**`elec_s_6_ec.nc`**: 6 buses, 6 corridors, `s_max_pu = 0.7`, `v_nom = 380 kV`). Every `elec_s.nc` line sum matches `elec_s_6_ec.nc` via `linemap_elec_s_6.csv`:

| ID | Regions | Corridor | `s_nom` (MVA) | Usable `0.7×` (MW) | Length (km) | `elec_s` Lines | `elec.nc` Border Lines & kV Mix |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| `0` | `TW0 0 ↔ TW0 2` | Yunlin/Hualien ↔ Kaohsiung/Pingtung | 179.9 | 125.9 | 187.7 | 1 | `1` (`161 kV×1`) |
| `1` | `TW0 0 ↔ TW0 3` | Yunlin/Hualien ↔ Tainan/Chiayi | 13,310.0 | 9,317.0 | 110.2 | 7 | `8` (`345 kV×4, 161 kV×3, 69 kV×1`) |
| `2` | `TW0 0 ↔ TW0 5` | Yunlin/Hualien ↔ Taichung/Changhua | 15,673.9 | 10,971.8 | 68.5 | 5 | `7` (`345 kV×5, 161 kV×1, 69 kV×1`) |
| `3` | `TW0 1 ↔ TW0 4` | New Taipei/Taipei ↔ Taoyuan/Hsinchu | 13,926.7 | 9,748.7 | 70.9 | 4 | `9` (`345 kV×4, 161 kV×4, 69 kV×1`) |
| `4` | `TW0 2 ↔ TW0 3` | Kaohsiung/Pingtung ↔ Tainan/Chiayi | 10,406.5 | 7,284.5 | 123.6 | 3 | `8` (`345 kV×4, 161 kV×3, 69 kV×1`) |
| `5` | `TW0 4 ↔ TW0 5` | Taoyuan/Hsinchu ↔ Taichung/Changhua | 9,969.6 | 6,978.8 | 120.2 | 4 | `5` (`345 kV×3, 161 kV×2`) |

In Test 2 (`config_tw_test2_highs.yaml`), **Corridor 3 (`TW0 1 ↔ TW0 4`)** reaches its `9,748.7 MW` usable limit and binds summer northern supply (`834.9 GWh` unserved in Taipei). In actual Taipower operations, `ndc_2050_grid_storage` (PDF p. 22) reports a 2022 remaining **Central→North** transfer margin of only **104 MW** (and **South→Central 1,608 MW**) before trunk upgrades—highlighting why future modeling needs explicit operational stability/N-1 constraints beyond raw OSM thermal sums.

---

## 4. Resilience Plan, Trunk Upgrades, Storage & Smart Grid

### 4.1 10-Year Grid Resilience Strengthening Plan (`taipower_grid_resilience_2022`, `search_summary`)

Total investment **NT$564.5 billion** (2022–2032):
- **Force decentralisation (~NT$437.9B):** Direct power plant lines to science/industrial parks, local green-energy consumption, breaking up over-concentrated Longtan / Zhongliao / Longqi hubs, adding urban nodes (Daan, Wanlong), multi-tier dispatch.
- **Continuous strengthening (~NT$125.0B):** Aging line replacement & expansion, utility/grid storage, substation indoor conversion.
- **Strengthened defence (~NT$1.69B):** Protection relay defence-in-depth fault isolation and real-time insulation monitoring.

### 4.2 345 kV Trunk Upgrades & Renewable Corridors (`ndc_2050_grid_storage`, `moea_psd_fy2024`, `downloaded`)

- **345 kV trunk upgrades to 2030 (PDF p. 25):**
  - Trunk Line 1 (`超一路`: `龍潭~中寮段`, `龍崎(南)~仁武線`): `1,000 → 3,000 MW`
  - Trunk Line 2 (`超二路`: `龍潭~峨眉線`, `義和~中寮線`): `2,000 → 3,000 MW`
  - Trunk Line 3 (`超三路`: `竹園~中寮段`): `2,000 → 3,000 MW`
- **Renewable grid corridors (PDF pp. 23–25):** Offshore wind **7 stations / 7 lines** (`+11.0 GW`); Solar PV **9 stations / 10 lines** (`+6.5 GW`); **4 STATCOMs** (PDF p. 26).
- **Battery storage & pumped hydro:** **1.42 GW** built & grid-connected by July 2025 (`1.41 GW` AFC/E-dReg + `0.01 GW` behind-the-meter, `moea_psd_fy2024` p. 17), targeting **1.5 GW (2025)** and **5.5 GW (2030)** (`ndc_2050_grid_storage` PDF p. 15), plus new pumped hydro at **Guangming (光明)** and **Shimen (石門)**.
- **Demand response & smart grid KPIs:** **1,314 MW** DR achieved in 2024 (`934 MW` traditional + `380 MW` aggregator/E-dReg, `moea_psd_fy2024` p. 10); **AMI** `2.25M` (end-2022) → `3.0M` (2025) → `6.0M` (2030); **IEC 61850** digital substations `50` (2025) → `185` (2030); **FDIR** automated feeders `4,200 → 8,600`; **CDCC / ADCC / DDCC** hierarchical control (PDF pp. 30–35).

---

## 5. Natural Gas, Coal & Oil Supply Networks

Sources: `moea_psd_fy2024` (p. 15 / PDF p. 19, `downloaded`), `cpc_lng_network`, `moeaea_lng_safety_stock`, `taipeitimes_2022_coal_stock`, `gti_2022_stockpiles` (`search_summary`).

### 5.1 Seven LNG Receiving Terminals

| # | Terminal | Operator | Location | Tanks / Capacity Highlights | Subsea / Onshore Links | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Yongan (一接)** | CPC | Yongan, Kaohsiung | 6 tanks (~690k kL); Phase 5 +~400k kL; >12 Mt/yr design | Subsea Line #1 & new 36" ~233 km #2 to Tongxiao + western onshore trunk | Operating |
| 2 | **Taichung (二接)** | CPC | Taichung Port | 6 tanks (960k kL); Phase 3 +2×180k kL; Phase 4 plan | Central–north subsea/onshore links; tee backup with Taipower #5 | Operating / Expanding |
| 3 | **Guantang (三接)** | CPC | Datan, Taoyuan | Phase 1: 2×160k kL (320k kL); Phase 2 plan +6×180k kL | Feeds Datan PP + northern grid; backed by 2nd Tongxiao–Datan subsea pipe | Commissioning / Operating |
| 4 | **Xiehe (四接)** | Taipower | Keelung | 2 planned tanks (~160k–180k kL each) | Oil-to-gas conversion at Hsieh-ho CCGT (independent NE hub) | EIA approved |
| 5 | **Taichung Harbor (五接)** | Taipower | Taichung Port Outer | Phase 1: 5×160k kL (800k kL); Phase 2 +4 tanks | ~3 km onshore line to Taichung PP + planned 36" subsea link to Tongxiao | Under development |
| 6 | **Mailiao (六接)** | FPCC | Mailiao Port, Yunlin | Phase 1: 2×160k kL (up to 4 tanks full build) | South wharf (260k m³ ship) + plant onshore line to 2×1.2 GW Mailiao CCGT | Ground broken (target late 2029) |
| 7 | **Intercontinental (七接)** | CPC | Kaohsiung Port Phase 2 | Initial 4×180k kL (up to 6 tanks); Phase 1 ~6 Mt/yr | Dual 36" onshore lines to Talin PP + Dalinpu ring to Hsinta & Yongan | EIA approved (late 2024) |

### 5.2 Figure-8 Pipeline Topology, Coal/Oil Ports & Stockpiles

- **Gas pipeline network:** Paired **western subsea spine** (`Yongan–Tongxiao #1/#2`, `Taichung–Tongxiao`, `Tongxiao–Datan #1/#2`) and **western onshore trunk**, plus southern power-plant onshore ring (`Intercontinental–Talin–Nanpu–Hsinta–Yongan`), forming mutual north–south redundancy ("figure-8" network).
- **LNG statutory reserves (`moea_psd_fy2024` p. 15, `moeaea_lng_safety_stock`):** Safety stock rises from **7 d (2019)** → **8 d (2022)** → **11 d (2025)** → **14 d (2027)**; minimum tank volume capacity rises **16 d (2022–24)** → **20 d (2025–26)** → **24 d (2027+)**.
- **Coal & Oil:** Major coal import ports serve `Linkou` (2,400 MW), `Taichung` (5,500 MW + indoor coal domes), `Mailiao`, `Kaohsiung Talin/Hsinta`, and east-coast `Ho-Ping` (1,308.6 MW). Taipower coal stockpiles sit around **~41 days** (`taipeitimes_2022_coal_stock`, `search_summary`). Petroleum reserves operate via CPC Taoyuan, CPC Dalin, and FPCC Mailiao refineries under the Petroleum Administration Act (`>=60 d` industry + `>=30 d` government = `>=90 d` statutory; reported `>100–146 d`).

---

## 6. High-Resolution 12-Node Cutsets & Regional LNG Blockade Results (Added `tem-v0.3.0`)

- **Latitudinal 345/161/69 kV cutsets & 12-subregion clustering (`config/scenarios/clusters_12.yaml`, `viewer/export_grid_data.py`):**
  - *Taipei Basin (`24.95°N`):* Raw `elec.nc` carries `12` crossing lines (`17,627 MVA`, incl. `5 × 345 kV` `15,417 MVA`). Clustering to `6` nodes collapses this into `2,137 MW` usable (`3,053 MVA × 0.7`), causing artificial load shedding, whereas clustering `79`-bus `elec_s.nc` to `12` subregions restores `3` lines (`9,250 MVA` / `6,475 MW` usable) while explicitly separating Taipei-Keelung, Xizhi-Yilan, and Taoyuan-Hsinchu (`Tatan`).
  - *Central→North (`24.65°N`):* `7` lines (`13,413 MVA`, incl. `4 × 345 kV` `12,334 MVA`) in `elec.nc`; `4` lines (`9,970 MVA` / `6,979 MW` usable) at `12` nodes vs. Taipower's `104 MW` 2022 operational transfer margin.
  - *South→Central (`23.50°N`):* `19` lines (`12,539 MVA`) in `elec.nc`; `7` lines (`10,843 MVA` / `7,590 MW` usable) at `12` nodes vs. Taipower's `1,608 MW` 2022 operational transfer margin.
- **Sub-national LNG terminal & pipeline blockade stress tests (30-day summer blockade, `50%` LNG imports, `sandbox/levers.py`):**
  - *Baseline (intact national pool):* `3,126.7 GWh` unserved (`10,090 GWh` gas, incl. `6,879 GWh` in North `TW0 1`/`TW0 4`).
  - *Northbound subsea gas pipeline cut (`subsea_gas_pipeline`):* Total unserved stays `3,126.7 GWh` because the intact `345 kV` AC grid substitutes electricity transmission from South/Central plants while North gas dispatch drops from `6,879` -> `1,413 GWh`.
  - *Terminal outages:* `guantang_lng` (`-14%`) raises unserved energy to `4,539.3 GWh`; `taichung_lng` (`-28%`) to `5,951.9 GWh`; `yongan_lng` (`-58%`) to `8,978.9 GWh` (`2.87×` baseline).
