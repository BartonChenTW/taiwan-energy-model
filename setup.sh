#!/usr/bin/env bash
# Set up the Taiwan energy model (TEM) next to its PyPSA-Earth fork, then check that a run works.
#
#   bash setup.sh                 # clone the model, create the environment, dry-run Test 1
#   bash setup.sh --run-test      # ... and run Test 1 (one week of 2013; first run downloads several GB)
#   bash setup.sh --help
#
# Runs in Git Bash (Windows), Linux and macOS. Safe to run again: every step is skipped when done.
# Afterwards, `source .tem-env.sh` gives $M (model folder), $C (configs) and $PY (Python) for the
# commands in GETTING_STARTED.md and AGENTS.md.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL_DIR="${PYPSA_EARTH_DIR:-$ROOT/../pypsa-earth}"
ENV_NAME="pypsa-earth"
ENV_PREFIX=""
PIN=1
RUN_TEST=0

usage() {
  cat <<'EOF'
Usage: bash setup.sh [options]

  --model-dir DIR   model checkout (default: $PYPSA_EARTH_DIR, else ../pypsa-earth)
  --env NAME        conda environment name to use or create (default: pypsa-earth)
  --prefix DIR      use an existing conda environment at this path instead of a named one
                    (default: <model-dir>/.venv if it exists)
  --latest          on a fresh clone, stay at the tip of branch `taiwan` instead of the
                    commit in model.lock
  --run-test        run Test 1 after the dry run (builds the 2013 weather cutout if missing)
  -h, --help        show this help

Steps: check tools -> clone the model fork -> create the environment -> check the Copernicus
key and disk space -> write .tem-env.sh -> Snakemake dry run of Test 1 -> (optional) run it.
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --model-dir) MODEL_DIR="$2"; shift 2 ;;
    --env) ENV_NAME="$2"; shift 2 ;;
    --prefix) ENV_PREFIX="$2"; shift 2 ;;
    --latest) PIN=0; shift ;;
    --run-test) RUN_TEST=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

step() { printf '\n== %s\n' "$*"; }
ok()   { printf '   ok: %s\n' "$*"; }
warn() { printf '   WARNING: %s\n' "$*"; }
die()  { printf '   ERROR: %s\n' "$*" >&2; exit 1; }
unixpath() { if command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi; }

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) OS=win ;;
  Darwin) OS=mac ;;
  *) OS=linux ;;
esac

# --- 1. Tools ---------------------------------------------------------------------------------
step "1/6 Tools"
command -v git >/dev/null 2>&1 || die "git not found. Install Git (on Windows: Git for Windows, which includes Git Bash)."
ok "git: $(git --version)"
CONDA=""
for c in mamba conda micromamba; do
  if command -v "$c" >/dev/null 2>&1; then CONDA="$c"; break; fi
done
if [ -n "$CONDA" ]; then ok "package manager: $CONDA"; fi

# --- 2. Model checkout ------------------------------------------------------------------------
step "2/6 Model checkout (PyPSA-Earth fork)"
LOCK_REPO="$(sed -n 's/^repository: *//p' "$ROOT/model.lock")"
LOCK_BRANCH="$(sed -n 's/^branch: *//p' "$ROOT/model.lock")"
LOCK_COMMIT="$(sed -n 's/^commit: *//p' "$ROOT/model.lock")"
if [ -d "$MODEL_DIR/.git" ]; then
  MODEL_DIR="$(cd "$MODEL_DIR" && pwd)"
  ok "found $MODEL_DIR (left as it is)"
  HEAD="$(git -C "$MODEL_DIR" rev-parse HEAD)"
  if [ "$HEAD" = "$LOCK_COMMIT" ]; then
    ok "at the commit in model.lock (${LOCK_COMMIT:0:8})"
  else
    warn "model is at ${HEAD:0:8}, model.lock names ${LOCK_COMMIT:0:8}. For the published results: git -C \"$MODEL_DIR\" checkout $LOCK_COMMIT"
  fi
elif [ -e "$MODEL_DIR" ]; then
  die "$MODEL_DIR exists but is not a git checkout. Move it away or pass --model-dir."
