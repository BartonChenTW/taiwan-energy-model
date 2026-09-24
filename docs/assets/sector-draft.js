/* Draft review page for the sector-coupled test (data: docs/data/sector_draft.json,
   written by pypsa_tw/viewer/export_dashboard_data.py). */

const L = {
  en: {
    co2: "CO₂ emissions", co2_note: (r) => `all sectors; official fuel combustion 2025: ${r} Mt`,
    elec: "Electricity demand", elec_note: (a, b) => `official consumption 2024: ${a} TWh; electricity model: ${b} TWh`,
    final: "Final energy demand", final_note: "all carriers, incl. non-energy use",
    cost: "System cost", cost_note: "model objective, EUR 2030 costs",
    use: { electricity: "Electricity", transport: "Transport", industry: "Industry (heat, feedstock)", buildings: "Buildings (heat, fuels)", agriculture: "Agriculture", other: "Other" },
    col_item: "Demand item", col_use: "Use", col_twh: "TWh", col_tech: "Technology", col_official: "Official fleet (GW)",
    col_fixed: "Sector model: existing (GW)", col_built: "Sector model: built (GW)",
    official: "Official fleet", model: "Sector model",
    meta: (d) => `Run ${d.run}, ${d.snapshots} time steps of ${d.step} h, exported ${d.generated}.`,
    issues: (d, f) => [
      `Coal, gas and oil capacity is too high: ${f.coal} GW coal, ${f.ccgt} GW CCGT and ${f.oil} GW oil in the sector network, against ${f.coalOff}, ${f.ccgtOff} and ${f.oilOff} GW in the official fleet. The sector workflow appears to add existing plants from another source on top; to trace.`,
      `Electricity demand is ${d.electricity_demand_TWh} TWh, against ${d.reference.electricity_consumption_2024_TWh} TWh official national consumption (2024) and ${d.reference.taipower_system_generation_2024_TWh} TWh in the electricity model (Taipower system). It comes from the UN balance with PyPSA-Earth's 2030 growth factors; part may be counted twice.`,
      `CO₂ is ${d.co2_Mt} Mt, about ${Math.round((d.co2_Mt / d.reference.co2_fuel_combustion_2025_Mt - 1) * 100)}% above official fuel-combustion emissions (${d.reference.co2_fuel_combustion_2025_Mt} Mt, 2025), consistent with the too-high demand and fossil capacity.`,
      `The model built ${f.rooftop} GW of rooftop solar, which is extendable by default in the sector model, so this is not "today's fixed system".`,
      "Fossil fuel supply is unlimited and biomass uses PyPSA-Earth's default potential, not checked for Taiwan.",
      "No CO₂ cap, and 6-day time steps: daily solar and wind patterns are averaged out.",
    ],
  },
  zh: {
    co2: "CO₂ 排放", co2_note: (r) => `所有部門；官方 2025 年燃料燃燒排放：${r} Mt`,
    elec: "電力需求", elec_note: (a, b) => `官方 2024 年用電量：${a} TWh；電力模型：${b} TWh`,
    final: "最終能源需求", final_note: "所有能源載體，含非能源用途",
    cost: "系統成本", cost_note: "模型目標函數，2030 年成本（歐元）",
    use: { electricity: "電力", transport: "運輸", industry: "工業（熱能、原料）", buildings: "建築（熱能、燃料）", agriculture: "農業", other: "其他" },
    col_item: "需求項目", col_use: "用途", col_twh: "TWh", col_tech: "技術", col_official: "官方機組（GW）",
    col_fixed: "部門模型：既有（GW）", col_built: "部門模型：新建（GW）",
    official: "官方機組", model: "部門耦合模型",
    meta: (d) => `模擬 ${d.run}，共 ${d.snapshots} 個時段、每段 ${d.step} 小時，匯出時間 ${d.generated}。`,
    issues: (d, f) => [
      `燃煤、燃氣與燃油容量過高：部門網路中燃煤 ${f.coal} GW、複循環燃氣 ${f.ccgt} GW、燃油 ${f.oil} GW，官方機組分別為 ${f.coalOff}、${f.ccgtOff}、${f.oilOff} GW。部門流程似乎從其他來源額外加入既有電廠，待追查。`,
      `電力需求為 ${d.electricity_demand_TWh} TWh，官方 2024 年全國用電量為 ${d.reference.electricity_consumption_2024_TWh} TWh，電力模型（台電系統）為 ${d.reference.taipower_system_generation_2024_TWh} TWh。此需求來自聯合國能源平衡加上 PyPSA-Earth 的 2030 年成長係數，可能部分重複計算。`,
      `CO₂ 為 ${d.co2_Mt} Mt，比官方燃料燃燒排放（${d.reference.co2_fuel_combustion_2025_Mt} Mt，2025 年）高約 ${Math.round((d.co2_Mt / d.reference.co2_fuel_combustion_2025_Mt - 1) * 100)}%，與需求及化石容量過高一致。`,
      `模型新建了 ${f.rooftop} GW 屋頂型太陽光電（部門模型預設可擴建），因此這不是「現有的固定系統」。`,
      "化石燃料供給無上限，生質能使用 PyPSA-Earth 預設潛力，尚未針對台灣核對。",
      "未設 CO₂ 上限，且每 6 天一個時段：日內的太陽光電與風力變化被平均掉。",
    ],
  },
};

