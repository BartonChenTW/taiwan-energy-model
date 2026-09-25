/* Taiwan power system sandbox.
   Phase 1: every scenario is pre-computed (pypsa_tw/sandbox/batch.py); the levers pick the
   nearest one. Data: docs/data/sandbox/, written by pypsa_tw/viewer/export_dashboard_data.py. */

// Technology groups and colours: the same as the dashboard (app.js).
const GROUPS = ["coal", "nuclear", "onwind", "storage", "solar", "offwind", "gas", "hydro", "other_re", "other", "unserved"];
const CARRIER_GROUP = {
  coal: "coal", lignite: "coal", nuclear: "nuclear", onwind: "onwind", PHS: "storage", battery: "storage",
  solar: "solar", "offwind-ac": "offwind", "offwind-dc": "offwind", CCGT: "gas", OCGT: "gas", ror: "hydro",
  hydro: "hydro", oil: "other", geothermal: "other_re", biomass: "other_re", load: "unserved", "load shedding": "unserved",
};

// Lever controls: [lever, group, step, display scale, unit shown]. Ranges come from the data.
const CONTROLS = [
  ["add_solar_GW", "g_add", 1, 1, "GW"], ["add_onwind_GW", "g_add", 0.1, 1, "GW"], ["add_offwind_GW", "g_add", 0.1, 1, "GW"],
  ["add_battery_GW", "g_add", 0.1, 1, "GW"], ["add_ccgt_GW", "g_add", 1, 1, "GW"],
  // Coal can only be retired (no new coal plants): a GW slider from 0 down to minus today's fleet, in quarters.
  ["coal_retire_frac", "g_add", 0.25, 1, "GW"],
  ["nuclear_restart", "g_nuclear"], ["add_nuclear_new_GW", "g_nuclear", 0.1, 1, "GW"],
  ["co2_cap_frac", "g_policy", 0.05, 100, "%"],
  ["demand_scale", "g_market", 0.05, 1, "×"], ["gas_price_mult", "g_market", 0.1, 1, "×"], ["coal_price_mult", "g_market", 0.1, 1, "×"],
  ["line_rating", "g_grid", 0.05, 100, "%"],
];

