/* Draft review page for the sector-coupled test (data: docs/data/sector_draft.json,
   written by pypsa_tw/viewer/export_dashboard_data.py). */

const L = {
  en: {
    co2: "CO₂ emissions", co2_note: (r) => `all sectors; official fuel combustion 2025: ${r} Mt`,
    elec: "Electricity demand", elec_note: (a, b) => `official consumption 2024: ${a} TWh; electricity model: ${b} TWh`,
    final: "Final energy demand", final_note: "all carriers, incl. non-energy use",
    cost: "System cost", cost_note: (y) => `model objective, EUR; sector technologies at ${y} costs, power plants at 2030 costs`,
    use: { electricity: "Electricity", transport: "Transport", industry: "Industry (heat, feedstock)", buildings: "Buildings (heat, fuels)", agriculture: "Agriculture", other: "Other" },
    col_item: "Demand item", col_use: "Use", col_twh: "TWh", col_tech: "Technology", col_official: "Official fleet (GW)",
    col_fixed: "Sector model: existing (GW)", col_built: "Sector model: built (GW)",
    official: "Official fleet", model: "Sector model",
    meta: (d) => `Run ${d.run} (${d.overlay}), ${d.snapshots} time steps of ${d.step} h, exported ${d.generated}.`,
    what: (d) => `The sector-coupled model adds heat, transport, industry and hydrogen to the electricity system, each with its own demand, fuels and technologies. This run: planning year ${d.planning_year} (costs and demand growth), 6 regions, ${d.step}-hour time steps (${d.snapshots} steps), 2013 weather, no CO₂ cap, no hydrogen export, load shedding allowed. Non-electric demand comes from the UN energy statistics, where Taiwan is listed as "Other Asia".`,
    mix: { gas: "Gas", coal: "Coal", oil: "Oil", nuclear: "Nuclear", solar: "Solar PV", wind: "Wind", hydro: "Hydro", pumped_storage: "Pumped hydro", biomass_waste: "Biomass and waste", other: "Other" },
    official_2025: "Official 2025", model_run: "Model",
    issues: (d, f) => [
      `Electricity demand is ${d.electricity_demand_TWh} TWh, against ${d.reference.electricity_consumption_2024_TWh} TWh official national consumption (2024) and ${d.reference.taipower_system_generation_2024_TWh} TWh in the electricity model (Taipower system). It comes from the UN balance with PyPSA-Earth's 2030 growth factors; part may be counted twice.`,
      `CO₂ is ${d.co2_Mt} Mt, about ${Math.round((d.co2_Mt / d.reference.co2_fuel_combustion_2025_Mt - 1) * 100)}% above official fuel-combustion emissions (${d.reference.co2_fuel_combustion_2025_Mt} Mt, 2025), consistent with the too-high demand; coal also runs at full output all year, as in the electricity model.`,
      `The model built ${f.rooftop} GW of rooftop solar, which is extendable by default in the sector model, so this is not "today's fixed system".`,
      "Fossil fuel supply is unlimited and biomass uses PyPSA-Earth's default potential, not checked for Taiwan.",
      `No CO₂ cap, and ${nf(d.step_h, 0)}-hour time steps: the day–night pattern of solar and demand is averaged out${d.step_h > 24 ? ", and so are several days of wind" : ""}.`,
    ],
  },
  zh: {
    co2: "CO₂ 排放", co2_note: (r) => `所有部門；官方 2025 年燃料燃燒排放：${r} Mt`,
    elec: "電力需求", elec_note: (a, b) => `官方 2024 年用電量：${a} TWh；電力模型：${b} TWh`,
    final: "最終能源需求", final_note: "所有能源載體，含非能源用途",
    cost: "系統成本", cost_note: (y) => `模型目標函數（歐元）；部門技術採 ${y} 年成本，電廠採 2030 年成本`,
    use: { electricity: "電力", transport: "運輸", industry: "工業（熱能、原料）", buildings: "建築（熱能、燃料）", agriculture: "農業", other: "其他" },
    col_item: "需求項目", col_use: "用途", col_twh: "TWh", col_tech: "技術", col_official: "官方機組（GW）",
    col_fixed: "部門模型：既有（GW）", col_built: "部門模型：新建（GW）",
    official: "官方機組", model: "部門耦合模型",
    meta: (d) => `模擬 ${d.run}（${d.overlay}），共 ${d.snapshots} 個時段、每段 ${d.step} 小時，匯出時間 ${d.generated}。`,
    what: (d) => `部門耦合模型在電力系統之外，加入熱能、運輸、工業與氫能，各有其需求、燃料與技術。本次模擬：規劃年 ${d.planning_year}（成本與需求成長）、6 個區域、每 ${d.step} 小時一個時段（共 ${d.snapshots} 個）、2013 年氣象、不設 CO₂ 上限、無氫氣出口、允許切負載。非電力需求取自聯合國能源統計，其中台灣列為「Other Asia」。`,
    mix: { gas: "燃氣", coal: "燃煤", oil: "燃油", nuclear: "核能", solar: "太陽光電", wind: "風力", hydro: "水力", pumped_storage: "抽蓄水力", biomass_waste: "生質能與廢棄物", other: "其他" },
    official_2025: "官方 2025 年", model_run: "模型",
    issues: (d, f) => [
      `電力需求為 ${d.electricity_demand_TWh} TWh，官方 2024 年全國用電量為 ${d.reference.electricity_consumption_2024_TWh} TWh，電力模型（台電系統）為 ${d.reference.taipower_system_generation_2024_TWh} TWh。此需求來自聯合國能源平衡加上 PyPSA-Earth 的 2030 年成長係數，可能部分重複計算。`,
      `CO₂ 為 ${d.co2_Mt} Mt，比官方燃料燃燒排放（${d.reference.co2_fuel_combustion_2025_Mt} Mt，2025 年）高約 ${Math.round((d.co2_Mt / d.reference.co2_fuel_combustion_2025_Mt - 1) * 100)}%，與需求過高一致；燃煤也與電力模型一樣全年滿載運轉。`,
      `模型新建了 ${f.rooftop} GW 屋頂型太陽光電（部門模型預設可擴建），因此這不是「現有的固定系統」。`,
      "化石燃料供給無上限，生質能使用 PyPSA-Earth 預設潛力，尚未針對台灣核對。",
      `未設 CO₂ 上限，且每 ${nf(d.step_h, 0)} 小時一個時段：太陽光電與需求的日夜變化被平均掉${d.step_h > 24 ? "，數天的風力變化也是" : ""}。`,
    ],
  },
};


