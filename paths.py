"""Where things are: this repository (ROOT) and the PyPSA-Earth model checkout (MODEL_DIR).

The model checkout holds the workflow, its data bundle, cutouts and all outputs (resources/,
networks/, results/, logs/). This repository holds the Taiwan configs and data, the sandbox, the
exporter and the website. Set PYPSA_EARTH_DIR to point elsewhere; the default is a sibling
folder ../pypsa-earth. The model commit this study was run with is in model.lock.
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODEL_DIR = Path(os.environ.get("PYPSA_EARTH_DIR", ROOT.parent / "pypsa-earth")).resolve()

# Top-level folders of this repository; other relative paths belong to the model checkout
_OWN = {"config", "data", "docs", "sandbox", "viewer", "notes"}


def resolve(rel):
    """A relative path from either tree: this repository's file if it exists, else the model's.
    E.g. 'config/config_tw_test2_highs.yaml' -> ROOT, 'config.default.yaml' -> MODEL_DIR."""
    rel = Path(rel)
    if rel.is_absolute():
        return rel
    if rel.parts and rel.parts[0] in _OWN and (ROOT / rel).exists():
        return ROOT / rel
    return MODEL_DIR / rel