const I18N = {
  en: {
    title: "Power system sandbox", nav_home: "← Home", nav_dashboard: "Model dashboard", nav_levers: "Levers", nav_results: "Results",
    nav_security: "Energy security →", nav_data: "Taiwan energy data →", nav_sector: "Sector model (draft) →",
    caveat: "Exploration tool, not a forecast: 6 buses, 4-hourly time steps, one weather year (2013), today's grid unless you change line ratings, and fixed capacities (the model dispatches what you add; it does not choose what to build). Costs are technology-data 2030 projections in EUR. Only pre-computed scenarios can be shown: the levers pick the nearest one.",
    levers_title: "What if…", levers_sub: "Start from today's system and change one or more levers.",
    g_add: "Add or remove capacity", g_add_note: "Right of zero adds new capacity; left of zero removes existing plants (all plants of that type scaled down by the same share).", g_nuclear: "Nuclear", g_policy: "CO₂", g_market: "Demand and fuel prices", g_grid: "Transmission",
    add_solar_GW: "Solar PV", add_onwind_GW: "Onshore wind", add_offwind_GW: "Offshore wind", add_battery_GW: "Battery (4 h)",
    add_ccgt_GW: "Gas (CCGT)", nuclear_restart: "Restart existing plants", add_nuclear_new_GW: "New nuclear plants (Lungmen site)", plants: (n) => `${n} ${n === 1 ? "plant" : "plants"}`,
    plant_size: (gw) => `each plant ${gw} GW (one Lungmen-design reactor)`,
    coal_retire_frac: "Coal (retire only, no new coal)", co2_cap_frac: "CO₂ cap (share of base emissions)", co2_off: "no cap", co2_apply: "Apply a cap",
    demand_scale: "Demand", gas_price_mult: "Gas price", coal_price_mult: "Coal price",
    line_rating: "Usable line rating", reset: "Reset to base", share: "Copy link", copied: "Link copied.",
    copy_failed: "Copy the address bar to share this scenario.",
    exact: "Exact match", nearest: "Showing the nearest computed scenario", not_computed: "Not computed yet: these results are for different settings", nearest_note: "Differences (yours → shown):",
    showing: "Showing", base_label: "base case", request_exact: "Request exactly these settings →",
    t_cost: "System cost", t_cost_note: (op, inv) => `operating ${op} + investment ${inv} M€/yr`,
    t_cost_restart: "restart costs not included",
    t_co2: "CO₂ emissions", t_re: "Renewable share", t_curtail: "Curtailment", t_unserved: "Unserved demand",
    range_label: "range", unc_title: "Uncertainty", today_gw: (x) => `today ${x} GW`, today_twh: (x) => `today ${x} TWh`,
    today_fuel: (x) => `today ${x} €/MWh of fuel`, today_pct: (x) => `today ${x} % (N-1 margin)`,
    unc_note: (v) => `Ranges: the same scenario solved under ${v}, and investment ±30% with a 5–10% discount rate. Changes vs base are paired: each variant is compared with the base case under the same variant.`,
    unc_weather: (y) => `${y} weather`, unc_low: "gas, coal and demand −10%", unc_high: "gas, coal and demand +10%",
    unc_none: "Ranges are not computed for this scenario yet: only technology-cost ranges are shown.",
    t_added: "Capacity change", t_added_note: (a, r) => `added ${a} · removed ${r} GW`, vs_base: "vs base",
    week_label: (w, a, b) => `Week ${w} · ${a} – ${b}`,
    cap_title: "Installed capacity", cap_sub: "GW by technology: base case and scenario",
    map_title: "Line loading", map_sub: "Highest flow over the year as a share of the usable line rating: darker and thicker lines are more loaded; hover for the value",
    year_title: "Dispatch over the year", year_sub: "National generation by technology and demand (GW), daily averages",
    dispatch_title: "Dispatch for one week", dispatch_sub: "National generation by technology and demand (GW), 4-hourly",
    week: "Week", demand_line: "Demand", base_series: "Base case", scenario_series: "Scenario",
    all_title: "All computed scenarios", all_sub: "Select a row to open it",
    col_scenario: "Scenario", col_cost: "System cost Δ (M€/yr)", col_co2: "CO₂ Δ (Mt)", col_re: "Renewables", col_unserved: "Unserved (GWh)",
    loading: "loading", footer: "Scenarios solved with pypsa_tw/sandbox/ (HiGHS) and exported by pypsa_tw/viewer/export_dashboard_data.py.",
    loading_error: "Could not load the sandbox data. If you opened the file directly, serve it instead: python -m http.server -d docs",
  },
  zh: {
    title: "電力系統情境沙盒", nav_home: "← 首頁", nav_dashboard: "模型儀表板", nav_levers: "調整項目", nav_results: "結果",
    nav_security: "能源安全 →", nav_data: "台灣能源資料 →", nav_sector: "部門耦合（草稿）→",
    caveat: "這是探索工具，不是預測：6 個節點、每 4 小時一個時段、單一氣象年（2013），除非調整線路容量否則電網維持現狀，且容量為固定值（模型只調度您加入的容量，不會自行決定要蓋什麼）。成本為 technology-data 2030 年預估值（歐元）。只能顯示預先計算的情境：調整項目會對應到最接近的一個。",
    levers_title: "如果……", levers_sub: "從現有系統出發，調整一個或多個項目。",
    g_add: "增減容量", g_add_note: "零以右為新增容量；零以左為移除既有電廠（該類電廠依相同比例縮減）。", g_nuclear: "核能", g_policy: "CO₂", g_market: "需求與燃料價格", g_grid: "輸電",
    add_solar_GW: "太陽光電", add_onwind_GW: "陸域風電", add_offwind_GW: "離岸風電", add_battery_GW: "電池儲能（4 小時）",
    add_ccgt_GW: "燃氣複循環", nuclear_restart: "重啟既有電廠", add_nuclear_new_GW: "新核電廠（龍門廠址）", plants: (n) => `${n} 座`,
    plant_size: (gw) => `每座 ${gw} GW（龍門設計的一部機組）`,
    coal_retire_frac: "燃煤（僅可除役，不新建）", co2_cap_frac: "CO₂ 上限（基準排放的比例）", co2_off: "不設上限", co2_apply: "設定上限",
    demand_scale: "需求", gas_price_mult: "天然氣價格", coal_price_mult: "煤價",
    line_rating: "線路可用容量", reset: "回到基準", share: "複製連結", copied: "已複製連結。",
    copy_failed: "請複製網址列以分享此情境。",
    exact: "完全符合", nearest: "目前顯示最接近的已計算情境", not_computed: "尚未計算：以下結果對應的是不同的設定", nearest_note: "差異（您的設定 → 顯示的情境）：",
    showing: "顯示", base_label: "基準情境", request_exact: "申請模擬這組設定 →",
    t_cost: "系統成本", t_cost_note: (op, inv) => `營運 ${op} + 投資 ${inv} 百萬歐元/年`,
    fx_note: (c) => `；匯率 1 歐元 = ${c ? c.eur_twd : 36.185} 新台幣（臺灣銀行，${c ? c.date.slice(0, 10) : "2026-09-24"}）`,
    t_cost_restart: "未含重啟成本",
    t_co2: "CO₂ 排放", t_re: "再生能源占比", t_curtail: "棄電量", t_unserved: "未供電量",
    range_label: "範圍", unc_title: "不確定性", today_gw: (x) => `目前 ${x} GW`, today_twh: (x) => `目前 ${x} TWh`,
    today_fuel: (x) => `目前燃料價格 ${x} 歐元/MWh`, today_pct: (x) => `目前 ${x} %（N-1 安全裕度）`,
    unc_note: (v) => `範圍：同一情境在 ${v} 下求解，以及投資成本 ±30%、折現率 5–10%。相對基準的變化為成對比較：每個變體都與同一變體下的基準情境比較。`,
    unc_weather: (y) => `${y} 年氣象`, unc_low: "天然氣、煤價與需求 −10%", unc_high: "天然氣、煤價與需求 +10%",
    unc_none: "此情境尚未計算範圍：僅顯示技術成本範圍。",
    t_added: "容量變化", t_added_note: (a, r) => `新增 ${a} · 移除 ${r} GW`, vs_base: "相對基準",
    week_label: (w, a, b) => `第 ${w} 週 · ${a} – ${b}`,
    cap_title: "裝置容量", cap_sub: "各技術裝置容量（GW）：基準與情境",
    map_title: "線路負載", map_sub: "全年最大潮流占線路可用容量的比例：顏色越深、線越粗表示負載越高；游標移上可看數值",
    year_title: "全年調度", year_sub: "全國各技術發電量與需求（GW），每日平均",
    dispatch_title: "一週的調度", dispatch_sub: "全國各技術發電量與需求（GW），每 4 小時",
    week: "週次", demand_line: "需求", base_series: "基準情境", scenario_series: "情境",
    all_title: "所有已計算情境", all_sub: "點選一列以開啟",
    col_scenario: "情境", col_cost: "系統成本變化（百萬歐元/年）", col_co2: "CO₂ 變化（Mt）", col_re: "再生能源", col_unserved: "未供電（GWh）",
    loading: "負載", footer: "情境以 pypsa_tw/sandbox/（HiGHS）求解，並由 pypsa_tw/viewer/export_dashboard_data.py 匯出。",
    loading_error: "無法載入沙盒資料。若直接開啟檔案，請改用本機伺服器：python -m http.server -d docs",
  },
};
const GROUP_LABEL = {
  en: { coal: "Coal", nuclear: "Nuclear", onwind: "Onshore wind", storage: "Storage", solar: "Solar PV", offwind: "Offshore wind",
        gas: "Gas", hydro: "Hydro", other_re: "Geothermal, biomass", other: "Oil", unserved: "Unserved demand" },
  zh: { coal: "燃煤", nuclear: "核能", onwind: "陸域風電", storage: "儲能", solar: "太陽光電", offwind: "離岸風電",
        gas: "燃氣", hydro: "水力", other_re: "地熱、生質能", other: "燃油", unserved: "未供電量" },
};

