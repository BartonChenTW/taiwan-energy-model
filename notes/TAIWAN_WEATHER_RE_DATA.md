# Taiwan Weather and Renewable Energy Potential Data

Technical reference documenting Taiwan's ERA5 reanalysis weather cutouts (2013 and 2018), seasonal/diurnal solar–wind complementarity, extreme lull (Dunkelflaute) and typhoon cut-out events, PyPSA-Earth/Atlite 5-carrier technical potential, spatial exclusion rules, and official county-level solar approvals. Published interactively on [`docs/weather-re.html`](../docs/weather-re.html) from [`docs/data/weather_re_data.json`](../docs/data/weather_re_data.json) (exported by [`viewer/export_weather_re_data.py`](../viewer/export_weather_re_data.py)).

---

## 1. ERA5 Weather Cutouts: 2013 vs. 2018 (`0.3° × 0.3°`, 8,760 h/yr)

Source: `era5_hersbach2020` via `atlite_hofmann2021` (`cutout-2013-era5-tw.nc`, `cutout-2018-era5-tw.nc`, Taiwan summary box `119.3–122.3°E`, `21.7–25.5°N`).

| Metric (Taiwan Box) | 2013 (Base Model Year) | 2018 (Comparison Year) | Difference / Note |
| --- | ---: | ---: | --- |
| 100 m mean wind speed (annual) | **6.93 m/s** | **6.62 m/s** | 2018 was ~4.5% wind-weaker |
| 100 m mean wind — Winter (Nov–Feb) | **8.43 m/s** | **8.19 m/s** | Driven by NE monsoon |
| 100 m mean wind — Summer (Jun–Sep) | **5.66 m/s** | **5.59 m/s** | SW monsoon / summer doldrums |
| Changhua offshore cell (`120.0°E, 24.0°N`) | **9.52 m/s** (P90 `17.82`) | **9.30 m/s** (P90 `17.98`) | Matches MOEA/ITRI `9–10+ m/s` |
| Solar GHI (annual mean / sum) | **184.6 W/m²** (`1,617.3 kWh/m²/yr`) | **187.7 W/m²** (`1,644.3 kWh/m²/yr`) | Direct share `63.2%` vs. `64.5%` |
| 2 m air temperature (mean / min / max) | **22.67 °C** (`0.5` / `34.6 °C`) | **22.92 °C** (`-5.1` / `33.8 °C`) | Warmer mean in 2018 |
| Surface runoff (annual sum) | **509.5 mm/yr** | **461.1 mm/yr** | Drier in 2018 |
| High-wind hours (`>=25 m/s` at 100 m) | **87 h** (peak `42.13 m/s`, `2013-09-21 11:00 UTC`) | **31 h** (peak `37.33 m/s`, `2018-07-10 21:00 UTC`) | Typhoons Usagi (2013) & Maria (2018) |

*Note on wind direction:* Atlite stores `wnd_azimuth` as the wind flow vector direction (`toward` S/SW during the NE monsoon: at `120.0°E, 24.0°N`, `S` = `38.1%` and `SW` = `29.3%` of hours in 2013 with mean speeds `11.26–11.49 m/s`).

---

## 2. Seasonality, Solar–Wind Complementarity & Extreme Lulls

### 2.1 Solar–Wind Complementarity (Pearson `r`)

Taiwan's winter NE monsoon wind peaks when winter solar irradiance dips, while summer midday solar peaks during the calmer SW monsoon:

| Pair | Monthly `r` (2013) | Monthly `r` (2018) | Hourly `r` (2013) | Hourly `r` (2018) |
| --- | ---: | ---: | ---: | ---: |
| Solar vs. Offshore Wind DC | **-0.502** | **-0.573** | -0.086 | -0.096 |
| Solar vs. Offshore Wind AC | **-0.496** | **-0.600** | -0.071 | -0.087 |
| Solar vs. Onshore Wind | **-0.436** | **-0.559** | -0.039 | -0.051 |

### 2.2 Worst Wind + Solar Lulls (Dunkelflaute, 50/50 Solar + Offshore DC Index)

| Year | Window | Period (UTC) | Solar CF | Offshore DC CF | Offshore AC CF | Combined 50/50 CF |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| **2013** | 24 h (1 day) | `2013-05-11 15:00` → `2013-05-12 14:00` | 8.1% | 2.0% | 1.2% | **5.1%** |
| **2013** | 72 h (3 days) | `2013-05-11 00:00` → `2013-05-13 23:00` | 10.4% | 3.0% | 2.7% | **6.7%** |
| **2013** | 168 h (7 days) | `2013-05-07 14:00` → `2013-05-14 13:00` | 12.3% | 6.7% | 5.9% | **9.5%** |
| **2018** | 24 h (1 day) | `2018-02-27 18:00` → `2018-02-28 17:00` | 9.8% | 3.6% | 10.5% | **6.7%** |
| **2018** | 72 h (3 days) | `2018-09-05 07:00` → `2018-09-08 06:00` | 14.1% | 0.6% | 0.6% | **7.4%** |
| **2018** | 168 h (7 days) | `2018-08-04 21:00` → `2018-08-11 20:00` | 15.7% | 1.3% | 1.6% | **8.5%** |

