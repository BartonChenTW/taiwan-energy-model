# Plan: separate the Taiwan work from the PyPSA-Earth fork

Status: proposal, 2026-09-26. Nothing has been moved yet.

## Why

This repository (`BartonChenTW/pypsa-earth`, branch `pypsa-taiwan-dev`) now holds four things
that change at different speeds:

| Part | Where | Changes |
| --- | --- | --- |
| Model code: PyPSA-Earth plus our patches | `scripts/`, `Snakefile`, `config.default.yaml`, six files in `data/` | Rarely; should follow upstream |
| Taiwan data collection | `pypsa_tw/data/` (23 MB with `official/`) | Often; its own sources and checksums |
| The study: configs, sandbox, exporter, notes | `pypsa_tw/config`, `sandbox`, `viewer`, `*.md` | Daily |
| Website | `docs/` (18 MB) | Daily; large regenerated JSON |

Keeping them together causes three problems:
- **Upstream sync:** PyPSA-Earth has moved 73 commits past our base (`91c7ca83`). It has reworked
  `prepare_sector_network.py` (about 1,300 lines) and the `Snakefile`, two of the files we patched
  most. Every day of study work on top of the fork makes the eventual update harder.
- **History:** every re-export of the website data (the sandbox data alone is 12.5 MB) adds to the
  model repository's history. GitHub reports 46.6 MB today: small, but growing with each export.
- **Provenance:** it is hard to see which files are PyPSA-Earth's and which are ours.
  `DATA_PROVENANCE.md` documents this, but the folder layout does not show it.

## Target

Two repositories side by side, plus upstream:

```
pypsa-meets-earth/pypsa-earth      upstream: generic fixes go here as pull requests
        ↑ pull requests
BartonChenTW/pypsa-earth           model fork: branch `taiwan` = upstream + Taiwan-specific options
        ↑ pinned commit (model.lock)
BartonChenTW/pypsa-taiwan          new: the study, the Taiwan data, the website
```

On DDM06479 the model checkout stays where it is: `F:\Barton\Repositories\pypsa-earth`, with its
`.venv` (a conda prefix that cannot be moved), `data/` (19 GB), `cutouts/`, `resources/`,
`networks/` and `results/`. The new repository is cloned next to it:
`F:\Barton\Repositories\pypsa-taiwan`.

### `pypsa-taiwan` layout

```
pypsa-taiwan/
  model.lock            model fork URL + commit this study was run with
  paths.py              MODEL_DIR (env PYPSA_EARTH_DIR, default ../pypsa-earth)
  config/               from pypsa_tw/config (Taiwan configs and scenario overlays)
  data/                 from pypsa_tw/data (official/, curated CSV, sources.csv, builders)
  data/fleet/           the three custom power plant files, moved out of the model's data/
  sandbox/  viewer/     from pypsa_tw/sandbox, pypsa_tw/viewer
  docs/                 the website (GitHub Pages of this repository)
  notes/                log.md, TAIWAN_2050_PATHWAY.md, DATA_PROVENANCE.md, plans, checklists
  AGENTS.md             how to run the study
```

The model fork keeps only what the PyPSA-Earth workflow itself needs:
- the Taiwan-specific options in `scripts/`;
- the three Taiwan rows in `data/demand/*_cagr.csv`, until upstream takes them or reads them from
  a config path.

### How a run works after the split

Snakemake still runs in the model folder, with configs from the study repository. Paths in the
configs that point to Taiwan data become relative to the model folder:

```bash
cd ../pypsa-earth
python -m snakemake -j 1 solve_all_networks --configfile ../pypsa-taiwan/config/config_tw_test2_highs.yaml
# config: electricity.custom_powerplants_file: ../pypsa-taiwan/data/fleet/custom_powerplants.csv
```

The sandbox and the exporter read `MODEL_DIR` from `paths.py` instead of assuming they sit inside
the model folder. The code that assumes this today is in five places:
- `sandbox/batch.py` and `sandbox/run_scenario.py` (`REPO`, and the import of `scripts/solve_network.py`);
- `viewer/viewer_helper.py` (`resolve_repo`), `viewer/export_model_data.py` and `viewer/stamp_assets.py`.

The exporter writes into `pypsa-taiwan/docs/data`.

## Steps

Each step ends in a working state and can be paused.

### Step 1. Freeze and inventory (about 1 hour)

- Tag the current state: `git tag pre-split-2026-09` on `pypsa-taiwan-dev`, then push the tag.
- List what moves: every tracked file under `pypsa_tw/` and `docs/`, `AGENTS.md`, and the three
  `data/custom_powerplants*.csv`.
- Record reference results to compare against after the split:
  - Test 1 (7 days, HiGHS);
  - the sandbox base case (objective 9,411,890,728);
  - the official pathway with all imports (2050 objective 49.09 bn €).

### Step 2. Create `pypsa-taiwan` with its history (1-2 hours)

- Extract the moving paths with their history using `git filter-repo`:
  `--path pypsa_tw/ --path docs/ --path AGENTS.md --path-rename pypsa_tw/:`, then move files into
  the layout above in one commit.
- Create `BartonChenTW/pypsa-taiwan` on GitHub (public, like today) and push.
- Add `model.lock` with the current fork commit (`67271fb8`).

### Step 3. Decouple the paths (about 2 hours, plus tests)