else
  echo "   cloning $LOCK_REPO (branch $LOCK_BRANCH) into $MODEL_DIR"
  git clone --branch "$LOCK_BRANCH" "$LOCK_REPO" "$MODEL_DIR"
  MODEL_DIR="$(cd "$MODEL_DIR" && pwd)"
  if [ "$PIN" = 1 ]; then
    git -C "$MODEL_DIR" -c advice.detachedHead=false checkout -q "$LOCK_COMMIT"
    ok "checked out the commit in model.lock (${LOCK_COMMIT:0:8}); \`git switch $LOCK_BRANCH\` in the model folder for the latest"
  fi
fi
# The configs reach Taiwan data through ../taiwan-energy-model/..., relative to the model folder.
SIBLING="$MODEL_DIR/../taiwan-energy-model"
if [ ! -d "$SIBLING" ] || [ "$(cd "$SIBLING" && pwd)" != "$ROOT" ]; then
  die "the configs reach the Taiwan data through ../taiwan-energy-model/ from the model folder,
   so this repository must be a folder named taiwan-energy-model next to $MODEL_DIR.
   Move or rename one of them (the model checkout can stay as it is)."
fi
ok "this repository sits next to the model as ../taiwan-energy-model"

# --- 3. Python environment --------------------------------------------------------------------
step "3/6 Python environment"
if [ -z "$ENV_PREFIX" ] && [ -d "$MODEL_DIR/.venv/conda-meta" ]; then
  ENV_PREFIX="$MODEL_DIR/.venv"
fi
if [ -z "$ENV_PREFIX" ]; then
  [ -n "$CONDA" ] || die "no conda/mamba found. Install Miniforge (https://github.com/conda-forge/miniforge) and open a new shell."
  ENV_PREFIX="$("$CONDA" env list | awk -v n="$ENV_NAME" '$1==n {print $NF}')"
  if [ -z "$ENV_PREFIX" ]; then
    case "$OS-$(uname -m)" in
      win-*) LOCKFILE=win-64 ;;
      mac-arm64) LOCKFILE=osx-arm64 ;;
      mac-*) LOCKFILE=osx-64 ;;
      *) LOCKFILE=linux-64 ;;
    esac
    ENVFILE="$MODEL_DIR/envs/$LOCKFILE.lock.yaml"
    [ -f "$ENVFILE" ] || ENVFILE="$MODEL_DIR/envs/environment.yaml"
    echo "   creating environment '$ENV_NAME' from envs/$(basename "$ENVFILE") (10-30 minutes)"
    "$CONDA" env create -n "$ENV_NAME" -f "$ENVFILE"
    ENV_PREFIX="$("$CONDA" env list | awk -v n="$ENV_NAME" '$1==n {print $NF}')"
    [ -n "$ENV_PREFIX" ] || die "environment '$ENV_NAME' was not created."
  fi
fi
ENV_PREFIX="$(unixpath "$ENV_PREFIX")"
if [ "$OS" = win ]; then
  PY="$ENV_PREFIX/python.exe"; LIB="$ENV_PREFIX/Library"
  ENV_PATH="$ENV_PREFIX:$ENV_PREFIX/Library/bin:$ENV_PREFIX/Scripts"
  WINPREFIX="$(cd "$ENV_PREFIX" && pwd -W)"; WINLIB="$WINPREFIX/Library"
else
  PY="$ENV_PREFIX/bin/python"; LIB="$ENV_PREFIX"; ENV_PATH="$ENV_PREFIX/bin"
  WINPREFIX="$ENV_PREFIX"; WINLIB="$LIB"
fi
[ -x "$PY" ] || die "no Python at $PY"
# What `conda activate` sets; without the GDAL/PROJ paths build_renewable_profiles cannot read GEBCO.
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1 CPL_ZIP_ENCODING=UTF-8 CONDA_PREFIX="$WINPREFIX" \
  GDAL_DATA="$WINLIB/share/gdal" GDAL_DRIVER_PATH="$WINLIB/lib/gdalplugins" PROJ_DATA="$WINLIB/share/proj" \
  PATH="$ENV_PATH:$PATH"
