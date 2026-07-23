from pathlib import Path

import networkx as nx
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import pypsa

try:
    import geopandas as gpd
except Exception:  # geopandas is optional for CSV-only inspection
    gpd = None


def resolve_repo(start=None):
    """Return the repository root from a notebook or script working directory."""
    path = Path.cwd() if start is None else Path(start).resolve()
    candidates = [path, *path.parents]
    for candidate in candidates:
        if (candidate / "Snakefile").exists():
            return candidate
    raise FileNotFoundError("Could not find repository root containing Snakefile.")


def read_table(path, **kwargs):
    path = Path(path)
    if not path.exists() or path.stat().st_size == 0:
        return pd.DataFrame()
    if path.suffix.lower() == ".geojson" and gpd is not None:
        return gpd.read_file(path)
    return pd.read_csv(path, **kwargs)


def table_info(name, df):
    column_names = ", ".join(map(str, df.columns[:12]))
    if len(df.columns) > 12:
        column_names += " ..."
    return {
        "table": name,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": column_names,
    }


def show_head(df, n=10):
    if df.empty:
        print("empty table")
        return df
    return df.head(n)


def component_capacity(df, nominal_col="p_nom", optimized_col="p_nom_opt"):
    if df.empty or nominal_col not in df.columns:
        return pd.Series(dtype=float)
    nominal = df[nominal_col].fillna(0.0)
    if optimized_col in df.columns:
        optimized = df[optimized_col].fillna(0.0)
        return optimized.where(optimized.abs() > 1e-9, nominal)
    return nominal


def network_graph(network, include_transformers=True, include_links=False):
    graph = nx.Graph()
    graph.add_nodes_from(network.buses.index.astype(str))
    if not network.lines.empty:
        graph.add_edges_from(
            (str(row.bus0), str(row.bus1)) for row in network.lines.itertuples()
        )
    if include_transformers and hasattr(network, "transformers"):
        if not network.transformers.empty:
            graph.add_edges_from(
                (str(row.bus0), str(row.bus1))
                for row in network.transformers.itertuples()
            )
    if include_links and hasattr(network, "links"):
        if not network.links.empty:
            graph.add_edges_from(
                (str(row.bus0), str(row.bus1)) for row in network.links.itertuples()
            )
    return graph


def topology_summary(network, include_transformers=True):
    graph = network_graph(network, include_transformers=include_transformers)
    components = sorted(nx.connected_components(graph), key=len, reverse=True)
    return pd.DataFrame(
        {
            "component_index": range(len(components)),
            "bus_count": [len(component) for component in components],
            "sample_buses": [
                ", ".join(sorted(component)[:12]) for component in components
            ],
        }
    )


def isolated_buses(network, include_transformers=True):
    graph = network_graph(network, include_transformers=include_transformers)
    return sorted([bus for bus, degree in graph.degree() if degree == 0])


def list_available_results(results_root):
    results_root = Path(results_root)
    available_results = sorted(
        path for path in results_root.iterdir() if path.is_dir() and (path / "networks").exists()
    )
    available_results_df = pd.DataFrame(
        {
            "result_index": range(len(available_results)),
            "result_folder": [path.name for path in available_results],
            "network_file": [str(next((path / "networks").glob("*.nc"), "")) for path in available_results],
        }
    )
    return available_results, available_results_df


def load_selected_runs(available_results, selected_result_indices):
    if not selected_result_indices:
        raise ValueError("Select at least one result index in SELECTED_RESULT_INDICES.")

    selected_results = [available_results[i] for i in selected_result_indices]
    run_result_paths = {}
    run_networks = {}

    for result_path in selected_results:
        network_candidates = sorted((result_path / "networks").glob("*.nc"))
        if not network_candidates:
            raise FileNotFoundError(f"No solved network file found in {result_path / 'networks'}")
        run_result_paths[result_path.name] = network_candidates[0]
        run_networks[result_path.name] = pypsa.Network(network_candidates[0])

    return selected_results, run_result_paths, run_networks


def nominal_capacity(df, nominal_col="p_nom", optimized_col="p_nom_opt"):
    if df.empty:
        return pd.Series(dtype=float)
    if optimized_col in df.columns:
        optimized = df[optimized_col].fillna(0.0)
        nominal = df[nominal_col].fillna(0.0) if nominal_col in df.columns else 0.0
        return optimized.where(optimized.abs() > 1e-9, nominal)
    return df[nominal_col].fillna(0.0)


