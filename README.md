# Taiwan energy system model (TEM)

An open model of Taiwan's energy system: Taiwan data and sources, scenarios and a website, built on
[PyPSA-Earth](https://github.com/pypsa-meets-earth/pypsa-earth) through the fork
[BartonChenTW/pypsa-earth](https://github.com/BartonChenTW/pypsa-earth) (branch `taiwan`).

台灣能源系統模型（TEM）：以 PyPSA-Earth 建置的開放模型，包含台灣能源資料與來源、情境模擬及網站。

- **Website:** https://bartonchentw.github.io/taiwan-energy-model/
- **Use the model:** [GETTING_STARTED.md](GETTING_STARTED.md)
- **Contribute data or code:** [CONTRIBUTING.md](CONTRIBUTING.md). Taiwan data and verified sources are the most useful contributions.
- **Where each input comes from:** [notes/DATA_PROVENANCE.md](notes/DATA_PROVENANCE.md). What the fork changes in PyPSA-Earth: [FORK_CHANGES.md](https://github.com/BartonChenTW/pypsa-earth/blob/taiwan/FORK_CHANGES.md).

| Folder | Content |
| --- | --- |
| `config/` | Taiwan configs and scenario overlays for PyPSA-Earth |
| `data/` | Taiwan data: source registry (`sources.csv`), official files (`official/`), curated tables, power plant fleet (`fleet/`), builder scripts, checks (`check_data.py`) |
| `sandbox/` | What-if scenarios on today's system, solved in seconds |
| `viewer/` | Exporter from model results to the website data |
| `docs/` | The website (GitHub Pages) |
| `notes/` | Project log, the 2050 pathway, provenance, plans |

The model itself runs in a PyPSA-Earth checkout next to this folder (`../pypsa-earth`, or set
`PYPSA_EARTH_DIR`); `model.lock` pins its commit.

Contact: barton.chen.energy@gmail.com
