/* Sector-coupled pathway 2030 -> 2050 on the draft page (data: docs/data/sector_pathway.json,
   written by pypsa_tw/viewer/export_dashboard_data.py from the myopic runs). */

const PT = {
  en: {
    intro: (p, a) => `Myopic pathway: the model starts from the official 2030 system (today's plants plus the MOEA plan and the 2030 renewable targets), then decides investments in ${p.horizons.join(", ")}, keeping what earlier years built and retiring plants at the end of their lifetime. CO₂ is capped on a straight line from the model's 2025 level (${p.co2_base_Mt} Mt) to net zero in 2050. CO₂ storage is limited to ${a.co2_storage_Mt} Mt/yr. ${p.id === "B" ? "Electricity demand grows 2.5%/yr to 2035, then 1%/yr" : "Electricity demand grows 2.5%/yr"}, other demand is flat, and ${pct(a.ev_share, 2040)} of road-transport energy is electric in 2040 (${pct(a.ev_share, 2050)} in 2050). ${p.years[0].step_h}-hour time steps, 6 regions, 2013 weather.`,
    col_item: "", year: (y) => String(y),
    rows: {
      net: "Net CO₂ emissions (Mt)", cap: "CO₂ cap (Mt)", stored: "CO₂ captured, stored or used (Mt)", dac: "of which from the air (DAC, Mt)", price: "CO₂ price in the model (€/t)",
      elec: "Electricity generated (TWh)", h2: "Hydrogen produced (TWh)", ely: "Electrolysers (GW)", batt: "Batteries (GWh)",
      cost: "System cost (bn € per year)", shed: "Demand not met (TWh)", h2imp: "Hydrogen imported (TWh)",
      nuc: "New nuclear (GW)", gascc: "Gas with carbon capture (GW)", nh3imp: "Ammonia imported (TWh)", efimp: "Synthetic fuels imported (TWh)", dac2: "CO₂ taken from the air (DAC, Mt)", wind: "Wind (GW)", solar: "Solar PV (GW)",
    },
    variant: "Scenario", compare_year: (y) => `${y}`,
    src_title: "Sources for the pathway assumptions", link_page: "page", link_file: "file",
    ev: { downloaded: "Downloaded", page_opened: "Page checked", search_summary: "To verify" },
    src_note: "Full records, local copies and checksums: pypsa_tw/data/sources.csv. \"To verify\" marks figures taken from a search summary.",
    sweep: { title: "2050 cost with and without new nuclear, by import price level", price: "Import prices",
             level: (f, h2) => `×${f} (hydrogen ${h2} €/MWh)`, no_nuc: "No new nuclear: system cost (bn €/yr)",
             nuc: "Nuclear allowed: system cost (bn €/yr)", nuc_gw: "New nuclear built (GW)", gap: "Cost of excluding nuclear (bn €/yr)",
             imp: "Imports without nuclear (TWh)",
             note: "Official options with imports of hydrogen, ammonia, synthetic oil and methane; all import prices scaled together (×1 = hydrogen 90, ammonia 80, synthetic oil 120, synthetic methane 90 €/MWh)." },
    compare_note: "Sensitivities A–D each change one assumption of the central pathway; the official runs use the options and 2050 ranges of Taiwan's action plans, with no new nuclear unless the name says otherwise (see the model gaps above). The columns are the last year.",
    groups: { nuclear: "Nuclear", coal: "Coal", gas: "Gas", gas_cc: "Gas with carbon capture", oil: "Oil", hydro: "Hydro", wind: "Wind", solar: "Solar PV",
              other_re: "Biomass and geothermal", hydrogen: "Hydrogen and ammonia power", storage: "Storage discharge" },
    uses: { industry: "Industry", transport: "Transport", buildings: "Buildings (heat, fuels)", electricity: "Electricity (other uses)",
            agriculture: "Agriculture", other: "Other" },
    net: "Net emissions", stored: "Captured (stored or used)", dac: "Taken from the air (DAC)", cap: "Cap",
    built: "built in this period", total: "installed",
    meta: (g, p) => `Run ${p.run} (${p.overlay}); exported ${g}.`,
    findings: (l, p, q) => {
      const g = (k, d = 0) => pnf((l.capacity_by_group_GW[k] || {}).total_GW || 0, d);
      const out = [`System cost rises from ${pnf(p.objective_EUR / 1e9, 1)} to ${pnf(l.objective_EUR / 1e9, 1)} bn € per year (${p.year} → ${l.year}); the CO₂ price in the model reaches about ${pnf(l.co2_price_EUR_t)} €/t.`,
        isOfficial(q)
          ? `In ${l.year}: solar ${g("solar")} GW and offshore plus onshore wind ${g("wind")} GW (within the action plans' 2050 ranges), hydrogen and ammonia turbines ${g("hydrogen")} GW, gas with carbon capture ${g("gas_cc", 1)} GW; no new nuclear.`
          : `In ${l.year}: solar ${g("solar")} GW (its land-use potential, incl. rooftops), wind ${g("wind")} GW${hasFloat(q) ? " incl. floating" : ""}, new nuclear ${g("nuclear", 1)} GW${q.id === "A" ? " (capped at 6.75 GW)" : " (no limit per site)"}${hasFloat(q) ? "" : "; floating offshore wind is not included"}.`];
      if (l.load_shedding_TWh > 1) out.push(`${pnf(l.load_shedding_TWh)} TWh of demand cannot be met: with these options net zero in ${l.year} is out of reach, and the CO₂ price shown is the penalty for unmet demand, not a real price.`);
      if (h2imp(l) > 1 && efimp(l) + nh3imp(l) <= 1) out.push(`${pnf(h2imp(l))} TWh of hydrogen is imported${isOfficial(q) ? ` (about ${pnf(h2imp(l) / 33.3)} Mt of hydrogen), for power, synthetic fuels and industry` : ""}.`);
      if (efimp(l) + nh3imp(l) > 1) out.push(`Imports: synthetic methane ${pnf(imp(l, "synthetic gas import"))}, ammonia ${pnf(nh3imp(l))}, synthetic oil ${pnf(imp(l, "synthetic oil import"))} and hydrogen ${pnf(h2imp(l))} TWh a year.`);
      out.push(`${pnf(l.co2.dac_Mt)} Mt of CO₂ is taken from the air and ${pnf(Object.values(l.hydrogen_TWh).reduce((a, b) => a + b, 0))} TWh of hydrogen is supplied (${pnf(l.electrolysis_GW, 1)} GW of electrolysers), mainly for synthetic fuels and industry.`);
      return out;
    },
  },
  zh: {
    intro: (p, a) => `短視（myopic）路徑：模型從官方 2030 年系統出發（現有電廠加上經濟部規劃與 2030 年再生能源目標），再於 ${p.horizons.join("、")} 年決定投資，保留先前年份所建設備，電廠於壽命結束時除役。CO₂ 上限自模型 2025 年水準（${p.co2_base_Mt} Mt）直線降至 2050 年淨零。CO₂ 封存上限每年 ${a.co2_storage_Mt} Mt。${p.id === "B" ? "電力需求 2035 年前每年成長 2.5%，之後 1%" : "電力需求每年成長 2.5%"}，其他需求持平；2040 年公路運輸能源 ${pct(a.ev_share, 2040)} 為電力（2050 年 ${pct(a.ev_share, 2050)}）。每 ${p.years[0].step_h} 小時一個時段、6 個區域、2013 年氣象。`,
    col_item: "", year: (y) => `${y} 年`,
    rows: {
      net: "淨 CO₂ 排放（Mt）", cap: "CO₂ 上限（Mt）", stored: "捕捉的 CO₂（封存或利用，Mt）", dac: "其中直接空氣捕捉（DAC，Mt）", price: "模型中的碳價（歐元/公噸）",
      elec: "發電量（TWh）", h2: "氫氣產量（TWh）", ely: "電解槽（GW）", batt: "電池（GWh）",
      cost: "系統成本（每年十億歐元）", shed: "未能供應的需求（TWh）", h2imp: "進口氫氣（TWh）",
      nuc: "新核電（GW）", gascc: "燃氣搭配碳捕捉（GW）", nh3imp: "進口氨（TWh）", efimp: "進口合成燃料（TWh）", dac2: "直接空氣捕捉 CO₂（DAC，Mt）", wind: "風電（GW）", solar: "太陽光電（GW）",
    },
    variant: "情境", compare_year: (y) => `${y} 年`,
    src_title: "路徑假設的資料來源", link_page: "頁面", link_file: "檔案",
    ev: { downloaded: "已下載", page_opened: "已查頁面", search_summary: "待查證" },
    src_note: "完整紀錄、本地副本與檢查碼：pypsa_tw/data/sources.csv。「待查證」表示數字取自搜尋摘要。",
    sweep: { title: "2050 年有無新核電的成本，依進口價格水準", price: "進口價格",
             level: (f, h2) => `×${f}（氫氣每 MWh ${h2} 歐元）`, no_nuc: "不新建核電：系統成本（每年十億歐元）",
             nuc: "允許核電：系統成本（每年十億歐元）", nuc_gw: "新建核電（GW）", gap: "排除核電的成本（每年十億歐元）",
             imp: "不新建核電時的進口量（TWh）",
             note: "官方選項加上氫氣、氨、合成燃油與合成甲烷的進口；所有進口價格同步縮放（×1 = 氫氣 90、氨 80、合成燃油 120、合成甲烷 90 歐元/MWh）。" },
    compare_note: "敏感度 A–D 各只改變基準路徑的一項假設；官方情境採用台灣各行動計畫的選項與 2050 年範圍，除名稱另有說明外不新建核電（見上方模型缺口）。各欄為最後一年。",
    groups: { nuclear: "核能", coal: "燃煤", gas: "燃氣", gas_cc: "燃氣搭配碳捕捉", oil: "燃油", hydro: "水力", wind: "風力", solar: "太陽光電",
              other_re: "生質能與地熱", hydrogen: "氫能與氨發電", storage: "儲能放電" },
    uses: { industry: "工業", transport: "運輸", buildings: "建築（熱能、燃料）", electricity: "電力（其他用途）",
            agriculture: "農業", other: "其他" },
    net: "淨排放", stored: "捕捉（封存或利用）", dac: "直接空氣捕捉（DAC）", cap: "上限",
    built: "本期新建", total: "裝置容量",
    meta: (g, p) => `模擬 ${p.run}（${p.overlay}）；匯出時間 ${g}。`,
    findings: (l, p, q) => {
      const g = (k, d = 0) => pnf((l.capacity_by_group_GW[k] || {}).total_GW || 0, d);
      const out = [`系統成本自每年 ${pnf(p.objective_EUR / 1e9, 1)} 升至 ${pnf(l.objective_EUR / 1e9, 1)} 十億歐元（${p.year} → ${l.year} 年）；模型中的碳價約達每公噸 ${pnf(l.co2_price_EUR_t)} 歐元。`,
        isOfficial(q)
          ? `${l.year} 年：太陽光電 ${g("solar")} GW、離岸與陸域風電 ${g("wind")} GW（皆在行動計畫的 2050 年範圍內），氫能與氨渦輪機 ${g("hydrogen")} GW，燃氣搭配碳捕捉 ${g("gas_cc", 1)} GW；不新建核電。`
          : `${l.year} 年：太陽光電 ${g("solar")} GW（達土地利用潛力上限，含屋頂型）、風電 ${g("wind")} GW${hasFloat(q) ? "（含浮動式）" : ""}、新核電 ${g("nuclear", 1)} GW${q.id === "A" ? "（上限 6.75 GW）" : "（未設各廠址上限）"}${hasFloat(q) ? "" : "；未納入浮動式離岸風電"}。`];
      if (l.load_shedding_TWh > 1) out.push(`有 ${pnf(l.load_shedding_TWh)} TWh 需求無法供應：在這些選項下，${l.year} 年無法達成淨零；表中碳價反映的是未供電的懲罰成本，並非實際碳價。`);
      if (h2imp(l) > 1 && efimp(l) + nh3imp(l) <= 1) out.push(`進口 ${pnf(h2imp(l))} TWh 氫氣${isOfficial(q) ? `（約 ${pnf(h2imp(l) / 33.3)} 百萬公噸氫），用於發電、合成燃料與工業` : ""}。`);
      if (efimp(l) + nh3imp(l) > 1) out.push(`進口：合成甲烷 ${pnf(imp(l, "synthetic gas import"))}、氨 ${pnf(nh3imp(l))}、合成燃油 ${pnf(imp(l, "synthetic oil import"))}、氫氣 ${pnf(h2imp(l))} TWh／年。`);
      out.push(`${pnf(l.co2.dac_Mt)} Mt CO₂ 自大氣移除，氫氣供應 ${pnf(Object.values(l.hydrogen_TWh).reduce((a, b) => a + b, 0))} TWh（電解槽 ${pnf(l.electrolysis_GW, 1)} GW），主要用於合成燃料與工業。`);
      return out;
    },
  },
};