Notably, Taiwan's worst multi-day lulls occur either during **May Mei-Yu plum rain fronts** (2013: both low solar and calm winds) or **August–September summer doldrums** (2018: offshore wind CF collapsing to `0.6–1.3%` for 3–7 days during peak cooling demand).

---

## 3. Five-Carrier Technical Potential & Spatial Exclusion Rules

Computed via `build_renewable_profiles` (`tw_test2_highs_2013_fullyear_4h_6b`, `tw_weather2018_highs_fullyear_4h_6b_ls`, and `tw_path2050_D_w2013_6b` for `offwind-float`) using Copernicus LC100 (`copernicus_lc100_2019`), WDPA protected areas (`wdpa`), GEBCO 2025 bathymetry (`gebco_2025`), and Marine Regions EEZ v11 (`marineregions_eez_v11`).

| Carrier | Turbine / Panel | Density | Depth / Shore / Buffer | Potential (GW) | CF 2013 / 2018 | Potential (TWh/yr, 2013) |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| **`solar`** | `CSi` (`latitude_optimal`, ×`0.8543`) | 4.6 MW/km² | Eligible LC100 (`20,30,40,50,60,90,100`), excl. WDPA | **39.44** | 13.2% / 13.3% | **45.6** |
| **`onwind`** | `Vestas_V112_3MW` | 3.0 MW/km² | 1,000 m urban buffer (`code 50`), excl. WDPA | **42.45** | 11.6% / 10.9% | **43.1** |
| **`offwind-ac`** | `NREL_ReferenceTurbine_5MW_offshore` | 2.0 MW/km² | Depth `<=50 m`, shore `<=30 km`, excl. WDPA | **12.38** | 36.3% / 34.4% | **39.4** |
| **`offwind-dc`** | `NREL_ReferenceTurbine_5MW_offshore` | 3.0 MW/km² | Depth `<=50 m`, shore `>=30 km`, excl. WDPA | **37.94** | 52.9% / 48.8% | **175.8** |
| **`offwind-float`** | `NREL_ReferenceTurbine_5MW_offshore` | 2.0 MW/km² | Depth `50–1,000 m` (Taiwan fork), excl. WDPA | **230.61** | 50.0% / — | **1,010.1** |
| **`hydro`** | 30 existing plants (HydroBASINS L6) | — | ERA5 runoff inflow normalized to national hydro | ~2.1 GW (+2.6 PHS) | — | **4.36** |

- **Fixed-bottom offshore wind (`AC + DC`):** `50.32 GW` (`215.2 TWh/yr` in 2013, `199.3 TWh/yr` in 2018).
- **Floating offshore wind (`50–1,000 m`):** `230.61 GW` (`1,010.1 TWh/yr` in 2013), added in `sector_path_2050_D_float_geothermal.yaml`, unlocking deep-water EEZ wind exceeding 3.5× Taiwan's current total electricity consumption.

---

## 4. Official County Solar Approvals (2015–2025) & 2050 Policy Targets

From `data/official/moeaea_solar_approvals_by_county_kW.csv` (`moeaea_solar_approvals_county`, `downloaded`): cumulative 2015–2025 approvals across all 22 counties total **20,989.2 MW**, heavily concentrated in southwestern Taiwan:

1. **Tainan City (臺南市):** `4,879.5 MW` (`23.2%`)
2. **Changhua County (彰化縣):** `2,665.7 MW` (`12.7%`)
3. **Yunlin County (雲林縣):** `2,363.0 MW` (`11.3%`)
4. **Pingtung County (屏東縣):** `2,128.5 MW` (`10.1%`)
5. **Chiayi County (嘉義縣):** `1,996.7 MW` (`9.5%`)

Official 2050 Net-Zero targets (`ndc_2050_wind_solar`, `ndc_2050_geothermal`, `ndc_2050_forward_energy`): **Solar PV 40–80 GW** (`50–100 TWh/yr`), **Offshore Wind 40–55 GW** (fixed + floating), **Geothermal 3.0–6.2 GW** (against `30–40 GW` MOEA/ITRI theoretical onshore potential), **Biomass 1.4–1.8 GW**, and **Ocean Energy 1.3–7.5 GW**.
