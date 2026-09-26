# Taiwan power plant data

`build_custom_powerplants.py` builds `data/custom_powerplants.csv` (powerplantmatching format) from official sources.

```powershell
python pypsa_tw/data/build_custom_powerplants.py
```

To use it, set these in the Taiwan config:

```yaml
electricity:
  custom_powerplants: replace   # use only this file, not powerplantmatching
  # The default filter keeps only DateIn <= 2023, which would drop the 2025 placeholders and the 2026 Taichung units.
  powerplants_filter: (DateOut >= 2026 or DateOut != DateOut) and (DateIn <= 2026 or DateIn != DateIn)
  estimate_renewable_capacities:
    stats: false                # no IRENA top-up of solar and wind
```

## Sources

| File | Source | Used for |
| --- | --- | --- |
| `official/taipower_units_20260924.json` | Taipower, *real-time generation by unit, including purchased power* ([data.gov.tw/dataset/8931](https://data.gov.tw/dataset/8931)), snapshot 2026-09-24 15:10. Government Open Data License v1. | Installed capacity of every unit, including IPPs |
| `official/moeaea_solar_approvals_by_county_kW.csv` | Energy Administration, *solar PV approvals by county and year* ([data.gov.tw/dataset/16423](https://data.gov.tw/dataset/16423)), 2015–2025. Transcribed from the PDFs in `official/moeaea_solar_approvals_by_county_pdfs_20251120.zip`; each year's county sum matches the published total. | Geographic shares for solar |
| `official/osm_power_plants_tw_20260924.json` | OpenStreetMap, all `power=plant` in Taiwan (Overpass API, 2026-09-24). ODbL. | Plant coordinates |
| `data/gadm/gadm41_TWN/gadm41_TWN.gpkg` | GADM 4.1, level 2 (counties) | A representative point per county for solar |
| `taipower_plant_mapping.csv` | Written by hand | Taipower plant name → fuel type, technology, storage hours, coordinates and coordinate source |
| `plant_names_zh.csv` | Written by hand | Chinese plant names for the website: Taipower and IPP plant names, the labels of Taipower's unit list, developers' offshore wind project names, and the MOEA thermal schedule for planned units (`basis` column). County rows (solar, biomass) are named by rule in `export_model_data.py`. |

Coordinates not found in OpenStreetMap come from the powerplantmatching list the model already used, or, for Greater Changhua 2b and Chung-Neng, from [thewindpower.net](https://www.thewindpower.net/). The `coord_source` column records which.

## Result (snapshot 2026-09-24)

| Technology | GW |
| --- | --- |
| Gas (CCGT 26.03, OCGT 0.18), including 3.9 GW of new units in trial operation | 26.21 |
| Coal | 11.36 |
| Oil (Hsieh-ho 1.00, Taichung gas turbines 0.28) | 1.28 |
| Solar PV | 15.39 |
| Offshore wind | 3.38 |
| Onshore wind | 0.81 |
| Hydro (reservoir 0.65, run-of-river 1.46) | 2.11 |
| Pumped hydro (Mingtan, Takuan II), 6 h | 2.60 |
| Batteries | 0.85 |
| **Total** | **64.00** |

Without the new units the total is 60.10 GW; Taipower gives 59.8 GW for the 2025 Taipower system. Nuclear is 0: no reactor is in the list.

**New units in trial operation** (`supplementary_units.csv`): Taipower shows them as "-", but they were generating at the snapshot. They are added with ratings from news sources:
- Taichung new CC #1 and #2, 1,300 MW each ([CNA 2026-09-04](https://www.cna.com.tw/news/afe/202609040200.aspx): "about 2,600 MW" for the pair).
- Hsinta new CC #3, 1,300 MW ([e-info.org.tw](https://e-info.org.tw/node/243153)).

Hsinta new CC #2 (0 MW at the snapshot) is listed but not included.

## Effect on the full-year run (2026-09-24 diagnostics)

Test 2 (2013 weather, 4H, 6 buses, fixed grid), with load shedding allowed so that any shortfall shows up as unserved energy:

| | powerplantmatching fleet, demand scale 0.86 | this file, demand scale 0.86 | this file, demand scale 0.749 | Taipower system 2024 |
| --- | --- | --- | --- | --- |
| Demand | 288.7 TWh | 288.7 TWh | 250.9 TWh | 251.4 TWh |
| Peak (4H average) | 47.5 GW | 47.5 GW | 41.4 GW | 40.9 GW (net peak) |
| Gas | 21% | 51% | 46% | 47.2% |
| Coal | 55% | 35% | 40% | 31.1% |
| Nuclear | 15% | 0% | 0% | 8.2% (0 since May 2025) |
| Renewables | 9% | 12% | 14% | 11.9% |
| Unserved | 0.41 TWh | 4.60 TWh | 0.83 TWh (peak 1.6 GW, Jun–Aug; 0 with `s_max_pu: 1.0`) | 0 |

The first three columns are without the new gas units in trial operation. With them (the current file), the scale-0.749 results are the same: 834.9 GWh unserved, gas 46%, coal 40%, renewables 14%.

**Demand must match the fleet's scope.** This file is Taipower's system, including purchased power. So demand should be scaled to Taipower-system generation, 251.44 TWh in 2024 (scale 0.749), not to the national total. **To confirm:** 251.44 TWh (excluding wheeling) comes from a search summary; I could not open a Taipower page stating it. It agrees with 2023's implied 247.3 TWh (coal 83.6 TWh at a 33.8% share, [e-info.org.tw](https://e-info.org.tw/node/238379)) and with 2023 sales of 233 TWh. The national total of 288.6 TWh also covers industrial self-generation, such as Mailiao, which is not in this file. With scale 0.749 the model peak is 41.4 GW, against Taipower's official net peak of 40,882 MW in 2024 and 40,752 MW in 2025 (`official/taipower_peak_load_by_year.csv`, [data.gov.tw/dataset/8307](https://data.gov.tw/dataset/8307)).

**The remaining shortfall is transmission, not generation.** The unserved energy sits at the Taipei bus (`TW0 1`: 87 TWh demand, 3.8 GW local generation). In every snapshot with shedding, the aggregated corridor `TW0 1`–`TW0 4` is at its limit of 0.7 × 13.93 GW = 9.75 GW, while 5.3 GW of gas capacity elsewhere is unused.
- Adding the 3.9 GW of new gas units left the unserved energy unchanged at 834.9 GWh.
- With lines allowed their full rating (`lines.s_max_pu: 1.0`), the full year has **no unserved energy**.

Two caveats:
- The 6-bus clustering lumps Taipei's several 345 kV corridors into one line.
- `s_max_pu: 0.7` is pypsa-earth's default N-1 security margin.

An earlier note said "no line at its limit, so it is a capacity shortfall". That was wrong: the check compared flows with the full rating `s_nom`, not with `s_max_pu × s_nom`.

**Coal still runs at a 100% capacity factor.** Taichung units under environmental shutdown or reduced output ("環保停機", "友善降載減排") are not modelled.

## Assumptions to check

- **Units shown as "-"** (34 units): 3 new gas units in trial operation are added with sourced ratings (see above). The other 31 are left out, as in Taipower's own subtotals: Hsinta new CC #2, Talin #5, standby coal Hsinta #1–3, the nuclear sites' gas turbines, and new solar and offshore wind farms in trial.
- **Left out:** outlying-island units (316 MW; Penghu, Kinmen and Matsu are not on the main grid), purchased cogeneration (627 MW; no fuel or location published), and geothermal and biomass (68 MW).
- **Solar** (15.4 GW, 15.0 GW of it one "other purchased solar" entry) is spread over counties by their share of 2015–2025 approvals, excluding the islands, and placed at one point per county. Approvals (21.0 GW) are more than what was built, so they are used only as shares.
- **Pumped hydro:** 6 h at full load. The ten units can run 6 h at full load with Sun Moon Lake at 732 m ([e-info.org.tw](https://e-info.org.tw/node/231256)); this is also pypsa-earth's `PHS_max_hours` default.
- **Hydro technology** (reservoir or run-of-river) is a judgement per station: stations at a storage reservoir (Deji, Wanda, Sun Moon Lake, Feitsui, Shihmen, Tsengwen) are `Reservoir`, the rest `Run-Of-River`.
- **Commissioning years** (`DateIn`): 43 plants take theirs from powerplantmatching; solar gets each county's capacity-weighted approval year (2020–2022); the other 35 get a 2025 placeholder, marked in `datein_source`. In a single-year dispatch this only affects how plants are grouped, but it will matter for future-year runs, where retirement follows `DateIn` plus lifetime.
- **Batteries** (853 MW) have no published locations, so they sit at one assumed point in central Taiwan. Their storage duration comes from pypsa-earth's `electricity.max_hours.battery`, which defaults to 6 h. Taiwan's grid batteries are probably shorter; not checked.
- **沃南風** is assumed to be Greater Changhua 2b.
- **Onshore wind** is 0.81 GW in Taipower's list; IRENA's 2023 figure is higher. To use the official list only, set `electricity.estimate_renewable_capacities.stats: false`. Otherwise pypsa-earth adds the difference to IRENA, spread evenly across buses.
- **Snapshot date:** the list is a live snapshot (2026-09-24), not a 2025 annual figure. Refresh it by downloading the JSON again and rerunning the script.

## History, projections and targets (`taiwan_timeseries.csv`)

`build_timeseries.py` builds one table of Taiwan energy data by year: electricity, energy use in all sectors, and CO2 by sector. Each row has `kind` = `history`, `projection` or `target`, a `source_id` and a `locator`, plus the evidence. It has 2,342 rows in 131 series.

**Where each value comes from.** `sources.csv` is the registry of every source:
- original title and publisher, edition, publication date;
- the landing page and the direct file URL;
- the local copy with its SHA-256 checksum, the access date and the evidence level.

`build_timeseries.py` stops if a local copy no longer matches its checksum. The `locator` says where in the source a value is. Projections and targets give the table or section with its printed page and PDF page, e.g. "Table 3-2, p. 20 (PDF p. 24)". History gives the column of the downloaded file. The website shows this under every chart and in a reference list. The main sources:

| source_id | Source | Used for |
| --- | --- | --- |
| `moea_psd_fy2024` | 經濟部《全國電力資源供需報告 113年度》 (MOEA National Power Supply-Demand Report FY2024, prepared by the Energy Administration; 2024 actuals, outlook 2025–2034), [data.gov.tw/dataset/16437](https://data.gov.tw/dataset/16437) | Night peak and capability (Table 3-2, p. 20), renewable targets (Table 3-1, p. 19), thermal plan (Figure 3-3, p. 18), demand growth 1.7%/yr (Section 3.1, p. 7), renewable-share targets (Section 3.2(1), p. 11), storage (Section 3.2(5), p. 17) |
| `moea_psd_fy2025_press` | MOEA news release on the 114年度 report (2026-06); the full report was not yet published | 2026–2035 outlook: +2.5%/yr, about 26 GW new gas |
| `smctw_2026_outlook` | Science Media Center Taiwan article (secondary; search summary) | 2026–2035 night-peak growth 2.7%/yr, **to verify** |
| `ndc_2050_pathway` | 國發會《臺灣2050淨零排放路徑及策略總說明》 (2022-03) | 2050 renewable share 60–70%, **to verify** (PDF blocked by bot protection) |
| `gegis_ssp2_26` | GEGIS (Mattsson et al., 2021) in the PyPSA-Earth data bundle | PyPSA-Earth default demand projection (a model projection, not an official forecast) |
| `derived_moea_growth` | Computed here | 1.7%/yr applied to 2024 generation (not published by anyone) |

The full table:

| Kind | Content | Source (in `official/`) |
| --- | --- | --- |
| history | Generation by source, 2005–2025 (national; Taipower + IPPs) | `moeaea_generation_by_source_annual.csv` ([16481](https://data.gov.tw/dataset/16481)) |
| history | Capacity by source, 2005–2025 (national) | `moeaea_capacity_by_source_annual.csv` ([16480](https://data.gov.tw/dataset/16480)) |
| history | Renewable shares, grid emission factor, CO₂, load factor, line losses, import dependence, 2005–2025 | `moeaea_energy_indicators_annual.csv` ([8308](https://data.gov.tw/dataset/8308)) |
| history | Peak load and reserve margin, 1982–2025 | `taipower_peak_load_by_year.csv` ([8307](https://data.gov.tw/dataset/8307)) |
| projection | Night peak, night net peak capability, night reserve margin, 2025–2034; demand growth; new gas capacity | `taiwan_projections_targets.csv`, from the MOEA report PDF ([16437](https://data.gov.tw/dataset/16437), Table 3-2) |
| target | Renewable capacity by technology for 2030 and 2032; renewable share 20% (Nov 2026), 30% (2030), about 65% (2050); grid storage | same, Table 3-1, plus the NDC 2050 pathway |
| projection | PyPSA-Earth default demand (GEGIS SSP2-2.6) for 2030, 2040 and 2050 | `data/ssp2-2.6/<year>/era5_2013/Asia.csv` |
| projection (derived) | The report's 1.7%/yr growth applied to 2024 generation | computed |
| history | Energy use by sector (industry, transport, residential, services, agriculture, non-energy use, energy sector own use), each sector by fuel, transport by mode and fuel, industry by branch, 2005–2025, TWh | `moeaea_energy_balance_toe_1982_2025.xlsx` (Energy Administration, 能源統計年報 table 3-02) |
| history | CO2 from fuel combustion by sector, direct and with electricity allocated to users, 1990–2025 | `moeaea_co2_by_sector_1990_2025.csv`, transcribed from the two `moeaea_co2_by_sector_*.pdf` tables |
| history | Household electricity by appliance, whole year and summer, 2024 survey | `moeaea_household_electricity_by_appliance_2024.csv` (Residential Sector Energy Statistics 2024, Figures 12–13) |

The report's Table 3-2 was checked after transcription: each year's reserve margin equals capability ÷ peak − 1. The Table 3-1 renewable targets add up to the stated totals.

**Energy use in all sectors (added 2026-09-25):**
- **Energy balance.** One sheet per year (1982–2025) with rows for flows and sectors and columns for products, in toe (1 toe = 10^7 kcal = 11.63 MWh; electricity at 860 kcal/kWh).
  - The builder reads it by label, not by row number. The 2018 revision moved residential and non-energy use from items 94/95 to 101/102.
  - Labels are NFKC-normalised: some sheets use the compatibility character U+F9BE for 料.
  - Checks: each year's sectors add up to final consumption (item 33), and each sector's fuels to its total.
- **Breaks in the series:**
  - 2018: new industry classification, electricity counted at 860 kcal/kWh, revised heat statistics (heat to industry jumps from 13 to 22 TWh).
  - Solar thermal (solar water heaters) is no longer compiled from 2022, because it fell below the statistics' materiality threshold (compilation notes, item 6).
- **CO2 by sector.** The two one-page tables (A1.1 direct, A2.1 with electricity allocated) were transcribed from the PDF text layer.
  - Every year's sectors add up to the table total.
  - The 2025 total (239.5 Mt) equals the energy-indicators file.
  - The PDF text garbles the column headers. The order (energy, industry, transport, agriculture, services, residential) was confirmed from the balance: services burn more oil and gas than homes, which gives 4.5 Mt direct CO2 for services and 3.5 Mt for homes.
- **Households.**
  - Appliance shares come from the Energy Administration / ITRI 2024 survey: 1,800 households, face to face.
  - Equipment ownership comes from DGBAS 2025 and is used in the key figures.
  - The survey PDF (20 MB) is not committed; its checksum is in `sources.csv`.
- **What is missing:**
  - service-sector end uses, e.g. the cooling share: the non-productive energy audit report is a candidate;
  - the electric-vehicle stock (MOTC registrations, candidate);
  - a direct split of heating and cooling, which the balance does not have.

**Two editions of the supply-demand report:**
- The downloaded PDF is the **113年度 (FY2024) report**, published in 2025: 2024 actuals, 2025–2034 outlook, demand +1.7%/yr, night peak +2.1%/yr. Earlier notes called it the "2025 edition".
- The **114年度 (FY2025) report** has so far only a news release (2026-06). It raises growth to +2.5%/yr for 2026–2035, with about 26 GW of new gas. The night-peak growth of +2.7%/yr comes from a secondary article (`smctw_2026_outlook`), not from MOEA directly.

**Checks against the official files:** these confirmed several figures taken earlier from search summaries: national generation 2024 of 289.4 TWh, capacities, emission factors and renewable shares. The key-facts table now marks them as downloaded.

The 2024 Taipower-system figure of 251.44 TWh used for demand calibration is still unconfirmed. The official data puts Taipower + IPPs at 243.2 TWh and the national total at 289.4 TWh. 251.44 fits between them if Taipower's purchases from self-generators are included.

## Future fleets, 2030 and 2034 (`build_future_powerplants.py`)

```powershell
python pypsa_tw/data/build_future_powerplants.py
```

This writes `data/custom_powerplants_tw2030.csv` and `data/custom_powerplants_tw2034.csv`. Each starts from today's file and applies the MOEA National Power Supply-Demand Report 113年度 (`moea_psd_fy2024`, [16437](https://data.gov.tw/dataset/16437)).

**Thermal plan.** `official/moea_thermal_schedule_2024_2034.csv` is Figure 3-3 of the report (p. 18; PDF p. 22), transcribed unit by unit with the month of each addition or retirement.
- The transcription adds up to the report's own totals for 2025–2034: +25,163 MW added and −12,941 MW retired. The script checks both.
- A unit counts for model year Y if it is in service on 1 July of Y, i.e. at the summer peak. A unit retiring in December of Y still counts for Y.
- Units already in today's fleet (`in_base_fleet = yes`, e.g. Tatan #7–9 and the new Taichung/Hsinta units) are not added again. Retirements of units no longer in the fleet (Mailiao coal, Chang Sheng) are skipped.
- Coordinates come from OpenStreetMap, as for today's fleet. Mailiao CC uses the Mailiao plant (w583660049).
- **Assumption:** the two "新增燃氣電源" units (2032 and 2033, 1,300 MW each) have no site in the report. They are placed at Tatan, the northern load centre.

**Renewables.** The Table 3-1 targets apply; the 2032 targets are held for 2034:

| | 2030 | 2034 |
| --- | --- | --- |
| Solar | 31.2 GW | 32.7 GW |
| Offshore wind | 10.9 GW | 13.9 GW |
| Onshore wind | 0.979 GW | 0.979 GW |
| Hydro | 2.14 GW | 2.18 GW |

- These targets are national, and they are applied to the Taipower-system fleet.
- Existing solar, wind and conventional hydro rows are scaled to the targets, so new capacity goes where today's capacity is: solar follows the county approval shares, offshore wind follows today's farms in Changhua and Yunlin.
- Pumped hydro (2.60 GW) and batteries (0.85 GW) stay as they are.

**Geothermal and biomass** are new rows at the target values: 1.2 and 0.81 GW in 2030, 1.4 and 0.84 GW in 2034.
- **Assumption:** geothermal sits at Qingshui (Yilan). Biomass and waste are split evenly over the six special municipalities.
- Their costs come from technology-data: geothermal has zero marginal cost, biomass about 16 EUR/MWh. So both run at base load.

Nuclear stays at 0.

| GW | Today | 2030 | 2034 |
| --- | --- | --- | --- |
| Gas (CCGT + OCGT) | 26.21 | 32.58 | 42.24 |
| Coal | 11.36 | 9.71 | 6.41 |
| Oil | 1.28 | 1.28 | 0.28 |
| Solar | 15.39 | 31.20 | 32.70 |
| Wind (offshore + onshore) | 4.19 | 11.88 | 14.88 |
| Hydro incl. pumped hydro | 4.72 | 4.74 | 4.78 |
| Geothermal | 0 | 1.20 | 1.40 |
| Biomass and waste | 0 | 0.81 | 0.84 |
| Batteries | 0.85 | 0.85 | 0.85 |
| **Total** | **64.00** | **94.25** | **104.38** |

`future_fleet_summary.csv` has the same table. To use a file, set `electricity.custom_powerplants_file` (the Snakefile now reads this key, defaulting to `data/custom_powerplants.csv`); see `pypsa_tw/config/scenarios/future_*.yaml`.
