/* Model data page: grid and regions, power plants, renewable potential and technology costs
   (data: docs/data/model_data.json, written by pypsa_tw/viewer/export_model_data.py). */

const MT = {
  en: {
    grid_full: (b, l) => `${b} substations and ${l} lines of the base network (OpenStreetMap), coloured by region; line width by voltage.`,
    grid_regions: "The model's six regions: node size by annual demand, link width by transfer capacity.",
    region: "Region", cities: "Main cities", demand: "Demand (TWh/yr)", peak: "Peak (GW)", subs: "Substations",
    from_to: "From – to", cap_gw: "Capacity (GW)", length: "Length (km)", circuits: "Circuits",
    kv: "kV", mva: "MVA", km: "km",
    all: "All", plants_sum: (n, gw) => `${n} plants, ${gw} GW`,
    col_name: "Name", col_type: "Type", col_tech: "Technology", col_mw: "MW", col_eff: "Efficiency", col_in: "In service", col_out: "Retires",
    groups: { gas: "Gas", coal: "Coal", oil: "Oil", nuclear: "Nuclear", hydro: "Hydro", wind: "Wind", solar: "Solar PV",
              biomass: "Biomass", geothermal: "Geothermal", storage: "Storage", other: "Other" },
    carriers: { solar: "Solar PV", onwind: "Onshore wind", "offwind-ac": "Offshore wind, near shore (AC)",
                "offwind-dc": "Offshore wind, far shore (DC)", "offwind-float": "Offshore wind, floating",
                CCGT: "Gas CCGT", OCGT: "Gas OCGT", coal: "Coal", oil: "Oil", ror: "Run-of-river", hydro: "Reservoir hydro",
                PHS: "Pumped hydro", battery: "Battery" },
    re_sum: (gw, twh, ex) => `Maximum ${gw} GW, about ${twh} TWh a year at the regions' capacity factors; ${ex} GW installed today.`,
    re_map_cells: "Where it can be built", re_map_cells_sub: (deg) => `Eligible capacity per ${deg}° weather cell (MW)`,
    re_map_cf: "How much it would produce", re_map_cf_sub: "Mean capacity factor at each substation's catchment; marker area by potential",
    max_gw: "Max (GW)", existing: "Installed (GW)", cf: "Capacity factor", twh: "TWh/yr",
    mw_cell: "MW", months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    set_density: "Capacity density", set_depth: "Water depth", set_shore: "Distance from shore", set_land: "Land-cover classes allowed (Copernicus)",
    set_natura: "Protected areas", set_natura_yes: "excluded (WDPA)", set_resource: "Resource model", set_corr: "Correction factor",
    set_note: "Settings from the model config (config.default.yaml, pypsa_tw/config/config_tw_test2_highs.yaml and, for floating wind, sector_path_2050_D_float_geothermal.yaml). The weather is ERA5 for 2013, converted with atlite.",
    year: "Cost year", group_all: "All groups",
    cgroups: { renewable: "Renewables", thermal: "Thermal", storage: "Storage", hydrogen: "Hydrogen and fuels", carbon: "Carbon capture", heat: "Heat", grid: "Grid" },
    col_techn: "Technology", col_inv: "Investment", col_fom: "FOM (%/yr)", col_vom: "VOM (€/MWh)", col_effn: "Efficiency",
    col_life: "Lifetime (yr)", col_fixed: "Fixed cost per year", col_cy: "Currency year", col_src: "Source (currency year)",
    cost_note: (r) => `Values as the model uses them for that cost year (technology-data, processed by PyPSA-Earth; discount rate ${r}). Annualised fixed cost = investment × annuity + FOM, in the investment's unit per year. Rows marked "Taiwan fork" are derived in this repository.`,
    lcoe_sub: "€ per MWh. Renewables at Taiwan's mean capacity factor from the potential above; dispatchable plants at the capacity factor you set. Indicative: no grid, balancing or storage costs.",
    cf_label: (v) => `Capacity factor of dispatchable plants: ${v}%`, co2_label: (v) => `CO₂ price: ${v} €/t`,
    capital: "Capital and fixed O&M", running: "Fuel and variable O&M", carbon: "CO₂ (incl. storage for capture)",
    meta: (g) => `Exported ${g}. Base run: today's system with 2013 weather, 6 regions.`,
    origin: { "pypsa-earth": "PyPSA-Earth default", taiwan: "Taiwan data", fork: "Added in this fork" },
    ov_cols: ["Input", "Origin", "What is used", "What this fork changes", "Sources"],
    set_default: "All settings are PyPSA-Earth's defaults.", set_changed: "Set in this fork:",
    set_fork_carrier: "This technology is added in this fork (PyPSA-Earth's default has no floating offshore wind); all settings below are this fork's.",
    src_title: "Sources", src_page: "page", src_file: "file", src_copy: "copy in this repository",
    ev: { downloaded: "Downloaded", page_opened: "Page checked", search_summary: "To verify", model_input: "Model input" },
    col_src_plant: "Sources", src_cap: "Capacity", src_loc: "Location", src_year: "Year",
    cmp_capex_tw: "Taiwan (official)", cmp_capex_py: "PyPSA",
    cmp_tw: "Taiwan: new build (tariff formula)", cmp_py: "PyPSA at Taiwan's output", cmp_act: "Taipower: actual 2025",
    cmp_py60: "PyPSA new build at 60%",
    cmp_lcoe_sub: "€ per MWh. New-build renewables: Taiwan's tariff formula (its installed cost, O&M, output and 5.25% cost of capital; offshore wind 5.70%) and PyPSA's rows at the same output with the model's 7% rate. Taipower: actual cost in 2025 of the power it bought (renewables) or generated (thermal), whatever the plants' age.",
    cmp_cols: ["Technology and source", "Taiwan installed cost", "PyPSA installed cost", "Ratio", "O&M (%/yr) Taiwan / PyPSA", "Output (capacity factor)", "Taiwan cost (€/MWh)", "PyPSA cost at Taiwan's output (€/MWh)"],
    cmp_cols_act: ["Taipower source and data", "Actual cost 2025", "PyPSA new build at 60% (€/MWh)", "Note"],
    cmp_find: (c) => [
      `Taiwan's official installed cost is ${c.solar}× PyPSA's for ground-mounted solar, ${c.off}× for offshore wind and ${c.geo}× for geothermal, but about the same for onshore wind (${c.on}×).`,
      `At Taiwan's own output per kW, new ground-mounted solar costs about ${c.solarTW} €/MWh by Taiwan's figures against ${c.solarPY} €/MWh with PyPSA's; offshore wind ${c.offTW} against ${c.offPY} €/MWh. With PyPSA's costs the model therefore finds solar and offshore wind much cheaper than Taiwan's tariffs imply.`,
      `Taipower's actual costs in 2025: own gas plants ${c.gas} €/MWh, coal ${c.coal}, nuclear ${c.nuc}; purchased wind ${c.wind} and solar ${c.solarAct} €/MWh (older, higher tariffs).`,
    ],
    cmp_note: (fx, y) => `NT$ converted at ${fx} TWD per EUR (Bank of Taiwan, 2026-09-24). PyPSA figures are cost year ${y} in technology-data's currency year (mostly EUR 2020); Taiwan's are nominal NT$ of 2026 (offshore wind 2023). No inflation adjustment, so part of the gap is price level. Tariff costs include grid connection to the tariff boundary and developer margins; PyPSA's are equipment and installation. The tariff formula reproduces the published tariffs (e.g. onshore wind 2.130 NT$/kWh vs 2.1299, offshore wind 2023 4.508 vs 4.5085).`,
  },
  zh: {
    grid_full: (b, l) => `基礎電網（OpenStreetMap）的 ${b} 座變電所與 ${l} 條線路，依區域著色；線寬代表電壓等級。`,
    grid_regions: "模型的六個區域：節點大小代表年需求，連線寬度代表輸電容量。",
    region: "區域", cities: "主要城市", demand: "需求（TWh／年）", peak: "尖峰（GW）", subs: "變電所數",
    from_to: "起訖", cap_gw: "容量（GW）", length: "長度（公里）", circuits: "迴路數",
    kv: "kV", mva: "MVA", km: "公里",
    all: "全部", plants_sum: (n, gw) => `${n} 座電廠，${gw} GW`,
    col_name: "名稱", col_type: "類型", col_tech: "技術", col_mw: "MW", col_eff: "效率", col_in: "商轉年", col_out: "除役年",
    groups: { gas: "燃氣", coal: "燃煤", oil: "燃油", nuclear: "核能", hydro: "水力", wind: "風力", solar: "太陽光電",
              biomass: "生質能", geothermal: "地熱", storage: "儲能", other: "其他" },
    carriers: { solar: "太陽光電", onwind: "陸域風電", "offwind-ac": "離岸風電（近岸，交流）",
                "offwind-dc": "離岸風電（遠岸，直流）", "offwind-float": "離岸風電（浮動式）",
                CCGT: "燃氣複循環", OCGT: "燃氣單循環", coal: "燃煤", oil: "燃油", ror: "川流式水力", hydro: "水庫式水力",
                PHS: "抽蓄水力", battery: "電池" },
    re_sum: (gw, twh, ex) => `最大 ${gw} GW，依各區容量因數每年約 ${twh} TWh；現有裝置 ${ex} GW。`,
    re_map_cells: "可設置的位置", re_map_cells_sub: (deg) => `每個 ${deg}° 氣象網格的可設置容量（MW）`,
    re_map_cf: "可發電量", re_map_cf_sub: "各變電所供電範圍的平均容量因數；圓點面積代表潛力",
    max_gw: "上限（GW）", existing: "現有（GW）", cf: "容量因數", twh: "TWh／年",
    mw_cell: "MW", months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    set_density: "容量密度", set_depth: "水深", set_shore: "離岸距離", set_land: "允許的土地覆蓋類別（Copernicus）",
    set_natura: "保護區", set_natura_yes: "排除（WDPA）", set_resource: "資源模型", set_corr: "修正係數",
    set_note: "設定取自模型設定檔（config.default.yaml、pypsa_tw/config/config_tw_test2_highs.yaml，浮動式風電另加 sector_path_2050_D_float_geothermal.yaml）。氣象資料為 2013 年 ERA5，以 atlite 轉換。",
    year: "成本年份", group_all: "全部類別",
    cgroups: { renewable: "再生能源", thermal: "火力與核能", storage: "儲能", hydrogen: "氫能與燃料", carbon: "碳捕捉", heat: "熱能", grid: "電網" },
    col_techn: "技術", col_inv: "投資成本", col_fom: "固定運維（%／年）", col_vom: "變動運維（歐元/MWh）", col_effn: "效率",
    col_life: "壽命（年）", col_fixed: "每年固定成本", col_cy: "幣值年", col_src: "來源（幣值年）",
    cost_note: (r) => `各成本年份模型實際使用的數值（technology-data，經 PyPSA-Earth 處理；折現率 ${r}）。年化固定成本 = 投資 × 年金因子 + 固定運維，單位同投資成本的每年值。標示「Taiwan fork」者為本專案推導。`,
    lcoe_sub: "每 MWh 歐元。再生能源採上方潛力分析的台灣平均容量因數；可調度電廠採您設定的容量因數。僅供參考：不含電網、調度或儲能成本。",
    cf_label: (v) => `可調度電廠容量因數：${v}%`, co2_label: (v) => `碳價：每公噸 ${v} 歐元`,
    capital: "資本與固定運維", running: "燃料與變動運維", carbon: "CO₂（含捕捉後封存）",
    meta: (g) => `匯出時間 ${g}。基準模擬：現況系統、2013 年氣象、6 個區域。`,
    origin: { "pypsa-earth": "PyPSA-Earth 預設", taiwan: "台灣資料", fork: "本分支新增" },
    ov_cols: ["輸入", "來源類別", "採用資料", "本分支的修改", "來源"],
    set_default: "所有設定皆為 PyPSA-Earth 預設值。", set_changed: "本分支設定：",
    set_fork_carrier: "此技術為本分支新增（PyPSA-Earth 預設沒有浮動式離岸風電）；以下設定皆為本分支所設。",
    src_title: "資料來源", src_page: "頁面", src_file: "檔案", src_copy: "本專案副本",
    ev: { downloaded: "已下載", page_opened: "已查頁面", search_summary: "待查證", model_input: "模型輸入" },
    col_src_plant: "來源", src_cap: "容量", src_loc: "位置", src_year: "年份",
    cmp_capex_tw: "台灣（官方）", cmp_capex_py: "PyPSA",
    cmp_tw: "台灣：新建（躉購費率公式）", cmp_py: "PyPSA（採台灣年發電量）", cmp_act: "台電：2025 年實際成本",
    cmp_py60: "PyPSA 新建（容量因數 60%）",
    cmp_lcoe_sub: "每 MWh 歐元。新建再生能源：台灣躉購費率公式（其期初設置成本、運維、年售電量與 5.25% 平均資金成本率；離岸風電 5.70%），以及 PyPSA 數據在相同年發電量、模型 7% 折現率下的成本。台電：2025 年購入（再生能源）或自發（火力）電力的實際成本，不論電廠年齡。",
    cmp_cols: ["技術與來源", "台灣設置成本", "PyPSA 設置成本", "倍數", "運維（%／年）台灣／PyPSA", "年發電量（容量因數）", "台灣成本（歐元/MWh）", "PyPSA 成本，台灣年發電量（歐元/MWh）"],
    cmp_cols_act: ["台電發電方式與資料", "2025 年實際成本", "PyPSA 新建，容量因數 60%（歐元/MWh）", "說明"],
    cmp_find: (c) => [
      `台灣官方設置成本為 PyPSA 的：地面型太陽光電 ${c.solar} 倍、離岸風電 ${c.off} 倍、地熱 ${c.geo} 倍；陸域風電則相近（${c.on} 倍）。`,
      `以台灣本身的每瓩年發電量計算，新建地面型太陽光電依台灣數據約每 MWh ${c.solarTW} 歐元，依 PyPSA 數據為 ${c.solarPY} 歐元；離岸風電為 ${c.offTW} 對 ${c.offPY} 歐元。因此模型採用 PyPSA 成本時，太陽光電與離岸風電比台灣躉購費率所隱含的便宜許多。`,
      `台電 2025 年實際成本：自有燃氣電廠每 MWh ${c.gas} 歐元、燃煤 ${c.coal}、核能 ${c.nuc}；購入風電 ${c.wind}、太陽光電 ${c.solarAct} 歐元（早期較高的躉購費率）。`,
    ],
    cmp_note: (fx, y) => `新台幣以每歐元 ${fx} 元換算（臺灣銀行，2026-09-24）。PyPSA 為 ${y} 年成本，幣值為 technology-data 的幣值年（多為 2020 年歐元）；台灣為 2026 年名目新台幣（離岸風電為 2023 年）。未調整通膨，差距有部分來自物價水準。躉購費率成本包含至責任分界點的併網費用與開發商合理利潤；PyPSA 為設備與安裝成本。躉購費率公式可重現公告費率（例如陸域風電 2.130 對 2.1299 元/度、2023 年離岸風電 4.508 對 4.5085 元/度）。`,
  },
};

