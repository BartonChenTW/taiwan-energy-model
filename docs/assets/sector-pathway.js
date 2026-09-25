/* Sector-coupled pathway 2030 -> 2050 on the draft page (data: docs/data/sector_pathway.json,
   written by pypsa_tw/viewer/export_dashboard_data.py from the myopic runs). */

const PT = {
  en: {
    intro: (p, a) => `Myopic pathway: the model starts from the official 2030 system (today's plants plus the MOEA plan and the 2030 renewable targets), then decides investments in ${p.horizons.join(", ")}, keeping what earlier years built and retiring plants at the end of their lifetime. CO₂ is capped on a straight line from the model's 2025 level (${p.co2_base_Mt} Mt) to net zero in 2050. CO₂ storage is limited to ${a.co2_storage_Mt} Mt/yr. Electricity demand grows 2.5%/yr, other demand is flat, and ${pct(a.ev_share, 2040)} of road-transport energy is electric in 2040 (${pct(a.ev_share, 2050)} in 2050). ${p.years[0].step_h}-hour time steps, 6 regions, 2013 weather.`,
    col_item: "", year: (y) => String(y),
    rows: {
      net: "Net CO₂ emissions (Mt)", cap: "CO₂ cap (Mt)", stored: "CO₂ captured, stored or used (Mt)", dac: "of which from the air (DAC, Mt)", price: "CO₂ price in the model (€/t)",
      elec: "Electricity generated (TWh)", h2: "Hydrogen produced (TWh)", ely: "Electrolysers (GW)", batt: "Batteries (GWh)",
      cost: "System cost (bn € per year)", shed: "Demand not met (TWh)",
    },
    groups: { nuclear: "Nuclear", coal: "Coal", gas: "Gas", oil: "Oil", hydro: "Hydro", wind: "Wind", solar: "Solar PV",
              other_re: "Biomass and geothermal", hydrogen: "Hydrogen (fuel cells, turbines)", storage: "Storage discharge" },
    uses: { industry: "Industry", transport: "Transport", buildings: "Buildings (heat, fuels)", electricity: "Electricity (other uses)",
            agriculture: "Agriculture", other: "Other" },
    net: "Net emissions", stored: "Captured (stored or used)", dac: "Taken from the air (DAC)", cap: "Cap",
    built: "built in this period", total: "installed",
    meta: (g, p) => `Run ${p.run} (${p.overlay}); exported ${g}.`,
    findings: (l, p) => [
      `Net zero in ${l.year} is reached, but the system cost rises from ${pnf(p.objective_EUR / 1e9, 1)} to ${pnf(l.objective_EUR / 1e9, 1)} bn € per year (${p.year} → ${l.year}); the CO₂ price in the model reaches about ${pnf(l.co2_price_EUR_t)} €/t.`,
      `Solar reaches its land-use potential (${pnf((l.capacity_by_group_GW.solar || {}).total_GW)} GW incl. rooftops) and wind ${pnf((l.capacity_by_group_GW.wind || {}).total_GW)} GW; the rest comes from ${pnf((l.capacity_by_group_GW.nuclear || {}).total_GW)} GW of new nuclear. The model has no limit per site, so this mostly shows that clean supply runs short under these demand assumptions; floating offshore wind (deeper than 50 m) is not included.`,
      `${pnf(l.co2.dac_Mt)} Mt of CO₂ is taken from the air and ${pnf(Object.values(l.hydrogen_TWh).reduce((a, b) => a + b, 0))} TWh of hydrogen is produced (${pnf(l.electrolysis_GW, 1)} GW of electrolysers), mainly for synthetic fuels and industry.`,
    ],
  },
  zh: {
    intro: (p, a) => `短視（myopic）路徑：模型從官方 2030 年系統出發（現有電廠加上經濟部規劃與 2030 年再生能源目標），再於 ${p.horizons.join("、")} 年決定投資，保留先前年份所建設備，電廠於壽命結束時除役。CO₂ 上限自模型 2025 年水準（${p.co2_base_Mt} Mt）直線降至 2050 年淨零。CO₂ 封存上限每年 ${a.co2_storage_Mt} Mt。電力需求每年成長 2.5%，其他需求持平；2040 年公路運輸能源 ${pct(a.ev_share, 2040)} 為電力（2050 年 ${pct(a.ev_share, 2050)}）。每 ${p.years[0].step_h} 小時一個時段、6 個區域、2013 年氣象。`,
    col_item: "", year: (y) => `${y} 年`,
    rows: {
      net: "淨 CO₂ 排放（Mt）", cap: "CO₂ 上限（Mt）", stored: "捕捉的 CO₂（封存或利用，Mt）", dac: "其中直接空氣捕捉（DAC，Mt）", price: "模型中的碳價（歐元/公噸）",
      elec: "發電量（TWh）", h2: "氫氣產量（TWh）", ely: "電解槽（GW）", batt: "電池（GWh）",
      cost: "系統成本（每年十億歐元）", shed: "未能供應的需求（TWh）",
    },
    groups: { nuclear: "核能", coal: "燃煤", gas: "燃氣", oil: "燃油", hydro: "水力", wind: "風力", solar: "太陽光電",
              other_re: "生質能與地熱", hydrogen: "氫能（燃料電池、渦輪機）", storage: "儲能放電" },
    uses: { industry: "工業", transport: "運輸", buildings: "建築（熱能、燃料）", electricity: "電力（其他用途）",
            agriculture: "農業", other: "其他" },
    net: "淨排放", stored: "捕捉（封存或利用）", dac: "直接空氣捕捉（DAC）", cap: "上限",
    built: "本期新建", total: "裝置容量",
    meta: (g, p) => `模擬 ${p.run}（${p.overlay}）；匯出時間 ${g}。`,
    findings: (l, p) => [
      `${l.year} 年達成淨零，但系統成本自每年 ${pnf(p.objective_EUR / 1e9, 1)} 升至 ${pnf(l.objective_EUR / 1e9, 1)} 十億歐元（${p.year} → ${l.year} 年）；模型中的碳價約達每公噸 ${pnf(l.co2_price_EUR_t)} 歐元。`,
      `太陽光電達到土地利用潛力上限（${pnf((l.capacity_by_group_GW.solar || {}).total_GW)} GW，含屋頂型），風電 ${pnf((l.capacity_by_group_GW.wind || {}).total_GW)} GW；其餘來自 ${pnf((l.capacity_by_group_GW.nuclear || {}).total_GW)} GW 的新核電。模型未設各廠址上限，因此這主要顯示在此需求假設下潔淨電力供給不足；未納入浮動式離岸風電（水深超過 50 公尺）。`,
      `${pnf(l.co2.dac_Mt)} Mt CO₂ 自大氣移除，並生產 ${pnf(Object.values(l.hydrogen_TWh).reduce((a, b) => a + b, 0))} TWh 氫氣（電解槽 ${pnf(l.electrolysis_GW, 1)} GW），主要用於合成燃料與工業。`,
    ],
  },
};

