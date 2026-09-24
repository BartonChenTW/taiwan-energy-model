/* Energy security page: blockade scenarios (data: docs/data/security/, written by
   pypsa_tw/viewer/export_dashboard_data.py from the sandbox blockade mode). */

const TX = {
  en: {
    type: "Fuel imports", t_normal: "Normal imports (reference)", t_full: "Full blockade: no LNG, coal or oil", t_lng: "LNG imports stop, coal and oil continue",
    days: "Length", d: (n) => `${n} days`, season: "Starts", summer: "1 July (summer peak)", winter: "7 January (winter)",
    options: "Options (one at a time)", o_none: "None", o_ration: "Ration demand by 20%", o_lng14: "LNG stock 14 days (2027 target)",
    o_nuclear: "Restart nuclear (Chinshan, Kuosheng, Maanshan)", o_res: "Solar +10 GW and batteries +5 GW",
    o_standby: "Restart standby and retired coal units (3.35 GW)", o_taichung: "Taichung power plant lost",
    o_tatan: "Tatan gas plant lost", o_corridor: "Half of the Taipei transmission corridor lost",
    exact: "Exact match", not_computed: "Not computed yet: showing the closest computed case", shown: "Showing",
    unserved: "Demand not met", unserved_note: (s, d) => `${s} of ${d} GWh demand in the window`,
    extra: "Caused by the blockade", extra_note: "extra unmet demand vs the same window with normal imports",
    worst: "Worst day", worst_note: "share of that day's demand not met", peak: "Largest shortfall", peak_note: "at a single moment",
    left: (f) => `${f} left at the end`, used_up: "used up (spread over the whole window)", left_note: "of the stock at the start",
    no_stock: "not drawn on", rationed_note: (r) => `includes ${r} GWh rationed on purpose`, normal_demand: "Demand without rationing",
    gas: "LNG (gas)", coal: "Coal", oil: "Oil",
    col_case: "Case", col_unserved: "Demand not met", col_worst: "Worst day", col_extra: "Caused by the blockade",
    season_short: { summer: "summer", winter: "winter" }, sep: ", ",
    l_normal: "normal imports", l_full: "full blockade", l_lng: "LNG cut", l_opt: {
      ration: "20% rationing", lng14: "LNG stock 14 d", nuclear: "nuclear restarted", res: "solar +10 GW, batteries +5 GW",
      standby: "standby coal restarted", taichung: "Taichung lost", tatan: "Tatan lost", corridor: "Taipei lines halved" },
    demand: "Demand", stocks_title: "Taiwan's fuel stocks",
    f_fuel: "Fuel", f_stock: "Stock", f_rule: "Rule", f_source: "Source (to verify)",
    meta: (g) => `Data exported ${g}.`,
    groups: { coal: "Coal", nuclear: "Nuclear", onwind: "Onshore wind", storage: "Storage", solar: "Solar PV", offwind: "Offshore wind",
              gas: "Gas", hydro: "Hydro", oil: "Oil", other: "Other", unserved: "Demand not met" },
  },
  zh: {
    type: "燃料進口", t_normal: "正常進口（參考）", t_full: "完全封鎖：液化天然氣、燃煤、燃油皆停止", t_lng: "液化天然氣停止進口，燃煤與燃油照常",
    days: "期間", d: (n) => `${n} 天`, season: "開始", summer: "7 月 1 日（夏季尖峰）", winter: "1 月 7 日（冬季）",
    options: "選項（一次一項）", o_none: "無", o_ration: "需求配給減少 20%", o_lng14: "液化天然氣存量 14 天（2027 年目標）",
    o_nuclear: "重啟核電（核一、核二、核三）", o_res: "太陽光電 +10 GW、電池 +5 GW",
    o_standby: "重啟備用及已除役燃煤機組（3.35 GW）", o_taichung: "台中電廠受損",
    o_tatan: "大潭燃氣電廠受損", o_corridor: "進入台北的輸電走廊損失一半",
    exact: "完全符合", not_computed: "尚未計算：顯示最接近的已計算情境", shown: "顯示",
    unserved: "未能供應的需求", unserved_note: (s, d) => `期間需求 ${d} GWh 中的 ${s}`,
    extra: "封鎖造成", extra_note: "相較同期正常進口多出的未供電量",
    worst: "最嚴重的一天", worst_note: "當日未能供應的需求比例", peak: "最大缺口", peak_note: "單一時點",
    left: (f) => `期末剩餘${f}`, used_up: "用盡（平均分配於整個期間）", left_note: "占起始存量",
    no_stock: "未動用", rationed_note: (r) => `含主動配給減少的 ${r} GWh`, normal_demand: "未配給時的需求",
    gas: "液化天然氣", coal: "燃煤", oil: "燃油",
    col_case: "情境", col_unserved: "未供電", col_worst: "最嚴重的一天", col_extra: "封鎖造成",
    season_short: { summer: "夏季", winter: "冬季" }, sep: "、",
    l_normal: "正常進口", l_full: "完全封鎖", l_lng: "液化天然氣中斷", l_opt: {
      ration: "配給 20%", lng14: "液化天然氣存量 14 天", nuclear: "重啟核電", res: "太陽光電 +10 GW、電池 +5 GW",
      standby: "重啟備用燃煤機組", taichung: "台中電廠受損", tatan: "大潭電廠受損", corridor: "台北線路減半" },
    demand: "需求", stocks_title: "台灣的燃料存量",
    f_fuel: "燃料", f_stock: "存量", f_rule: "規定", f_source: "來源（待查證）",
    meta: (g) => `資料匯出時間 ${g}。`,
    groups: { coal: "燃煤", nuclear: "核能", onwind: "陸域風電", storage: "儲能", solar: "太陽光電", offwind: "離岸風電",
              gas: "燃氣", hydro: "水力", oil: "燃油", other: "其他", unserved: "未能供應的需求" },
  },
};