const GROUP_COLOR = { gas: "--c-gas", coal: "--c-coal", oil: "--c-other", nuclear: "--c-nuclear", hydro: "--c-hydro", wind: "--c-onwind",
                      solar: "--c-solar", biomass: "--c-other_re", geothermal: "--c-other_re", storage: "--c-storage", other: "--c-other" };
const GROUP_ORDER = ["nuclear", "coal", "gas", "oil", "hydro", "wind", "solar", "biomass", "geothermal", "storage", "other"];
// LCOE chart: cost row -> capacity factor source (a renewable carrier, or null for the slider) and fuel
const LCOE_TECHS = [["solar-utility", ["solar"]], ["solar-rooftop", ["solar"]], ["onwind", ["onwind"]], ["offwind", ["offwind-ac", "offwind-dc"]],
                    ["offwind-float", ["offwind-float"]], ["geothermal", null], ["nuclear", null, "uranium"], ["coal", null, "coal"],
                    ["CCGT", null, "gas"], ["CCGT CC", null, "gas", 0.95], ["OCGT", null, "gas"]];
const TREND_TECHS = ["solar-utility", "solar-rooftop", "onwind", "offwind", "offwind-float", "nuclear", "CCGT", "electrolysis"];
const CO2_STORAGE_EUR_T = 10;  // sector.co2_sequestration_cost

