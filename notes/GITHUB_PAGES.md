# GitHub Pages Setup

This repo now has a simple static GitHub Pages site in:

```text
docs/
```

The site entry point is:

```text
docs/index.html
```

## Enable GitHub Pages

1. Push this branch to GitHub.
2. Open the repository on GitHub.
3. Go to `Settings`.
4. In the left sidebar, open `Pages`.
5. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
6. Select the branch that contains this `docs/` folder.
7. Select the folder `/docs`.
8. Click `Save`.

GitHub's official Pages documentation says branch publishing can use either the repository root `/` or `/docs` folder as the publishing source.

## Commands

From the repository root:

```powershell
git add docs pypsa_tw
git commit -m "Add Taiwan simulation GitHub Pages dashboard"
git push -u origin pypsa-taiwan-dev
```

If the branch does not exist locally yet:

```powershell
git checkout -b pypsa-taiwan-dev
```

## Notes

- The page uses Plotly from a CDN, so the browser needs internet access.
- The map uses an OpenStreetMap basemap through Plotly.
- The static data is stored in `docs/assets/results-data.js`.
- For deeper dispatch and energy analysis, use `pypsa_tw/taiwan_simulation_results.ipynb`.
