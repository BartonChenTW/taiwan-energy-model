/* PyPSA-Earth Taiwan dashboard.
   Data comes from docs/data/, written by pypsa_tw/viewer/export_dashboard_data.py. */

// Technology groups in stack order, bottom to top. Colours come from CSS tokens.
const GROUPS = ["coal", "nuclear", "onwind", "storage", "solar", "offwind", "gas", "hydro", "other"];
const CARRIER_GROUP = {
  coal: "coal", lignite: "coal", nuclear: "nuclear", onwind: "onwind", PHS: "storage",
  battery: "storage", solar: "solar", "offwind-ac": "offwind", "offwind-dc": "offwind",
  CCGT: "gas", OCGT: "gas", ror: "hydro", hydro: "hydro", oil: "other", load: "other",
};
const AVAILABILITY_ORDER = ["solar", "onwind", "offwind-ac", "offwind-dc", "ror"];

const I18N = {
  en: {
    title: "Taiwan electricity model", nav_results: "Results", nav_inputs: "Inputs",
    nav_runs: "All runs", nav_findings: "Findings", select_case: "Run", results: "Results",
    energy_mix: "Generation mix", energy_mix_sub: "Annual energy by technology (TWh)",
    capacity: "Installed capacity", capacity_sub: "Capacity by technology (GW); capacity factor in the table",
    dispatch: "Dispatch",
    dispatch_sub: "National generation by technology and demand (GW). Storage charging is shown below zero. Drag to zoom, double-click to reset.",
    price: "Electricity price", price_sub: "Demand-weighted national marginal price (EUR/MWh)",
    map: "Network", map_sub: "Buses sized by demand; line width by capacity. Hover for loading.",
    show_table: "Show table", show_lines: "Show line table", show_buses: "Show demand by bus",
    inputs: "Inputs", demand: "Demand", demand_sub: "National electricity demand (GW)",
    availability: "Renewable availability",
    availability_sub: "Capacity-weighted availability per technology (0–1), from the weather data",
    technology: "Technology data", technology_sub: "Fleet and cost assumptions used in this run",
    all_runs: "All runs", inventory: "Run inventory", inventory_sub: "Select a row to view that run",
    compare_mix: "Generation mix by run", compare_mix_sub: "Share of annual generation (%)",
    findings: "Findings", details_in: "Details:",
    footer: "Generated from local model results by pypsa_tw/viewer/export_dashboard_data.py.",
    generated: "Data exported", t_demand: "Demand", t_co2: "CO₂ emissions", t_price: "Mean price",
    t_solve: "Solve time", t_solver_only: "solver only", t_rule: "whole step",
    technology_col: "Technology", capacity_col: "Capacity (GW)", energy_col: "Energy (TWh)",
    cf_col: "Capacity factor", count_col: "Units", mc_col: "Marginal cost (EUR/MWh)",
    cc_col: "Capital cost (EUR/MW/yr)", eff_col: "Efficiency", co2_col: "CO₂ (t/MWh fuel)",
    life_col: "Lifetime (yr)", hours_col: "Storage (h)", year_col: "Mean build year", ext_col: "Extendable",
    bus_col: "Bus", peak_col: "Peak (GW)", gen_col: "Generation (TWh)", price_col: "Mean price (EUR/MWh)",
    line_col: "Line", from_to: "From – to", snom_col: "Capacity (GW)", sopt_col: "Optimised (GW)",
    len_col: "Length (km)", load_mean_col: "Mean loading", load_max_col: "Max loading",
    status_col: "Status", run_col: "Run", grid_col: "Grid", solver_col: "Solver", period_col: "Period",
    buses_col: "Buses", time_col: "Solve (s)", co2_mt_col: "CO₂ (Mt)",
    yes: "yes", no: "no", demand_series: "Demand", grid_fixed: "fixed (v1.0)", grid_opt: "expandable (copt)",
    ok_label: "OK", warning_label: "Warning", critical_label: "Critical",
    no_issues: "No issues found by the automatic checks.",
    represents: (h, w) => `${h} h represented · ${w} h per snapshot`,
    loading_error: "Could not load the data. If you opened this file directly, serve the folder instead: python -m http.server -d docs",
  },
  zh: {
    title: "台灣電力系統模型", nav_results: "結果", nav_inputs: "輸入資料", nav_runs: "所有模擬",
    nav_findings: "發現", select_case: "模擬", results: "結果",
    energy_mix: "發電結構", energy_mix_sub: "各技術年發電量（TWh）",
    capacity: "裝置容量", capacity_sub: "各技術裝置容量（GW）；容量因數見表格",
    dispatch: "調度",
    dispatch_sub: "全國各技術發電量與需求（GW）。抽蓄充電顯示於零以下。拖曳可放大，雙擊可還原。",
    price: "電價", price_sub: "以需求加權的全國邊際電價（EUR/MWh）",
    map: "電網", map_sub: "節點大小代表需求；線寬代表容量。滑鼠移上可看負載率。",
    show_table: "顯示表格", show_lines: "顯示線路表", show_buses: "顯示各節點需求",
    inputs: "輸入資料", demand: "電力需求", demand_sub: "全國電力需求（GW）",
    availability: "再生能源可用率", availability_sub: "依容量加權的各技術可用率（0–1），來自氣象資料",
    technology: "技術資料", technology_sub: "本次模擬使用的機組與成本假設",
    all_runs: "所有模擬", inventory: "模擬清單", inventory_sub: "點選一列以查看該模擬",
    compare_mix: "各模擬發電結構", compare_mix_sub: "年發電量占比（%）",
    findings: "發現", details_in: "詳細紀錄：",
    footer: "由 pypsa_tw/viewer/export_dashboard_data.py 從本機模擬結果產生。",
    generated: "資料匯出時間", t_demand: "電力需求", t_co2: "CO₂ 排放", t_price: "平均電價",
    t_solve: "求解時間", t_solver_only: "僅求解器", t_rule: "整個步驟",
    technology_col: "技術", capacity_col: "容量（GW）", energy_col: "發電量（TWh）",
    cf_col: "容量因數", count_col: "機組數", mc_col: "邊際成本（EUR/MWh）",
    cc_col: "資本成本（EUR/MW/年）", eff_col: "效率", co2_col: "CO₂（t/MWh 燃料）",
    life_col: "壽命（年）", hours_col: "儲能時數（h）", year_col: "平均商轉年", ext_col: "可擴建",
    bus_col: "節點", peak_col: "尖峰（GW）", gen_col: "發電量（TWh）", price_col: "平均電價（EUR/MWh）",
    line_col: "線路", from_to: "起訖", snom_col: "容量（GW）", sopt_col: "最佳化後（GW）",
    len_col: "長度（km）", load_mean_col: "平均負載率", load_max_col: "最大負載率",
    status_col: "狀態", run_col: "模擬", grid_col: "電網", solver_col: "求解器", period_col: "期間",
    buses_col: "節點數", time_col: "求解（秒）", co2_mt_col: "CO₂（百萬噸）",
    yes: "是", no: "否", demand_series: "需求", grid_fixed: "固定（v1.0）", grid_opt: "可擴建（copt）",
    ok_label: "正常", warning_label: "注意", critical_label: "嚴重",
    no_issues: "自動檢查未發現問題。",
    represents: (h, w) => `代表 ${h} 小時 · 每個時段 ${w} 小時`,
    loading_error: "無法載入資料。若直接開啟檔案，請改用本機伺服器：python -m http.server -d docs",
  },
};