const st = { data: null, gridView: "full", reLayer: "cells", fleet: null, fuel: "", region: "", search: "", re: "solar",
             year: null, group: "", sort: { key: "MW", dir: -1 } };
const $m = (id) => document.getElementById(id);
const mlang = () => (window.twLang ? window.twLang() : "en");
const T = () => MT[mlang()];
const cv = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nf = (v, d = 0) => (v === null || v === undefined || Number.isNaN(v) ? "–" : new Intl.NumberFormat(mlang() === "zh" ? "zh-TW" : "en-US",
  { maximumFractionDigits: d, minimumFractionDigits: d }).format(v));
const cfg = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };
const plantName = (p) => (mlang() === "zh" && p.name_zh ? p.name_zh : p.name);
const regionName = (id) => { const r = st.data.network.regions.find((x) => x.id === id); return r ? r.label[mlang()] : id || "–"; };
const regionColor = (id) => cv(`--k-${st.data.network.regions.findIndex((x) => x.id === id) + 1}`);
const isDark = () => document.documentElement.getAttribute("data-theme") === "dark" ||
  (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
// Sequential blue ramp (one hue, light to dark; reversed brightness in dark mode)
const seqScale = () => (isDark()
  ? [[0, "#1c3350"], [0.25, "#21528f"], [0.5, "#2f72c6"], [0.75, "#5c9de6"], [1, "#b3d3f6"]]
  : [[0, "#e6f0fb"], [0.25, "#a9cbf3"], [0.5, "#5c9de6"], [0.75, "#2a78d6"], [1, "#154a8a"]]);

function alpha(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function layout(extra = {}) {
  const axis = { gridcolor: cv("--grid"), linecolor: cv("--axis"), zerolinecolor: cv("--axis"), tickfont: { color: cv("--muted"), size: 11 }, automargin: true };
  return { paper_bgcolor: cv("--surface"), plot_bgcolor: cv("--surface"), margin: { l: 8, r: 12, t: 8, b: 8 },
           font: { family: cv("--font"), color: cv("--ink-2"), size: 12 }, hovermode: "closest",
           legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", font: { color: cv("--ink-2"), size: 11 } },
           hoverlabel: { bgcolor: cv("--surface"), bordercolor: cv("--border"), font: { color: cv("--ink") } },
           ...extra, xaxis: { ...axis, ...(extra.xaxis || {}) }, yaxis: { ...axis, ...(extra.yaxis || {}) } };
}

function geoLayout(extra = {}) {
  return layout({
    geo: { projection: { type: "mercator" }, resolution: 50, lonaxis: { range: [119.2, 122.4] }, lataxis: { range: [21.75, 25.45] },
           bgcolor: cv("--surface"), showland: true,
           landcolor: cv("--wash"), showocean: true, oceancolor: cv("--surface"), showcoastlines: true, coastlinecolor: cv("--axis"),
           showcountries: false, showframe: false, showlakes: false },
    margin: { l: 0, r: 0, t: 0, b: 0 }, ...extra,
  });
}

function table(head, rows, sortable) {
  return `<table><thead><tr>${head.map(([h, num, key]) => `<th${num ? ' class="num"' : ""}${sortable && key ? ` data-sort="${key}" tabindex="0" role="button" aria-sort="${st.sort.key === key ? (st.sort.dir > 0 ? "ascending" : "descending") : "none"}"` : ""}>${esc(h)}${sortable && st.sort.key === key ? (st.sort.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((r) => `<tr>${r.map(([v, num]) => `<td${num ? ' class="num"' : ""}>${v}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
}

function ringTraces(geom, id, fill) {
  if (!geom) return [];
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  return polys.map((p) => ({
    type: "scattergeo", mode: "lines", fill: fill ? "toself" : "none", showlegend: false, hoverinfo: "skip",
    lon: p[0].map((c) => c[0]), lat: p[0].map((c) => c[1]),
    fillcolor: alpha(regionColor(id), fill ? 0.16 : 0), line: { color: alpha(regionColor(id), fill ? 0.7 : 0.5), width: 1, dash: fill ? "solid" : "dot" },
  }));
}

// ---------- Grid and regions ----------
function renderGrid() {
  const t = T(), N = st.data.network;
  const traces = [];
  N.regions.forEach((r) => { traces.push(...ringTraces(r.onshore, r.id, true), ...ringTraces(r.offshore, r.id, false)); });
  if (st.gridView === "full") {
    const byV = {};
    N.lines.forEach((l) => { (byV[l.v_nom] = byV[l.v_nom] || []).push(l); });
    Object.entries(byV).sort((a, b) => a[0] - b[0]).forEach(([v, ls]) => {
      const lon = [], lat = [];
      ls.forEach((l) => { lon.push(l.coords[0][0], l.coords[1][0], null); lat.push(l.coords[0][1], l.coords[1][1], null); });
      traces.push({ type: "scattergeo", mode: "lines", name: `${nf(+v)} ${t.kv}`, lon, lat, hoverinfo: "skip",
                    line: { color: cv("--ink-2"), width: +v >= 300 ? 2 : 1 } });
    });
    // hover points at line midpoints
    traces.push({ type: "scattergeo", mode: "markers", showlegend: false, marker: { size: 8, opacity: 0 },
                  lon: N.lines.map((l) => (l.coords[0][0] + l.coords[1][0]) / 2), lat: N.lines.map((l) => (l.coords[0][1] + l.coords[1][1]) / 2),
                  hovertemplate: N.lines.map((l) => `${esc(l.bus0)} – ${esc(l.bus1)}<br>${nf(l.v_nom)} ${t.kv} · ${nf(l.s_nom_MVA)} ${t.mva} · ${nf(l.length_km, 1)} ${t.km}<extra></extra>`) });
    traces.push({ type: "scattergeo", mode: "markers", showlegend: false,
                  lon: N.buses.map((b) => b.x), lat: N.buses.map((b) => b.y),
                  marker: { size: 6, color: N.buses.map((b) => regionColor(b.region)), line: { color: cv("--surface"), width: 1 } },
                  hovertemplate: N.buses.map((b) => `${esc(b.id)} · ${nf(b.v_nom)} ${t.kv}<br>${esc(regionName(b.region))}<extra></extra>`) });
    $m("md-grid-sub").textContent = t.grid_full(N.buses.length, N.lines.length);
  } else {
    const pos = Object.fromEntries(N.regions.map((r) => [r.id, r]));
    const maxS = Math.max(...N.region_lines.map((l) => l.s_nom_GW), 1);
    N.region_lines.forEach((l) => traces.push({ type: "scattergeo", mode: "lines", showlegend: false, hoverinfo: "skip",
      lon: [pos[l.bus0].x, pos[l.bus1].x], lat: [pos[l.bus0].y, pos[l.bus1].y], line: { color: cv("--ink-2"), width: 1.5 + 7 * l.s_nom_GW / maxS } }));
    traces.push({ type: "scattergeo", mode: "markers", showlegend: false, marker: { size: 14, opacity: 0 },
                  lon: N.region_lines.map((l) => (pos[l.bus0].x + pos[l.bus1].x) / 2), lat: N.region_lines.map((l) => (pos[l.bus0].y + pos[l.bus1].y) / 2),
                  hovertemplate: N.region_lines.map((l) => `${esc(regionName(l.bus0))} ↔ ${esc(regionName(l.bus1))}<br>${nf(l.s_nom_GW, 1)} GW · ${nf(l.length_km)} ${t.km}<extra></extra>`) });
    const maxD = Math.max(...N.regions.map((r) => r.demand_TWh), 1);
    traces.push({ type: "scattergeo", mode: "markers+text", showlegend: false, lon: N.regions.map((r) => r.x), lat: N.regions.map((r) => r.y),
                  text: N.regions.map((r) => r.label[mlang()]), textposition: N.regions.map((r) => (r.x < 120.9 ? "middle left" : "middle right")),
                  textfont: { color: cv("--ink"), size: 11 },
                  marker: { size: N.regions.map((r) => 12 + 26 * Math.sqrt(r.demand_TWh / maxD)), color: N.regions.map((r) => regionColor(r.id)),
                            line: { color: cv("--surface"), width: 2 } },
                  hovertemplate: N.regions.map((r) => `${esc(r.label[mlang()])}<br>${esc(t.demand)} ${nf(r.demand_TWh, 1)} · ${esc(t.peak)} ${nf(r.peak_GW, 1)}<extra></extra>`) });
    $m("md-grid-sub").textContent = t.grid_regions;
  }
  traces.push({ type: "scattergeo", mode: "markers", lon: [119.3, 122.3], lat: [21.8, 25.5], marker: { size: 1, opacity: 0 }, hoverinfo: "skip", showlegend: false });
  Plotly.react("md-grid-map", traces, geoLayout({ showlegend: st.gridView === "full" }), cfg);

  $m("md-region-table").innerHTML = table(
    [[t.region], [t.demand, 1], [t.peak, 1], [t.subs, 1]],
    N.regions.map((r) => [[`<span class="swatch" style="background:${regionColor(r.id)}"></span>${esc(r.label[mlang()])} <span class="muted">${esc(r.id)}</span>`],
      [nf(r.demand_TWh, 1), 1], [nf(r.peak_GW, 1), 1], [nf(r.substations), 1]]));
  $m("md-region-lines").innerHTML = table(
    [[t.from_to], [t.cap_gw, 1], [t.length, 1], [t.circuits, 1]],
    N.region_lines.map((l) => [[`${esc(regionName(l.bus0))} ↔ ${esc(regionName(l.bus1))}`], [nf(l.s_nom_GW, 1), 1], [nf(l.length_km), 1], [nf(l.circuits, 1), 1]]));
}

// ---------- Power plants ----------
function plantsShown() {
  const f = st.data.fleets.find((x) => x.id === st.fleet) || st.data.fleets[0];
  const q = st.search.trim().toLowerCase();
  return { fleet: f, rows: f.plants.filter((p) => (!st.fuel || p.group === st.fuel) && (!st.region || p.region === st.region) &&
                                                (!q || String(p.name).toLowerCase().includes(q) || String(p.name_zh || "").includes(st.search.trim()))) };
}

function fillSelect(id, opts, value) {
  const el = $m(id);
  el.innerHTML = opts.map(([v, label]) => `<option value="${esc(v)}">${esc(label)}</option>`).join("");
  el.value = value;
}

function renderPlants() {
  const t = T(), { fleet, rows } = plantsShown();
  fillSelect("md-fleet", st.data.fleets.map((f) => [f.id, mlang() === "zh" ? f.label_zh : f.label]), fleet.id);
  const groups = GROUP_ORDER.filter((g) => fleet.plants.some((p) => p.group === g));
  fillSelect("md-fuel", [["", t.all], ...groups.map((g) => [g, t.groups[g]])], st.fuel);
  fillSelect("md-region", [["", t.all], ...st.data.network.regions.map((r) => [r.id, r.label[mlang()]])], st.region);
  const total = rows.reduce((a, p) => a + (p.MW || 0), 0);
  $m("md-plant-sum").textContent = t.plants_sum(rows.length, nf(total / 1e3, 1));

  const maxMW = Math.max(...fleet.plants.map((p) => p.MW || 0), 1);
  const traces = groups.filter((g) => rows.some((p) => p.group === g)).map((g) => {
    const ps = rows.filter((p) => p.group === g && p.lat !== null);
    return { type: "scattergeo", mode: "markers", name: t.groups[g], lon: ps.map((p) => p.lon), lat: ps.map((p) => p.lat),
             marker: { size: ps.map((p) => 5 + 34 * Math.sqrt((p.MW || 0) / maxMW)), color: cv(GROUP_COLOR[g]), opacity: 0.85,
                       line: { color: cv("--surface"), width: 1 } },
             hovertemplate: ps.map((p) => `<b>${esc(plantName(p))}</b><br>${esc(t.groups[g])}${techLabel(p) ? ` · ${esc(techLabel(p))}` : ""}<br>${nf(p.MW)} MW${p.year_in ? ` · ${p.year_in}` : ""}${p.year_out ? `–${p.year_out}` : ""}<br>${esc(regionName(p.region))}<extra></extra>`) };
  });
  traces.push({ type: "scattergeo", mode: "markers", lon: [119.3, 122.3], lat: [21.8, 25.5], marker: { size: 1, opacity: 0 }, hoverinfo: "skip", showlegend: false });
  Plotly.react("md-plant-map", traces, geoLayout({ showlegend: true }), cfg);

  const regs = st.data.network.regions;
  const bars = groups.map((g) => ({
    type: "bar", orientation: "h", name: t.groups[g], y: regs.map((r) => r.label[mlang()]),
    x: regs.map((r) => rows.filter((p) => p.group === g && p.region === r.id).reduce((a, p) => a + (p.MW || 0), 0) / 1e3),
    marker: { color: cv(GROUP_COLOR[g]), line: { color: cv("--surface"), width: 1.5 } },
    hovertemplate: `${esc(t.groups[g])}: %{x:.2f} GW<extra>%{y}</extra>`,
  })).filter((b) => b.x.some((v) => v > 0.001));
  Plotly.react("md-plant-chart", bars, layout({ barmode: "stack", barcornerradius: 3, legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cv("--ink-2"), size: 11 } }, xaxis: { title: { text: "GW", font: { size: 11 } } },
                                                yaxis: { autorange: "reversed" }, margin: { l: 8, r: 12, t: 8, b: 30 } }), cfg);

  const k = st.sort.key, dir = st.sort.dir;
  const sorted = [...rows].sort((a, b) => {
    const val = (p) => (k === "region" ? regionName(p.region) : k === "name" ? plantName(p) : p[k]);
    const va = val(a), vb = val(b);
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir;
  });
  const hasEff = fleet.plants.some((p) => p.efficiency), hasOut = fleet.plants.some((p) => p.year_out);
  const cols = [[t.col_name, 0, "name"], [t.col_type, 0, "group"], [t.col_tech, 0, "technology"], [t.col_mw, 1, "MW"],
    ...(hasEff ? [[t.col_eff, 1, "efficiency"]] : []), [t.col_in, 1, "year_in"], ...(hasOut ? [[t.col_out, 1, "year_out"]] : []), [t.region, 0, "region"], [t.col_src_plant]];
  $m("md-plant-table").innerHTML = table(cols,
    sorted.map((p) => [[mlang() === "zh" && p.name_zh ? `${esc(p.name_zh)}<br><span class="muted">${esc(p.name)}</span>` : esc(p.name)], [`<span class="swatch" style="background:${cv(GROUP_COLOR[p.group])}"></span>${esc(t.groups[p.group] || p.fuel)}`],
      [esc(techLabel(p))], [nf(p.MW, 1), 1],
      ...(hasEff ? [[p.efficiency ? nf(p.efficiency * 100, 0) + "%" : "–", 1]] : []),
      [p.year_in ?? "–", 1], ...(hasOut ? [[p.year_out ?? "–", 1]] : []), [esc(regionName(p.region))], [plantSources(p)]]), true);
  $m("md-plant-table").querySelectorAll("th[data-sort]").forEach((th) => {
    const go = () => { const key = th.dataset.sort; st.sort = { key, dir: st.sort.key === key ? -st.sort.dir : (key === "MW" ? -1 : 1) }; renderPlants(); };
    th.addEventListener("click", go);
    th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}

// ---------- Renewable potential ----------
function reData() { return st.data.potential.find((p) => p.carrier === st.re) || st.data.potential[0]; }

function meanCF(carriers) {
  let w = 0, s = 0;
  st.data.potential.filter((p) => carriers.includes(p.carrier)).forEach((p) => p.regions.forEach((r) => {
    if (r.cf && r.p_nom_max_GW) { w += r.p_nom_max_GW; s += r.cf * r.p_nom_max_GW; }
  }));
  return w ? s / w : null;
}

function renderPotential() {
  const t = T(), P = reData();
  fillSelect("md-re", st.data.potential.map((p) => [p.carrier, t.carriers[p.carrier] || p.carrier]), P.carrier);
  const twh = P.regions.reduce((a, r) => a + (r.potential_TWh || 0), 0);
  const ex = P.regions.reduce((a, r) => a + (r.existing_GW || 0), 0);
  $m("md-re-sum").textContent = t.re_sum(nf(P.total_GW, 1), nf(twh), nf(ex, 1));

  const traces = [];
  st.data.network.regions.forEach((r) => traces.push(...ringTraces(r.onshore, r.id, false).map((tr) => ({ ...tr, line: { ...tr.line, dash: "solid", color: cv("--axis") } })),
                                                      ...ringTraces(r.offshore, r.id, false).map((tr) => ({ ...tr, line: { ...tr.line, color: cv("--axis") } }))));
  const el = $m("md-re-map");
  if (st.reLayer === "cells") {
    $m("md-re-map-title").textContent = t.re_map_cells;
    $m("md-re-map-sub").textContent = t.re_map_cells_sub(nf(P.cell_deg, 1));
    const px = Math.max(6, Math.round((el.clientHeight || 420) * P.cell_deg / 3.9));
    traces.push({ type: "scattergeo", mode: "markers", showlegend: false, lon: P.cells.map((c) => c[0]), lat: P.cells.map((c) => c[1]),
                  marker: { symbol: "square", size: px, color: P.cells.map((c) => c[2]), colorscale: seqScale(), cmin: 0, opacity: 0.9,
                            line: { width: 0 }, colorbar: { title: { text: t.mw_cell, font: { size: 11 } }, thickness: 10, len: 0.6,
                                                             tickfont: { color: cv("--muted"), size: 10 }, outlinewidth: 0 } },
                  hovertemplate: P.cells.map((c) => `${nf(c[2])} MW<br>${nf(c[1], 1)}°N ${nf(c[0], 1)}°E<extra></extra>`) });
  } else {
    $m("md-re-map-title").textContent = t.re_map_cf;
    $m("md-re-map-sub").textContent = t.re_map_cf_sub;
    const maxP = Math.max(...P.substations.map((s) => s.p_nom_max_MW), 1);
    const cfs = P.substations.map((s) => s.cf);
    traces.push({ type: "scattergeo", mode: "markers", showlegend: false, lon: P.substations.map((s) => s.x), lat: P.substations.map((s) => s.y),
                  marker: { size: P.substations.map((s) => 5 + 26 * Math.sqrt(s.p_nom_max_MW / maxP)), color: cfs, colorscale: seqScale(),
                            cmin: Math.min(...cfs), cmax: Math.max(...cfs), line: { color: cv("--surface"), width: 1 },
                            colorbar: { title: { text: t.cf, font: { size: 11 } }, thickness: 10, len: 0.6, tickformat: ".0%",
                                        tickfont: { color: cv("--muted"), size: 10 }, outlinewidth: 0 } },
                  hovertemplate: P.substations.map((s) => `${esc(s.bus)} · ${esc(regionName(s.region))}<br>${nf(s.p_nom_max_MW)} MW · ${nf(s.cf * 100, 1)}%<extra></extra>`) });
  }
  traces.push({ type: "scattergeo", mode: "markers", lon: [119.3, 122.3], lat: [21.8, 25.5], marker: { size: 1, opacity: 0 }, hoverinfo: "skip", showlegend: false });
  Plotly.react("md-re-map", traces, geoLayout(), cfg);

  $m("md-re-table").innerHTML = table(
    [[t.region], [t.max_gw, 1], [t.existing, 1], [t.cf, 1], [t.twh, 1]],
    P.regions.map((r) => [[`<span class="swatch" style="background:${regionColor(r.region)}"></span>${esc(regionName(r.region))}`],
      [nf(r.p_nom_max_GW, 1), 1], [nf(r.existing_GW, 2), 1], [r.cf ? nf(r.cf * 100, 1) + "%" : "–", 1], [nf(r.potential_TWh, 1), 1]]));
  const lines = P.regions.filter((r) => r.monthly_cf.length && r.p_nom_max_GW > 0.05).map((r) => ({
    type: "scatter", mode: "lines+markers", name: regionName(r.region), x: t.months, y: r.monthly_cf,
    line: { color: regionColor(r.region), width: 2 }, marker: { size: 8, color: regionColor(r.region), line: { color: cv("--surface"), width: 2 } },
    hovertemplate: `${esc(regionName(r.region))}: %{y:.1%}<extra>%{x}</extra>`,
  }));
  Plotly.react("md-re-month", lines, layout({ yaxis: { tickformat: ".0%", rangemode: "tozero" }, xaxis: { type: "category" }, margin: { l: 8, r: 12, t: 8, b: 24 } }), cfg);

  const s = P.settings || {};
  const items = [];
  if (s.capacity_per_sqkm !== undefined) items.push([t.set_density, `${nf(s.capacity_per_sqkm, 1)} MW/km²`]);
  if (s.min_depth !== undefined || s.max_depth !== undefined) items.push([t.set_depth, `${s.min_depth !== undefined ? nf(s.min_depth) : 0}–${s.max_depth !== undefined ? nf(s.max_depth) : "∞"} m`]);
  if (s.min_shore_distance !== undefined || s.max_shore_distance !== undefined)
    items.push([t.set_shore, `${s.min_shore_distance !== undefined ? nf(s.min_shore_distance / 1e3) : 0}–${s.max_shore_distance !== undefined ? nf(s.max_shore_distance / 1e3) : "∞"} km`]);
  if (s.copernicus && s.copernicus.grid_codes) items.push([t.set_land, s.copernicus.grid_codes.join(", ")]);
  if (s.natura) items.push([t.set_natura, t.set_natura_yes]);
  if (s.resource) items.push([t.set_resource, Object.entries(s.resource).map(([k, v]) => `${k}: ${v}`).join(" · ")]);
  if (s.correction_factor !== undefined) items.push([t.set_corr, nf(s.correction_factor, 3)]);
  const head = P.fork_carrier ? `${originTag("fork")} ${esc(t.set_fork_carrier)}`
    : (P.changed_settings && P.changed_settings.length ? `${originTag("fork")} ${esc(t.set_changed)} ${esc(P.changed_settings.join(", "))}` : `${originTag("pypsa-earth")} ${esc(t.set_default)}`);
  $m("md-re-settings").innerHTML = `<p class="note">${head}</p><dl class="kv">${items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl><p class="note muted">${esc(t.set_note)}</p>`;
}

// ---------- Technology costs ----------
function costYear() { return st.data.costs.years.find((y) => y.year === st.year) || st.data.costs.years[st.data.costs.years.length - 1]; }

// "EUR/kW_e, 2020" -> "€/kW"; keeps carrier suffixes such as kW_th, kW_H2
const unitLabel = (u) => String(u).replace(/,\s*\d{4}$/, "").replace(/kW_el\b|kW_e\b|kWel\b/, "kW").replace("EUR", "€");

function renderCosts() {
  const t = T(), Y = costYear();
  fillSelect("md-year", st.data.costs.years.map((y) => [y.year, String(y.year)]), Y.year);
  const groups = [...new Set(Y.rows.map((r) => r.group))];
  fillSelect("md-group", [["", t.group_all], ...groups.map((g) => [g, t.cgroups[g] || g])], st.group);
  const name = (r) => (mlang() === "zh" ? r.zh : r.en);

  // Indicative cost of electricity
  const cf = +$m("md-cf").value / 100, co2 = +$m("md-co2").value;
  $m("md-cf-label").textContent = t.cf_label($m("md-cf").value);
  $m("md-co2-label").textContent = t.co2_label(co2);
  $m("md-lcoe-sub").textContent = t.lcoe_sub;
  const rows = LCOE_TECHS.map(([key, reCarriers, fuel, capture]) => {
    const r = Y.rows.find((x) => x.key === key);
    if (!r || !r.fixed_per_unit_yr) return null;
    const c = reCarriers ? meanCF(reCarriers) : cf;
    if (!c) return null;
    const capital = r.fixed_per_unit_yr * 1000 / (c * 8760);
    const eff = r.efficiency || 1;
    const fuelCost = fuel ? (Y.fuel_EUR_MWh[fuel] || 0) / eff : 0;
    const running = (r.VOM_EUR_MWh || 0) + fuelCost;
    const intensity = fuel ? (Y.co2_t_MWh[fuel] || 0) / eff : 0;
    const carbon = intensity * (capture ? (1 - capture) * co2 + capture * CO2_STORAGE_EUR_T : co2);
    return { label: `${name(r)} (${nf(c * 100)}%)`, capital, running, carbon, total: capital + running + carbon };
  }).filter(Boolean).sort((a, b) => a.total - b.total);
  const parts = [["capital", 1], ["running", 2], ["carbon", 3]];
  Plotly.react("md-lcoe", parts.map(([k, i]) => ({
    type: "bar", orientation: "h", name: t[k], y: rows.map((r) => r.label), x: rows.map((r) => r[k]),
    marker: { color: cv(`--k-${i}`), line: { color: cv("--surface"), width: 1.5 } }, hovertemplate: `${esc(t[k])}: %{x:.0f} €/MWh<extra>%{y}</extra>`,
  })).filter((tr) => tr.x.some((v) => v > 0.05)), layout({ barmode: "stack", barcornerradius: 3, yaxis: { autorange: "reversed" },
    xaxis: { title: { text: "€/MWh", font: { size: 11 } }, rangemode: "tozero" }, margin: { l: 8, r: 12, t: 8, b: 30 },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cv("--ink-2"), size: 11 } } }), cfg);

  // Investment trend (same unit for all: € per kW)
  const trend = TREND_TECHS.map((key, i) => {
    const pts = st.data.costs.years.map((y) => [y.year, (y.rows.find((r) => r.key === key) || {}).investment]);
    const r = Y.rows.find((x) => x.key === key);
    return { type: "scatter", mode: "lines+markers", name: r ? name(r) : key, x: pts.map((p) => p[0]), y: pts.map((p) => p[1]),
             line: { color: cv(`--k-${i + 1}`), width: 2 }, marker: { size: 8, color: cv(`--k-${i + 1}`), line: { color: cv("--surface"), width: 2 } },
             hovertemplate: `${esc(r ? name(r) : key)}: %{y:,.0f} €/kW<extra>%{x}</extra>` };
  });
  Plotly.react("md-inv-trend", trend, layout({ xaxis: { type: "category" }, yaxis: { title: { text: "€/kW (log scale)", font: { size: 11 } }, type: "log",
                                                   tickvals: [200, 500, 1000, 2000, 5000, 10000], ticktext: ["200", "500", "1,000", "2,000", "5,000", "10,000"] },
                                                 margin: { l: 8, r: 12, t: 8, b: 24 } }), cfg);

  const shown = Y.rows.filter((r) => !st.group || r.group === st.group);
  $m("md-cost-table").innerHTML = table(
    [[t.col_techn], [t.col_inv, 1], [t.col_fom, 1], [t.col_vom, 1], [t.col_effn, 1], [t.col_life, 1], [t.col_fixed, 1], [t.col_src]],
    shown.map((r) => [[`${esc(name(r))}<br><span class="muted">${esc(t.cgroups[r.group] || r.group)}</span> ${originTag(r.origin)}`],
      [`${nf(r.investment, r.investment < 10 ? 2 : 0)} <span class="muted">${esc(unitLabel(r.unit))}</span>`, 1], [nf(r.FOM_pct, 2), 1], [nf(r.VOM_EUR_MWh, 2), 1],
      [r.efficiency && r.efficiency !== 1 ? nf(r.efficiency * 100, 1) + "%" : "–", 1], [nf(r.lifetime), 1],
      [`${nf(r.fixed_per_unit_yr, r.fixed_per_unit_yr < 10 ? 2 : 1)} <span class="muted">${esc(unitLabel(r.unit))}</span>`, 1],
      [`<span class="src">${costSource(r.source)}${r.currency_year ? ` (${r.currency_year})` : ""}</span>`]]));
  $m("md-cost-note").textContent = t.cost_note(nf(Y.discount_rate, 3));
}

const REPO_BLOB = "https://github.com/BartonChenTW/pypsa-earth/blob/pypsa-taiwan-dev/pypsa_tw/data/";
const EV_SEV = { downloaded: "good", page_opened: "good", search_summary: "warning", model_input: "neutral" };
const EV_ICON = { good: "✓", warning: "!", neutral: "◆" };
const srcRec = (id) => (st.data.sources.records || {})[id];
const chip = (ev) => { const sev = EV_SEV[ev] || "neutral";
  return `<span class="chip ${sev}"><span class="chip-icon" aria-hidden="true">${EV_ICON[sev]}</span>${esc(T().ev[ev] || ev)}</span>`; };
const a = (url, text) => (url ? `<a href="${esc(url)}" rel="noopener">${esc(text)}</a>` : esc(text));
// URLs inside free text (technology-data source strings) become links
const linkify = (text) => esc(text).replace(/https?:\/\/[^\s,;)]+[^\s,;.)]/g, (u) => `<a href="${u}" rel="noopener">${u.length > 50 ? u.slice(0, 48) + "…" : u}</a>`);

// technology-data source strings can be long: a short text plus every link in it
function costSource(text) {
  const urls = String(text || "").match(/https?:\/\/[^\s,;)]+[^\s,;.)]/g) || [];
  const head = String(text || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const short = head.length > 70 ? head.slice(0, 68) + "…" : head;
  // publishers named without a URL in technology-data
  const known = [[/Danish Energy Agency/i, "https://ens.dk/en/analyses-and-statistics/technology-catalogues"],
                 [/Lazard/i, "https://www.lazard.com/research-insights/levelized-cost-of-energyplus/"]];
  known.forEach(([re, u]) => { if (re.test(text) && !urls.includes(u)) urls.unshift(u); });
  return `<span title="${esc(text)}">${esc(short)}</span>` + urls.map((u, i) => ` ${a(u, `[${i + 1}]`)}`).join("");
}