let data = null;
const $ = (id) => document.getElementById(id);
const lang = () => (window.twLang ? window.twLang() : "en");
const T = () => L[lang()];
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (v, d = 1) => (v === null || v === undefined ? "–" : new Intl.NumberFormat(lang() === "zh" ? "zh-TW" : "en-US",
  { maximumFractionDigits: d, minimumFractionDigits: d }).format(v));
const cfg = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

function layout(extra = {}) {
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return { paper_bgcolor: cssVar("--surface"), plot_bgcolor: cssVar("--surface"), margin: { l: 8, r: 40, t: 8, b: 8 },
           font: { family: cssVar("--font"), color: cssVar("--ink-2"), size: 12 }, barcornerradius: 4,
           legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", font: { color: cssVar("--ink-2"), size: 11 } },
           hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"), font: { color: cssVar("--ink") } },
           ...extra, xaxis: { ...axis, ...(extra.xaxis || {}) }, yaxis: { ...axis, autorange: "reversed", ...(extra.yaxis || {}) } };
}

// One series per chart: bars in the accent colour, value labels in ink.
function bars(id, labels, values, unit, digits = 1) {
  $(id).style.height = `${Math.max(220, 50 + 30 * labels.length)}px`;
  Plotly.react(id, [{ type: "bar", orientation: "h", y: labels, x: values, marker: { color: cssVar("--accent") },
    text: values.map((v) => nf(v, digits)), textposition: "outside", cliponaxis: false, textfont: { color: cssVar("--ink-2") },
    hovertemplate: `%{y}: %{x:.${digits}f} ${unit}<extra></extra>` }],
    layout({ showlegend: false, xaxis: { title: { text: unit, font: { size: 11 } } } }), cfg);
}

function capacityFigures(d) {
  const c = Object.fromEntries(d.electricity_capacity_GW.map((r) => [r.carrier, r]));
  const f = (k) => (c[k] ? c[k].fixed_GW + c[k].built_GW : 0);
  const o = d.official_fleet_GW;
  return { coal: nf(f("coal"), 1), ccgt: nf(f("CCGT"), 1), oil: nf(f("oil"), 1), rooftop: nf(f("solar rooftop"), 1),
           coalOff: nf(o["Hard Coal"] || 0, 1), ccgtOff: nf(o.CCGT || 0, 1), oilOff: nf(o.Oil || 0, 1) };
}