def build_run_summary(run_networks, run_result_paths):
    return pd.DataFrame(
        [
            {
                "run": run_name,
                "result_file": str(run_result_paths[run_name]),
                "objective": getattr(network, "objective", None),
                "snapshots": len(network.snapshots),
                "first_snapshot": network.snapshots[0] if len(network.snapshots) else None,
                "last_snapshot": network.snapshots[-1] if len(network.snapshots) else None,
                "buses": len(network.buses),
                "lines": len(network.lines),
                "generators": len(network.generators),
                "loads": len(network.loads),
                "stores": len(network.stores),
                "storage_units": len(network.storage_units),
            }
            for run_name, network in run_networks.items()
        ]
    )


def build_model_inputs_summary(run_networks):
    records = []
    for run_name, network in run_networks.items():
        constraints = network.global_constraints.copy()
        if constraints.empty:
            records.append(
                {
                    "run": run_name,
                    "constraint_name": "no_global_constraints",
                    "type": None,
                    "carrier_attribute": None,
                    "sense": None,
                    "constant": None,
                    "mu": None,
                }
            )
            continue

        constraints = constraints.reset_index(names="constraint_name")
        constraints.insert(0, "run", run_name)
        for column in ["type", "carrier_attribute", "sense", "constant", "mu"]:
            if column not in constraints.columns:
                constraints[column] = None
        records.extend(
            constraints[["run", "constraint_name", "type", "carrier_attribute", "sense", "constant", "mu"]]
            .to_dict("records")
        )

    return pd.DataFrame(records)


def build_bus_technology_limits(run_networks):
    records = []
    components = [
        ("Generator", "generators", "bus", "carrier", "p_nom_min", "p_nom_max", "p_nom_extendable"),
        ("StorageUnit", "storage_units", "bus", "carrier", "p_nom_min", "p_nom_max", "p_nom_extendable"),
        ("Link", "links", "bus0", "carrier", "p_nom_min", "p_nom_max", "p_nom_extendable"),
    ]

    for run_name, network in run_networks.items():
        for component_name, attr_name, bus_col, carrier_col, min_col, max_col, extendable_col in components:
            component_df = getattr(network, attr_name).copy()
            if component_df.empty or bus_col not in component_df.columns:
                continue

            component_df = component_df.reset_index(names="asset")
            component_df["run"] = run_name
            component_df["component"] = component_name
            component_df["bus"] = component_df[bus_col]
            component_df["carrier"] = (
                component_df[carrier_col] if carrier_col in component_df.columns else component_name.lower()
            )
            component_df["capacity_min_MW"] = component_df[min_col] if min_col in component_df.columns else 0.0
            component_df["capacity_max_MW"] = component_df[max_col] if max_col in component_df.columns else pd.NA
            component_df["extendable"] = (
                component_df[extendable_col] if extendable_col in component_df.columns else False
            )

            grouped = (
                component_df.groupby(["run", "component", "bus", "carrier", "extendable"], dropna=False)[
                    ["capacity_min_MW", "capacity_max_MW"]
                ]
                .sum(min_count=1)
                .reset_index()
                .sort_values(["run", "bus", "component", "carrier"])
            )
            records.extend(grouped.to_dict("records"))

    return pd.DataFrame(records)


def _component_capacity(df, nominal_col, optimized_col):
    if df.empty:
        return pd.Series(dtype=float)
    if optimized_col in df.columns:
        optimized = df[optimized_col].fillna(0.0)
        nominal = df[nominal_col].fillna(0.0) if nominal_col in df.columns else 0.0
        return optimized.where(optimized.abs() > 1e-9, nominal)
    return df[nominal_col].fillna(0.0)


def build_transmission_assets(run_networks):
    records = []
    for run_name, network in run_networks.items():
        if not network.lines.empty:
            line_capacity = _component_capacity(network.lines, "s_nom", "s_nom_opt")
            for line_name, line in network.lines.iterrows():
                records.append(
                    {
                        "run": run_name,
                        "component": "Line",
                        "asset": line_name,
                        "carrier": line.get("carrier", "AC"),
                        "bus0": line.bus0,
                        "bus1": line.bus1,
                        "length_km": line.get("length", pd.NA),
                        "voltage_kV": line.get("v_nom", pd.NA),
                        "capacity_MW": line_capacity.get(line_name, pd.NA),
                        "capacity_min_MW": line.get("s_nom_min", pd.NA),
                        "capacity_max_MW": line.get("s_nom_max", pd.NA),
                        "extendable": bool(line.get("s_nom_extendable", False)),
                    }
                )

        if not network.links.empty and "carrier" in network.links.columns:
            dc_links = network.links[network.links.carrier.eq("DC")]
            link_capacity = _component_capacity(dc_links, "p_nom", "p_nom_opt")
            for link_name, link in dc_links.iterrows():
                records.append(
                    {
                        "run": run_name,
                        "component": "Link",
                        "asset": link_name,
                        "carrier": link.get("carrier", "DC"),
                        "bus0": link.bus0,
                        "bus1": link.bus1,
                        "length_km": link.get("length", pd.NA),
                        "voltage_kV": pd.NA,
                        "capacity_MW": link_capacity.get(link_name, pd.NA),
                        "capacity_min_MW": link.get("p_nom_min", pd.NA),
                        "capacity_max_MW": link.get("p_nom_max", pd.NA),
                        "extendable": bool(link.get("p_nom_extendable", False)),
                    }
                )

    return pd.DataFrame(records)


