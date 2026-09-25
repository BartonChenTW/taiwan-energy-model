"""
Write Taiwan rows ("TW") into PyPSA-Earth's demand growth files, so the sector-coupled
model does not fall back to the DEFAULT row, whose electricity growth (e.g. +5.6%/yr for
households) is far above Taiwan's.

PyPSA-Earth grows each energy-totals category from the UN base year (2019) to the
planning year: total = base x (1 + growth)^n x (1 + efficiency gain)^n, and industry
by branch with its own production growth. The Taiwan rows are deliberately simple:

- electricity for homes, services, agriculture, rail and other uses: +2.5%/yr, the
  official outlook (MOEA supply-demand report 114年度 news release, 2026-2035), applied
  to 2050;
- the machinery branch, which holds Taiwan's electronics industry (61 TWh of electricity
  in the base data, 93% of its energy): +2.5%/yr;
- everything else flat (0%/yr), and no separate efficiency gains: the historical
  trends below already include efficiency, and fuel switching (EVs, heat pumps,
  hydrogen) is left to the model and the transport-share settings.

The historical 2015-2025 trend of each category, from the official energy balance
(taiwan_timeseries.csv), is written next to the value in sector_growth_tw.csv for
comparison. Extrapolating those trends to 2050 would be too strong (chemicals -2.8%/yr,
textiles -6.9%/yr, electronics +4.5%/yr in 2018-2025), which is why they are not used
directly.

Run from the repository root (then the sector workflow picks the rows up):

    python pypsa_tw/data/build_sector_growth_tw.py
"""

from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DEMAND = REPO / "data" / "demand"
OUT = HERE / "sector_growth_tw.csv"

ELECTRICITY_GROWTH = 0.025
SOURCE_ELEC = "moea_psd_fy2025_press (+2.5%/yr, 2026-2035), applied to 2050"

# growth_factors_cagr.csv column -> balance series used for the historical trend
TREND_SERIES = {
    "electricity residential": "sector_fuel_residential_electricity",
    "residential gas": "sector_fuel_residential_gas",
    "residential oil": "sector_fuel_residential_oil",
    "services electricity": "sector_fuel_services_electricity",
    "services gas": "sector_fuel_services_gas",
    "services oil": "sector_fuel_services_oil",
    "total road": "transport_mode_road",
    "total rail": "transport_mode_rail",
    "total domestic aviation": "transport_mode_domestic_air",
    "total domestic navigation": "transport_mode_domestic_water",
    "agriculture electricity": "sector_fuel_agriculture_electricity",
    "agriculture oil": "sector_fuel_agriculture_oil",
}
INDUSTRY_TREND = {"machinery": "industry_branch_electronics", "chemical and petrochemical": "industry_branch_chemicals",
                  "iron and steel": "industry_branch_basic_metals", "non-metallic minerals": "industry_branch_non_metallic",
                  "paper pulp and print": "industry_branch_paper", "textile and leather": "industry_branch_textiles"}


def trends():
    ts = pd.read_csv(HERE / "taiwan_timeseries.csv")
    p = ts[ts.kind == "history"].pivot_table(index="year", columns="series", values="value")

    def cagr(series, a, b):
        x, y = p.at[a, series], p.at[b, series]
        return (y / x) ** (1 / (b - a)) - 1 if x > 0 and y > 0 else float("nan")

    return cagr


def set_row(path, values):
    """Add or replace the TW line only; the upstream rows stay byte-for-byte unchanged."""
    lines = path.read_text(encoding="utf-8").splitlines()
    columns = lines[0].split(",")[1:]
    row = "TW," + ",".join(f"{values.get(c, 0.0):g}" for c in columns)
    lines = [ln for ln in lines if not ln.startswith("TW,")] + [row]
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lines) + "\n")


def main():
    cagr = trends()
    doc = []

    g = pd.read_csv(DEMAND / "growth_factors_cagr.csv", index_col=0)
    growth = {c: (ELECTRICITY_GROWTH if "electricity" in c else 0.0) for c in g.columns}
    set_row(DEMAND / "growth_factors_cagr.csv", growth)
    for c, v in growth.items():
        s = TREND_SERIES.get(c)
        doc.append({"file": "growth_factors_cagr.csv", "column": c, "value": v,
                    "trend_2015_2025": round(cagr(s, 2015, 2025), 4) if s else "",
                    "basis": SOURCE_ELEC if v else "flat (assumption)"})

    e = pd.read_csv(DEMAND / "efficiency_gains_cagr.csv", index_col=0)
    set_row(DEMAND / "efficiency_gains_cagr.csv", {c: 0.0 for c in e.columns})
    doc.append({"file": "efficiency_gains_cagr.csv", "column": "(all)", "value": 0.0, "trend_2015_2025": "",
                "basis": "none: the trends and the +2.5%/yr are net of efficiency"})

    ind = pd.read_csv(DEMAND / "industry_growth_cagr.csv", index_col=0)
    ind_values = {c: (ELECTRICITY_GROWTH if c == "machinery" else 0.0) for c in ind.columns}
    set_row(DEMAND / "industry_growth_cagr.csv", ind_values)
    for c, v in ind_values.items():
        s = INDUSTRY_TREND.get(c)
        doc.append({"file": "industry_growth_cagr.csv", "column": c, "value": v,
                    "trend_2015_2025": round(cagr(s, 2018, 2025), 4) if s else "",  # 2018-2025 for industry
                    "basis": ("electronics (machinery branch), " + SOURCE_ELEC) if v else "flat (assumption)"})

    out = pd.DataFrame(doc)
    out.to_csv(OUT, index=False)
    print(f"wrote TW rows to data/demand/*_cagr.csv and {OUT.relative_to(REPO)} ({len(out)} rows)")
    print("note: industry trends are 2018-2025 (the classification changed in 2018)")


if __name__ == "__main__":
    main()