const state = { lang: "en", index: null, cache: {}, levers: {}, current: null, week: 27 };
const $ = (id) => document.getElementById(id);
const t = (k) => I18N[state.lang][k] ?? k;
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (v, d = 1) => (v === null || v === undefined || Number.isNaN(v) ? "–"
  : new Intl.NumberFormat(state.lang === "zh" ? "zh-TW" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v));
const signed = (v, d = 1) => (v === null || v === undefined ? "–" : `${v > 0 ? "+" : v < 0 ? "−" : "±"}${nf(Math.abs(v), d)}`);
function storageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }
const plotConfig = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

function baseLayout(extra = {}) {
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return {
    paper_bgcolor: cssVar("--surface"), plot_bgcolor: cssVar("--surface"),
    font: { family: cssVar("--font"), color: cssVar("--ink-2"), size: 12 }, margin: { l: 8, r: 12, t: 8, b: 8 },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 11 } },
    hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"), font: { color: cssVar("--ink"), family: cssVar("--font") } },
    ...extra, xaxis: { ...axis, ...(extra.xaxis || {}) }, yaxis: { ...axis, ...(extra.yaxis || {}) },
  };
}

function groupSum(byCarrier) {
  const out = {};
  for (const [c, v] of Object.entries(byCarrier || {})) { const g = CARRIER_GROUP[c] || "other"; out[g] = (out[g] || 0) + (v || 0); }
  return out;
}

// ---------- levers ----------
// New nuclear is set in plants of one Lungmen-design reactor (1,350 MW), 0-5 plants.
const nuclearSite = () => ({ unit_MW: 1350, max_units: 5, ...((state.index && state.index.nuclear_new_site) || {}) });
// Starting values in today's system (from the base case), shown next to each lever.
function todayValues(baseCase) {
  const c = baseCase.results.capacity_GW;
  return {
    add_solar_GW: c.solar || 0, add_onwind_GW: c.onwind || 0,
    add_offwind_GW: (c["offwind-ac"] || 0) + (c["offwind-dc"] || 0), add_battery_GW: c.battery || 0,
    add_ccgt_GW: c.CCGT || 0, coal_retire_frac: c.coal || 0,
    demand_scale: baseCase.summary.demand_TWh,
    gas_price_mult: (state.index.fuel_price_EUR_per_MWh || {}).gas,
    coal_price_mult: (state.index.fuel_price_EUR_per_MWh || {}).coal,
    line_rating: 0.7,
  };
}
const meta = (k) => state.index.levers[k];
const defaults = () => Object.fromEntries(Object.entries(state.index.levers).map(([k, m]) => [k, Array.isArray(m.default) ? [] : m.default]));