const originTag = (o) => `<span class="origin o-${esc(o)}">${esc(T().origin[o] || o)}</span>`;

function renderOverview() {
  const t = T(), zh = mlang() === "zh" ? 1 : 0;
  $m("md-origin-legend").innerHTML = ["pypsa-earth", "taiwan", "fork"].map(originTag).join("");
  const short = (id) => { const r = srcRec(id); return r ? a(r.landing_url || r.file_url, r.short_cite.split(" (")[0].split(":")[0]) : esc(id); };
  $m("md-overview").innerHTML = table(t.ov_cols.map((h) => [h]),
    (st.data.overview || []).map((r) => [[`<b>${esc(r.input[zh])}</b>`], [r.origin.map(originTag).join(" ")], [esc(r.used[zh])], [esc(r.change[zh])],
      [`<span class="src">${r.sources.map(short).join("<br>")}</span>`]]));
}

function renderSources() {
  const t = T();
  document.querySelectorAll(".md-sources").forEach((el) => {
    const ids = (st.data.sources.sections || {})[el.dataset.section] || [];
    el.innerHTML = `<p><b>${esc(t.src_title)}</b></p><ol class="refs">` + ids.map((id) => {
      const r = srcRec(id);
      if (!r) return "";
      const title = mlang() === "zh" ? r.title || r.title_en : r.title_en || r.title;
      const links = [r.landing_url && a(r.landing_url, t.src_page), r.file_url && a(r.file_url, t.src_file),
                     r.local_file && a(REPO_BLOB + r.local_file, t.src_copy)].filter(Boolean).join(" · ");
      const meta = [r.publisher, r.edition || r.published, r.license].filter(Boolean).join(" · ");
      return `<li id="md-src-${esc(id)}"><b>${esc(r.short_cite || title)}</b>${title && title !== r.short_cite ? ` — <i>${esc(title)}</i>` : ""}. ${esc(meta)}. ${links} ${originTag(r.origin)} ${chip(r.evidence)}` +
        (r.note ? `<br><span class="muted">${linkify(r.note)}</span>` : "") + "</li>";
    }).join("") + "</ol>";
  });
}

