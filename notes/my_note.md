How to run pypsa-earth on Empa workstation DDM06479

Steps:
 - enable the virtual environment `mamba activate F:\Barton\Repositories\pypsa-earth\env`
 - use `python -m snakemake -j 1 solve_all_networks --configfile config.tutorial.yaml -n`


Issues:
 - before run:
    - 'googledrivedownloader' was not installed
 - after running:
    - The problem is a version mismatch between powerplantmatching and the IRENASTAT CSV format on Zenodo — the downloaded file has a different structure than what the library expects.


Log:
 - 2026-05-10: check the 'toturial' simulation is finished! Next steps: 1. show the results, 2. run Taiwan