function render() {
  if (!data) return;
  const d = data, t = T();
  const tile = (label, value, unit, note) => `<div class="tile"><div class="label">${esc(label)}</div>
    <div class="value">${value}<span class="unit">${esc(unit)}</span></div><div class="note">${esc(note)}</div></div>`;
  $("sd-tiles").innerHTML = [
    tile(t.co2, nf(d.co2_Mt, 0), "Mt", t.co2_note(nf(d.reference.co2_fuel_combustion_2025_Mt, 1))),
    tile(t.elec, nf(d.electricity_demand_TWh, 0), "TWh", t.elec_note(nf(d.reference.electricity_consumption_2024_TWh, 1), nf(d.reference.taipower_system_generation_2024_TWh, 1))),
    tile(t.final, nf(d.final_demand_TWh, 0), "TWh", t.final_note),
    tile(t.cost, nf(d.objective_EUR / 1e9, 1), "bn €/yr", t.cost_note),
  ].join("");

  const byUse = {};
  d.demand_TWh.forEach((r) => { byUse[r.use] = (byUse[r.use] || 0) + r.TWh; });
  const uses = Object.keys(byUse).sort((a, b) => byUse[b] - byUse[a]);
  bars("sd-chart-demand", uses.map((u) => t.use[u] || u), uses.map((u) => byUse[u]), "TWh", 0);
  $("sd-table-demand").innerHTML = `<table><thead><tr><th>${t.col_item}</th><th>${t.col_use}</th><th class="num">${t.col_twh}</th></tr></thead><tbody>` +
    d.demand_TWh.map((r) => `<tr><td><code>${esc(r.carrier)}</code></td><td>${esc(t.use[r.use] || r.use)}</td><td class="num">${nf(r.TWh, 1)}</td></tr>`).join("") + "</tbody></table>";

  const sup = Object.entries(d.electricity_supply_TWh);
  bars("sd-chart-supply", sup.map(([k]) => k), sup.map(([, v]) => v), "TWh", 1);

  // Capacity: official fleet (neutral) vs sector model (accent), for the technologies both have.
  const map = [["coal", "Hard Coal"], ["CCGT", "CCGT"], ["OCGT", "OCGT"], ["oil", "Oil"], ["solar", "Solar"], ["solar rooftop", null],
               ["offwind-ac", null], ["onwind", null], ["urban central solid biomass CHP", null]];
  const cap = Object.fromEntries(d.electricity_capacity_GW.map((r) => [r.carrier, r]));
  const rows = map.filter(([k]) => cap[k]);
  const labels = rows.map(([k]) => k);
  const official = rows.map(([, o]) => (o ? d.official_fleet_GW[o] || 0 : null));
  const model = rows.map(([k]) => cap[k].fixed_GW + cap[k].built_GW);
  $("sd-chart-capacity").style.height = `${Math.max(260, 70 + 44 * labels.length)}px`;
  Plotly.react("sd-chart-capacity", [
    { type: "bar", orientation: "h", name: t.official, y: labels, x: official, marker: { color: cssVar("--muted") },
      hovertemplate: `${t.official}<br>%{y}: %{x:.2f} GW<extra></extra>` },
    { type: "bar", orientation: "h", name: t.model, y: labels, x: model, marker: { color: cssVar("--accent") },
      hovertemplate: `${t.model}<br>%{y}: %{x:.2f} GW<extra></extra>` },
  ], layout({ barmode: "group", xaxis: { title: { text: "GW", font: { size: 11 } } } }), cfg);
  $("sd-table-capacity").innerHTML = `<table><thead><tr><th>${t.col_tech}</th><th class="num">${t.col_official}</th><th class="num">${t.col_fixed}</th><th class="num">${t.col_built}</th></tr></thead><tbody>` +
    d.electricity_capacity_GW.map((r) => {
      const o = (map.find(([k]) => k === r.carrier) || [])[1];
      return `<tr><td><code>${esc(r.carrier)}</code></td><td class="num">${o ? nf(d.official_fleet_GW[o] || 0, 2) : "–"}</td><td class="num">${nf(r.fixed_GW, 2)}</td><td class="num">${nf(r.built_GW, 2)}</td></tr>`;
    }).join("") + "</tbody></table>";

  $("sd-issues").innerHTML = t.issues(d, capacityFigures(d)).map((s) => `<li>${esc(s)}</li>`).join("");
  $("sd-meta").textContent = t.meta({ ...d, step: nf(d.step_h, 0) });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/sector_draft.json");
    if (res.ok) data = await res.json();
  } catch { /* keep null */ }
  render();
  document.addEventListener("langchange", render);
  const toggle = $("theme-toggle");
  if (toggle) toggle.addEventListener("click", () => setTimeout(render, 0));
});