const PLANT_SRC_NAMES = {
  en: { taipower_units_realtime: "Taipower unit list", moeaea_solar_approvals_county: "Energy Administration solar approvals",
        powerplantmatching_gotzens2019: "powerplantmatching", cna_20260904_taichung_cc: "CNA 2026-09-04", einfo_hsinta_new_cc: "e-info.org.tw",
        thewindpower: "thewindpower.net", gadm_41: "GADM 4.1", moea_psd_fy2024: "MOEA supply-demand report 113年度", osm_power_plants_tw: "OpenStreetMap" },
  zh: { taipower_units_realtime: "台電各機組發電量資訊", moeaea_solar_approvals_county: "能源署太陽光電同意備案容量",
        powerplantmatching_gotzens2019: "powerplantmatching", cna_20260904_taichung_cc: "中央社 2026-09-04", einfo_hsinta_new_cc: "環境資訊中心",
        thewindpower: "thewindpower.net", gadm_41: "GADM 4.1", moea_psd_fy2024: "經濟部 113 年度電力資源供需報告", osm_power_plants_tw: "OpenStreetMap" },
};
const LABEL_ZH = { "placeholder (2025)": "暫定（2025）", "county point (GADM 4.1)": "縣市代表點", "county point, assumed site": "縣市代表點（假設）",
  "assumption: Tatan site": "假設：大潭廠址", "Figure 3-3": "圖 3-3", "Figure 3-3 (thermal schedule)": "圖 3-3（火力機組時程）",
  "Table 3-1 (renewable targets; existing rows scaled)": "表 3-1（再生能源目標；依現有比例放大）" };