// Colours: the dashboard's technology tokens (checked on all pairs, site.css) and the
// categorical slots --k-1..6 in their validated order for uses.
// Gas with carbon capture shares the gas colour, hatched.
const GEN = [["nuclear", "--c-nuclear"], ["coal", "--c-coal"], ["gas", "--c-gas"], ["gas_cc", "--c-gas", "/"], ["oil", "--c-other"], ["hydro", "--c-hydro"],
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
  const traces = groups.map(([g, color, hatch]) => {
    const c = color.startsWith("--") ? pvar(color) : color;
    return {
    type: "bar", name: names[g], x, y: years.map((y) => value(y, g)),
    marker: { color: c, line: { color: pvar("--surface"), width: 1.5 },
              ...(hatch ? { pattern: { shape: hatch, fillmode: "overlay", bgcolor: c, fgcolor: pvar("--surface"), fgopacity: 0.7, size: 7, solidity: 0.3 } } : {}) },
    hovertemplate: `${names[g]}: %{y:.${digits}f} ${unit}<extra>%{x}</extra>`,
    };
  }).filter((tr) => tr.y.some((v) => v > 0.05));
  Plotly.react(id, traces, playout({ barmode: "stack", yaxis: { title: { text: unit, font: { size: 11 } } } }), pcfg);
}