// Colours: the dashboard's technology tokens (checked on all pairs, site.css) and the
// categorical slots --k-1..6 in their validated order for uses.
const GEN = [["nuclear", "--c-nuclear"], ["coal", "--c-coal"], ["gas", "--c-gas"], ["oil", "--c-other"], ["hydro", "--c-hydro"],
             ["wind", "--c-onwind"], ["solar", "--c-solar"], ["other_re", "--c-other_re"], ["hydrogen", "--c-offwind"], ["storage", "--c-storage"]];
const USES = [["industry", 1], ["transport", 2], ["buildings", 3], ["electricity", 4], ["agriculture", 5], ["other", 6]];

let pw = null;
const $p = (id) => document.getElementById(id);
const plang = () => (window.twLang ? window.twLang() : "en");
const P = () => PT[plang()];
const pvar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const pesc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pnf = (v, d = 0) => (v === null || v === undefined ? "–" : new Intl.NumberFormat(plang() === "zh" ? "zh-TW" : "en-US",
  { maximumFractionDigits: d, minimumFractionDigits: d }).format(v));
const zero = (v) => (v !== null && Math.abs(v) < 0.5 ? 0 : v);
const pct = (m, y) => (m && m[`AB_${y}`] !== undefined ? `${Math.round(100 * m[`AB_${y}`])}%` : "–");
const pcfg = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

function playout(extra = {}) {
  const axis = { gridcolor: pvar("--grid"), linecolor: pvar("--axis"), zerolinecolor: pvar("--axis"),
                 tickfont: { color: pvar("--muted"), size: 11 }, automargin: true };
  return { paper_bgcolor: pvar("--surface"), plot_bgcolor: pvar("--surface"), margin: { l: 8, r: 12, t: 8, b: 8 },
           font: { family: pvar("--font"), color: pvar("--ink-2"), size: 12 }, barcornerradius: 3, hovermode: "closest",
           legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: pvar("--ink-2"), size: 11 } },
           hoverlabel: { bgcolor: pvar("--surface"), bordercolor: pvar("--border"), font: { color: pvar("--ink") } },
           ...extra, xaxis: { ...axis, type: "category", ...(extra.xaxis || {}) }, yaxis: { ...axis, rangemode: "tozero", ...(extra.yaxis || {}) } };
}

