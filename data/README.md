# Taiwan power plant data

`build_custom_powerplants.py` builds `data/custom_powerplants.csv` (powerplantmatching format) from official sources.

```powershell
python pypsa_tw/data/build_custom_powerplants.py
```

To use it, set these in the Taiwan config:

```yaml
electricity:
  custom_powerplants: replace   # use only this file, not powerplantmatching
  # The default filter keeps only DateIn <= 2023, which would drop the 2025 placeholders.
  powerplants_filter: (DateOut >= 2025 or DateOut != DateOut) and (DateIn <= 2025 or DateIn != DateIn)
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

Coordinates not found in OpenStreetMap come from the powerplantmatching list the model already used, or, for Greater Changhua 2b and Chung-Neng, from [thewindpower.net](https://www.thewindpower.net/). The `coord_source` column records which.

## Result (snapshot 2026-09-24)

| Technology | GW |
| --- | --- |
| Gas (CCGT 22.13, OCGT 0.18) | 22.31 |
| Coal | 11.36 |
| Oil (Hsieh-ho 1.00, Taichung gas turbines 0.28) | 1.28 |
| Solar PV | 15.39 |
| Offshore wind | 3.38 |
| Onshore wind | 0.81 |
| Hydro (reservoir 0.65, run-of-river 1.46) | 2.11 |
| Pumped hydro (Mingtan, Takuan II), 6 h | 2.60 |
| Batteries | 0.85 |
| **Total** | **60.10** |

Taipower gives 59.8 GW for the 2025 Taipower system. Nuclear is 0: no reactor is in the list.

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
| Unserved | 0.41 TWh | 4.60 TWh | 0.83 TWh (peak 1.6 GW, Jun–Aug) | 0 |

**Demand must match the fleet's scope.** This file is Taipower's system, including purchased power. So demand should be scaled to Taipower-system generation, 251.44 TWh in 2024 (scale 0.749), not to the national total. **To confirm:** 251.44 TWh (excluding wheeling) comes from a search summary; I could not open a Taipower page stating it. It agrees with 2023's implied 247.3 TWh (coal 83.6 TWh at a 33.8% share, [e-info.org.tw](https://e-info.org.tw/node/238379)) and with 2023 sales of 233 TWh. The national total of 288.6 TWh also covers industrial self-generation, such as Mailiao, which is not in this file. With scale 0.749 the model peak is 41.4 GW, against Taipower's official net peak of 40,882 MW in 2024 and 40,752 MW in 2025 (`official/taipower_peak_load_by_year.csv`, [data.gov.tw/dataset/8307](https://data.gov.tw/dataset/8307)).

**Remaining shortfall:** units Taipower shows as "-" were generating 4.5 GW at the snapshot, mostly new gas units in trial operation: Taichung CC #1–2 at 2.56 GW and Hsinta new CC #3 at 0.57 GW. Their ratings are not in the feed, so they are left out here. Including them would probably close the summer gap.

**Coal still runs at a 100% capacity factor.** Taichung units under environmental shutdown or reduced output ("環保停機", "友善降載減排") are not modelled.

## Assumptions to check

- **Units shown as "-"** (34 units: new units in trial operation, such as Taichung CC #1–2 and Hsinta new CC #2–3, and standby units such as Hsinta coal #1–3) are left out, as in Taipower's own subtotals.
- **Left out:** outlying-island units (316 MW; Penghu, Kinmen and Matsu are not on the main grid), purchased cogeneration (627 MW; no fuel or location published), and geothermal and biomass (68 MW).
- **Solar** (15.4 GW, 15.0 GW of it one "other purchased solar" entry) is spread over counties by their share of 2015–2025 approvals, excluding the islands, and placed at one point per county. Approvals (21.0 GW) are more than what was built, so they are used only as shares.
- **Pumped hydro:** 6 h at full load. The ten units can run 6 h at full load with Sun Moon Lake at 732 m ([e-info.org.tw](https://e-info.org.tw/node/231256)); this is also pypsa-earth's `PHS_max_hours` default.
- **Hydro technology** (reservoir or run-of-river) is a judgement per station: stations at a storage reservoir (Deji, Wanda, Sun Moon Lake, Feitsui, Shihmen, Tsengwen) are `Reservoir`, the rest `Run-Of-River`.
- **Commissioning years** (`DateIn`): 43 plants take theirs from powerplantmatching; solar gets each county's capacity-weighted approval year (2020–2022); the other 35 get a 2025 placeholder, marked in `datein_source`. In a single-year dispatch this only affects how plants are grouped, but it will matter for future-year runs, where retirement follows `DateIn` plus lifetime.
- **Batteries** (853 MW) have no published locations, so they sit at one assumed point in central Taiwan. Their storage duration comes from pypsa-earth's `electricity.max_hours.battery`, which defaults to 6 h. Taiwan's grid batteries are probably shorter; not checked.
- **沃南風** is assumed to be Greater Changhua 2b.
- **Onshore wind** is 0.81 GW in Taipower's list; IRENA's 2023 figure is higher. To use the official list only, set `electricity.estimate_renewable_capacities.stats: false`. Otherwise pypsa-earth adds the difference to IRENA, spread evenly across buses.
- **Snapshot date:** the list is a live snapshot (2026-09-24), not a 2025 annual figure. Refresh it by downloading the JSON again and rerunning the script.