let pwId = null;
const pLabel = (p) => (plang() === "zh" ? p.label_zh || p.label : p.label);
const h2imp = (y) => y.hydrogen_TWh["H2 import"] || 0;
const imp = (y, c) => (y.imports_TWh || {})[c] || 0;
const nh3imp = (y) => imp(y, "NH3 import");
const efimp = (y) => imp(y, "synthetic oil import") + imp(y, "synthetic gas import");
const isOfficial = (q) => q.id.startsWith("official");
const hasFloat = (q) => q.id === "D" || isOfficial(q);

function renderCompare(t) {
  const last = (p) => p.years[p.years.length - 1];
  const g = (y, k) => (y.capacity_by_group_GW[k] || {}).total_GW || 0;
  const rows = [
    ["cost", (y) => pnf(y.objective_EUR / 1e9, 1)], ["net", (y) => pnf(zero(y.co2.net_Mt))], ["shed", (y) => pnf(y.load_shedding_TWh, 1)],
    ["nuc", (y) => pnf(g(y, "nuclear"), 1)], ["wind", (y) => pnf(g(y, "wind"))], ["solar", (y) => pnf(g(y, "solar"))],
    ["gascc", (y) => pnf(g(y, "gas_cc"), 1)], ["h2imp", (y) => pnf(h2imp(y))], ["nh3imp", (y) => pnf(nh3imp(y))], ["efimp", (y) => pnf(efimp(y))],
    ["ely", (y) => pnf(y.electrolysis_GW, 1)], ["dac2", (y) => pnf(y.co2.dac_Mt)],
    ["elec", (y) => pnf(Object.values(y.generation_TWh).reduce((a, b) => a + b, 0))],
  ];
  const ps = pw.pathways;
  $p("sp-compare").innerHTML = `<p class="note muted">${pesc(t.compare_note)}</p><table><thead><tr><th>${pesc(t.compare_year(last(ps[0]).year))}</th>${ps.map((p) => `<th class="num">${pesc(pLabel(p))}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([k, f]) => `<tr><td>${pesc(t.rows[k])}</td>${ps.map((p) => `<td class="num">${f(last(p))}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
}