const TECH_ZH = { "Steam Turbine": "汽力機組", Offshore: "離岸", Onshore: "陸域", "Run-Of-River": "川流式", Reservoir: "水庫式",
  "Pumped Storage": "抽蓄", OCGT: "單循環燃氣渦輪", CCGT: "複循環", Geothermal: "地熱" };
const techLabel = (p) => { const x = p.technology && p.technology !== p.fuel && p.technology !== "Pv" ? p.technology : "";
  return mlang() === "zh" ? TECH_ZH[x] || x : x; };
// one plant's sources: capacity, location, year
function plantSources(p) {
  const t = T(), s = p.src || {};
  const one = (x) => {
    if (!x) return null;
    const r = x.id ? srcRec(x.id) : null;
    const name = PLANT_SRC_NAMES[mlang()][x.id] || (r ? r.short_cite.split(" (")[0] : "");
    const extra = x.label ? (mlang() === "zh" ? LABEL_ZH[x.label] || x.label : x.label) : "";
    const label = x.url ? x.label : [name, extra && !(name && extra.includes(name)) ? extra : ""].filter(Boolean).join(mlang() === "zh" ? "，" : ", ");
    const url = x.url || (r ? r.landing_url : "");
    return url ? a(url, label) : esc(label);
  };
  const parts = [];
  if (s.capacity && s.capacity.length) parts.push(`${esc(t.src_cap)}: ${s.capacity.map(one).filter(Boolean).join(", ")}`);
  if (s.location) parts.push(`${esc(t.src_loc)}: ${one(s.location)}`);
  if (s.year) parts.push(`${esc(t.src_year)}: ${one(s.year)}`);
  return `<span class="src">${parts.join("<br>")}</span>`;
}