function stackBars(id, years, groups, value, unit, names, digits = 0) {
  const x = years.map((y) => P().year(y.year));
  const traces = groups.map(([g, color]) => ({
    type: "bar", name: names[g], x, y: years.map((y) => value(y, g)),
    marker: { color: color.startsWith("--") ? pvar(color) : color, line: { color: pvar("--surface"), width: 1.5 } },
    hovertemplate: `${names[g]}: %{y:.${digits}f} ${unit}<extra>%{x}</extra>`,
  })).filter((tr) => tr.y.some((v) => v > 0.05));
  Plotly.react(id, traces, playout({ barmode: "stack", yaxis: { title: { text: unit, font: { size: 11 } } } }), pcfg);
}

function renderPathway() {
  if (!pw || !pw.pathways.length) return;
  const t = P(), p = pw.pathways[0], ys = p.years;
  $p("sp-intro").textContent = t.intro(p, p.assumptions);

  const rows = [
    ["net", (y) => pnf(zero(y.co2.net_Mt))], ["cap", (y) => pnf(y.co2.cap_Mt)], ["stored", (y) => pnf(y.co2.captured_Mt)],
    ["dac", (y) => pnf(y.co2.dac_Mt)], ["price", (y) => pnf(y.co2_price_EUR_t)],
    ["elec", (y) => pnf(Object.values(y.generation_TWh).reduce((a, b) => a + b, 0))],
    ["h2", (y) => pnf(Object.values(y.hydrogen_TWh).reduce((a, b) => a + b, 0))], ["ely", (y) => pnf(y.electrolysis_GW, 1)],
    ["batt", (y) => pnf(y.battery_GWh)], ["cost", (y) => pnf(y.objective_EUR / 1e9, 1)], ["shed", (y) => pnf(y.load_shedding_TWh, 1)],
  ];
  $p("sp-table").innerHTML = `<table><thead><tr><th></th>${ys.map((y) => `<th class="num">${pesc(t.year(y.year))}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([k, f]) => `<tr><td>${pesc(t.rows[k])}</td>${ys.map((y) => `<td class="num">${f(y)}</td>`).join("")}</tr>`).join("") + "</tbody></table>";

  stackBars("sp-chart-gen", ys, GEN, (y, g) => y.generation_TWh[g] || 0, "TWh", t.groups);
  stackBars("sp-chart-cap", ys, GEN.filter(([g]) => g !== "storage").concat([["storage", "--c-storage"]]),
            (y, g) => (y.capacity_by_group_GW[g] || {}).total_GW || 0, "GW", t.groups, 1);
  stackBars("sp-chart-use", ys, USES.map(([u, k]) => [u, `--k-${k}`]), (y, u) => y.demand_by_use_TWh[u] || 0, "TWh", t.uses);

  // CO2: net emissions, stored and DAC as bars (first three categorical slots), cap as a dashed line.
  const x = ys.map((y) => t.year(y.year));
  Plotly.react("sp-chart-co2", [
    { type: "bar", name: t.net, x, y: ys.map((y) => y.co2.net_Mt), marker: { color: pvar("--k-1") }, hovertemplate: `${t.net}: %{y:.0f} Mt<extra>%{x}</extra>` },
    { type: "bar", name: t.stored, x, y: ys.map((y) => y.co2.captured_Mt), marker: { color: pvar("--k-3") }, hovertemplate: `${t.stored}: %{y:.0f} Mt<extra>%{x}</extra>` },
    { type: "bar", name: t.dac, x, y: ys.map((y) => y.co2.dac_Mt), marker: { color: pvar("--k-2") }, hovertemplate: `${t.dac}: %{y:.0f} Mt<extra>%{x}</extra>` },
    { type: "scatter", mode: "lines+markers", name: t.cap, x, y: ys.map((y) => y.co2.cap_Mt), line: { color: pvar("--ink"), width: 2, dash: "dash" },
      marker: { size: 8, color: pvar("--surface"), line: { color: pvar("--ink"), width: 2 } }, hovertemplate: `${t.cap}: %{y:.0f} Mt<extra>%{x}</extra>` },
  ], playout({ barmode: "group", yaxis: { title: { text: "Mt CO₂", font: { size: 11 } } } }), pcfg);

  const last = ys[ys.length - 1], prev = ys[ys.length - 2];
  $p("sp-findings").innerHTML = t.findings(last, prev).map((s) => `<li>${pesc(s)}</li>`).join("");
  $p("sp-meta").textContent = t.meta(pw.generated, p);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/sector_pathway.json");
    if (res.ok) pw = await res.json();
  } catch { /* keep null */ }
  if (!pw) { const s = $p("pathway"); if (s) s.hidden = true; return; }
  renderPathway();
  document.addEventListener("langchange", renderPathway);
  const toggle = $p("theme-toggle");
  if (toggle) toggle.addEventListener("click", () => setTimeout(renderPathway, 0));
});