// Readable names for PyPSA-Earth carrier codes (the code stays as a tooltip in the tables).
const NAMES = {
  en: {
    CCGT: "Gas (combined cycle)", OCGT: "Gas (open cycle)", coal: "Coal", oil: "Oil", nuclear: "Nuclear",
    solar: "Solar PV (ground-mounted)", "solar rooftop": "Solar PV (rooftop)", "offwind-ac": "Offshore wind (AC)",
    "offwind-dc": "Offshore wind (DC)", onwind: "Onshore wind", ror: "Run-of-river hydro", hydro: "Reservoir hydro",
    PHS: "Pumped hydro", "battery discharger": "Battery", "urban central solid biomass CHP": "Biomass CHP (district heating)",
    AC: "Electricity (households and other)", "industry electricity": "Industry electricity", "services electricity": "Services electricity",
    "agriculture electricity": "Agriculture electricity", "rail transport electricity": "Rail electricity", "land transport EV": "Electric vehicles",
    "land transport oil": "Road transport oil", "land transport fuel cell": "Road transport hydrogen (fuel cell)", "rail transport oil": "Rail oil",
    "kerosene for aviation": "Aviation kerosene", "shipping oil": "Shipping oil", "H2 for shipping": "Shipping hydrogen",
    "gas for industry": "Industry gas", "low-temperature heat for industry": "Industry low-temperature heat", "naphtha for industry": "Industry naphtha (feedstock)",
    "solid biomass for industry": "Industry solid biomass", "H2 for industry": "Industry hydrogen", NH3: "Ammonia",
    "residential gas": "Residential gas", "residential oil": "Residential oil", "residential biomass": "Residential biomass",
    "services gas": "Services gas", "services oil": "Services oil", "services biomass": "Services biomass", "agriculture oil": "Agriculture oil",
    "urban central heat": "District heating", "residential urban decentral heat": "Urban residential heat (individual)",
    "services urban decentral heat": "Urban services heat (individual)", "residential rural heat": "Rural residential heat",
    "services rural heat": "Rural services heat", "H2 export": "Hydrogen export",
  },
  zh: {
    CCGT: "燃氣複循環", OCGT: "燃氣單循環", coal: "燃煤", oil: "燃油", nuclear: "核能",
    solar: "太陽光電（地面型）", "solar rooftop": "太陽光電（屋頂型）", "offwind-ac": "離岸風電（交流）",
    "offwind-dc": "離岸風電（直流）", onwind: "陸域風電", ror: "川流式水力", hydro: "水庫式水力",
    PHS: "抽蓄水力", "battery discharger": "電池儲能", "urban central solid biomass CHP": "生質能汽電共生（區域供熱）",
    AC: "電力（住宅及其他）", "industry electricity": "工業用電", "services electricity": "服務業用電",
    "agriculture electricity": "農業用電", "rail transport electricity": "鐵路用電", "land transport EV": "電動車",
    "land transport oil": "公路運輸燃油", "land transport fuel cell": "公路運輸用氫（燃料電池）", "rail transport oil": "鐵路燃油",
    "kerosene for aviation": "航空燃油", "shipping oil": "航運燃油", "H2 for shipping": "航運用氫",
    "gas for industry": "工業用天然氣", "low-temperature heat for industry": "工業低溫熱能", "naphtha for industry": "工業石油腦（原料）",
    "solid biomass for industry": "工業固態生質燃料", "H2 for industry": "工業用氫", NH3: "氨",
    "residential gas": "住宅天然氣", "residential oil": "住宅燃油", "residential biomass": "住宅生質能",
    "services gas": "服務業天然氣", "services oil": "服務業燃油", "services biomass": "服務業生質能", "agriculture oil": "農業燃油",
    "urban central heat": "區域供熱", "residential urban decentral heat": "都市住宅供熱（個別）",
    "services urban decentral heat": "都市服務業供熱（個別）", "residential rural heat": "鄉村住宅供熱",
    "services rural heat": "鄉村服務業供熱", "H2 export": "氫氣出口",
  },
};
const name = (c) => NAMES[lang()][c] || NAMES.en[c] || c;