function leverText(k, v, compact = false) {
  const c = CONTROLS.find((x) => x[0] === k);
  const today = compact ? {} : state.today || {};
  if (k === "nuclear_restart") return v.length ? v.map((p) => state.index.nuclear_plants[p].name).join(", ") : "–";
  if (k === "co2_cap_frac" && v === null) return t("co2_off");
  if (k === "add_nuclear_new_GW" && state.index) {
    const n = t("plants")(Math.round(v / (nuclearSite().unit_MW / 1e3)));
    return compact ? n : `${n} → ${nf(v, 2)} GW`;
  }
  if (k.startsWith("add_")) {
    const d = c[2] < 1 ? 1 : 0;
    const change = `${v < 0 ? "−" : "+"}${nf(Math.abs(v), d)} GW`;
    return today[k] === undefined ? change : `${change} → ${nf(Math.max(0, today[k] + v), 1)} GW`;
  }
  if (k === "coal_retire_frac") {
    if (today[k] === undefined) return `−${nf(v * 100, 0)} %`;
    return `${v > 0 ? "−" : "+"}${nf(today[k] * v, 1)} GW → ${nf(today[k] * (1 - v), 1)} GW`;
  }
  if (k === "demand_scale" && today[k] !== undefined) return `${nf(v, 2)} × → ${nf(today[k] * v, 0)} TWh`;
  if (k.endsWith("_price_mult") && today[k] !== undefined) return `${nf(v, 2)} × → ${nf(today[k] * v, 1)} €/MWh`;
  return `${nf(v * c[3], c[3] === 100 ? 0 : 2)} ${c[4]}`;
}

// "today 15.4 GW" under the lever name.
function todayText(k) {
  const today = state.today || {};
  if (today[k] === undefined) return "";
  if (k === "demand_scale") return t("today_twh")(nf(today[k], 0));
  if (k.endsWith("_price_mult")) return t("today_fuel")(nf(today[k], 1));
  if (k === "line_rating") return t("today_pct")(nf(today[k] * 100, 0));
  return t("today_gw")(nf(today[k], 1));
}

function renderControls() {
  const box = $("lever-controls");
  const groups = [...new Set(CONTROLS.map((c) => c[1]))];
  box.innerHTML = groups.map((g) => `<fieldset class="lever-group"><legend>${esc(t(g))}</legend>${g === "g_add" ? `<p class="note muted">${esc(t("g_add_note"))}</p>` : ""}${
    CONTROLS.filter((c) => c[1] === g).map(([k, , step]) => {
      const m = meta(k), v = state.levers[k];
      if (k === "nuclear_restart") {
        return `<div class="lever"><span class="lever-label">${esc(t(k))}</span>${Object.entries(state.index.nuclear_plants).map(([id, p]) =>
          `<label class="check"><input type="checkbox" data-plant="${esc(id)}" ${v.includes(id) ? "checked" : ""}> ${esc(p.name)} · ${nf(p.MW / 1e3, 2)} GW</label>`).join("")}</div>`;
      }
      const isCap = k === "co2_cap_frac";
      const val = isCap && v === null ? m.max : v;
      if (k === "add_nuclear_new_GW") {
        const site = nuclearSite(), unitGW = site.unit_MW / 1e3;
        return `<div class="lever"><label class="lever-label" for="lv-${k}"><span>${esc(t(k))}<span class="lever-today">${esc(t("plant_size")(nf(unitGW, 2)))}</span></span> <output id="out-${k}">${esc(leverText(k, v))}</output></label>
        <input type="range" id="lv-${k}" data-lever="${k}" data-unit-gw="${unitGW}" min="0" max="${site.max_units}" step="1" value="${Math.round(v / unitGW)}"></div>`;
      }
      const today = todayText(k);
      if (k === "coal_retire_frac") {
        // Slider in quarters of today's coal fleet, left = retire; the lever stays a fraction.
        return `<div class="lever"><label class="lever-label" for="lv-${k}"><span>${esc(t(k))}${today ? `<span class="lever-today">${esc(today)}</span>` : ""}</span> <output id="out-${k}">${esc(leverText(k, v))}</output></label>
        <input type="range" id="lv-${k}" data-lever="${k}" data-coal-step="${step}" min="${-Math.round(m.max / step)}" max="0" step="1" value="${-Math.round(v / step)}"></div>`;
      }
      return `<div class="lever"><label class="lever-label" for="lv-${k}"><span>${esc(t(k))}${today ? `<span class="lever-today">${esc(today)}</span>` : ""}</span> <output id="out-${k}">${esc(leverText(k, v))}</output></label>
        ${isCap ? `<label class="check"><input type="checkbox" id="cap-on" ${v !== null ? "checked" : ""}> ${esc(t("co2_apply"))}</label>` : ""}
        <input type="range" id="lv-${k}" data-lever="${k}" min="${m.min}" max="${m.max}" step="${step}" value="${val}" ${isCap && v === null ? "disabled" : ""}></div>`;
    }).join("")}</fieldset>`).join("");

  box.querySelectorAll("input[type=range]").forEach((el) => el.addEventListener("input", () => {
    // New nuclear: the slider counts plants; the lever is GW.
    state.levers[el.dataset.lever] = el.dataset.unitGw ? Math.round(Number(el.value) * Number(el.dataset.unitGw) * 100) / 100
      : el.dataset.coalStep ? -Number(el.value) * Number(el.dataset.coalStep) : Number(el.value);
    $(`out-${el.dataset.lever}`).textContent = leverText(el.dataset.lever, state.levers[el.dataset.lever]);
    update();
  }));
  box.querySelectorAll("input[data-plant]").forEach((el) => el.addEventListener("change", () => {
    const set = new Set(state.levers.nuclear_restart);
    el.checked ? set.add(el.dataset.plant) : set.delete(el.dataset.plant);
    state.levers.nuclear_restart = [...set].sort();
    update();
  }));
  $("cap-on").addEventListener("change", (e) => {
    const slider = $("lv-co2_cap_frac");
    slider.disabled = !e.target.checked;
    state.levers.co2_cap_frac = e.target.checked ? Number(slider.value) : null;
    $("out-co2_cap_frac").textContent = leverText("co2_cap_frac", state.levers.co2_cap_frac);
    update();
  });
}