// Fuel stocks: secondary sources found on 2026-09-24, still to verify against official pages.
const STOCKS = [
  { fuel: "gas", stock: { en: "about 11 days", zh: "約 11 天" }, rule: { en: "at least 7 days (2019), 14 days from 2027", zh: "至少 7 天（2019 年），2027 年起 14 天" },
    src: [["S&P Global, 2024", "https://www.spglobal.com/energy/en/news-research/latest-news/lng/053024-taiwan-vulnerable-to-lng-supply-risks-in-the-event-of-a-maritime-blockade"],
          ["Energy Administration", "https://www.moeaea.gov.tw/ECW/english/content/Content.aspx?menu_id=8677"]] },
  { fuel: "coal", stock: { en: "about 41 days (Taipower, 2022)", zh: "約 41 天（台電，2022 年）" }, rule: { en: "no legal minimum found", zh: "未找到法定下限" },
    src: [["Taipei Times, 2022", "https://www.taipeitimes.com/News/biz/archives/2022/08/04/2003782917"]] },
  { fuel: "oil", stock: { en: "146 days (2022); over 100 days (2026)", zh: "146 天（2022 年）；逾 100 天（2026 年）" },
    rule: { en: "60 days (industry) + 30 days (government), Petroleum Administration Act", zh: "業者 60 天＋政府 30 天（石油管理法）" },
    src: [["Taipei Times, 2026", "https://www.taipeitimes.com/News/biz/archives/2026/03/06/2003853325"],
          ["Global Taiwan Institute, 2022", "https://globaltaiwan.org/2022/05/assessing-taiwans-strategic-energy-stockpiles/"]] },
];

const ORDER = ["coal", "nuclear", "onwind", "storage", "solar", "offwind", "gas", "hydro", "oil", "other", "unserved"];
const COLOR = { oil: "--c-other", other: "--c-other_re" };
const state = { index: null, cache: {}, ctl: { type: "full", days: 30, season: "summer", option: "none" } };
const $ = (id) => document.getElementById(id);
const lang = () => (window.twLang ? window.twLang() : "en");
const T = () => TX[lang()];
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (v, d = 0) => (v === null || v === undefined ? "–" : new Intl.NumberFormat(lang() === "zh" ? "zh-TW" : "en-US",
  { maximumFractionDigits: d, minimumFractionDigits: d }).format(v));