// ---------- PyPSA vs Taiwan costs ----------
function renderCompare() {
  const t = T(), C = st.data.comparison;
  if (!C) return;
  $m("md-cmp-year").textContent = C.pypsa_year;
  $m("md-cmp-year-zh").textContent = C.pypsa_year;
  const fit = C.rows.filter((r) => r.kind === "fit"), act = C.rows.filter((r) => r.kind === "actual");
  const k = (key) => C.rows.find((r) => r.key === key) || {};
  $m("md-cmp-findings").innerHTML = t.cmp_find({
    solar: nf(k("fit_solar_ground").capex_ratio, 1), off: nf(k("fit_offwind").capex_ratio, 1), geo: nf(k("fit_geothermal").capex_ratio, 1),
    on: nf(k("fit_onwind").capex_ratio, 1), solarTW: nf(k("fit_solar_ground").taiwan_EUR_MWh), solarPY: nf(k("fit_solar_ground").pypsa_EUR_MWh_at_taiwan_cf),
    offTW: nf(k("fit_offwind").taiwan_EUR_MWh), offPY: nf(k("fit_offwind").pypsa_EUR_MWh_at_taiwan_cf),
    gas: nf(k("act_gas").actual_EUR_MWh), coal: nf(k("act_coal").actual_EUR_MWh), nuc: nf(k("act_nuclear").actual_EUR_MWh),
    wind: nf(k("act_wind").actual_EUR_MWh), solarAct: nf(k("act_solar").actual_EUR_MWh),
  }).map((x) => `<li>${esc(x)}</li>`).join("");
  const name = (r) => (mlang() === "zh" ? r.zh : r.en);
  const bar = (label, rows, val, i, fmt) => ({ type: "bar", orientation: "h", name: label, y: rows.map(name), x: rows.map(val),
    marker: { color: cv(`--k-${i}`), line: { color: cv("--surface"), width: 1.5 } }, hovertemplate: `${esc(label)}: %{x:,.0f} ${fmt}<extra>%{y}</extra>` });
  const lg = { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cv("--ink-2"), size: 11 } };
  Plotly.react("md-cmp-capex", [bar(t.cmp_capex_tw, fit, (r) => r.capex_EUR_kW, 1, "€/kW"), bar(t.cmp_capex_py, fit, (r) => r.pypsa_investment_EUR_kW, 2, "€/kW")],
    layout({ barmode: "group", barcornerradius: 3, yaxis: { autorange: "reversed" }, xaxis: { title: { text: "€/kW", font: { size: 11 } }, rangemode: "tozero" },
             legend: lg, margin: { l: 8, r: 12, t: 8, b: 30 } }), cfg);
  // cost per MWh: per technology up to three views
  const techs = [["fit_solar_ground", "act_solar"], ["fit_solar_roof_large", null], ["fit_onwind", null], ["fit_offwind", "act_wind"],
                 ["fit_geothermal", "act_geothermal"], ["fit_small_hydro", null], [null, "act_gas"], [null, "act_coal"], [null, "act_nuclear"]];
  const labels = techs.map(([f, x]) => name(k(f || x)));
  const series = [[t.cmp_tw, techs.map(([f]) => (f ? k(f).taiwan_EUR_MWh : null)), 1], [t.cmp_py, techs.map(([f, x]) => (f ? k(f).pypsa_EUR_MWh_at_taiwan_cf : k(x).pypsa_EUR_MWh_at_60pct)), 2],
                  [t.cmp_act, techs.map(([, x]) => (x ? k(x).actual_EUR_MWh : null)), 3]];
  Plotly.react("md-cmp-lcoe", series.map(([label, xs, i]) => ({ type: "bar", orientation: "h", name: label, y: labels, x: xs,
    marker: { color: cv(`--k-${i}`), line: { color: cv("--surface"), width: 1.5 } }, hovertemplate: `${esc(label)}: %{x:.0f} €/MWh<extra>%{y}</extra>` })),
    layout({ barmode: "group", barcornerradius: 3, yaxis: { autorange: "reversed" }, xaxis: { title: { text: "€/MWh", font: { size: 11 } }, rangemode: "tozero" },
             legend: lg, margin: { l: 8, r: 12, t: 8, b: 30 } }), cfg);
  $m("md-cmp-lcoe-sub").textContent = t.cmp_lcoe_sub;
  const srcLink = (r) => { const rec = srcRec(r.source_id); return rec ? `${a(rec.file_url || rec.landing_url, rec.short_cite.split(":")[0])}, ${esc(r.locator)}` : ""; };
  $m("md-cmp-table").innerHTML = table(t.cmp_cols.map((h, i) => [h, i > 0 && i < 8]),
    fit.map((r) => [[`${esc(name(r))} <span class="muted">(${esc(r.year)})</span><br><span class="src">${srcLink(r)}</span>`],
      [`${nf(r.capex_EUR_kW)} €/kW<br><span class="muted">${nf(r.capex_TWD_kW)} NT$/kW</span>`, 1], [`${nf(r.pypsa_investment_EUR_kW)} €/kW`, 1],
      [`${nf(r.capex_ratio, 2)}×`, 1], [`${nf(r.om_pct, 2)} / ${nf(r.pypsa_FOM_pct, 2)}`, 1],
      [`${nf(r.cf * 100, 1)}%${r.model_cf ? `<br><span class="muted">model ${nf(r.model_cf * 100, 1)}%</span>` : ""}`, 1],
      [`${nf(r.taiwan_EUR_MWh)}<br><span class="muted">${nf(r.taiwan_TWD_kWh, 2)} NT$/kWh</span>`, 1], [nf(r.pypsa_EUR_MWh_at_taiwan_cf), 1]])) +
    (fit.some((r) => r.note) ? `<p class="note muted">${fit.filter((r) => r.note).map((r) => `${esc(name(r))}: ${esc(r.note)}`).join(" ")}</p>` : "") +
    table(t.cmp_cols_act.map((h, i) => [h, i === 1 || i === 2]),
      act.map((r) => [[`${esc(name(r))}<br><span class="src">${srcLink(r)}</span>`], [`${nf(r.actual_EUR_MWh)} €/MWh<br><span class="muted">${nf(r.actual_TWD_kWh, 2)} NT$/kWh</span>`, 1],
        [nf(r.pypsa_EUR_MWh_at_60pct), 1], [`<span class="muted">${esc(r.note)}</span>`]]));
  $m("md-cmp-note").textContent = t.cmp_note(nf(C.fx_TWD_EUR, 3), C.pypsa_year);
}