const GROUP_LABEL = {
  en: { coal: "Coal", nuclear: "Nuclear", onwind: "Onshore wind", storage: "Pumped hydro",
        solar: "Solar PV", offwind: "Offshore wind", gas: "Gas", hydro: "Hydro", other: "Other (oil)" },
  zh: { coal: "燃煤", nuclear: "核能", onwind: "陸域風電", storage: "抽蓄水力", solar: "太陽光電",
        offwind: "離岸風電", gas: "燃氣", hydro: "水力", other: "其他（燃油）" },
};
const CARRIER_LABEL = {
  en: { CCGT: "Gas (CCGT)", OCGT: "Gas (OCGT)", coal: "Coal", lignite: "Lignite", nuclear: "Nuclear",
        oil: "Oil", solar: "Solar PV", onwind: "Onshore wind", "offwind-ac": "Offshore wind (AC)",
        "offwind-dc": "Offshore wind (DC)", ror: "Run-of-river hydro", hydro: "Reservoir hydro",
        PHS: "Pumped hydro", load: "Load shedding" },
  zh: { CCGT: "燃氣複循環", OCGT: "燃氣單循環", coal: "燃煤", lignite: "褐煤", nuclear: "核能", oil: "燃油",
        solar: "太陽光電", onwind: "陸域風電", "offwind-ac": "離岸風電（交流）", "offwind-dc": "離岸風電（直流）",
        ror: "川流式水力", hydro: "水庫式水力", PHS: "抽蓄水力", load: "切負載" },
};