// Distance between lever settings: each lever normalised by its range; each restarted plant counts 1.
function distance(a, b) {
  let d = 0;
  for (const [k, m] of Object.entries(state.index.levers)) {
    if (k === "nuclear_restart") {
      const x = new Set(a[k]), y = new Set(b[k]);
      d += [...x].filter((p) => !y.has(p)).length + [...y].filter((p) => !x.has(p)).length;
    } else if (a[k] === null || b[k] === null) {
      d += a[k] === b[k] ? 0 : 1 + Math.abs(((a[k] ?? m.max) - (b[k] ?? m.max)) / (m.max - m.min));
    } else {
      d += Math.abs(a[k] - b[k]) / (m.max - m.min);
    }
  }
  return d;
}

function nearest() {
  let best = null;
  for (const s of state.index.scenarios) {
    const d = distance(state.levers, s.levers);
    const n = Object.keys(s.changed).length;
    if (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) < 1e-9 && n < best.n)) best = { s, d, n };
  }
  return best;
}

// ---------- URL ----------
function readUrl() {
  const q = new URL(location.href).searchParams;
  for (const k of Object.keys(state.index.levers)) {
    if (!q.has(k)) continue;
    const raw = q.get(k);
    if (k === "nuclear_restart") state.levers[k] = raw.split(",").filter((p) => p in state.index.nuclear_plants).sort();
    else if (k === "co2_cap_frac" && raw === "none") state.levers[k] = null;
    else {
      const m = meta(k), v = Number(raw);
      if (Number.isFinite(v)) state.levers[k] = Math.min(m.max, Math.max(m.min, v));
    }
  }
}

function writeUrl() {
  const url = new URL(location.href);
  const def = defaults();
  for (const k of Object.keys(def)) url.searchParams.delete(k);
  for (const [k, v] of Object.entries(state.levers)) {
    if (JSON.stringify(v) === JSON.stringify(def[k])) continue;
    url.searchParams.set(k, k === "nuclear_restart" ? v.join(",") : v === null ? "none" : String(v));
  }
  history.replaceState(null, "", url);
  return url.toString();
}

// ---------- results ----------
async function loadCase(hash) {
  if (!state.cache[hash]) {
    const res = await fetch(`data/sandbox/cases/${hash}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${hash}`);
    state.cache[hash] = await res.json();
  }
  return state.cache[hash];
}

function renderMatch(best) {
  const s = best.s;
  const exact = best.d < 1e-9;
  const diffs = Object.keys(state.index.levers)
    .filter((k) => JSON.stringify(state.levers[k]) !== JSON.stringify(s.levers[k]))
    .map((k) => `${esc(t(k))}: ${esc(leverText(k, state.levers[k], true))} → ${esc(leverText(k, s.levers[k], true))}`);
  const box = $("match");
  // Not computed: a red status box (icon and heading too, so it does not rely on colour alone).
  box.classList.toggle("inexact", !exact);
  const shown = esc(s.hash === state.index.base ? t("base_label") : s.label);
  box.innerHTML = exact
    ? `<b>${esc(t("exact"))}:</b> ${shown}`
    : `<div class="match-head"><span class="icon" aria-hidden="true">!</span><b>${esc(t("not_computed"))}</b></div>
       <p class="note">${esc(t("nearest_note"))} ${diffs.join(" · ")}</p>
       <p class="note"><b>${esc(t("nearest"))}:</b> ${shown}</p>
       <p class="note"><a href="request.html${esc(location.search)}">${esc(t("request_exact"))}</a></p>`;
}

function uncertaintyText(s) {
  const order = ["w2011", "w2018", "low", "high"];
  const names = [...(s.variants || [])].sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((v) => (v.startsWith("w") ? t("unc_weather")(v.slice(1)) : t(`unc_${v}`)));
  return names.length ? t("unc_note")([t("unc_weather")("2013"), ...names].join(", ")) : t("unc_none");
}

// In Chinese, costs also get an NT$ figure (億元 = 1e8 NT$) at the dashboard's exchange rate.
const ntdYi = (meur) => (meur === null || meur === undefined ? null : meur * 1e6 * ((state.index.currency || {}).eur_twd || 36.185) / 1e8);
const ntdNote = (meur, signedValue = false) => (state.lang === "zh" && meur !== null && meur !== undefined
  ? `（約新台幣 ${signedValue ? signed(ntdYi(meur), 0) : nf(ntdYi(meur), 0)} 億元/年）` : "");