def build_transmission_summary(transmission_assets_df):
    if transmission_assets_df.empty:
        return pd.DataFrame(
            columns=[
                "run",
                "component",
                "asset_count",
                "extendable_count",
                "total_length_km",
                "total_capacity_GW",
            ]
        )

    summary = (
        transmission_assets_df.groupby(["run", "component"], dropna=False)
        .agg(
            asset_count=("asset", "count"),
            extendable_count=("extendable", "sum"),
            total_length_km=("length_km", "sum"),
            total_capacity_GW=("capacity_MW", lambda values: values.sum() / 1e3),
        )
        .reset_index()
    )
    return summary.sort_values(["run", "component"])


def plot_transmission_network(network, run_name):
    plot_buses = network.buses.reset_index(names="bus")
    fig = go.Figure()

    if not network.lines.empty:
        line_capacity = _component_capacity(network.lines, "s_nom", "s_nom_opt")
        max_capacity = max(float(line_capacity.max()), 1.0)

        for line_name, line in network.lines.iterrows():
            if line.bus0 not in network.buses.index or line.bus1 not in network.buses.index:
                continue

            b0 = network.buses.loc[line.bus0]
            b1 = network.buses.loc[line.bus1]
            capacity = float(line_capacity.get(line_name, 0.0))
            width = 1.5 + capacity / max_capacity * 8

            fig.add_trace(
                go.Scattermapbox(
                    lon=[b0.x, b1.x],
                    lat=[b0.y, b1.y],
                    mode="lines",
                    line=dict(width=width, color="rgba(25, 97, 168, 0.75)"),
                    customdata=[capacity],
                    hovertemplate=(
                        f"<b>{line_name}</b><br>"
                        f"{line.bus0} -> {line.bus1}<br>"
                        "Capacity: %{customdata:,.1f} MW<br>"
                        f"Length: {line.get('length', pd.NA):,.1f} km"
                        "<extra></extra>"
                    ),
                    name="AC line",
                    showlegend=False,
                )
            )

            mid_lon = (b0.x + b1.x) / 2
            mid_lat = (b0.y + b1.y) / 2
            fig.add_trace(
                go.Scattermapbox(
                    lon=[mid_lon],
                    lat=[mid_lat],
                    mode="markers+text",
                    text=[f"{capacity / 1e3:.1f} GW"],
                    textposition="top center",
                    marker=dict(size=7, color="#1961a8"),
                    hoverinfo="skip",
                    showlegend=False,
                )
            )

    fig.add_trace(
        go.Scattermapbox(
            lon=plot_buses.x,
            lat=plot_buses.y,
            mode="markers+text",
            text=plot_buses.bus,
            textposition="top center",
            marker=dict(size=14, color="#f28e2b", opacity=0.92),
            hovertemplate="<b>%{text}</b><br>lon: %{lon:.3f}<br>lat: %{lat:.3f}<extra></extra>",
            name="Buses",
        )
    )

    fig.update_layout(
        title=f"Transmission Network and Line Capacity: {run_name}",
        mapbox_style="open-street-map",
        mapbox_zoom=6.2,
        mapbox_center=dict(lat=float(plot_buses.y.mean()), lon=float(plot_buses.x.mean())),
        margin=dict(l=0, r=0, t=45, b=0),
        height=720,
    )
    return fig


def build_capacity_comparison(run_networks):
    capacity_by_run = {}
    for run_name, network in run_networks.items():
        gen_capacity = nominal_capacity(network.generators).groupby(network.generators.carrier).sum()
        capacity_by_run[run_name] = gen_capacity / 1e3

    capacity_compare_df = pd.DataFrame(capacity_by_run).T.fillna(0.0)
    capacity_compare_df.index.name = "run"
    if not capacity_compare_df.empty:
        capacity_compare_df = capacity_compare_df.loc[
            :, capacity_compare_df.sum(axis=0).sort_values(ascending=False).index
        ]
    capacity_df = (
        capacity_compare_df.reset_index()
        .melt(id_vars="run", var_name="carrier", value_name="capacity_GW")
        .sort_values(["run", "carrier"])
    )
    return capacity_compare_df, capacity_df


