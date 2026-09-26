# Taiwan energy system model

A study of Taiwan's energy system, built on [PyPSA-Earth](https://github.com/pypsa-meets-earth/pypsa-earth)
through the fork [BartonChenTW/pypsa-earth](https://github.com/BartonChenTW/pypsa-earth).

- Website: https://bartonchentw.github.io/taiwan-energy-model/
- This repository: Taiwan configs (`config/`), Taiwan data and its sources (`data/`, `data/sources.csv`),
  the what-if sandbox (`sandbox/`), the exporter (`viewer/`), the website (`docs/`) and notes (`notes/`).
- The model: a PyPSA-Earth checkout next to this folder (`../pypsa-earth`, or set `PYPSA_EARTH_DIR`);
  `model.lock` pins the commit.
- Which inputs come from PyPSA-Earth and which this study adds: `notes/DATA_PROVENANCE.md`.
- How to run: `AGENTS.md`.

Contact: barton.chen.energy@gmail.com
