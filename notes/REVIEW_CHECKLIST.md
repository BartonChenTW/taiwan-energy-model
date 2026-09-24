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
- [ ] **Report transcription** (`official/taiwan_projections_targets.csv`): Tables 3-1 and 3-2 of the 113年度 supply-demand report were typed in by hand. The consistency checks pass, but a second look at the PDF (`official/moea_power_supply_demand_report_20260609.pdf`, printed pp. 19–20, PDF pp. 23–24) would help.
- [ ] **Which outlook to use for future scenarios:** the 113年度 report (+1.7%/yr, full PDF) or the 114年度 report (+2.5%/yr, news release only so far).
- [ ] **2023 night peak (36,146 MW)** is derived: the 2024 value minus the reported increase.

## Future-year scenarios (`pypsa_tw/data/build_future_powerplants.py`, `pypsa_tw/config/scenarios/`)

- [ ] **Figure 3-3 transcription** (`official/moea_thermal_schedule_2024_2034.csv`): typed from the chart image on p. 22 of the report. The totals match, but check the unit names and months, and the `in_base_fleet` flags (which units are already in today's list).
- [ ] **Sites of the two "新增燃氣電源" units** (2032 and 2033, 1,300 MW each): the report gives no site; they are placed at Tatan.
- [ ] **Geothermal and biomass locations:** geothermal all at Qingshui (Yilan); biomass split evenly over the six special municipalities. They also run at a capacity factor of about 100%, which is high for geothermal.
- [ ] **Renewable targets are national** but applied to the Taipower-system fleet and demand. This is one reason the model's renewable share (35.8% in 2030) is above the 30% target.
- [ ] **Offshore wind growth follows today's farms** (Changhua, Yunlin). Round 3 zones are elsewhere too (e.g. Hsinchu, Miaoli).
- [ ] **Demand growth:** the 113年度 report's +1.7%/yr is used. The 114年度 report says +2.5%/yr (news release only), which would give about 290 TWh in 2030.
- [ ] **Model-year rule:** a unit counts if it is in service on 1 July of the model year.

## Sources (`pypsa_tw/data/sources.csv`)

- [ ] **NDC 2050 pathway (60–70% renewables):** from a search summary. The PDF blocks scripted downloads (HTTP 403); download it by hand into `pypsa_tw/data/official/`, check the figure and page, then set `evidence`, `local_file` and `sha256` in `sources.csv`.
- [ ] **Night-peak growth 2026–2035 (2.7%/yr):** from a secondary article (Science Media Center Taiwan), not MOEA. Replace it with the MOEA 114年度 report when it is published on data.gov.tw/dataset/16437.
- [ ] **Titles of the MOEA news release and the SMC article** are not recorded (left empty rather than guessed). Add them from the pages.
- [ ] **Publication date of the 113年度 report:** the text cites data of 2025-08-15, and the open-data file was updated 2026-06-09. The exact publication date is not in the PDF.

## Sandbox (`pypsa_tw/sandbox/`)

- [ ] **Levers and ranges** (`levers.py`):
  - add 0–20 GW solar/offshore, 0–10 GW onshore/battery/CCGT;
  - new nuclear 0–5 GW;
  - coal retired 0–100%;
  - CO2 cap 30–100% of base emissions;
  - demand 0.9–1.3×; gas/coal price 0.5–2×;
  - line rating 0.5–1.0.
- [ ] **Nuclear restart capacities** come from OpenStreetMap `plant:output:electricity`: Chinshan 1,208 MW, Kuosheng 1,896 MW, Maanshan 1,780 MW. Check them against Taipower's ratings. Other assumptions: availability 0.9 (constant), technology-data marginal cost, and no restart cost in the system cost.
- [ ] **Where additions go:**
  - solar and wind in proportion to each bus's remaining technical potential;
  - batteries and CCGT in proportion to peak demand by bus (which favours Taipei);
  - new nuclear at the Lungmen site; restarts at their own sites.
- [ ] **New batteries:** 4 h, 0.96 charge and discharge efficiency (technology-data inverter). The base network's existing battery has an efficiency of 1.0 (a pypsa-earth default), i.e. lossless; this is worth fixing in the fleet.
- [ ] **System cost** = operating cost + annualised investment (technology-data 2030, 7.1% discount rate) of the added capacity. The load-shedding penalty (1,000 EUR/MWh) is in the objective but not in the system cost.

## Website pages

- [ ] **About page** (`docs/about.html`):
  - The text is drafted from the public GitHub profile (bio "Scientist for Energy Systems Modelling", Empa, Zurich/Taipei) and the parts of LinkedIn visible without login ("postdoctoral researcher … energy system analysis and energy storage", University of Birmingham 2016–2021, University of Exeter).
  - Titles and dates behind the LinkedIn login were not used.
  - Check the wording, add a degree or role if you want, and replace the GitHub avatar if you prefer another photo.
- [ ] **Request form:** create a Formspree or Web3Forms form and set `FORM` in `docs/assets/request.js`. Until then, the form shows "not switched on yet".
- [ ] **Challenges page:** the model results quoted there are from the central sandbox scenarios (2013 weather). Update them if the model changes.
