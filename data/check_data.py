"""Check the Taiwan data collection: source registry, tables and downloaded files.

Runs without the PyPSA-Earth model (only pandas), locally and on every pull request:

    python data/check_data.py

Errors (exit code 1) break a rule that other code relies on; warnings are worth a look.
"""

import hashlib
import re
import sys
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
EVIDENCE = {"downloaded", "page_opened", "search_summary", "derived", "model_input", "model_output"}
ORIGIN = {"pypsa-earth", "taiwan", "fork"}
KIND = {"history", "projection", "target"}
MAX_MB, WARN_MB = 50, 20
errors, warnings = [], []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def read(name, **kw):
    return pd.read_csv(HERE / name, dtype=str, keep_default_na=False, **kw)


def check_sources():
    src = read("sources.csv")
    need = ["source_id", "short_cite", "publisher", "origin", "evidence"]
    for col in need:
        if col not in src.columns:
            err(f"sources.csv: missing column {col}")
            return src
    dup = src.source_id[src.source_id.duplicated()].tolist()
    if dup:
        err(f"sources.csv: duplicate source_id {dup}")
    for r in src.itertuples():
        sid = r.source_id
        if not re.fullmatch(r"[a-z0-9_]+", sid):
            err(f"sources.csv: source_id '{sid}' should be lowercase letters, digits and _")
        for col in need[1:]:
            if not getattr(r, col):
                err(f"sources.csv: {sid} has no {col}")
        if r.evidence not in EVIDENCE:
            err(f"sources.csv: {sid} evidence '{r.evidence}' not in {sorted(EVIDENCE)}")
        if r.origin not in ORIGIN:
            err(f"sources.csv: {sid} origin '{r.origin}' not in {sorted(ORIGIN)}")
        if not (r.landing_url or r.file_url) and r.evidence not in {"derived", "model_output"}:
            err(f"sources.csv: {sid} has neither landing_url nor file_url")
        if r.accessed and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.accessed):
            err(f"sources.csv: {sid} accessed '{r.accessed}' is not YYYY-MM-DD")
        if r.evidence == "downloaded" and not r.local_file and r.origin == "taiwan":
            warn(f"sources.csv: {sid} is 'downloaded' but has no local_file (keep a copy in data/official/ if the licence allows)")
        if r.local_file:
            f = HERE / r.local_file
            if not f.exists():
                err(f"sources.csv: {sid} local_file {r.local_file} does not exist")
            elif not r.sha256:
                err(f"sources.csv: {sid} local_file has no sha256")
            elif hashlib.sha256(f.read_bytes()).hexdigest() != r.sha256:
                err(f"sources.csv: {sid} {r.local_file} does not match its sha256 (file changed after registration?)")
    return src


def check_tables(ids):
    ts = read("taiwan_timeseries.csv")
    bad = sorted(set(ts.source_id) - ids)
    if bad:
        err(f"taiwan_timeseries.csv: source_id not in sources.csv: {bad}")
    for col, allowed in (("kind", KIND), ("evidence", EVIDENCE)):
        wrong = sorted(set(ts[col]) - allowed)
        if wrong:
            err(f"taiwan_timeseries.csv: {col} values {wrong} not in {sorted(allowed)}")
    if pd.to_numeric(ts.value, errors="coerce").isna().any():
        err("taiwan_timeseries.csv: non-numeric values")
    dup = ts[ts.duplicated(["series", "kind", "year", "source_id"], keep=False)]
    if len(dup):
        err(f"taiwan_timeseries.csv: {len(dup)} duplicate rows (series, kind, year, source_id), e.g. {dup.iloc[0].series}")

    facts = read("taiwan_key_facts.csv")
    for r in facts.itertuples():
        if r.evidence not in EVIDENCE:
            err(f"taiwan_key_facts.csv: '{r.indicator_en}' evidence '{r.evidence}' not in {sorted(EVIDENCE)}")
        for col in ("indicator_en", "indicator_zh", "value", "unit", "year"):
            if not getattr(r, col):
                err(f"taiwan_key_facts.csv: '{r.indicator_en or r.indicator_zh}' has no {col}")
        if not r.link and r.evidence not in {"derived", "model_output", "model_input"}:
            warn(f"taiwan_key_facts.csv: '{r.indicator_en}' has no link")

    bench = read("taiwan_cost_benchmarks.csv")
    bad = sorted(set(bench.source_id) - ids)
    if bad:
        err(f"taiwan_cost_benchmarks.csv: source_id not in sources.csv: {bad}")

    names = read("plant_names_zh.csv")
    if names.name.duplicated().any():
        err(f"plant_names_zh.csv: duplicate names {names.name[names.name.duplicated()].tolist()}")
    known = set(names.name)
    for f in sorted((HERE / "fleet").glob("custom_powerplants*.csv")):
        plants = pd.read_csv(f, dtype=str, keep_default_na=False).Name
        missing = sorted({p for p in plants if p not in known and not p.startswith(("Solar ", "Biomass and waste "))})
        if missing:
            err(f"plant_names_zh.csv: no Chinese name for {missing} (used in fleet/{f.name})")

    mapping = read("taipower_plant_mapping.csv")
    pat = re.compile(r"^(OSM [rwn]\d+|powerplantmatching|thewindpower\.net|assumed)$")
    for r in mapping.itertuples():
        if r.coord_source and not pat.match(r.coord_source):
            warn(f"taipower_plant_mapping.csv: {r.name} coord_source '{r.coord_source}' (expected 'OSM r/w/n<id>', powerplantmatching, thewindpower.net or assumed)")


def check_files(src):
    registered = {Path(p).as_posix() for p in src.local_file if p}
    for f in sorted((HERE / "official").rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(HERE).as_posix()
        if rel not in registered:
            warn(f"{rel} is not registered in sources.csv (local_file)")
    for f in sorted(HERE.rglob("*")):
        if f.is_file() and "__pycache__" not in f.parts:
            mb = f.stat().st_size / 1e6
            rel = f.relative_to(HERE).as_posix()
            if mb > MAX_MB:
                err(f"{rel} is {mb:.0f} MB (GitHub rejects files over 100 MB; keep data files under {MAX_MB} MB)")
            elif mb > WARN_MB:
                warn(f"{rel} is {mb:.0f} MB (consider linking instead of committing)")


def main():
    src = check_sources()
    check_tables(set(src.source_id))
    check_files(src)
    for w in warnings:
        print(f"warning: {w}")
    for e in errors:
        print(f"ERROR: {e}")
    print(f"{len(src)} sources checked: {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