- Add `paths.py` and use it in the five places above.
- Point the configs to `../pypsa-taiwan/data/fleet/...`, and make the fleet builders
  (`build_custom_powerplants.py`, `build_future_powerplants.py`) write there.
- Test from the new layout:
  - `snakemake -n` for Test 2 and for the pathway;
  - Test 1 in full;
  - `pytest sandbox/test_levers.py`;
  - one sandbox solve;
  - the exporter.

  The results must match step 1.

### Step 4. Move the website (about 1 hour)

- Turn on GitHub Pages for `pypsa-taiwan` (`main`, `/docs`). The new address is
  `bartonchentw.github.io/pypsa-taiwan/`.
- In the fork, replace `docs/` with small redirect pages, one per old page (for example
  `model-data.html`). Each keeps its query and anchor and points to the new address, so old links
  keep working.
- Update the address wherever it appears (About page, README, request form).

### Step 5. Slim the model fork (about 1 hour)

- On the fork, a new branch `taiwan` from `pypsa-taiwan-dev`: remove `pypsa_tw/` and the moved
  fleet files. Keep the Taiwan-specific code patches and a short README pointing to `pypsa-taiwan`.
- Keep `pypsa-taiwan-dev` and the tag as they are for reference.

### Step 6. Send the generic fixes upstream (2-4 hours of work, then review time)

These patches fix problems any PyPSA-Earth user would hit. Each becomes a small pull request on a
branch from `upstream/main`. None of them is in upstream yet (checked 2026-09-26):

| Fix | File | Check first |
| --- | --- | --- |
| UN energy statistics report Taiwan as "Other Asia" and it is dropped | `build_base_energy_totals.py`, `build_base_industry_totals.py` | none |
| UNCTAD bulk file id changed (355 no longer exists); look it up | `prepare_urban_percent.py` | none |
| World Port Index download fails on certificate errors; use a local copy | `prepare_ports.py` | upstream still downloads directly |
| Myopic chain: existing plants of the base year never retire | `add_brownfield.py` | upstream reworked this file; test whether it still happens |
| Myopic chain: name clash of existing and new links drops all links | `add_existing_baseyear.py` | same |
| Land-use limit subtracts existing capacity twice | `solve_network.py` | upstream reworked this file |
| Converted biomass plants get an unlimited free biomass supply | `prepare_sector_network.py` | upstream reworked this file |
| Retry when a shared Gurobi licence is at its use limit | `cluster_network.py` | optional; may be too site-specific |

Features that could also go upstream, if the maintainers want them:
- bounds on total capacity and on generation shares (`solve_network.py`);
- `min_depth` for offshore wind (`build_renewable_profiles.py`);
- demand-growth and transport-data overrides.

The Taiwan-specific options stay in the fork:
- nuclear candidate sites;
- gas with carbon capture, hydrogen and ammonia turbines;
- fuel imports;
- floating wind costs.

Opening a pull request is public and in your name, so I would prepare the branches and the
descriptions and you would open them.

### Step 7. Update the fork to current upstream (half a day to two days; separate project)

- Start the `taiwan` branch again from `upstream/main` and re-apply the Taiwan-specific patches
  one group at a time. Drop whatever upstream accepted in step 6.
- The hard part is `prepare_sector_network.py`, where upstream changed about 1,300 lines. Our 132
  lines of additions have to be rewritten against the new structure.
  - Upstream now reads several custom power plant files natively (`custom_powerplants_files`);
    our `custom_powerplants_file` option may become unnecessary.
- Re-run the reference cases from step 1, then the pathway runs, about 12 minutes each. That needs
  a heads-up to the other users of DDM06479, and it uses the shared Gurobi licence.
- Update `model.lock` in `pypsa-taiwan` when the results are checked.

## Order and effort

| Step | Effort | Risk | Needs |
| --- | --- | --- | --- |
| 1 Freeze | 1 h | none | – |
| 2 New repo | 1-2 h | low | your go-ahead to create the GitHub repository |
| 3 Paths | 2 h + tests | low | a short heads-up for the test runs |
| 4 Website | 1 h | low (new address) | your OK to change the public address |
| 5 Slim fork | 1 h | low | – |
| 6 Upstream fixes | 2-4 h + review | none for us | you open the pull requests |
| 7 Update fork | 0.5-2 days | medium | model re-runs on the shared machine |

Steps 1-5 are one working day and change no model results. Step 6 can run in parallel. Step 7 is
worth doing only after the upstream fixes are in, and it can wait.

## Decisions for you

1. **Repository name:** `pypsa-taiwan`, or something else, e.g. `taiwan-energy-model` to match the
   site's new title?
2. **Website address:** moving the site changes its address (redirects keep old links). Or keep
   the site in the fork and move only the study code and data?
3. **History:** keep the history of `pypsa_tw/` and `docs/` in the new repository (recommended),
   or start fresh?
4. **Upstream pull requests:** do you want to submit them, and under your account?

## What stays the same

- The model folder on DDM06479, its environment, data and cutouts.
- The commands in the new `AGENTS.md`, apart from `cd ../pypsa-earth`.
- Everything in `docs/data/` stays public. Credentials stay out of both repositories.
- Claude Code keeps project memory per folder: when work moves to `pypsa-taiwan`, copy the
  memory notes (shared workstation, no PowerShell, contact email) to the new project.