const pct = (v, d = 1) => (v === null || v === undefined ? "–" : `${nf(v * 100, d)}%`);
const cfg = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

function layout(extra = {}) {
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return { paper_bgcolor: cssVar("--surface"), plot_bgcolor: cssVar("--surface"), margin: { l: 8, r: 12, t: 8, b: 8 },
           font: { family: cssVar("--font"), color: cssVar("--ink-2"), size: 12 },
           legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 11 } },
           hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"), font: { color: cssVar("--ink") } },
           ...extra, xaxis: { ...axis, ...(extra.xaxis || {}) }, yaxis: { ...axis, ...(extra.yaxis || {}) } };
}

// ---------- which scenario do the controls describe? ----------
function signature(sec, lv) {
  const imports = [sec.lng_import_frac, sec.coal_import_frac, sec.oil_import_frac];
  const type = imports.every((v) => v === 1) ? "normal" : imports.every((v) => v === 0) ? "full" : imports[0] === 0 && imports[1] === 1 ? "lng" : "other";
  let option = "none";
  if (sec.rationing_frac > 0) option = "ration";
  else if (sec.lng_stock_days !== 11) option = "lng14";
  else if ((lv.nuclear_restart || []).length) option = "nuclear";
  else if ((lv.add_solar_GW || 0) > 0) option = "res";
  else if (sec.standby_restart.length) option = "standby";
  else if (sec.damage.includes("taichung")) option = "taichung";
  else if (sec.damage.includes("tatan")) option = "tatan";
  else if (sec.damage.includes("taipei_corridor")) option = "corridor";
  return { type, days: sec.blockade_days, season: sec.blockade_season, option };
}

function label(g) {
  const t = T();
  const parts = [t.d(g.days), t.season_short[g.season], { normal: t.l_normal, full: t.l_full, lng: t.l_lng }[g.type] || ""];
  if (g.option !== "none") parts.push(t.l_opt[g.option]);
  return parts.filter(Boolean).join(t.sep);
}
const labelOf = (s) => label(signature(s.security, s.levers));

function best() {
  const c = state.ctl;
  let top = null;
  for (const s of state.index.scenarios) {
    const g = signature(s.security, s.levers);
    const d = 4 * (g.type !== c.type) + 3 * (g.days !== c.days) + 3 * (g.season !== c.season) + 2 * (g.option !== c.option);
    if (!top || d < top.d) top = { s, d, g };
  }
  return top;
}

// ---------- controls ----------
function renderControls() {
  const t = T(), c = state.ctl;
  const radio = (name, value, label) => `<label class="check"><input type="radio" name="${name}" value="${value}" ${String(c[name]) === String(value) ? "checked" : ""}> ${esc(label)}</label>`;
  $("sec-controls").innerHTML = `
    <fieldset class="lever-group"><legend>${esc(t.type)}</legend>${radio("type", "full", t.t_full)}${radio("type", "lng", t.t_lng)}${radio("type", "normal", t.t_normal)}</fieldset>
    <fieldset class="lever-group"><legend>${esc(t.days)}</legend>${[14, 30, 60].map((d) => radio("days", d, t.d(d))).join("")}</fieldset>
    <fieldset class="lever-group"><legend>${esc(t.season)}</legend>${radio("season", "summer", t.summer)}${radio("season", "winter", t.winter)}</fieldset>
    <fieldset class="lever-group"><legend>${esc(t.options)}</legend>${["none", "ration", "lng14", "nuclear", "res", "standby", "taichung", "tatan", "corridor"]
      .map((o) => radio("option", o, t[`o_${o}`])).join("")}</fieldset>`;
  $("sec-controls").querySelectorAll("input[type=radio]").forEach((el) => el.addEventListener("change", () => {
    state.ctl[el.name] = el.name === "days" ? Number(el.value) : el.value;
    writeUrl();
    update();
  }));
}

