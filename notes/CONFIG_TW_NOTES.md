# Taiwan PyPSA-Earth Config Notes

This note records the config fix for the `retrieve_cutout` failure seen when running:

```powershell
snakemake -j 1 solve_all_networks
```

## What Went Wrong

The active `config.yaml` used:

```yaml
countries: ["TW"]
tutorial: true
atlite:
  default: cutout-2013-era5-tutorial
```

That combination does not work because PyPSA-Earth has tutorial cutout bundles for selected tutorial regions only, such as `NG/BJ`, `BW`, `MA`, and `KZ`. There is no tutorial cutout bundle for Taiwan.

As a result, `retrieve_cutout` selected no cutout bundle, no file was downloaded, and `atlite.Cutout(...)` tried to create/open a missing file without the required cutout parameters.

The visible error was:

```text
TypeError: Arguments 'time' and 'module' must be specified. Spatial bounds must either be passed via argument 'bounds' or 'x' and 'y'.
```

## Correct Settings

For Taiwan, use a normal non-tutorial run and build the cutout locally:

```yaml
tutorial: false

enable:
  retrieve_cutout: false
  build_cutout: true

atlite:
  default: cutout-2013-era5
```

The corrected copy is saved as:

```text
pypsa_tw/config.tw.fixed.yaml
```

## How To Use It

The active workflow reads `config.yaml`, so keep `config.yaml` aligned with `pypsa_tw/config.tw.fixed.yaml` before running.

Recommended check:

```powershell
snakemake -n -j 1 solve_all_networks
```

Then run:

```powershell
snakemake -j 1 solve_all_networks
```

Because this builds a real ERA5 cutout for Taiwan, the real run may require working CDS/ERA5 credentials and can take longer than the tutorial workflow.

## IRENASTAT Cache Issue

If `add_electricity` fails with a pandas CSV parser error while calling `pm.data.IRENASTAT()`, the cached `powerplantmatching` IRENA CSV may be corrupted or incomplete.

Expected cache file:

```text
C:\Users\chyi\AppData\Roaming\powerplantmatching\data\in\IRENASTAT_capacities_2000-2023.csv
```

Correct direct-download URL:

```text
https://zenodo.org/records/10952917/files/IRENASTAT_capacities_2000-2023.csv?download=1
```

Replace the cached file with the downloaded CSV, then rerun:

```powershell
snakemake -j 1 solve_all_networks
```

The workflow script [scripts/add_electricity.py](../scripts/add_electricity.py) has also been patched to use this direct URL while preserving a manually replaced cached IRENASTAT file.