const FINDINGS = {
  en: [
    "<b>Isolated buses fixed.</b> Two cluster buses (TW1 0, TW2 0) came from disconnected pieces of the OpenStreetMap grid. Since the config fetches small isolated subnetworks into the main grid, every run has one connected network and no load shedding.",
    "<b>Weather data gap (fixed).</b> Runs before 2026-09-23 used a weather file covering only 2013-03-01 to 03-06. Outside those days solar, wind and run-of-river were treated as fully available, so those results overstate renewables. The runs are flagged in the table; they are replaced by runs with a full-year 2013 weather file.",
    "<b>Today's grid kept fixed.</b> Runs with grid “v1.0” keep transmission at today's capacity. Earlier “copt” runs let lines expand (Test 2 added 4.4 GW).",
    "<b>Input data still to review (Phase 3).</b> The fleet includes 5.3 GW of nuclear, but Taiwan's last reactor shut down in May 2025. Pumped hydro has no storage hours. Demand (≈336 TWh) looks high against recent statistics. Costs come from 2030 projections.",
  ],
  zh: [
    "<b>孤立節點已修正。</b>兩個叢集節點（TW1 0、TW2 0）源自 OpenStreetMap 電網中互不相連的部分。設定改為把小型孤立子網路併入主網後，每次模擬都只有一個相連電網，且不需切負載。",
    "<b>氣象資料缺漏（已修正）。</b>2026-09-23 之前的模擬使用只涵蓋 2013-03-01 至 03-06 的氣象檔。這幾天以外，太陽光電、風電與川流式水力都被視為滿載可用，因此高估再生能源。這些模擬已在表格中標示，並由使用 2013 全年氣象檔的新模擬取代。",
    "<b>維持現有電網。</b>電網標示為「v1.0」的模擬維持目前輸電容量；較早的「copt」模擬允許線路擴建（Test 2 增加 4.4 GW）。",
    "<b>輸入資料仍待檢視（第三階段）。</b>機組資料包含 5.3 GW 核能，但台灣最後一部核電機組已於 2025 年 5 月停機；抽蓄水力沒有儲能時數；電力需求（約 336 TWh）相較近年統計偏高；成本資料採用 2030 年預估值。",
  ],
};