function renderSweep(t) {
  const el = $p("sp-sweep");
  const sw = (pw && pw.import_sweep) || [];
  if (!el) return;
  if (!sw.length) { el.hidden = true; return; }
  el.hidden = false;
  const fs = [...new Set(sw.map((r) => r.factor))].sort((a, b) => a - b);
  const get = (f, nuc) => sw.find((r) => r.factor === f && r.nuclear_allowed === nuc);
  const bn = (r) => (r ? pnf(r.objective_EUR / 1e9, 1) : "–");
  const imp = (r) => (r ? pnf(Object.values(r.imports_TWh || {}).reduce((a, b) => a + b, 0)) : "–");
  const rows = [
    [t.sweep.no_nuc, (f) => bn(get(f, false))],
    [t.sweep.nuc, (f) => bn(get(f, true))],
    [t.sweep.gap, (f) => { const a = get(f, false), b = get(f, true); return a && b ? pnf(Math.max(0, (a.objective_EUR - b.objective_EUR) / 1e9), 1) : "–"; }],
    [t.sweep.nuc_gw, (f) => { const r = get(f, true); return r ? pnf(r.nuclear_GW, 1) : "–"; }],
    [t.sweep.imp, (f) => imp(get(f, false))],
  ];
  el.innerHTML = `<p><b>${pesc(t.sweep.title)}</b></p><div class="table-wrap"><table><thead><tr><th>${pesc(t.sweep.price)}</th>` +
    fs.map((f) => `<th class="num">${pesc(t.sweep.level(f, pnf(90 * f, (90 * f) % 1 ? 1 : 0)))}</th>`).join("") + "</tr></thead><tbody>" +
    rows.map(([label, fn]) => `<tr><td>${pesc(label)}</td>${fs.map((f) => `<td class="num">${fn(f)}</td>`).join("")}</tr>`).join("") +
    `</tbody></table></div><p class="note muted">${pesc(t.sweep.note)}</p>`;
}

