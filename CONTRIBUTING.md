# Contributing to the Taiwan energy system model (TEM)

Contributions are welcome: Taiwan data and sources, checks of existing figures, model settings,
code, and corrections to the website or its Chinese text.

> **繁體中文摘要：** 最有幫助的貢獻是台灣能源資料：官方檔案、數據與出處，以及查證標示「待查證」的數字。
> 每筆資料都必須能追溯到來源（連結、頁碼或表號），並登記在 `data/sources.csv`。
> 提交前請執行 `python data/check_data.py`。問題與建議可用中文或英文開 issue。

## Ways to contribute

| You want to | Do this |
| --- | --- |
| Point out a source, an error or a missing figure | Open an [issue](https://github.com/BartonChenTW/taiwan-energy-model/issues/new/choose). The "Data source" form asks for everything needed. |
| Verify a figure marked "to verify" | Find the figure in the official document, then change its evidence to `downloaded` or `page_opened` and add the page or table (section 3.5) |
| Add data or fix a table | Send a pull request (section 2) |
| Change how the model works | Settings: `config/` here. Model code: the fork [BartonChenTW/pypsa-earth](https://github.com/BartonChenTW/pypsa-earth), branch `taiwan` (section 4) |
| Improve the website or its translation | `docs/` (section 5) |

## 1. Rules that apply to everything

- **Traceable:** every number must be traceable to a source. That means a link, plus the page,
  table or column where it appears.
- **No secrets or personal data:** no passwords, API keys or tokens, and no personal information.
  The repository and the website are public.
- **Only redistributable files:** commit a downloaded file only if its licence allows
  redistribution. Taiwan's Government Open Data License v1 and CC BY do; many journal PDFs and
  paywalled reports do not. When in doubt, register the link and leave the file out.
- **No model outputs:** `resources/`, `networks/` and `results/` stay in the model folder.
- **File size:** keep data files under 20 MB; `data/check_data.py` rejects files over 50 MB.

## 2. Workflow

1. **Fork and branch:** fork this repository on GitHub and create a branch named after the change,
   e.g. `data/moeaea-generation-2025`.
2. **Make the change** in small commits, each with a message that says what changed and why.
3. **Run the checks:**
   ```bash
   python data/check_data.py        # needs only Python and pandas
   ```
   - If you changed a table that a builder script produces, also run that script.
     `data/build_timeseries.py` needs the model folder next to this one.
   - If you changed the website, open it locally (`cd docs && python -m http.server`).
4. **Open a pull request.** The template has a short checklist, and the data checks run
   automatically on every pull request.
5. **Review:** a maintainer checks the sources. Figures are compared with the documents they cite.

## 3. Contributing data

### 3.1 Where the data lives

| File in `data/` | Content | Edited by |
| --- | --- | --- |
| `sources.csv` | **The source registry.** One row per document, dataset or web page. Everything else refers to it by `source_id`. | hand |
| `official/` | Downloaded official files, kept byte for byte (SHA-256 in `sources.csv`) | hand (download) |
| `taiwan_key_facts.csv` | Key figures shown on the website's Taiwan energy data page | hand |
| `taiwan_energy_catalog.csv` | Catalogue of Taiwan data sources (provider, content, format, licence) | hand |
| `taiwan_timeseries.csv` | History, projections and targets by year | **generated** by `build_timeseries.py`; do not edit by hand |
| `taipower_plant_mapping.csv` | Taipower unit names → plant, fuel, technology, coordinates and their source | hand |
| `supplementary_units.csv` | Units missing from Taipower's list (e.g. in trial operation), with a news or official source | hand |
| `plant_names_zh.csv` | Chinese name of every plant, with its basis | hand |
| `taiwan_cost_benchmarks.csv` | Taiwan cost figures (feed-in tariff parameters, Taipower costs) compared with PyPSA's | hand |
| `fleet/` | The power plant files the model reads | **generated** by `build_custom_powerplants.py` and `build_future_powerplants.py` |

### 3.2 Register the source first

Add a row to `data/sources.csv`:

| Column | What to write |
| --- | --- |
| `source_id` | Short, unique, lowercase with `_`: publisher, content and year, e.g. `moeaea_generation_annual` |
| `short_cite` | How the source is cited on the website, e.g. `Energy Administration, annual generation by source` |
| `title`, `title_en` | The original title (Chinese if it is Chinese) and an English translation |
| `publisher` | Chinese and English name, e.g. `經濟部能源署 Energy Administration` |
| `edition`, `published` | Edition or version (e.g. `114年度`, `snapshot 2026-09-24`), and the publication date |
| `landing_url`, `file_url` | The page that describes the source, and the direct file link (data.gov.tw pages are good landing URLs) |
| `local_file`, `sha256` | If the file is committed: its path under `data/` (e.g. `official/...`) and its SHA-256 (`sha256sum file`, or `python -c "import hashlib,sys;print(hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest())" file`) |
| `accessed` | The date you opened or downloaded it, `YYYY-MM-DD` |
| `license` | e.g. `Government Open Data License v1`, `CC BY 4.0` |
| `origin` | `taiwan` (Taiwanese source), `fork` (other source added by this project) or `pypsa-earth` (PyPSA-Earth's own data) |
| `evidence` | How far the figure has been checked (see 3.3) |
| `note` | What the source is used for, with page, table or column numbers |

### 3.3 Evidence levels

| `evidence` | Meaning | Website label |
| --- | --- | --- |
| `downloaded` | The official file was downloaded and the figure read from it | Downloaded |
| `page_opened` | The source page was opened and the figure read there | Page checked |
| `search_summary` | Taken from a search result or a secondary summary; **still to verify** | To verify |
| `derived` | Calculated by this project from other sources (say how in `note`) | Derived |
| `model_input`, `model_output` | A dataset the model uses as is, or a model result | Model input / Model output |

Never mark a figure `downloaded` or `page_opened` unless you have seen it in the source yourself.

### 3.4 Add the data

- **Official file:** save it to `data/official/`. Name it as publisher, content and date, in
  lowercase with `_`, e.g. `moeaea_generation_by_source_annual.csv` or
  `taipower_units_20260924.json`. Do not edit it after download; convert or clean it in a builder
  script instead. Register it in `sources.csv` with its SHA-256.
- **Key figure:** add a row to `taiwan_key_facts.csv`, with an English and a Chinese indicator
  name, value, unit, year, scope, source and evidence.
  - Scope matters: say whether a figure covers the whole country or only the Taipower system.
- **Time series:** extend `data/build_timeseries.py`. Read the official file, then emit rows with
  `row(series, en, zh, kind, year, value, unit, scope, source_id, locator=...)`.
  - `kind` is `history`, `projection` or `target`.
  - `locator` says where in the source the value is (sheet, table, column or page).
  - Then rerun the script.
- **Power plants:** correct `taipower_plant_mapping.csv` or `supplementary_units.csv`, then rerun
  `build_custom_powerplants.py`.
  - Coordinates: prefer an OpenStreetMap object, written as `OSM w123456`, `OSM r…` or `OSM n…`.
  - Add a Chinese name to `plant_names_zh.csv` for any new plant.
- **Units:** use SI or the unit of the source (MW, GWh, TWh, NT$/kWh, kt). Say which in the
  `unit` column; do not mix units within a series.

### 3.5 Verify a figure marked "to verify"

1. **Find the figure:** search `data/sources.csv` and `taiwan_key_facts.csv` for `search_summary`.
2. **Check it:** open the original document, preferably an official one, and find the figure.
3. **If it matches:** change `evidence`, add the page or table to `note` (or `locator`), and set
   `accessed`. If the licence allows, commit the file to `data/official/` with its SHA-256.
4. **If it differs:** correct the value, and say in the pull request what the old value was and
   where the new one comes from.

## 4. Model settings and code

- **Settings:** scenarios and model settings are YAML overlays in `config/scenarios/`, applied on
  top of `config/config_tw_test2_highs.yaml`.
  - Give a new overlay its own `run.name` or `run.sector_name`, so its outputs do not overwrite
    others.
  - Explain each setting in a comment with its source.
- **Model code:** changes to PyPSA-Earth itself go to the fork
  [BartonChenTW/pypsa-earth](https://github.com/BartonChenTW/pypsa-earth), branch `taiwan`, as a
  separate pull request.
  - Mark the change with a `Taiwan fork` comment and add it to `FORK_CHANGES.md` there.
  - Fixes that would help every PyPSA-Earth user belong upstream in
    [pypsa-meets-earth/pypsa-earth](https://github.com/pypsa-meets-earth/pypsa-earth).
- **Study code:** the sandbox (`sandbox/`), exporter (`viewer/`) and data builders (`data/*.py`)
  are here. Keep `python -m pytest sandbox/test_levers.py` passing.

## 5. Website

- **Pages:** `docs/` is the website, published by GitHub Pages from `main`. Page text is bilingual:
  every English span (`t-en`) has a Traditional Chinese twin (`t-zh`). Keep them in step.
- **Data files:** `docs/data/` is generated by `viewer/export_dashboard_data.py`. Do not edit it by
  hand; change the exporter or the data instead.
- **Public:** everything in `docs/` is public.

## Questions

Open an issue, in English or Chinese, or write to barton.chen.energy@gmail.com.