function renderTiles(s) {
  const m = s.metrics, d = s.deltas, rg = s.ranges || {}, dr = s.delta_ranges || {};
  // Value with its range, e.g. "118.4 (112.0–125.1)", shown only when the range is not a single point.
  const span = (k, scale, digits) => {
    const r = rg[k];
    return r && Math.abs(r[1] - r[0]) > 10 ** -(digits + 1) ? `${t("range_label")} ${nf(r[0] * scale, digits)}–${nf(r[1] * scale, digits)}` : "";
  };
  const dspan = (k, scale, digits, unit = "") => {
    const r = dr[k];
    return r && Math.abs(r[1] - r[0]) > 10 ** -(digits + 1) ? ` (${signed(r[0] * scale, digits)} … ${signed(r[1] * scale, digits)}${unit})` : "";
  };
  const bar = (k) => {
    const r = rg[k], v = m[k];
    if (!r || r[1] - r[0] <= 0) return "";
    const lo = Math.min(r[0], v), hi = Math.max(r[1], v), pos = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50;
    return `<div class="range-bar" aria-hidden="true"><span class="range-fill"></span><span class="range-dot" style="left:${pos}%"></span></div>`;
  };
  const tile = (label, value, unit, k, delta, extra = "") => `<div class="tile"><div class="label">${esc(label)}</div>
    <div class="value">${value}<span class="unit">${esc(unit)}</span></div>${bar(k)}
    <div class="note">${esc(span(k, k === "re_share" ? 100 : 1, k === "re_share" || k === "co2_Mt" ? 1 : 0))}</div>
    <div class="note">${esc(delta)} ${esc(t("vs_base"))}${extra ? `<br>${esc(extra)}` : ""}</div></div>`;
  const costNote = t("t_cost_note")(nf(m.operating_cost_MEUR, 0), nf(m.investment_MEUR, 0)) +
    (m.investment_not_costed.length ? `; ${t("t_cost_restart")}` : "");
  $("sb-tiles").innerHTML = [
    tile(t("t_cost"), nf(m.system_cost_MEUR, 0), "M€/yr", "system_cost_MEUR",
         signed(d.system_cost_MEUR, 0) + dspan("system_cost_MEUR", 1, 0) + ntdNote(d.system_cost_MEUR, true),
         costNote + ntdNote(m.system_cost_MEUR) + (state.lang === "zh" ? t("fx_note")(state.index.currency) : "")),
    tile(t("t_co2"), nf(m.co2_Mt, 1), "Mt", "co2_Mt", signed(d.co2_Mt, 1) + dspan("co2_Mt", 1, 1)),
    tile(t("t_re"), nf(m.re_share * 100, 1), "%", "re_share", `${signed(d.re_share * 100, 1)} pp` + dspan("re_share", 100, 1, " pp")),
    tile(t("t_curtail"), nf(m.curtailment_TWh, 2), "TWh", "curtailment_TWh", signed(d.curtailment_TWh, 2) + dspan("curtailment_TWh", 1, 2)),
    tile(t("t_unserved"), nf(m.unserved_GWh, 0), "GWh", "unserved_GWh", signed(d.unserved_GWh, 0) + dspan("unserved_GWh", 1, 0)),
    tile(t("t_added"), signed(m.capacity_change_GW ?? m.capacity_added_GW, 1), "GW", "capacity_change_GW",
         signed(d.capacity_change_GW ?? d.capacity_added_GW, 1), t("t_added_note")(nf(m.capacity_added_GW, 1), nf(m.capacity_removed_GW ?? 0, 1))),
  ].join("") + `<p class="note muted unc-note">${esc(uncertaintyText(s))}</p>`;
}

function renderCapacity(base, cur) {
  const b = groupSum(base.results.capacity_GW), c = groupSum(cur.results.capacity_GW);
  const groups = GROUPS.filter((g) => g !== "unserved" && ((b[g] || 0) > 1e-3 || (c[g] || 0) > 1e-3));
  const labels = groups.map((g) => GROUP_LABEL[state.lang][g]);
  const bar = (vals, name, color) => ({ type: "bar", orientation: "h", name, y: labels, x: groups.map((g) => vals[g] || 0),
    marker: { color, line: { color: cssVar("--surface"), width: 2 } }, hovertemplate: `${name}<br>%{y}: %{x:.2f} GW<extra></extra>` });
  Plotly.react("sb-chart-capacity", [bar(b, t("base_series"), cssVar("--muted")), bar(c, t("scenario_series"), cssVar("--accent"))],
    baseLayout({ barmode: "group", barcornerradius: 4, yaxis: { autorange: "reversed" }, xaxis: { title: { text: "GW", font: { size: 11 } } } }), plotConfig);
}