def plot_capacity_comparison(capacity_df):
    fig = px.bar(
        capacity_df,
        x="run",
        y="capacity_GW",
        color="carrier",
        title="Generator Capacity by Carrier Across Runs",
        labels={"capacity_GW": "Capacity (GW)", "carrier": "Carrier", "run": "Run"},
    )
    fig.update_layout(barmode="stack", xaxis_tickangle=-20)
    return fig


def build_generation_comparison(run_networks):
    generation_by_run = {}
    for run_name, network in run_networks.items():
        snapshot_weight = network.snapshot_weightings.generators.reindex(network.snapshots).fillna(1.0)
        if network.generators_t.p.empty:
            generation_by_run[run_name] = pd.Series(dtype=float)
        else:
            generation_mwh_by_generator = network.generators_t.p.multiply(snapshot_weight, axis=0).sum()
            generation_by_run[run_name] = generation_mwh_by_generator.groupby(network.generators.carrier).sum() / 1e3

    generation_compare_df = pd.DataFrame(generation_by_run).T.fillna(0.0)
    generation_compare_df.index.name = "run"
    if not generation_compare_df.empty:
        generation_compare_df = generation_compare_df.loc[
            :, generation_compare_df.sum(axis=0).sort_values(ascending=False).index
        ]
    energy_mix_df = generation_compare_df.reset_index().melt(
        id_vars="run", var_name="carrier", value_name="generation_GWh"
    )
    return generation_by_run, generation_compare_df, energy_mix_df


def plot_generation_comparison(energy_mix_df):
    fig = px.bar(
        energy_mix_df,
        x="run",
        y="generation_GWh",
        color="carrier",
        title="Energy Mix by Carrier Across Runs",
        labels={"generation_GWh": "Generation (GWh)", "carrier": "Carrier", "run": "Run"},
    )
    fig.update_layout(barmode="stack", xaxis_tickangle=-20)
    return fig


def build_dispatch_plot_data(network):
    load = network.loads_t.p_set.sum(axis=1) if not network.loads_t.p_set.empty else pd.Series(index=network.snapshots, dtype=float)
    dispatch_by_carrier = pd.DataFrame(index=network.snapshots)
    if not network.generators_t.p.empty:
        dispatch_by_carrier = network.generators_t.p.groupby(network.generators.carrier, axis=1).sum()

    dispatch_plot = dispatch_by_carrier.copy()
    dispatch_plot["load"] = load
    dispatch_long = dispatch_plot.reset_index(names="snapshot").melt(
        id_vars="snapshot", var_name="carrier", value_name="MW"
    )
    return load, dispatch_long


def plot_dispatch(load, dispatch_long, run_name):
    fig = px.area(
        dispatch_long[dispatch_long.carrier != "load"],
        x="snapshot",
        y="MW",
        color="carrier",
        title=f"Dispatch by Carrier and Total Load: {run_name}",
    )
    fig.add_trace(
        go.Scatter(
            x=load.index,
            y=load.values,
            mode="lines",
            name="load",
            line=dict(color="black", width=3),
        )
    )
    fig.update_layout(yaxis_title="MW", xaxis_title="Snapshot")
    return fig


def build_curtailment_summary(network, snapshot_weight):
    renewable_carriers = {"solar", "onwind", "offwind-ac", "offwind-dc", "ror", "hydro"}
    renewable_gens = network.generators.index[network.generators.carrier.isin(renewable_carriers)]

    curtailment = []
    for gen in renewable_gens:
        carrier = network.generators.at[gen, "carrier"]
        p_nom = nominal_capacity(network.generators.loc[[gen]]).iloc[0]
        if gen not in network.generators_t.p_max_pu.columns or gen not in network.generators_t.p.columns:
            continue
        available = (network.generators_t.p_max_pu[gen] * p_nom * snapshot_weight).sum()
        dispatched = (network.generators_t.p[gen] * snapshot_weight).sum()
        curtailment.append((carrier, available, dispatched, max(available - dispatched, 0.0)))

    curtailment_df = pd.DataFrame(
        curtailment, columns=["carrier", "available_MWh", "dispatched_MWh", "curtailed_MWh"]
    )
    if curtailment_df.empty:
        return pd.DataFrame(
            columns=["available_MWh", "dispatched_MWh", "curtailed_MWh", "curtailment_rate_pct"]
        )

    curtailment_summary = curtailment_df.groupby("carrier").sum() / 1e3
    curtailment_summary["curtailment_rate_pct"] = (
        curtailment_summary["curtailed_MWh"] / curtailment_summary["available_MWh"].replace(0, pd.NA) * 100
    )
    return curtailment_summary