const state = { lang: "en", index: null, current: null, cache: {} };

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const t = (key) => I18N[state.lang][key] ?? key;
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const groupColor = (g) => cssVar(`--c-${g}`);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function nf(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return new Intl.NumberFormat(state.lang === "zh" ? "zh-TW" : "en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}
const pct = (v, d = 0) => (v === null || v === undefined ? "–" : `${nf(v * 100, d)}%`);

function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }

function groupSum(byCarrier) {
  const out = {};
  for (const [carrier, v] of Object.entries(byCarrier || {})) {
    const g = CARRIER_GROUP[carrier] || "other";
    out[g] = (out[g] || 0) + (v || 0);
  }
  return out;
}

function severityOf(summary) {
  if (summary.warnings.some((w) => w.severity === "critical")) return "critical";
  if (summary.warnings.length) return "warning";
  return "good";
}

function warningText(w) {
  const zh = state.lang === "zh";
  const carrier = (c) => CARRIER_LABEL[state.lang][c] || c;
  switch (w.code) {
    case "subnetworks": return zh ? `電網分成 ${w.n} 個互不相連的子網路` : `${w.n} disconnected subnetworks`;
    case "load_shedding": return zh ? `使用切負載 ${nf(w.gwh)} GWh` : `Load shedding used: ${nf(w.gwh)} GWh`;
    case "cf_implausible":
      return zh ? `${carrier(w.carrier)} 容量因數 ${pct(w.cf)} 不合理（上限約 ${pct(w.limit)}）`
                : `${carrier(w.carrier)} capacity factor ${pct(w.cf)} is implausible (limit about ${pct(w.limit)})`;
    case "availability_saturated":
      return zh ? `太陽光電在 ${pct(w.share)} 的時段可用率為 1.0（氣象資料缺漏）`
                : `Solar availability is 1.0 in ${pct(w.share)} of snapshots (weather data gap)`;
    case "gens_extendable": return zh ? "部分發電機組可擴建" : "Some generators are extendable";
    case "lines_extendable":
      return zh ? `輸電線路可擴建，增加 ${nf(w.added_gw)} GW` : `Transmission lines can expand; ${nf(w.added_gw)} GW added`;
    default: return w.code;
  }
}

function caseLabel(s) {
  const grid = s.transmission ? ` · ${s.transmission}` : "";
  return `${s.run}${grid}`;
}

function gridLabel(s) {
  if (!s.transmission) return "–";
  return s.transmission === "v1.0" ? t("grid_fixed") : s.transmission === "copt" ? t("grid_opt") : s.transmission;
}

function statusBadge(sev) {
  const label = { good: t("ok_label"), warning: t("warning_label"), critical: t("critical_label") }[sev];
  return `<span class="badge"><span class="dot" style="background:var(--${sev})"></span>${label}</span>`;
}

function table(headers, rows) {
  const head = headers.map(([label, num]) => `<th${num ? ' class="num"' : ""}>${label}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map(([v, num]) => `<td${num ? ' class="num"' : ""}>${v}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const swatch = (g) => `<span class="swatch" style="background:${groupColor(g)}"></span>`;

// ---------- Plotly theming ----------
function baseLayout(extra = {}) {
  const ink2 = cssVar("--ink-2");
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return {
    paper_bgcolor: cssVar("--surface"),
    plot_bgcolor: cssVar("--surface"),
    font: { family: cssVar("--font"), color: ink2, size: 12 },
    margin: { l: 8, r: 12, t: 8, b: 8 },
    xaxis: { ...axis, ...(extra.xaxis || {}) },
    yaxis: { ...axis, ...(extra.yaxis || {}) },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", font: { color: ink2, size: 12 } },
    hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"),
                  font: { color: cssVar("--ink"), family: cssVar("--font") } },
    barcornerradius: 4,
    ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "xaxis" && k !== "yaxis")),
  };
}
const plotConfig = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

// ---------- rendering ----------
function renderStatus(s) {
  const el = $("case-status");
  if (!s.warnings.length) {
    el.innerHTML = `<div class="status good"><span class="icon" aria-hidden="true">✓</span><span><b>${t("ok_label")}</b> · ${t("no_issues")}</span></div>`;
    return;
  }
  el.innerHTML = s.warnings.map((w) => {
    const label = w.severity === "critical" ? t("critical_label") : t("warning_label");
    return `<div class="status ${w.severity}"><span class="icon" aria-hidden="true">!</span><span><b>${label}</b> · ${esc(warningText(w))}</span></div>`;
  }).join("");
}

function renderTiles(s) {
  const tile = (label, value, unit, note = "") =>
    `<div class="tile"><div class="label">${label}</div><div class="value">${value}<span class="unit">${unit}</span></div>${note ? `<div class="note">${note}</div>` : ""}</div>`;
  const solve = s.solver_s !== null ? nf(s.solver_s, 2) : nf(s.solve_rule_s, 1);
  const solveNote = `${s.solver || ""} · ${t("t_solver_only")}; ${t("t_rule")} ${nf(s.solve_rule_s, 1)} s`;
  $("tiles").innerHTML = [
    tile(t("t_demand"), nf(s.demand_TWh, 1), "TWh", t("represents")(nf(s.represented_hours, 0), nf(s.weight_h_per_snapshot, 1))),
    tile(t("t_co2"), nf(s.co2_Mt, 1), "Mt"),
    tile(t("t_price"), nf(s.price_mean, 1), "EUR/MWh"),
    tile(t("t_solve"), solve, "s", solveNote),
  ].join("");
}