function renderAll() {
  if (!st.data) return;
  renderOverview();
  renderGrid();
  renderPlants();
  renderPotential();
  renderCosts();
  renderCompare();
  renderSources();
  $m("md-meta").textContent = T().meta(st.data.generated);
}

function wireSegmented(id, attr, key, render) {
  $m(id).querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    st[key] = b.dataset[attr];
    $m(id).querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("data/model_data.json");
    if (res.ok) st.data = await res.json();
  } catch { /* keep null */ }
  if (!st.data) { $m("md-meta").textContent = "Data not available."; return; }
  st.fleet = st.data.fleets[0].id;
  st.year = st.data.costs.years[st.data.costs.years.length - 1].year;
  wireSegmented("md-grid-view", "view", "gridView", renderGrid);
  wireSegmented("md-re-layer", "layer", "reLayer", renderPotential);
  $m("md-fleet").addEventListener("change", (e) => { st.fleet = e.target.value; st.fuel = ""; renderPlants(); });
  $m("md-fuel").addEventListener("change", (e) => { st.fuel = e.target.value; renderPlants(); });
  $m("md-region").addEventListener("change", (e) => { st.region = e.target.value; renderPlants(); });
  $m("md-search").addEventListener("input", (e) => { st.search = e.target.value; renderPlants(); });
  $m("md-re").addEventListener("change", (e) => { st.re = e.target.value; renderPotential(); });
  $m("md-year").addEventListener("change", (e) => { st.year = +e.target.value; renderCosts(); });
  $m("md-group").addEventListener("change", (e) => { st.group = e.target.value; renderCosts(); });
  $m("md-cf").addEventListener("input", renderCosts);
  $m("md-co2").addEventListener("input", renderCosts);
  renderAll();
  document.addEventListener("langchange", renderAll);
  const toggle = $m("theme-toggle");
  if (toggle) toggle.addEventListener("click", () => setTimeout(renderAll, 0));
});