"$PY" -c "import pypsa, snakemake, atlite" 2>/dev/null \
  || die "the environment at $ENV_PREFIX lacks pypsa/snakemake/atlite. Recreate it from the model's envs/."
ok "$ENV_PREFIX ($("$PY" -c 'import pypsa; print("PyPSA", pypsa.__version__)'))"

# --- 4. Weather key and disk ------------------------------------------------------------------
step "4/6 Weather data and disk space"
CUTOUT="$MODEL_DIR/cutouts/cutout-2013-era5-tw.nc"
if [ -f "$CUTOUT" ]; then
  ok "2013 weather cutout exists; no Copernicus key needed"
  NEED_CUTOUT=0
else
  NEED_CUTOUT=1
  if [ -f "$HOME/.cdsapirc" ]; then
    ok "Copernicus key found ($HOME/.cdsapirc); the first run builds the 2013 cutout"
  else
    warn "no $HOME/.cdsapirc. The first run needs it to download 2013 weather (ERA5)."
    warn "Get a free key at https://cds.climate.copernicus.eu and save these two lines there:"
    warn "  url: https://cds.climate.copernicus.eu/api"
    warn "  key: <your key>"
  fi
fi
FREE_GB="$(df -Pk "$MODEL_DIR" | awk 'NR==2 {printf "%d", $4/1048576}')"
if [ -n "$FREE_GB" ] && [ "$FREE_GB" -lt 30 ]; then
  warn "only ${FREE_GB} GB free next to the model; about 30 GB is needed (data bundle, weather, outputs)"
else
  ok "${FREE_GB:-?} GB free"
fi

# --- 5. Shell helper --------------------------------------------------------------------------
step "5/6 Shell helper"
cat > "$ROOT/.tem-env.sh" <<EOF
# Written by setup.sh. Use: source .tem-env.sh   (then \$PY, \$M and \$C as in GETTING_STARTED.md)
export M="$MODEL_DIR" C="$ROOT/config" PY="$PY"
export PYTHONIOENCODING=utf-8 PYTHONUTF8=1 CPL_ZIP_ENCODING=UTF-8 CONDA_PREFIX="$WINPREFIX"
export GDAL_DATA="$WINLIB/share/gdal" GDAL_DRIVER_PATH="$WINLIB/lib/gdalplugins" PROJ_DATA="$WINLIB/share/proj"
export PATH="$ENV_PATH:\$PATH"
EOF
ok "wrote .tem-env.sh (not committed)"

# --- 6. Dry run, then optionally the test -----------------------------------------------------
step "6/6 Snakemake dry run of Test 1 (1-8 March 2013, 6 regions, HiGHS)"
CONFIGS=("$ROOT/config/config_tw_test1_highs.yaml")
[ "$NEED_CUTOUT" = 1 ] && CONFIGS+=("$ROOT/config/scenarios/build_cutout.yaml")
cd "$MODEL_DIR"
"$PY" -m snakemake -j 1 solve_all_networks --configfile "${CONFIGS[@]}" -n --quiet rules \
  || die "dry run failed; see the Snakemake message above."
ok "the workflow resolves"

if [ "$RUN_TEST" = 1 ]; then
  step "Running Test 1 (first run: downloads several GB, one to several hours)"
  "$PY" -m snakemake -j 1 solve_all_networks --configfile "${CONFIGS[@]}"
  ok "results in $MODEL_DIR/results/"
fi

cat <<EOF

Done. Next:
  source .tem-env.sh
  cd "\$M"
EOF
if [ "$RUN_TEST" = 0 ]; then
  EXTRA=""; [ "$NEED_CUTOUT" = 1 ] && EXTRA=' $C/scenarios/build_cutout.yaml'
  echo "  \$PY -m snakemake -j 1 solve_all_networks --configfile \$C/config_tw_test1_highs.yaml$EXTRA   # Test 1, one week"
fi
cat <<'EOF'
  $PY -m snakemake -j 1 solve_all_networks --configfile $C/config_tw_test2_highs.yaml      # full year 2013
See GETTING_STARTED.md for scenarios, the sandbox and the website data.
EOF