function carrierBars(targetId, byGroup, unit, digits) {
  const groups = GROUPS.filter((g) => (byGroup[g] || 0) > 1e-6);
  const labels = groups.map((g) => GROUP_LABEL[state.lang][g]);
  const values = groups.map((g) => byGroup[g]);
  Plotly.react(targetId, [{
    type: "bar", orientation: "h", y: labels, x: values,
    marker: { color: groups.map(groupColor), line: { color: cssVar("--surface"), width: 2 } },
    text: values.map((v) => nf(v, digits)), textposition: "outside", cliponaxis: false,
    textfont: { color: cssVar("--ink-2") },
    hovertemplate: `%{y}: %{x:.${digits}f} ${unit}<extra></extra>`,
  }], baseLayout({ yaxis: { autorange: "reversed" }, xaxis: { title: { text: unit, font: { size: 11 } } }, showlegend: false }), plotConfig);
}

function renderMix(d) {
  const energy = groupSum(d.results.energy_TWh);
  const cap = groupSum(d.results.capacity_GW);
  carrierBars("chart-energy", energy, "TWh", 1);
  carrierBars("chart-capacity", cap, "GW", 1);

  const groups = GROUPS.filter((g) => (energy[g] || 0) > 1e-6 || (cap[g] || 0) > 1e-6);
  const total = Object.values(energy).reduce((a, b) => a + b, 0);
  $("table-energy").innerHTML = table(
    [[t("technology_col")], [t("energy_col"), 1], ["%", 1]],
    groups.map((g) => [[swatch(g) + GROUP_LABEL[state.lang][g]], [nf(energy[g] || 0, 1), 1], [pct((energy[g] || 0) / total, 1), 1]]),
  );
  const hours = d.summary.represented_hours;
  $("table-capacity").innerHTML = table(
    [[t("technology_col")], [t("capacity_col"), 1], [t("cf_col"), 1]],
    groups.map((g) => [[swatch(g) + GROUP_LABEL[state.lang][g]], [nf(cap[g] || 0, 2), 1],
      [cap[g] ? pct((energy[g] || 0) * 1e3 / (cap[g] * hours), 1) : "–", 1]]),
  );
}

