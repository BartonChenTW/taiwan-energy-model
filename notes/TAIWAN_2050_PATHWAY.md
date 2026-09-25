# Taiwan's 2050 net-zero pathway in PyPSA-Earth

The sector-coupled pathway (`sector_path_2050.yaml`) reaches net zero in 2050 mostly with new
nuclear (about 41 GW). Taiwan's official pathway has no nuclear. It relies on options that
PyPSA-Earth's sector model lacks. This note records how this fork adds those options and how
the official pathway is run. The website summary is the "model gaps" panel on
`docs/sector-draft.html`.

## Official targets used

All figures come from the approved key-strategy action plans (核定本, April 2023), which are
downloaded to `pypsa_tw/data/official/` and registered in `pypsa_tw/data/sources.csv`.

| Item | 2050 target | Source (PDF page) | In the model |
| --- | --- | --- | --- |
| Power mix | renewables 60–70%, hydrogen 9–12%, thermal with carbon capture 20–27% | power system and storage plan, p. 3, quoting the NDC pathway (2022) | `official_mix` only |
| Offshore wind | 40–55 GW, moving toward floating | wind/solar plan, p. 10 | total bound, 2050 |
| Solar | 40–80 GW (50–100 TWh/yr) | wind/solar plan, p. 15 | total bound, 2050 |
| Geothermal | 3–6.2 GW | forward-energy plan, p. 6 | total bound, 2050 (max in every year) |
| Biomass, ocean | 1.4–1.8 GW, 1.3–7.5 GW | forward-energy plan, p. 6 | not bounded; ocean not modelled |
| Hydrogen | imported as well as domestic (liquid hydrogen by ship) | hydrogen plan, pp. 5, 8 | imports at a fixed price |
| Ammonia | 800 MW coal–ammonia co-firing by 2030 (KPI) | hydrogen plan, p. 6 | imports; cracked to hydrogen |
| Storage | batteries 5.5 GW by 2030; later targets to be set | power system and storage plan, p. 15 | not bounded |
| Road transport | 100% electric new cars and scooters in 2040 | EV plan, p. 22 | as in `sector_path_2050.yaml` |
| CO₂ storage | 2030 CCUS 1.7–4.6 Mt/yr; no 2050 volume in the plan's text | CCUS plan, p. 19 | 40 Mt/yr as before, still to verify |
| Nuclear | none | NDC pathway | new nuclear capped at 0 |

## What the fork adds

In `scripts/prepare_sector_network.py`, `add_taiwan_power_options` reads `sector.taiwan_power`.
Every option can be built at every node.

- **`CCGT CC`** is a stand-alone gas combined cycle with post-combustion capture. It uses the CCGT row
  of the cost file with NETL's ratios for an H-class NGCC with 95% capture (Baseline Rev. 4a):
  - investment × 2.041 (1,980 vs 970 $/kW);
  - efficiency × 0.885 (54.0% vs 61.0% LHV).

  95% of the CO₂ goes to the CO₂ store, which shares the 40 Mt/yr limit with direct air capture
  and industry. The other 5% goes to the atmosphere.
- **`H2 CCGT`** is a hydrogen-fired combined cycle at the CCGT cost and efficiency. Until now the only
  hydrogen-to-power option was fuel cells, with a 10-year life.
- **`NH3 import`** brings in ammonia at a fixed landed price, 100 €/MWh LHV (to verify). The existing
  ammonia cracker can turn it into hydrogen.
- **`NH3 CCGT`** is ammonia-fired power. It is optional and off, because no sourced efficiency was
  found.
- Hydrogen imports (`sector.hydrogen_import`, already added for sensitivity C) cost 90 €/MWh
  (to verify).

In `scripts/solve_network.py`:

- `solving.options.capacity_total_MW` bounds the total capacity of a group of carriers.
  - Bounds are `min` and `max`, either in MW or as `{planning horizon: MW}`.
  - Earlier horizons' builds count towards the total.
  - Links count their electric output.
- `solving.options.generation_share` bounds each group's share of annual generation, by horizon.
  The shares are of the groups' combined generation.

## Runs

Both runs reuse sensitivity D's electricity network, which has floating offshore wind and
geothermal:

```bash
B="--configfile pypsa_tw/config/config_tw_test2_highs.yaml pypsa_tw/config/scenarios/sector_path_2050.yaml pypsa_tw/config/scenarios/sector_path_2050_D_float_geothermal.yaml"
S=pypsa_tw/config/scenarios
python -m snakemake -j 1 solve_sector_networks_myopic $B $S/sector_path_2050_official.yaml $S/solver_gurobi_local.yaml --rerun-triggers mtime
python -m snakemake -j 1 solve_sector_networks_myopic $B $S/sector_path_2050_official.yaml $S/sector_path_2050_official_mix.yaml $S/solver_gurobi_local.yaml --rerun-triggers mtime
```

- **official** (`sector_path_2050_official.yaml`): the official options and 2050 capacity ranges, no
  new nuclear, least cost otherwise.
- **official_mix** (`+ sector_path_2050_official_mix.yaml`): the same, plus the official 2050 power
  mix as generation-share bounds.

Each run takes about 10 minutes (3 horizons, daily steps, Gurobi).

## Still open

- The 2050 CO₂ storage volume: 40 Mt/yr comes from a search summary and is not in the CCUS plan's
  text.
- The 2050 electricity demand of the official pathway. The model uses its own demand
  (+2.5%/yr for electricity and electronics).
- Import prices for hydrogen and ammonia, which should be run at a low and a high value.
- Retrofitting existing gas and coal plants with capture. Only new CCGT CC is offered.
- Energy security of the import-based route. Imported hydrogen and ammonia raise blockade
  exposure; this should be compared with the nuclear route on the energy-security page.