let all = null, data = null;
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
  if (!all) return;
  const t = T();
  const sel = $("sd-run");
  if (!sel.options.length) {
    sel.innerHTML = all.runs.map((r, i) => `<option value="${i}">${esc(r.label)}</option>`).join("");
    sel.addEventListener("change", () => { data = all.runs[Number(sel.value)]; render(); });
  }
  data = data || all.runs[0];
  const d = { ...data, generated: all.generated };
  $("sd-what").textContent = t.what({ ...d, step: nf(d.step_h, 0) });
  const tile = (label, value, unit, note) => `<div class="tile"><div class="label">${esc(label)}</div>
    <div class="value">${value}<span class="unit">${esc(unit)}</span></div><div class="note">${esc(note)}</div></div>`;
  $("sd-tiles").innerHTML = [
    tile(t.co2, nf(d.co2_Mt, 0), "Mt", t.co2_note(nf(d.reference.co2_fuel_combustion_2025_Mt, 1))),
    tile(t.elec, nf(d.electricity_demand_TWh, 0), "TWh", t.elec_note(nf(d.reference.electricity_consumption_2024_TWh, 1), nf(d.reference.taipower_system_generation_2024_TWh, 1))),
    tile(t.final, nf(d.final_demand_TWh, 0), "TWh", t.final_note),
    tile(t.cost, nf(d.objective_EUR / 1e9, 1), "bn €/yr", t.cost_note(d.planning_year) +
         (lang() === "zh" ? `（約新台幣 ${nf(d.objective_EUR * (all.currency || {}).eur_twd / 1e8 || d.objective_EUR * 36.185 / 1e8, 0)} 億元/年；匯率 1 歐元 = ${(all.currency || {}).eur_twd || 36.185} 新台幣）` : "")),
  ].join("");

  const byUse = {};
  d.demand_TWh.forEach((r) => { byUse[r.use] = (byUse[r.use] || 0) + r.TWh; });
  const uses = Object.keys(byUse).sort((a, b) => byUse[b] - byUse[a]);
  bars("sd-chart-demand", uses.map((u) => t.use[u] || u), uses.map((u) => byUse[u]), "TWh", 0);
  $("sd-table-demand").innerHTML = `<table><thead><tr><th>${t.col_item}</th><th>${t.col_use}</th><th class="num">${t.col_twh}</th></tr></thead><tbody>` +
    d.demand_TWh.map((r) => `<tr><td title="${esc(r.carrier)}">${esc(name(r.carrier))}</td><td>${esc(t.use[r.use] || r.use)}</td><td class="num">${nf(r.TWh, 1)}</td></tr>`).join("") + "</tbody></table>";

  // Electricity mix: model vs official 2025 (two series: neutral = official, accent = model).
  const off = all.official_2025.mix_share, mod = d.mix_share;
  const groups = ["gas", "coal", "oil", "nuclear", "solar", "wind", "hydro", "pumped_storage", "biomass_waste", "other"]
    .filter((g) => (off[g] || 0) > 0.0005 || (mod[g] || 0) > 0.0005);
  const gl = groups.map((g) => t.mix[g] || g);
  $("sd-chart-mix").style.height = `${Math.max(260, 70 + 40 * gl.length)}px`;
  Plotly.react("sd-chart-mix", [
    { type: "bar", orientation: "h", name: t.official_2025, y: gl, x: groups.map((g) => 100 * (off[g] || 0)), marker: { color: cssVar("--muted") },
      hovertemplate: `${t.official_2025}<br>%{y}: %{x:.1f}%<extra></extra>` },
    { type: "bar", orientation: "h", name: `${t.model_run}: ${d.label}`, y: gl, x: groups.map((g) => 100 * (mod[g] || 0)), marker: { color: cssVar("--accent") },
      hovertemplate: `${t.model_run}<br>%{y}: %{x:.1f}%<extra></extra>` },
  ], layout({ barmode: "group", xaxis: { title: { text: "%", font: { size: 11 } }, ticksuffix: "%" } }), cfg);

  const sup = Object.entries(d.electricity_supply_TWh);
  bars("sd-chart-supply", sup.map(([k]) => name(k)), sup.map(([, v]) => v), "TWh", 1);

  // Capacity: official fleet (neutral) vs sector model (accent), for the technologies both have.
  const map = [["coal", "Hard Coal"], ["CCGT", "CCGT"], ["OCGT", "OCGT"], ["oil", "Oil"], ["solar", "Solar"], ["solar rooftop", null],
               ["offwind-ac", null], ["onwind", null], ["urban central solid biomass CHP", null]];
  const cap = Object.fromEntries(d.electricity_capacity_GW.map((r) => [r.carrier, r]));
  const rows = map.filter(([k]) => cap[k]);
  const labels = rows.map(([k]) => name(k));
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
      return `<tr><td title="${esc(r.carrier)}">${esc(name(r.carrier))}</td><td class="num">${o ? nf(d.official_fleet_GW[o] || 0, 2) : "–"}</td><td class="num">${nf(r.fixed_GW, 2)}</td><td class="num">${nf(r.built_GW, 2)}</td></tr>`;
    }).join("") + "</tbody></table>";

  $("sd-issues").innerHTML = t.issues(d, capacityFigures(d)).map((s) => `<li>${esc(s)}</li>`).join("");
  $("sd-meta").textContent = t.meta({ ...d, step: nf(d.step_h, 0) });
  document.getElementById("sd-run").value = String(all.runs.indexOf(data));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/sector_draft.json");
    if (res.ok) all = await res.json();
  } catch { /* keep null */ }
  render();
  document.addEventListener("langchange", render);
  const toggle = $("theme-toggle");
  if (toggle) toggle.addEventListener("click", () => setTimeout(render, 0));
});
