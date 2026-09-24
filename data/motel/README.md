# MOTEL staging records for Taiwan

Taiwan energy data collected for the PyPSA-Earth Taiwan model, stored in the Step 1 ("ingest") staging format of [MOTEL](https://github.com/uesl-empa/motel-platform), Empa's open technology database for energy system models.

| File | Records | Content |
| --- | --- | --- |
| `unmapped_entity/unmapped_entities_taiwan_fleet.yaml` | 12 | One per technology in the Taiwan fleet: installed capacity, every plant with location and commissioning year, pumped-hydro storage hours, ratings of new gas units |
| `unmapped_entity/unmapped_entities_taiwan_solar_approvals.yaml` | 22 | One per county: solar PV approvals per year, 2015–2025 |
| `unmapped_carrier_data/unmapped_carrier_data_taiwan_electricity.yaml` | 5 | Electricity: Taipower peak load and reserve margin 2020–2025, annual generation and generation mix (Taipower system and national) |
| `unmapped_entity/unmapped_entities_taiwan_capacity_history.yaml` | 15 | National capacity per technology by year, 2005–2025 (Energy Administration), plus the 2030 and 2032 targets from the MOEA supply-demand report |
| `unmapped_carrier_data/unmapped_carrier_data_taiwan_history_projections.yaml` | 4 | Electricity generation by source 2005–2025; peak load 1982–2025 and the night-peak, capability and reserve-margin outlook for 2025–2034; the PyPSA-Earth default (GEGIS) demand projection; emission factor and CO₂ 2005–2025; renewable share and other indicators with targets |

All records are `mapping_status: to_be_mapped`. The values are raw, with provenance, and have not been harmonised to MOTEL's controlled vocabularies. Statistics taken from search summaries are marked `confidence_level: to be verified`.

## Regenerate and validate

```powershell
python pypsa_tw/data/build_custom_powerplants.py
python pypsa_tw/data/build_timeseries.py
python pypsa_tw/data/export_motel.py
python pypsa_tw/data/motel/tools/validate_unmapped.py pypsa_tw/data/motel/unmapped_entity pypsa_tw/data/motel/unmapped_carrier_data --schema-dir pypsa_tw/data/motel/tools/schema --strict
```

## Vendored MOTEL files

`tools/validate_unmapped.py` and `tools/schema/unmapped_entity_{technology,carrier}.yaml` are copied unchanged from [uesl-empa/motel-platform](https://github.com/uesl-empa/motel-platform) at commit `e3c6a97680d6e51ad6931b5568f01666ea1cc035` (schema version 0.2.0). The validator is MIT-licensed; the schemas are CC BY 4.0. © the MOTEL authors (Empa, Urban Energy Systems Laboratory).