function readUrl() {
  const q = new URL(location.href).searchParams;
  for (const k of ["type", "season", "option"]) if (q.has(k)) state.ctl[k] = q.get(k).slice(0, 20);
  if (q.has("days") && [14, 30, 60].includes(Number(q.get("days")))) state.ctl.days = Number(q.get("days"));
}

function writeUrl() {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(state.ctl)) url.searchParams.set(k, String(v));
  history.replaceState(null, "", url);
}

// ---------- results ----------
async function loadCase(hash) {
  if (!state.cache[hash]) {
    const res = await fetch(`data/security/cases/${hash}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.cache[hash] = await res.json();
  }
  return state.cache[hash];
}

function renderTiles(entry, c) {
  const t = T(), m = c.metrics;
  const tile = (label, value, unit, note) => `<div class="tile"><div class="label">${esc(label)}</div>
    <div class="value">${value}<span class="unit">${esc(unit)}</span></div><div class="note">${esc(note)}</div></div>`;
  const stockTile = (fuel) => {
    const left = (m.stock_left_pct || {})[fuel];
    if (left === undefined) return "";
    const v = Math.max(0, left);
    const note = v < 1 ? t.used_up : v > 99.5 ? t.no_stock : t.left_note;
    return tile(t.left(t[fuel]), nf(v), "%", note);
  };
  const shortNote = m.rationed_GWh ? `${t.unserved_note(`${nf(m.short_GWh)} GWh`, nf(m.normal_demand_GWh))}; ${t.rationed_note(nf(m.rationed_GWh))}`
    : t.unserved_note(`${nf(m.short_GWh)} GWh`, nf(m.normal_demand_GWh));
  $("sec-tiles").innerHTML = [
    tile(t.unserved, pct(m.short_share), "", shortNote),
    tile(t.extra, nf(entry.extra_short_GWh ?? null), "GWh", t.extra_note),
    tile(t.worst, pct(m.worst_day_share, 0), "", t.worst_note),
    tile(t.peak, nf(m.peak_shortfall_GW, 1), "GW", t.peak_note),
    stockTile("gas"), stockTile("coal"), stockTile("oil"),
  ].join("");
}

function renderCharts(c) {
  const t = T(), x = c.dates;
  const traces = ORDER.filter((g) => c.supply_GWh[g]).map((g) => ({
    type: "scatter", mode: "lines", x, y: c.supply_GWh[g], stackgroup: "one", name: t.groups[g] || g, line: { width: 0 },
    fillcolor: cssVar(COLOR[g] || `--c-${g}`), hovertemplate: `${t.groups[g] || g}: %{y:.0f} GWh<extra></extra>` }));
  const r = (c.scenario && c.scenario.security.rationing_frac) || 0;
  if (r > 0) traces.push({ type: "scatter", mode: "lines", x, y: c.demand_GWh.map((v) => v / (1 - r)), name: t.normal_demand,
    line: { color: cssVar("--ink"), width: 2, dash: "dot" }, hovertemplate: `${t.normal_demand}: %{y:.0f} GWh<extra></extra>` });
  traces.push({ type: "scatter", mode: "lines", x, y: c.demand_GWh, name: t.demand, line: { color: cssVar("--ink"), width: 2 },
                hovertemplate: `${t.demand}: %{y:.0f} GWh<extra></extra>` });
  Plotly.react("sec-chart-supply", traces, layout({ hovermode: "x unified", yaxis: { title: { text: "GWh", font: { size: 11 } } } }), cfg);

  const dash = { gas: "solid", coal: "dash", oil: "dot" };
  Plotly.react("sec-chart-stocks", Object.entries(c.stock_pct).map(([fuel, y]) => ({
    type: "scatter", mode: "lines", x, y, name: t[fuel], line: { color: cssVar(COLOR[fuel] || `--c-${fuel}`), width: 2.5, dash: dash[fuel] },
    hovertemplate: `${t[fuel]}: %{y:.0f}%<extra></extra>` })),
    layout({ hovermode: "x unified", yaxis: { range: [0, 105], ticksuffix: "%" } }), cfg);

  const share = c.unserved_GWh.map((u, i) => (c.demand_GWh[i] ? (100 * (u + (c.demand_GWh[i] * r) / (1 - r))) / (c.demand_GWh[i] / (1 - r)) : 0));
  Plotly.react("sec-chart-unserved", [{ type: "bar", x, y: share, marker: { color: cssVar("--c-unserved") },
    hovertemplate: `%{x}: %{y:.1f}%<extra></extra>` }],
    layout({ showlegend: false, barcornerradius: 3, yaxis: { ticksuffix: "%", rangemode: "tozero" } }), cfg);
}

function renderTable() {
  const t = T();
  const key = (s) => [s.security.blockade_season === "summer" ? 0 : 1, s.security.blockade_days, s.metrics.short_share];
  const rows = [...state.index.scenarios].sort((a, b) => {
    const ka = key(a), kb = key(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
  });
  const cur = state.shown;
  $("sec-table").innerHTML = `<table><thead><tr><th>${esc(t.col_case)}</th><th class="num">${esc(t.col_unserved)}</th><th class="num">${esc(t.col_worst)}</th><th class="num">${esc(t.col_extra)}</th></tr></thead><tbody>` +
    rows.map((s) => `<tr class="clickable${s.hash === cur ? " current" : ""}" data-hash="${esc(s.hash)}" tabindex="0"><td>${esc(labelOf(s))}</td>
      <td class="num">${pct(s.metrics.short_share)}</td><td class="num">${pct(s.metrics.worst_day_share, 0)}</td>
      <td class="num">${s.extra_short_GWh ? `${nf(s.extra_short_GWh)} GWh` : "–"}</td></tr>`).join("") + "</tbody></table>";
  $("sec-table").querySelectorAll("tr[data-hash]").forEach((tr) => {
    const go = () => {
      const s = state.index.scenarios.find((x) => x.hash === tr.dataset.hash);
      Object.assign(state.ctl, signature(s.security, s.levers));
      renderControls(); writeUrl(); update();
    };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });
}

function renderStocks() {
  const t = T(), L = lang();
  $("stock-facts").innerHTML = `<h3>${esc(t.stocks_title)}</h3><table><thead><tr><th>${esc(t.f_fuel)}</th><th>${esc(t.f_stock)}</th><th>${esc(t.f_rule)}</th><th>${esc(t.f_source)}</th></tr></thead><tbody>` +
    STOCKS.map((r) => `<tr><td>${esc(t[r.fuel])}</td><td><b>${esc(r.stock[L])}</b></td><td>${esc(r.rule[L])}</td>
      <td>${r.src.map(([n, u]) => `<a href="${esc(u)}" rel="noopener">${esc(n)}</a>`).join(" · ")}</td></tr>`).join("") + "</tbody></table>";
}

let ticket = 0;
async function update() {
  const my = ++ticket, t = T();
  const b = best();
  const exact = b.d === 0;
  const box = $("sec-match");
  box.classList.toggle("inexact", !exact);
  box.innerHTML = exact ? `<b>${esc(t.exact)}:</b> ${esc(labelOf(b.s))}`
    : `<div class="match-head"><span class="icon" aria-hidden="true">!</span><b>${esc(t.not_computed)}</b></div><p class="note"><b>${esc(t.shown)}:</b> ${esc(labelOf(b.s))}</p>`;
  state.shown = b.s.hash;
  const c = await loadCase(b.s.hash);
  if (my !== ticket) return;
  renderTiles(b.s, c);
  renderCharts(c);
  renderTable();
}

function renderAll() {
  if (!state.index) return;
  renderStocks();
  renderControls();
  update();
}

document.addEventListener("DOMContentLoaded", async () => {
  readUrl();
  try {
    const res = await fetch("data/security/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.index = await res.json();
    $("sec-meta").textContent = T().meta(state.index.generated);
    renderAll();
  } catch (err) {
    $("sec-match").textContent = `Could not load data/security/index.json (${err.message}).`;
  }
  document.addEventListener("langchange", renderAll);
  const toggle = $("theme-toggle");
  if (toggle) toggle.addEventListener("click", () => setTimeout(renderAll, 0));
});