function renderDispatch(d) {
  const x = d.inputs.time;
  const byGroup = {};
  for (const [carrier, series] of Object.entries(d.results.dispatch_MW)) {
    const g = CARRIER_GROUP[carrier] || "other";
    byGroup[g] = byGroup[g] ? byGroup[g].map((v, i) => v + series[i]) : series.slice();
  }
  const traces = [];
  for (const g of GROUPS) {
    const s = byGroup[g];
    if (!s || s.every((v) => Math.abs(v) < 1)) continue;
    const common = { type: "scatter", mode: "lines", x, line: { width: 0 }, fillcolor: groupColor(g),
                     name: GROUP_LABEL[state.lang][g], legendgroup: g,
                     hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{y:.1f} GW<extra></extra>` };
    const pos = s.map((v) => Math.max(v, 0) / 1e3);
    const neg = s.map((v) => Math.min(v, 0) / 1e3);
    if (pos.some((v) => v > 1e-3)) traces.push({ ...common, y: pos, stackgroup: "pos" });
    if (neg.some((v) => v < -1e-3)) traces.push({ ...common, y: neg, stackgroup: "neg", showlegend: false });
  }
  traces.push({ type: "scatter", mode: "lines", x, y: d.inputs.demand_MW.map((v) => v / 1e3),
                name: t("demand_series"), line: { color: cssVar("--ink"), width: 2 },
                hovertemplate: `${t("demand_series")}: %{y:.1f} GW<extra></extra>` });
  Plotly.react("chart-dispatch", traces, baseLayout({
    hovermode: "x unified", yaxis: { title: { text: "GW", font: { size: 11 } } },
    xaxis: { showspikes: true, spikemode: "across", spikethickness: 1, spikecolor: cssVar("--axis"), spikedash: "solid" },
  }), plotConfig);
}

function singleLine(targetId, x, y, name, unit, color, digits = 1) {
  Plotly.react(targetId, [{ type: "scatter", mode: "lines", x, y, name, line: { color, width: 2 },
    hovertemplate: `%{x}<br>${name}: %{y:.${digits}f} ${unit}<extra></extra>` }],
    baseLayout({ showlegend: false, hovermode: "x", yaxis: { title: { text: unit, font: { size: 11 } } } }), plotConfig);
}

function renderPrice(d) {
  singleLine("chart-price", d.inputs.time, d.results.price_national, t("price"), "EUR/MWh", cssVar("--accent"), 1);
}

function renderMap(d) {
  const buses = Object.fromEntries(d.results.buses.map((b) => [b.name, b]));
  const lines = d.results.lines;
  const maxCap = Math.max(...lines.map((l) => l.s_nom_opt_MVA || 0), 1);
  const lineColor = cssVar("--ink-2");
  // scattergeo needs no WebGL or tile server, so the map renders everywhere.
  const traces = lines.map((l) => ({
    type: "scattergeo", mode: "lines", hoverinfo: "skip", showlegend: false,
    lon: [buses[l.bus0].x, buses[l.bus1].x], lat: [buses[l.bus0].y, buses[l.bus1].y],
    line: { color: lineColor, width: 1.5 + 6 * (l.s_nom_opt_MVA / maxCap) },
  }));
  traces.push({
    type: "scattergeo", mode: "markers", showlegend: false,
    lon: lines.map((l) => (buses[l.bus0].x + buses[l.bus1].x) / 2),
    lat: lines.map((l) => (buses[l.bus0].y + buses[l.bus1].y) / 2),
    marker: { size: 14, opacity: 0 },
    hovertemplate: lines.map((l) => `${esc(l.bus0)} – ${esc(l.bus1)}<br>${nf(l.s_nom_opt_MVA / 1e3, 1)} GW · ${t("load_mean_col")} ${pct(l.loading_mean)} · ${t("load_max_col")} ${pct(l.loading_max)}<extra></extra>`),
  });
  const maxDemand = Math.max(...d.results.buses.map((b) => b.demand_TWh || 0), 1);
  traces.push({
    type: "scattergeo", mode: "markers+text", showlegend: false,
    lon: d.results.buses.map((b) => b.x), lat: d.results.buses.map((b) => b.y),
    text: d.results.buses.map((b) => b.name),
    textposition: d.results.buses.map((b) => (b.x < 120.9 ? "middle left" : "middle right")),
    textfont: { color: cssVar("--ink-2"), size: 11 },
    marker: { size: d.results.buses.map((b) => 10 + 22 * Math.sqrt((b.demand_TWh || 0) / maxDemand)), color: cssVar("--accent"),
              line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: d.results.buses.map((b) => `${esc(b.name)}<br>${t("t_demand")} ${nf(b.demand_TWh, 1)} TWh · ${t("peak_col")} ${nf(b.peak_GW, 1)}<br>${t("gen_col")} ${nf(b.generation_TWh, 1)}<extra></extra>`),
  });
  // Invisible corner points so the fitted view always shows the whole main island.
  traces.push({ type: "scattergeo", mode: "markers", lon: [119.9, 122.1], lat: [21.85, 25.35],
                marker: { size: 1, opacity: 0 }, hoverinfo: "skip", showlegend: false });
  Plotly.react("chart-map", traces, baseLayout({
    geo: {
      projection: { type: "mercator" }, resolution: 50, fitbounds: "locations",
      bgcolor: cssVar("--surface"), showland: true, landcolor: cssVar("--wash"), showocean: true,
      oceancolor: cssVar("--surface"), showcoastlines: true, coastlinecolor: cssVar("--axis"),
      showcountries: false, showframe: false, showlakes: false,
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
  }), plotConfig);

  $("table-lines").innerHTML = table(
    [[t("from_to")], [t("snom_col"), 1], [t("sopt_col"), 1], [t("len_col"), 1], [t("load_mean_col"), 1], [t("load_max_col"), 1]],
    lines.map((l) => [[`${esc(l.bus0)} – ${esc(l.bus1)}`], [nf(l.s_nom_MVA / 1e3, 2), 1], [nf(l.s_nom_opt_MVA / 1e3, 2), 1],
      [nf(l.length_km, 0), 1], [pct(l.loading_mean), 1], [pct(l.loading_max), 1]]),
  );
}

function renderInputs(d) {
  singleLine("chart-demand", d.inputs.time, d.inputs.demand_MW.map((v) => v / 1e3), t("demand_series"), "GW", cssVar("--ink-2"), 1);
  $("table-buses").innerHTML = table(
    [[t("bus_col")], [`${t("t_demand")} (TWh)`, 1], [t("peak_col"), 1], [t("gen_col"), 1], [t("price_col"), 1]],
    d.results.buses.map((b) => [[esc(b.name)], [nf(b.demand_TWh, 1), 1], [nf(b.peak_GW, 1), 1], [nf(b.generation_TWh, 1), 1], [nf(b.price_mean, 1), 1]]),
  );

  // Small multiples: one row per technology, shared time axis.
  const carriers = AVAILABILITY_ORDER.filter((c) => d.inputs.availability[c]);
  const rows = carriers.length;
  const gap = 0.06;
  const h = (1 - gap * (rows - 1)) / rows;
  const layout = baseLayout({ showlegend: false, hovermode: "x unified", margin: { l: 8, r: 12, t: 18, b: 8 } });
  const traces = carriers.map((c, i) => {
    const axis = i === 0 ? "" : String(i + 1);
    const top = 1 - i * (h + gap);
    layout[`yaxis${axis}`] = { ...layout.yaxis, domain: [top - h, top], range: [0, 1.05], tickvals: [0, 0.5, 1] };
    layout[`xaxis${axis}`] = { ...layout.xaxis, anchor: `y${axis}`, matches: i === 0 ? undefined : "x", showticklabels: i === rows - 1 };
    const mean = d.inputs.availability_mean[c];
    (layout.annotations ||= []).push({ text: `${CARRIER_LABEL[state.lang][c] || c} · ${state.lang === "zh" ? "平均" : "mean"} ${nf(mean, 2)}`,
      xref: "paper", yref: "paper", x: 0, y: top + 0.01, xanchor: "left", yanchor: "bottom", showarrow: false,
      font: { size: 11, color: cssVar("--ink-2") } });
    return { type: "scatter", mode: "lines", x: d.inputs.time, y: d.inputs.availability[c], xaxis: `x${axis}`, yaxis: `y${axis}`,
             name: CARRIER_LABEL[state.lang][c] || c, line: { width: 1.2, color: groupColor(CARRIER_GROUP[c]) },
             hovertemplate: `${CARRIER_LABEL[state.lang][c] || c}: %{y:.2f}<extra></extra>` };
  });
  Plotly.react("chart-availability", traces, layout, plotConfig);

  $("table-technology").innerHTML = table(
    [[t("technology_col")], [t("count_col"), 1], [t("capacity_col"), 1], [t("mc_col"), 1], [t("cc_col"), 1],
     [t("eff_col"), 1], [t("co2_col"), 1], [t("life_col"), 1], [t("hours_col"), 1], [t("year_col"), 1], [t("ext_col")]],
    d.inputs.technology.map((r) => [
      [swatch(CARRIER_GROUP[r.carrier] || "other") + esc(CARRIER_LABEL[state.lang][r.carrier] || r.carrier)],
      [r.count, 1], [nf(r.p_nom_GW, 2), 1], [nf(r.marginal_cost, 2), 1], [nf(r.capital_cost, 0), 1],
      [nf(r.efficiency, 2), 1], [nf(r.co2_t_per_MWh_fuel, 3), 1], [nf(r.lifetime, 0), 1], [r.max_hours === undefined ? "–" : nf(r.max_hours, 1), 1],
      [r.build_year_mean ? String(Math.round(r.build_year_mean)) : "–", 1], [r.extendable ? t("yes") : t("no")],
    ]),
  );
}

function renderRuns() {
  const cases = state.index.cases;
  const rows = cases.map((s) => {
    const sel = s.id === state.current ? " selected" : "";
    const period = `${s.start.slice(0, 10)} → ${s.end.slice(0, 10)} · ${nf(s.step_h, 0)}h`;
    const time = s.solver_s !== null ? `${nf(s.solver_s, 2)} / ${nf(s.solve_rule_s, 1)}` : nf(s.solve_rule_s, 1);
    return `<tr class="clickable${sel}" data-id="${esc(s.id)}" tabindex="0">
      <td>${statusBadge(severityOf(s))}</td><td>${esc(s.run)}</td><td>${gridLabel(s)}</td><td>${esc(s.solver || "–")}</td>
      <td>${period}</td><td class="num">${s.buses}</td><td class="num">${time}</td>
      <td class="num">${nf(s.demand_TWh, 1)}</td><td class="num">${nf(s.co2_Mt, 1)}</td></tr>`;
  }).join("");
  $("table-runs").innerHTML = `<table><thead><tr><th>${t("status_col")}</th><th>${t("run_col")}</th><th>${t("grid_col")}</th>
    <th>${t("solver_col")}</th><th>${t("period_col")}</th><th class="num">${t("buses_col")}</th><th class="num">${t("time_col")}</th>
    <th class="num">${t("t_demand")} (TWh)</th><th class="num">${t("co2_mt_col")}</th></tr></thead><tbody>${rows}</tbody></table>`;
  $("table-runs").querySelectorAll("tr[data-id]").forEach((tr) => {
    const go = () => { selectCase(tr.dataset.id); document.getElementById("results").scrollIntoView(); };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });
}

async function renderCompare() {
  const details = await Promise.all(state.index.cases.map((s) => loadCase(s.id)));
  const labels = state.index.cases.map(caseLabel);
  const shares = details.map((d) => {
    const g = groupSum(d.results.energy_TWh);
    const total = Object.values(g).reduce((a, b) => a + b, 0) || 1;
    return { g, total };
  });
  const traces = GROUPS.filter((g) => shares.some((s) => (s.g[g] || 0) > 1e-6)).map((g) => ({
    type: "bar", orientation: "h", name: GROUP_LABEL[state.lang][g], y: labels,
    x: shares.map((s) => (100 * (s.g[g] || 0)) / s.total),
    customdata: shares.map((s) => s.g[g] || 0),
    marker: { color: groupColor(g), line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{x:.1f}% · %{customdata:.1f} TWh<extra></extra>`,
  }));
  $("chart-compare").style.height = `${Math.max(240, 60 + 44 * labels.length)}px`;
  Plotly.react("chart-compare", traces, baseLayout({
    barmode: "stack", barcornerradius: 0, xaxis: { range: [0, 100], ticksuffix: "%" }, yaxis: { autorange: "reversed" },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 12 } },
  }), plotConfig);
}