function renderDispatch(cur) {
  const sel = $("week");
  const perWeek = 42; // 7 days x 6 four-hour steps
  const fmt = new Intl.DateTimeFormat(state.lang === "zh" ? "zh-TW" : "en-GB", { day: "numeric", month: "short" });
  const day = (i) => fmt.format(new Date(cur.inputs.time[Math.min(i, cur.inputs.time.length - 1)].replace(" ", "T")));
  const weeks = Math.floor(cur.inputs.time.length / perWeek);
  const opts = Array.from({ length: weeks }, (_, i) =>
    `<option value="${i + 1}">${esc(t("week_label")(i + 1, day(i * perWeek), day((i + 1) * perWeek - 1)))}</option>`).join("");
  if (sel.dataset.lang !== state.lang || sel.options.length !== weeks) {
    sel.innerHTML = opts;
    sel.dataset.lang = state.lang;
  }
  if (!sel.dataset.bound) {
    sel.addEventListener("change", () => { state.week = Number(sel.value); update(); });
    sel.dataset.bound = "1";
  }
  sel.value = String(state.week);
  const start = (state.week - 1) * perWeek, end = start + perWeek;
  const x = cur.inputs.time.slice(start, end);
  const byGroup = {};
  for (const [carrier, series] of Object.entries(cur.results.dispatch_MW)) {
    const g = CARRIER_GROUP[carrier] || "other";
    const part = series.slice(start, end);
    byGroup[g] = byGroup[g] ? byGroup[g].map((v, i) => v + part[i]) : part;
  }
  // Positive and negative stacks, as on the dashboard: storage charging shows below zero.
  const traces = [];
  for (const g of GROUPS) {
    const series = byGroup[g];
    if (!series || series.every((v) => Math.abs(v) < 1)) continue;
    const common = { type: "scatter", mode: "lines", x, line: { width: 0 }, fillcolor: cssVar(`--c-${g}`),
                     name: GROUP_LABEL[state.lang][g], legendgroup: g,
                     hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{y:.1f} GW<extra></extra>` };
    const pos = series.map((v) => Math.max(v, 0) / 1e3), neg = series.map((v) => Math.min(v, 0) / 1e3);
    if (pos.some((v) => v > 1e-3)) traces.push({ ...common, y: pos, stackgroup: "pos" });
    if (neg.some((v) => v < -1e-3)) traces.push({ ...common, y: neg, stackgroup: "neg", showlegend: false });
  }
  traces.push({ type: "scatter", mode: "lines", x, y: cur.inputs.demand_MW.slice(start, end).map((v) => v / 1e3), name: t("demand_line"),
    line: { color: cssVar("--ink"), width: 2 }, hovertemplate: `${t("demand_line")}: %{y:.1f} GW<extra></extra>` });
  Plotly.react("sb-chart-dispatch", traces, baseLayout({ hovermode: "x unified", yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotConfig);
}

// Whole year, one point per day: the average of that day's time steps.
function renderYear(cur) {
  const time = cur.inputs.time;
  const days = [];
  const index = new Map();
  time.forEach((ts, i) => {
    const day = ts.slice(0, 10);
    if (!index.has(day)) { index.set(day, days.length); days.push({ day, idx: [] }); }
    days[index.get(day)].idx.push(i);
  });
  const mean = (series) => days.map((d) => d.idx.reduce((a, i) => a + series[i], 0) / d.idx.length / 1e3);
  const byGroup = {};
  for (const [carrier, series] of Object.entries(cur.results.dispatch_MW)) {
    const g = CARRIER_GROUP[carrier] || "other";
    byGroup[g] = byGroup[g] ? byGroup[g].map((v, i) => v + series[i]) : series.slice();
  }
  const x = days.map((d) => d.day);
  const traces = [];
  for (const g of GROUPS) {
    if (!byGroup[g]) continue;
    const pos = mean(byGroup[g].map((v) => Math.max(v, 0))), neg = mean(byGroup[g].map((v) => Math.min(v, 0)));
    const common = { type: "scatter", mode: "lines", x, line: { width: 0 }, fillcolor: cssVar(`--c-${g}`),
                     name: GROUP_LABEL[state.lang][g], legendgroup: g,
                     hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{y:.1f} GW<extra></extra>` };
    if (pos.some((v) => v > 1e-3)) traces.push({ ...common, y: pos, stackgroup: "pos" });
    if (neg.some((v) => v < -1e-3)) traces.push({ ...common, y: neg, stackgroup: "neg", showlegend: false });
  }
  traces.push({ type: "scatter", mode: "lines", x, y: mean(cur.inputs.demand_MW), name: t("demand_line"),
                line: { color: cssVar("--ink"), width: 1.5 }, hovertemplate: `${t("demand_line")}: %{y:.1f} GW<extra></extra>` });
  Plotly.react("sb-chart-year", traces, baseLayout({ hovermode: "x unified", xaxis: { type: "date" },
    yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotConfig);
}

function renderMap(cur) {
  const buses = Object.fromEntries(cur.results.buses.map((b) => [b.name, b]));
  const ramp = ["#cde2fb", "#86b6ef", "#3987e5", "#1c5cab", "#0d366b"]; // sequential blue, light to dark
  const colour = (v) => ramp[Math.min(ramp.length - 1, Math.floor((v ?? 0) * (ramp.length - 0.001)))];
  const lines = cur.results.lines.map((l) => {
    const a = buses[l.bus0], b = buses[l.bus1];
    // Loading against the usable rating (s_max_pu), as the constraint sees it.
    const usable = (cur.sandbox.levers.line_rating ?? 0.7);
    const load = l.loading_max !== null ? Math.min(1, l.loading_max / usable) : 0;
    return { type: "scattergeo", mode: "lines", lon: [a.x, b.x], lat: [a.y, b.y], showlegend: false,
             line: { width: 2 + 6 * load, color: colour(load) }, hoverinfo: "text",
             text: `${l.bus0} – ${l.bus1}<br>${t("loading")} ${nf(load * 100, 0)}%` };
  });
  const bus = { type: "scattergeo", mode: "markers+text", lon: cur.results.buses.map((b) => b.x), lat: cur.results.buses.map((b) => b.y),
    text: cur.results.buses.map((b) => b.name), textposition: "middle right", showlegend: false,
    marker: { size: 9, color: cssVar("--ink-2"), line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: "%{text}<extra></extra>", textfont: { color: cssVar("--ink-2"), size: 11 } };
  Plotly.react("sb-chart-map", [...lines, bus], {
    ...baseLayout({ margin: { l: 0, r: 0, t: 0, b: 0 } }),
    geo: { projection: { type: "mercator" }, lonaxis: { range: [119.9, 122.1] }, lataxis: { range: [21.8, 25.4] },
           showland: true, landcolor: cssVar("--wash"), showocean: false, bgcolor: cssVar("--surface"),
           showcountries: false, coastlinecolor: cssVar("--axis"), showframe: false },
  }, plotConfig);
}

function renderTable() {
  const rows = [...state.index.scenarios].sort((a, b) => (a.hash === state.index.base ? -1 : b.hash === state.index.base ? 1 : a.label.localeCompare(b.label)));
  $("sb-table").innerHTML = `<table><thead><tr><th>${esc(t("col_scenario"))}</th><th class="num">${esc(t("col_cost"))}</th>
    <th class="num">${esc(t("col_co2"))}</th><th class="num">${esc(t("col_re"))}</th><th class="num">${esc(t("col_unserved"))}</th></tr></thead><tbody>` +
    rows.map((s) => `<tr class="clickable${s.hash === state.current ? " selected" : ""}" data-hash="${esc(s.hash)}" tabindex="0">
      <td>${esc(s.hash === state.index.base ? t("base_label") : s.label)}</td><td class="num">${signed(s.deltas.system_cost_MEUR, 0)}${state.lang === "zh" ? `<br><span class="muted">${signed(ntdYi(s.deltas.system_cost_MEUR), 0)} 億元</span>` : ""}</td>
      <td class="num">${signed(s.deltas.co2_Mt, 1)}</td><td class="num">${nf(s.metrics.re_share * 100, 1)}%</td>
      <td class="num">${nf(s.metrics.unserved_GWh, 0)}</td></tr>`).join("") + "</tbody></table>";
  $("sb-table").querySelectorAll("tr[data-hash]").forEach((tr) => {
    const go = () => {
      const s = state.index.scenarios.find((x) => x.hash === tr.dataset.hash);
      state.levers = JSON.parse(JSON.stringify(s.levers));
      renderControls();
      update();
      $("sb-results").scrollIntoView();
    };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });
}

let pending = 0;
async function update() {
  const ticket = ++pending;
  writeUrl();
  const best = nearest();
  state.current = best.s.hash;
  renderMatch(best);
  renderTiles(best.s);
  const [base, cur] = await Promise.all([loadCase(state.index.base), loadCase(best.s.hash)]);
  if (ticket !== pending) return; // a newer update is on its way
  renderCapacity(base, cur);
  renderYear(cur);
  renderDispatch(cur);
  renderMap(cur);
  renderTable();
}

function applyStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
}

function renderAll() {
  applyStaticText();
  if (!state.index) return;
  renderControls();
  update();
}

async function init() {
  const urlLang = new URL(location.href).searchParams.get("lang");
  state.lang = (urlLang || storageGet("tw-lang")) === "zh" ? "zh" : "en";
  const theme = storageGet("tw-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang; storageSet("tw-lang", state.lang); renderAll();
  }));
  $("theme-toggle").addEventListener("click", () => {
    const next = cssVar("color-scheme") === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; storageSet("tw-theme", next); renderAll();
  });
  $("reset").addEventListener("click", () => { state.levers = defaults(); renderControls(); update(); });
  $("share").addEventListener("click", async () => {
    const url = writeUrl();
    try { await navigator.clipboard.writeText(url); $("share-status").textContent = t("copied"); }
    catch { $("share-status").textContent = t("copy_failed"); }
  });
  applyStaticText();
  try {
    const res = await fetch("data/sandbox/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.index = await res.json();
    state.levers = defaults();
    readUrl();
    state.today = todayValues(await loadCase(state.index.base));
    renderAll();
  } catch (err) {
    $("match").innerHTML = `<b>${esc(t("loading_error"))}</b><br><small>${esc(err.message)}</small>`;
  }
}

init();