const EV_SEV = { downloaded: "good", page_opened: "good", search_summary: "warning" };
const EV_ICON = { good: "✓", warning: "!", neutral: "◆" };

function renderSources(t) {
  const el = $p("sp-sources");
  const src = (pw && pw.sources) || [];
  if (!el) return;
  if (!src.length) { el.hidden = true; return; }
  el.hidden = false;
  const chip = (ev) => { const sev = EV_SEV[ev] || "neutral";
    return `<span class="chip ${sev}"><span class="chip-icon" aria-hidden="true">${EV_ICON[sev]}</span>${pesc(t.ev[ev] || ev)}</span>`; };
  const link = (u, label) => (u ? `<a href="${pesc(u)}" rel="noopener">${pesc(label)}</a>` : "");
  el.innerHTML = `<p><b>${pesc(t.src_title)}</b></p><ol class="refs">` + src.map((r) => {
    const title = plang() === "zh" ? r.title || r.title_en : r.title_en || r.title;
    const links = [link(r.landing_url, t.link_page), link(r.file_url, t.link_file)].filter(Boolean).join(" · ");
    return `<li id="src-${pesc(r.source_id)}"><b>${pesc(r.short_cite || title)}</b>${r.short_cite && title && title !== r.short_cite ? ` — <i>${pesc(title)}</i>` : ""}. ` +
      `${pesc(r.publisher)}${r.published ? `, ${pesc(r.published)}` : ""}. ${links} ${chip(r.evidence)}<br><span class="muted">${pesc(r.note)}</span></li>`;
  }).join("") + `</ol><p class="note muted">${pesc(t.src_note)}</p>`;
}

function renderPathway() {
  if (!pw || !pw.pathways.length) return;
  const sel = $p("sp-variant");
  if (sel && !sel.options.length) {
    sel.addEventListener("change", () => { pwId = sel.value; writePwUrl(); renderPathway(); });
  }
  if (sel) sel.innerHTML = pw.pathways.map((q) => `<option value="${pesc(q.id)}">${pesc(pLabel(q))}</option>`).join("");
  const p = pw.pathways.find((q) => q.id === pwId) || pw.pathways[0];
  pwId = p.id;
  if (sel) sel.value = p.id;
  const t = P(), ys = p.years;
  renderCompare(t);
  renderSweep(t);
  renderSources(t);
  $p("sp-intro").textContent = `${pLabel(p)}${plang() === "zh" ? "。" : ". "}${t.intro(p, p.assumptions)}`;

  const rows = [
    ["net", (y) => pnf(zero(y.co2.net_Mt))], ["cap", (y) => pnf(y.co2.cap_Mt)], ["stored", (y) => pnf(y.co2.captured_Mt)],
    ["dac", (y) => pnf(y.co2.dac_Mt)], ["price", (y) => pnf(y.co2_price_EUR_t)],
    ["elec", (y) => pnf(Object.values(y.generation_TWh).reduce((a, b) => a + b, 0))],
    ["h2", (y) => pnf(Object.values(y.hydrogen_TWh).reduce((a, b) => a + b, 0))], ["ely", (y) => pnf(y.electrolysis_GW, 1)],
    ["h2imp", (y) => pnf(h2imp(y))], ["batt", (y) => pnf(y.battery_GWh)], ["cost", (y) => pnf(y.objective_EUR / 1e9, 1)],
    ["shed", (y) => pnf(y.load_shedding_TWh, 1)],
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
  $p("sp-findings").innerHTML = t.findings(last, prev, p).map((s) => `<li>${pesc(s)}</li>`).join("");
  $p("sp-meta").textContent = t.meta(pw.generated, p);
}

function writePwUrl() {
  const url = new URL(location.href);
  url.searchParams.set("pathway", pwId);
  history.replaceState(null, "", url);
}

document.addEventListener("DOMContentLoaded", async () => {
  pwId = new URL(location.href).searchParams.get("pathway");
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