function renderFindings() {
  $("findings-list").innerHTML = FINDINGS[state.lang].map((f) => `<li>${f}</li>`).join("");
}

function applyStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
  $("generated").textContent = state.index ? `${t("generated")}: ${state.index.generated}` : "";
  const select = $("case-select");
  if (state.index) {
    select.innerHTML = state.index.cases.map((s) => {
      const sev = { good: "✓", warning: "!", critical: "✕" }[severityOf(s)];
      return `<option value="${esc(s.id)}">${sev} ${esc(caseLabel(s))}</option>`;
    }).join("");
    select.value = state.current;
  }
}

async function loadCase(id) {
  if (!state.cache[id]) {
    const res = await fetch(`data/cases/${encodeURIComponent(id)}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
    state.cache[id] = await res.json();
  }
  return state.cache[id];
}

async function renderAll() {
  applyStaticText();
  renderFindings();
  const d = await loadCase(state.current);
  renderStatus(d.summary);
  renderTiles(d.summary);
  renderMix(d);
  renderDispatch(d);
  renderPrice(d);
  renderMap(d);
  renderInputs(d);
  renderRuns();
  await renderCompare();
}

async function selectCase(id) {
  state.current = id;
  const url = new URL(location.href);
  url.searchParams.set("case", id);
  history.replaceState(null, "", url);
  await renderAll();
}

function defaultCase(cases) {
  const requested = new URL(location.href).searchParams.get("case");
  if (requested && cases.some((c) => c.id === requested)) return requested;
  const clean = cases.filter((c) => severityOf(c) === "good");
  const pick = clean.find((c) => c.run.includes("test2")) || clean[0] || cases[cases.length - 1];
  return pick.id;
}

function setupControls() {
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang;
    storageSet("tw-lang", state.lang);
    renderAll();
  }));
  $("case-select").addEventListener("change", (e) => selectCase(e.target.value));
  $("theme-toggle").addEventListener("click", () => {
    const dark = cssVar("color-scheme") === "dark";
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storageSet("tw-theme", next);
    renderAll();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) renderAll();
  });
}

async function init() {
  const urlLang = new URL(location.href).searchParams.get("lang");
  state.lang = (urlLang || storageGet("tw-lang")) === "zh" ? "zh" : "en";
  const theme = storageGet("tw-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  setupControls();
  try {
    const res = await fetch("data/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.index = await res.json();
    state.current = defaultCase(state.index.cases);
    await renderAll();
  } catch (err) {
    applyStaticText();
    $("case-status").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${esc(t("loading_error"))}<br><small>${esc(err.message)}</small></span></div>`;
  }
}

init();
