# Review checklist

Items Claude decided or assumed without your confirmation. Tick them off, or note a correction, when you have time. Details and sources are in `pypsa_tw/data/README.md` and `pypsa_tw/log.md`.

## Power plant fleet (`data/custom_powerplants.csv`, added 2026-09-24)

- [ ] **Hydro technology per station**: reservoir or run-of-river (column `technology` in `pypsa_tw/data/taipower_plant_mapping.csv`). Reservoir: Deji, Wanda, Takuan I, Chukung, Feitsui, Shihmen, Tsengwen. All others are run-of-river.
- [ ] **Pumped hydro storage: 6 h** for Mingtan and Takuan II. Source: [e-info.org.tw](https://e-info.org.tw/node/231256), which says the 10 units can run 6 h at full load with Sun Moon Lake at 732 m.
- [ ] **Batteries (853 MW)**: one assumed location in central Taiwan (24.15 N, 120.65 E), and pypsa-earth's default 6 h storage. Taiwan's grid batteries are probably shorter.
- [ ] **沃南風 = Greater Changhua 2b**: assumed. Coordinates from thewindpower.net.
- [ ] **New gas units in trial operation**, added with sourced ratings (`pypsa_tw/data/supplementary_units.csv`):
  - Taichung new CC #1 and #2, 1,300 MW each: [CNA 2026-09-04](https://www.cna.com.tw/news/afe/202609040200.aspx) gives "about 2,600 MW" for the pair.
  - Hsinta new CC #3, 1,300 MW: [e-info.org.tw](https://e-info.org.tw/node/243153); unit 1 is listed at 1,300.0 MW.
  - Hsinta new CC #2 is **not** included (not generating at the snapshot).
- [ ] **Left out**: outlying-island units (316 MW), purchased cogeneration (627 MW, no fuel or location published), geothermal and biomass (68 MW), and other "-" units (standby coal Hsinta #1–3, new solar and offshore wind farms in trial).
- [ ] **Solar spread by county** using 2015–2025 approvals (21.0 GW approved against 15.4 GW installed), one point per county.
- [ ] **Commissioning years**: 35 plants have a 2025 placeholder (`datein_source` column). This matters later for future-year runs (retirements).
- [ ] **Snapshot date**: the fleet is a live 2026-09-24 snapshot, not a 2025 annual figure.

## Demand

- [ ] **Scale 0.749**: demand calibrated to Taipower-system generation of **251.44 TWh (2024)**. I could not open a Taipower page stating this figure; it came from a search summary. It agrees with 2023's implied 247.3 TWh ([e-info.org.tw](https://e-info.org.tw/node/238379)).
- [ ] **Demand profile shape**: GEGIS 2030 profile, scaled. The 4H-average peak is 41.4 GW, against Taipower's official net peak of 40,882 MW (2024).

## Model settings

- [ ] `estimate_renewable_capacities.stats: false`: solar and wind come only from the official list, with no IRENA top-up.
- [ ] `powerplants_filter` allows `DateIn <= 2026`, for the new Taichung units.
- [ ] Transmission fixed at today's grid (`ll: v1.0`).
- [ ] **Line limit `s_max_pu: 0.7`** (pypsa-earth default, an N-1 margin). It is what makes the full year infeasible: the single aggregated line into Taipei binds at 9.75 GW. With 1.0 the full year solves. Decide whether 0.7 is right for Taiwan's 345 kV grid, or whether to test with more buses first.
- [ ] **Two Taichung coal units** are to be dismantled from October 2026 (CNA 2026-09-04). They are still in the fleet, because the snapshot predates that.

## MOTEL records (`pypsa_tw/data/motel/`)

- [ ] Attribute names and scope labels are raw staging values, before MOTEL harmonisation. Check them if you plan to submit the records to the MOTEL database.

## Taiwan energy data page (`docs/taiwan-data.html`)

- [ ] **12 key figures marked "To verify"** (14 confirmed from official downloads on 2026-09-24) in `pypsa_tw/data/taiwan_key_facts.csv` come from search summaries. Check them against the linked source (ideally the Energy Administration statistics database) and change `evidence` to `page_opened` or `downloaded`.
- [ ] **Catalogue content and notes are in English only**; dataset names are bilingual.
- [ ] **Report transcription** (`official/taiwan_projections_targets.csv`): Tables 3-1 and 3-2 of the 2025 supply-demand report were typed in by hand. The consistency checks pass, but a second look at the PDF (`official/moea_power_supply_demand_report_20260609.pdf`, pp. 19–20) would help.
- [ ] **Which outlook to use for future scenarios:** the 2025 edition (+1.7%/yr, full PDF) or the 2026 edition (+2.5%/yr, press release only).
- [ ] **2023 night peak (36,146 MW)** is derived: the 2024 value minus the reported increase.