def plot_spatial_overview(network, run_name):
    bus_capacity = network.generators.assign(capacity=nominal_capacity(network.generators)).groupby("bus")[
        "capacity"
    ].sum()
    plot_buses = network.buses.join(bus_capacity.rename("generator_capacity_MW")).fillna(
        {"generator_capacity_MW": 0.0}
    )
    plot_buses = plot_buses.reset_index(names="bus")
    plot_buses["bubble_size"] = 8 + plot_buses["generator_capacity_MW"].clip(lower=0) / max(
        plot_buses["generator_capacity_MW"].max(), 1
    ) * 42

    fig = go.Figure()
    for _, line in network.lines.iterrows():
        if line.bus0 in network.buses.index and line.bus1 in network.buses.index:
            b0 = network.buses.loc[line.bus0]
            b1 = network.buses.loc[line.bus1]
            fig.add_trace(
                go.Scattermapbox(
                    lon=[b0.x, b1.x],
                    lat=[b0.y, b1.y],
                    mode="lines",
                    line=dict(width=2, color="rgba(80, 80, 80, 0.45)"),
                    hoverinfo="skip",
                    showlegend=False,
                )
            )

    fig.add_trace(
        go.Scattermapbox(
            lon=plot_buses.x,
            lat=plot_buses.y,
            mode="markers+text",
            text=plot_buses.bus,
            textposition="top center",
            marker=dict(
                size=plot_buses.bubble_size,
                color=plot_buses.generator_capacity_MW,
                colorscale="Viridis",
                showscale=True,
                colorbar=dict(title="MW"),
                opacity=0.85,
            ),
            customdata=plot_buses[["generator_capacity_MW"]],
            hovertemplate="<b>%{text}</b><br>Capacity: %{customdata[0]:,.1f} MW<extra></extra>",
            name="Buses",
        )
    )

    fig.update_layout(
        title=f"Taiwan Network Spatial Overview: {run_name}",
        mapbox_style="open-street-map",
        mapbox_zoom=6.2,
        mapbox_center=dict(lat=float(plot_buses.y.mean()), lon=float(plot_buses.x.mean())),
        margin=dict(l=0, r=0, t=40, b=0),
        height=700,
    )
    return fig


def build_sanity_checks(network, result_path, load, snapshot_weight, generation_gwh):
    checks = {}
    checks["result_file_exists"] = Path(result_path).exists()
    checks["objective_is_finite"] = pd.notna(getattr(network, "objective", None))
    checks["load_total_GWh"] = (load * snapshot_weight).sum() / 1e3 if not load.empty else 0.0
    checks["generation_total_GWh"] = generation_gwh.sum() if not generation_gwh.empty else 0.0
    checks["generator_dispatch_has_nan"] = (
        bool(network.generators_t.p.isna().any().any()) if not network.generators_t.p.empty else False
    )
    checks["negative_generator_dispatch_MWh"] = float(
        network.generators_t.p.where(network.generators_t.p < -1e-6, 0).sum().sum()
    ) if not network.generators_t.p.empty else 0.0
    return pd.Series(checks).to_frame("value")


def build_sanity_checks_by_run(run_networks, run_result_paths, generation_by_run):
    records = []
    for run_name, network in run_networks.items():
        snapshot_weight = network.snapshot_weightings.generators.reindex(network.snapshots).fillna(1.0)
        load = (
            network.loads_t.p_set.sum(axis=1)
            if not network.loads_t.p_set.empty
            else pd.Series(index=network.snapshots, dtype=float)
        )
        records.append(
            {
                "run": run_name,
                "result_file_exists": Path(run_result_paths[run_name]).exists(),
                "objective_is_finite": pd.notna(getattr(network, "objective", None)),
                "load_total_GWh": (load * snapshot_weight).sum() / 1e3 if not load.empty else 0.0,
                "generation_total_GWh": generation_by_run.get(run_name, pd.Series(dtype=float)).sum(),
                "generator_dispatch_has_nan": (
                    bool(network.generators_t.p.isna().any().any()) if not network.generators_t.p.empty else False
                ),
                "negative_generator_dispatch_MWh": float(
                    network.generators_t.p.where(network.generators_t.p < -1e-6, 0).sum().sum()
                ) if not network.generators_t.p.empty else 0.0,
            }
        )
    return pd.DataFrame(records)
