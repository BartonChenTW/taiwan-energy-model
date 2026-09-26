/* Taiwan energy data page: key figures and data-source catalogue.
   Data: docs/data/taiwan_catalog.json, written by pypsa_tw/viewer/export_dashboard_data.py
   from pypsa_tw/data/taiwan_key_facts.csv and taiwan_energy_catalog.csv. */

const I18N = {
  en: {
    title: "Taiwan energy data", nav_home: "← Home", nav_dashboard: "Model dashboard", nav_sandbox: "Sandbox →", nav_security: "Energy security →", nav_sector: "Sector model (draft) →", nav_facts: "Key figures", nav_sources: "Data sources",
    nav_history: "History and projections", history_title: "History and projections",
    history_intro: "Official annual statistics (2005-2025; peak load from 1982), the government's 10-year outlook, policy targets, and PyPSA-Earth's default demand projection. Solid lines and areas are history; dashed lines and open markers are projections or targets.",
    h_gen: "Generation by source", h_gen_sub: "TWh per year, national (incl. self-generation). Dashed: 1.7%/yr official growth applied to 2024 (derived); diamonds: PyPSA-Earth default demand (GEGIS).",
    h_cap: "Installed capacity by source", h_cap_sub: "GW, national, end of year",
    h_peak: "Peak load and supply capability", h_peak_sub: "GW. Day peak history (Taipower); night peak and night net peak capability forecast (MOEA report, Table 3-2)",
    h_re: "Renewable capacity: history and targets", h_re_sub: "GW. Targets for 2030 and 2032 from the MOEA report (Table 3-1); wind target = offshore + onshore",
    h_share: "Renewable share of generation", h_share_sub: "%. Targets: 20% (Nov 2026), 30% (2030), about 65% (2050 net-zero pathway)",
    h_ef: "Grid emission factor", h_ef_sub: "kg CO2e per kWh of public electricity supply",
    h_plan: "Planned thermal additions and retirements", h_plan_sub: "GW per year, Taipower system (MOEA supply-demand report 113年度, Figure 3-3, p. 18, unit by unit). Above zero: new gas units; below zero: retirements. The 2030 and 2034 model scenarios use this plan.",
    s_add_gas: "Gas added", s_ret_coal: "Coal retired", s_ret_gas: "Gas retired", s_ret_oil: "Oil retired",
    src_label: "Sources", src_history: "History", src_ref: "see References below",
    h_refs: "References for history and projections",
    h_refs_sub: "Every series points to one of these sources (pypsa_tw/data/sources.csv). Projections and targets also give the table or page; history gives the column of the downloaded file. A checksum identifies the exact file used.",
    col_title: "Title", col_publisher: "Publisher", col_edition: "Edition / coverage", col_published: "Published",
    col_origin: "Origin", origin_pypsa_earth: "PyPSA-Earth default", origin_taiwan: "Taiwan data", origin_fork: "Added in this fork",
    col_file: "File", col_local: "Local copy (SHA-256)", col_accessed: "Accessed", col_locator: "Where in the source",
    link_page: "page", link_file: "file",
    h_table: "All series", filter_series: "Series", filter_kind: "Kind", download_csv: "Download CSV",
    kind_history: "History", kind_projection: "Projection", kind_target: "Target",
    col_kind: "Kind", s_total: "Total", s_forecast: "Official growth path (derived)", s_gegis: "PyPSA-Earth default demand",
    s_day_peak: "Day peak (history)", s_night_peak: "Night peak", s_night_cap: "Night net peak capability (forecast)",
    s_solar: "Solar PV", s_wind: "Wind", s_re_total: "All renewables", s_target: "target", s_re_share: "Renewable share",
    s_ef: "Grid emission factor",
    g_coal: "Coal", g_nuclear: "Nuclear", g_wind: "Wind", g_pumped_storage: "Pumped storage", g_solar: "Solar PV",
    g_other_re: "Geothermal, biomass, waste", g_gas: "Gas", g_hydro: "Hydro", g_oil: "Oil",
    intro: "Key figures about Taiwan's electricity system and the data sources behind them, collected for the PyPSA-Earth Taiwan model. Every figure shows how it was obtained, so you can see what is confirmed and what still needs checking.",
    facts_title: "Key figures", sources_title: "Data sources",
    filter_topic: "Topic", filter_evidence: "Evidence", filter_search: "Search", filter_category: "Category", filter_use: "Use in model",
    all: "All",
    col_indicator: "Indicator", col_value: "Value", col_year: "Year", col_scope: "Scope", col_evidence: "Evidence",
    col_source: "Source", col_note: "Note", col_name: "Dataset", col_provider: "Provider", col_content: "Content",
    col_format: "Format · update", col_license: "Licence", col_use: "Use in model", col_link: "Link",
    topic_capacity: "Capacity", topic_demand: "Demand", topic_generation: "Generation", topic_emissions: "Emissions",
    topic_price: "Prices", topic_policy: "Policy targets", topic_resource: "Renewable resource",
    cat_electricity: "Electricity (Taipower)", cat_statistics: "Official statistics", cat_policy: "Policy and plans",
    cat_weather: "Weather", cat_geography: "Geography", cat_international: "International and open data", cat_other: "Other",
    ev_downloaded: "Downloaded", ev_page_opened: "Page checked", ev_search_summary: "To verify", ev_model_output: "Model output", ev_model_input: "Model input", ev_derived: "Derived",
    ev_legend: "Downloaded: official file downloaded and read. Page checked: source page opened and read. To verify: taken from a search-result summary; check the source before reuse. Model output: computed by the model.",
    use_used: "Used", use_candidate: "Candidate", use_reference: "Reference",
    use_legend: "Used: feeds the model or this dashboard. Candidate: would improve the model (see todo). Reference: background or cross-check.",
    tile_facts: "Key figures", tile_sources: "Data sources", tile_used: "used in the model", tile_verify: "still to verify",
    tile_checked: "links reachable", tile_links: "Links",
    link_ok: "Link reachable", link_bad: (code) => `Link not reachable by script (HTTP ${code}); it may block bots`,
    open: "Open",
    none: "No rows match the filters.",
    footer: "Data: pypsa_tw/data/taiwan_key_facts.csv and taiwan_energy_catalog.csv, exported by pypsa_tw/viewer/export_dashboard_data.py.",
    loading_error: "Could not load the data. If you opened this file directly, serve the folder instead: python -m http.server -d docs",
    nav_sectors: "All sectors", topic_end_use: "End use", filter_year: "Year",
    sectors_title: "Energy use in all sectors",
    sectors_intro: "Electricity is about a third of the energy Taiwan uses. These charts cover all of it: industry, transport, homes, services and agriculture, by fuel, from the official energy balance (Energy Administration, 2005-2025), plus CO2 by sector and a household survey of what uses electricity. Energy is in TWh (1 toe = 11.63 MWh; electricity counted at its energy content, 860 kcal/kWh).",
    h_sector: "Energy use by sector", h_sector_sub: "TWh per year. The stack adds up to domestic energy consumption: final use by sector, non-energy use (petrochemical feedstock) and the energy sector's own use.",
    h_fuel: "What each sector runs on", h_fuel_sub: "TWh in the selected year, by fuel. Electricity is counted at the point of use, not the fuel burnt to make it.",
    h_transport: "Transport energy by fuel", h_transport_sub: "TWh per year, all domestic transport (road is about 97%). International shipping and aviation are not included.",
    h_industry: "Industry energy by branch", h_industry_sub: "TWh per year, fuel and electricity (feedstock excluded). The industry classification changed in 2018.",
    h_co2s: "CO2 from fuel combustion by sector", co2_direct: "Direct", co2_indirect: "Electricity allocated to users",
    co2_sub_direct: "Mt CO2 per year. Direct: emissions where the fuel is burnt, so power plants count in the energy sector.",
    co2_sub_indirect: "Mt CO2 per year. Power-plant emissions are allocated to the sectors that use the electricity; the energy sector keeps its own use and losses.",
    h_home: "Household electricity by appliance", h_home_sub: "Share of household electricity, 2024 survey of 1,800 homes (Energy Administration / ITRI). Summer = June to September.",
    home_year: "Whole year", home_summer: "Summer months",
    h_heatcool: "Heating, cooling and hot water",
    sec: { industry: "Industry", transport: "Transport", residential: "Residential", services: "Services", agriculture: "Agriculture",
           non_energy: "Non-energy use (feedstock)", energy_own_use: "Energy sector own use", energy: "Energy sector" },
    fuel: { gas: "Natural gas", electricity: "Electricity", heat: "Heat (steam)", coal: "Coal", biomass_waste: "Biomass and waste",
            oil: "Oil products", solar_thermal: "Solar thermal" },
    tfuel: { gasoline: "Gasoline", jet: "Jet fuel", diesel: "Diesel", fuel_oil: "Fuel oil", electricity: "Electricity", other: "Other" },
    branch: { chemicals: "Chemicals", basic_metals: "Basic metals", electronics: "Electronics", non_metallic: "Cement, glass, ceramics",
              paper: "Paper", textiles: "Textiles", other: "Other branches" },
    break_2018: "2018: new classification",
    heatcool: (v) => [
      "The energy balance counts fuels by sector, not by end use, so there is no separate row for heating or cooling. For homes, the 2024 survey above shows what the electricity is used for.",
      `Cooling runs on electricity: air conditioners use ${v.acYear}% of household electricity over the year and ${v.acSummer}% in June to September. Households own ${v.acPer} air conditioners on average, and ${v.acOwn}% have at least one (DGBAS 2025).`,
      `In ${v.year}, electricity was ${v.elecShare}% of household energy use. The rest was LPG (${v.lpg} TWh) and natural gas (${v.gas} TWh), used for cooking and gas water heaters. Electric water heaters take another ${v.whYear}% of household electricity.`,
      `Industry used ${v.heat} TWh of heat (steam) in ${v.year}, bought from cogeneration plants; in 2025, 89% of it went to the chemical industry. The balance records sold steam from 2001, and the series steps up in 2018 when the heat statistics were revised.`,
      "Solar water heaters: the balance estimated about 1 TWh of solar heat a year in homes until 2021 and stopped from 2022, when it fell below the statistics' materiality threshold (compilation notes, item 6).",
      "Space heating is not measured on its own. Winters are mild, and heating in homes appears inside electricity use (air conditioners in heating mode, electric heaters).",
    ],
  },
  zh: {
    title: "台灣能源資料", nav_home: "← 首頁", nav_dashboard: "模型儀表板", nav_sandbox: "情境沙盒 →", nav_security: "能源安全 →", nav_sector: "部門耦合（草稿）→", nav_facts: "關鍵數據", nav_sources: "資料來源",
    nav_history: "歷史與預測", history_title: "歷史與預測",
    history_intro: "官方年度統計（2005-2025 年；尖峰負載自 1982 年起）、政府 10 年展望、政策目標，以及 PyPSA-Earth 預設的需求預估。實線與面積為歷史；虛線與空心標記為預測或目標。",
    h_gen: "各能源別發電量", h_gen_sub: "每年 TWh，全國（含自用發電）。虛線：以 2024 年為基準套用官方年增 1.7%（推估）；菱形：PyPSA-Earth 預設需求（GEGIS）。",
    h_cap: "各能源別裝置容量", h_cap_sub: "GW，全國，年底",
    h_peak: "尖峰負載與供電能力", h_peak_sub: "GW。日尖峰歷史（台電）；夜尖峰與夜間淨尖峰能力預測（經濟部報告表 3-2）",
    h_re: "再生能源裝置容量：歷史與目標", h_re_sub: "GW。2030、2032 年目標取自經濟部報告（表 3-1）；風電目標為離岸加陸域",
    h_share: "再生能源發電占比", h_share_sub: "%。目標：20%（2026 年 11 月）、30%（2030 年）、約 65%（2050 淨零路徑）",
    h_ef: "電力排碳係數", h_ef_sub: "每度公用售電之公斤 CO2e",
    h_plan: "火力機組新增與除役規劃", h_plan_sub: "每年 GW，台電系統（經濟部 113 年度全國電力資源供需報告圖 3-3，第 18 頁，逐機組）。零以上：新燃氣機組；零以下：除役。2030 與 2034 年模型情境採用此規劃。",
    s_add_gas: "燃氣新增", s_ret_coal: "燃煤除役", s_ret_gas: "燃氣除役", s_ret_oil: "燃油除役",
    src_label: "資料來源", src_history: "歷史", src_ref: "詳見下方參考資料",
    h_refs: "歷史與預測資料的參考來源",
    h_refs_sub: "每個數列都對應下列其中一個來源（pypsa_tw/data/sources.csv）。預測與目標另註明表號或頁碼；歷史資料註明下載檔案中的欄位。檢查碼可辨識所用的確切檔案。",
    col_title: "標題", col_publisher: "發布機關", col_edition: "版次／涵蓋範圍", col_published: "發布時間",
    col_origin: "來源類別", origin_pypsa_earth: "PyPSA-Earth 預設", origin_taiwan: "台灣資料", origin_fork: "本分支新增",
    col_file: "檔案", col_local: "本地副本（SHA-256）", col_accessed: "取得日期", col_locator: "出處位置",
    link_page: "頁面", link_file: "檔案",
    h_table: "所有數列", filter_series: "數列", filter_kind: "類型", download_csv: "下載 CSV",
    kind_history: "歷史", kind_projection: "預測", kind_target: "目標",
    col_kind: "類型", s_total: "合計", s_forecast: "官方成長路徑（推估）", s_gegis: "PyPSA-Earth 預設需求",
    s_day_peak: "日尖峰（歷史）", s_night_peak: "夜尖峰", s_night_cap: "夜間淨尖峰能力（預測）",
    s_solar: "太陽光電", s_wind: "風力", s_re_total: "再生能源合計", s_target: "目標", s_re_share: "再生能源占比",
    s_ef: "電力排碳係數",
    g_coal: "燃煤", g_nuclear: "核能", g_wind: "風力", g_pumped_storage: "抽蓄水力", g_solar: "太陽光電",
    g_other_re: "地熱、生質能、廢棄物", g_gas: "燃氣", g_hydro: "水力", g_oil: "燃油",
    intro: "為 PyPSA-Earth 台灣模型整理的台灣電力系統關鍵數據與資料來源。每筆數據都標示取得方式，方便分辨哪些已確認、哪些仍待查證。",
    facts_title: "關鍵數據", sources_title: "資料來源",
    filter_topic: "主題", filter_evidence: "證據", filter_search: "搜尋", filter_category: "類別", filter_use: "模型使用",
    all: "全部",
    col_indicator: "指標", col_value: "數值", col_year: "年份", col_scope: "範圍", col_evidence: "證據",
    col_source: "來源", col_note: "備註", col_name: "資料集", col_provider: "提供者", col_content: "內容",
    col_format: "格式 · 更新", col_license: "授權", col_use: "模型使用", col_link: "連結",
    topic_capacity: "裝置容量", topic_demand: "需求", topic_generation: "發電", topic_emissions: "排放",
    topic_price: "電價", topic_policy: "政策目標", topic_resource: "再生能源資源",
    cat_electricity: "電力（台電）", cat_statistics: "官方統計", cat_policy: "政策與計畫",
    cat_weather: "氣象", cat_geography: "地理", cat_international: "國際與開放資料", cat_other: "其他",
    ev_downloaded: "已下載", ev_page_opened: "已查頁面", ev_search_summary: "待查證", ev_model_output: "模型結果", ev_model_input: "模型輸入", ev_derived: "推估",
    ev_legend: "已下載：已下載並讀取官方檔案。已查頁面：已開啟並閱讀來源頁面。待查證：取自搜尋結果摘要，引用前請查核原始來源。模型結果：由模型計算。",
    use_used: "使用中", use_candidate: "可採用", use_reference: "參考",
    use_legend: "使用中：用於模型或本儀表板。可採用：可改善模型（見待辦事項）。參考：背景資料或交叉比對。",
    tile_facts: "關鍵數據", tile_sources: "資料來源", tile_used: "用於模型", tile_verify: "待查證",
    tile_checked: "連結可連線", tile_links: "連結",
    link_ok: "連結可連線", link_bad: (code) => `程式無法連線（HTTP ${code}），網站可能阻擋自動程式`,
    open: "開啟",
    none: "沒有符合篩選條件的資料。",
    footer: "資料：pypsa_tw/data/taiwan_key_facts.csv 與 taiwan_energy_catalog.csv，由 pypsa_tw/viewer/export_dashboard_data.py 匯出。",
    loading_error: "無法載入資料。若直接開啟檔案，請改用本機伺服器：python -m http.server -d docs",
    nav_sectors: "各部門", topic_end_use: "終端用途", filter_year: "年份",
    sectors_title: "各部門能源使用",
    sectors_intro: "電力約占台灣能源使用的三分之一。以下圖表涵蓋全部能源：工業、運輸、住宅、服務業與農業，依燃料別分列，資料取自官方能源平衡表（能源署，2005-2025 年），另有部門別 CO2 排放，以及家庭用電用途調查。能源單位為 TWh（1 公噸油當量 = 11.63 MWh；電力以其熱值 860 千卡/度計）。",
    h_sector: "各部門能源消費", h_sector_sub: "每年 TWh。堆疊總和為國內能源消費：各部門最終消費、非能源消費（石化原料）及能源部門自用。",
    h_fuel: "各部門使用的能源", h_fuel_sub: "所選年份的 TWh，依燃料別。電力以使用端計算，不計發電所燃燒的燃料。",
    h_transport: "運輸部門能源（依燃料）", h_transport_sub: "每年 TWh，國內運輸（公路約占 97%）。不含國際海運與航空。",
    h_industry: "工業部門能源（依行業）", h_industry_sub: "每年 TWh，燃料與電力（不含原料用途）。2018 年起行業分類改版。",
    h_co2s: "各部門燃料燃燒 CO2 排放", co2_direct: "直接排放", co2_indirect: "電力排放分攤至用電部門",
    co2_sub_direct: "每年百萬公噸 CO2。直接排放：在燃燒燃料處計算，因此電廠排放計入能源部門。",
    co2_sub_indirect: "每年百萬公噸 CO2。電廠排放依用電量分攤至各用電部門；能源部門僅保留自用與損耗。",
    h_home: "家庭用電（依電器）", h_home_sub: "占家庭用電比例，2024 年 1,800 戶調查（能源署／工研院）。夏月為 6 至 9 月。",
    home_year: "全年", home_summer: "夏月",
    h_heatcool: "暖氣、冷氣與熱水",
    sec: { industry: "工業部門", transport: "運輸部門", residential: "住宅部門", services: "服務業部門", agriculture: "農業部門",
           non_energy: "非能源消費（原料）", energy_own_use: "能源部門自用", energy: "能源部門" },
    fuel: { gas: "天然氣", electricity: "電力", heat: "熱能（蒸汽）", coal: "煤及煤產品", biomass_waste: "生質能及廢棄物",
            oil: "石油產品", solar_thermal: "太陽熱能" },
    tfuel: { gasoline: "車用汽油", jet: "航空燃油", diesel: "柴油", fuel_oil: "燃料油", electricity: "電力", other: "其他" },
    branch: { chemicals: "化學材料", basic_metals: "基本金屬", electronics: "電子產品", non_metallic: "水泥、玻璃、陶瓷",
              paper: "紙漿及紙製品", textiles: "紡織", other: "其他行業" },
    break_2018: "2018 年：分類改版",
    heatcool: (v) => [
      "能源平衡表依部門記錄燃料，而非依終端用途，因此沒有暖氣或冷氣的獨立項目。住宅部分可參考上方 2024 年調查的用電用途。",
      `冷氣使用電力：冷氣機占家庭全年用電 ${v.acYear}%，6 至 9 月占 ${v.acSummer}%。每戶平均擁有 ${v.acPer} 台冷暖氣機，${v.acOwn}% 的家庭至少有一台（主計總處 2025 年）。`,
      `${v.year} 年電力占住宅能源消費的 ${v.elecShare}%，其餘為液化石油氣（${v.lpg} TWh）與天然氣（${v.gas} TWh），用於烹飪與瓦斯熱水器。電熱水器另占家庭用電 ${v.whYear}%。`,
      `${v.year} 年工業使用 ${v.heat} TWh 的熱能（蒸汽），購自汽電共生廠；2025 年其中 89% 用於化學材料業。平衡表自 2001 年起記錄售出的蒸汽，2018 年熱能統計修正後數值上升。`,
      "太陽能熱水器：平衡表估計至 2021 年住宅每年約有 1 TWh 太陽熱能，2022 年起因已不符統計重要性原則而停編（編製說明第六點）。",
      "暖氣未單獨統計。台灣冬季溫和，住宅暖氣用能包含在電力使用中（冷暖氣機暖氣模式、電暖器）。",
    ],
  },
};

const EVIDENCE = { downloaded: "good", page_opened: "good", search_summary: "warning", model_output: "neutral", model_input: "neutral", derived: "neutral" };
const EVIDENCE_ICON = { good: "✓", warning: "!", neutral: "◆" };
const state = { lang: "en", data: null, ts: null };

const $ = (id) => document.getElementById(id);
const t = (key) => I18N[state.lang][key] ?? key;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
function storageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

function evidenceBadge(ev) {
  const sev = EVIDENCE[ev] || "neutral";
  return `<span class="chip ${sev}"><span class="chip-icon" aria-hidden="true">${EVIDENCE_ICON[sev]}</span>${esc(t(`ev_${ev}`))}</span>`;
}

function linkCell(url) {
  if (!url) return "–";
  const code = state.data.link_status[url];
  const ok = code === "200";
  const mark = code === undefined ? "" : ok
    ? `<span class="link-mark ok" title="${esc(t("link_ok"))}" aria-label="${esc(t("link_ok"))}">✓</span>`
    : `<span class="link-mark bad" title="${esc(t("link_bad")(code))}" aria-label="${esc(t("link_bad")(code))}">?</span>`;
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep */ }
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(host)}</a>${mark}`;
}

function fillSelect(id, values, labeller) {
  const el = $(id);
  const current = el.value;
  el.innerHTML = `<option value="">${esc(t("all"))}</option>` +
    values.map((v) => `<option value="${esc(v)}">${esc(labeller(v))}</option>`).join("");
  if (values.includes(current)) el.value = current;
}

function matches(row, fields, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => String(row[f] ?? "").toLowerCase().includes(q));
}

function renderTiles() {
  const { facts, catalog, link_status } = state.data;
  const used = catalog.filter((c) => c.model_use === "used").length;
  const verify = facts.filter((f) => f.evidence === "search_summary").length;
  const links = Object.values(link_status);
  const reachable = links.filter((c) => c === "200").length;
  const tile = (label, value, note) =>
    `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${value}</div><div class="note">${esc(note)}</div></div>`;
  $("tiles").innerHTML = [
    tile(t("tile_facts"), facts.length, `${verify} ${t("tile_verify")}`),
    tile(t("tile_sources"), catalog.length, `${used} ${t("tile_used")}`),
    tile(t("tile_links"), `${reachable}/${links.length}`, `${t("tile_checked")} (${state.data.links_checked || "–"})`),
  ].join("");
}

function renderFacts() {
  const { facts } = state.data;
  fillSelect("fact-topic", [...new Set(facts.map((f) => f.topic))], (v) => t(`topic_${v}`));
  fillSelect("fact-evidence", [...new Set(facts.map((f) => f.evidence))], (v) => t(`ev_${v}`));
  const topic = $("fact-topic").value, ev = $("fact-evidence").value, q = $("fact-search").value.trim();
  const zh = state.lang === "zh";
  const rows = facts.filter((f) => (!topic || f.topic === topic) && (!ev || f.evidence === ev)
    && matches(f, ["indicator_en", "indicator_zh", "scope", "source_name", "note", "year"], q));
  $("evidence-legend").textContent = t("ev_legend");
  if (!rows.length) { $("table-facts").innerHTML = `<p class="muted">${esc(t("none"))}</p>`; return; }
  const head = [t("col_indicator"), t("col_value"), t("col_year"), t("col_scope"), t("col_evidence"), t("col_source"), t("col_note")];
  $("table-facts").innerHTML = `<table><thead><tr>${head.map((h, i) => `<th${i === 1 ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((f) => `<tr>
      <td>${esc(zh ? f.indicator_zh : f.indicator_en)}<br><span class="muted">${esc(t(`topic_${f.topic}`))}</span></td>
      <td class="num"><b>${esc(f.value)}</b> ${esc(f.unit)}</td>
      <td>${esc(f.year)}</td><td>${esc(f.scope)}</td><td>${evidenceBadge(f.evidence)}</td>
      <td>${esc(f.source_name)}<br>${linkCell(f.link)}</td><td class="note-cell">${esc(f.note)}</td></tr>`).join("") +
    "</tbody></table>";
}

function renderSources() {
  const { catalog } = state.data;
  fillSelect("src-category", [...new Set(catalog.map((c) => c.category))], (v) => t(`cat_${v}`));
  fillSelect("src-use", ["used", "candidate", "reference"], (v) => t(`use_${v}`));
  const cat = $("src-category").value, use = $("src-use").value, q = $("src-search").value.trim();
  const zh = state.lang === "zh";
  const rows = catalog.filter((c) => (!cat || c.category === cat) && (!use || c.model_use === use)
    && matches(c, ["name_en", "name_zh", "provider", "content", "note", "format"], q));
  $("use-legend").textContent = t("use_legend");
  if (!rows.length) { $("table-sources").innerHTML = `<p class="muted">${esc(t("none"))}</p>`; return; }
  const head = [t("col_name"), t("col_provider"), t("col_content"), t("col_format"), t("col_license"), t("col_use"), t("col_link")];
  $("table-sources").innerHTML = `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((c) => `<tr>
      <td><b>${esc(zh ? c.name_zh : c.name_en)}</b><br><span class="muted">${esc(zh ? c.name_en : c.name_zh)} · ${esc(t(`cat_${c.category}`))}</span></td>
      <td>${esc(c.provider)}</td>
      <td class="note-cell">${esc(c.content)}${c.note ? `<br><span class="muted">${esc(c.note)}</span>` : ""}</td>
      <td>${esc(c.format)}<br><span class="muted">${esc(c.update)}</span></td>
      <td>${esc(c.license || "–")}</td>
      <td><span class="chip use-${esc(c.model_use)}">${esc(t(`use_${c.model_use}`))}</span></td>
      <td>${linkCell(c.link)}</td></tr>`).join("") +
    "</tbody></table>";
}


// ---------- History and projections ----------
// Stack order and colours follow the dashboard's validated carrier palette.
const STACK = [
  { g: "coal", color: "--c-coal", parts: ["coal"] },
  { g: "nuclear", color: "--c-nuclear", parts: ["nuclear"] },
  { g: "wind", color: "--c-onwind", parts: ["wind"] },
  { g: "pumped_storage", color: "--c-storage", parts: ["pumped_storage"] },
  { g: "solar", color: "--c-solar", parts: ["solar"] },
  { g: "other_re", color: "--c-other_re", parts: ["geothermal", "biomass", "waste"] },
  { g: "gas", color: "--c-gas", parts: ["gas"] },
  { g: "hydro", color: "--c-hydro", parts: ["hydro"] },
  { g: "oil", color: "--c-other", parts: ["oil"] },
];

function tsSeries(id, kinds) {
  const rows = state.ts.filter((r) => r.series === id && (!kinds || kinds.includes(r.kind)) && /^\d{4}$/.test(r.year))
    .sort((a, b) => Number(a.year) - Number(b.year));
  return { x: rows.map((r) => Number(r.year)), y: rows.map((r) => Number(r.value)), rows };
}

function layoutBase(extra = {}) {
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return {
    paper_bgcolor: cssVar("--surface"), plot_bgcolor: cssVar("--surface"),
    font: { family: cssVar("--font"), color: cssVar("--ink-2"), size: 12 },
    margin: { l: 8, r: 12, t: 8, b: 8 }, hovermode: "x unified",
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 11 } },
    hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"), font: { color: cssVar("--ink"), family: cssVar("--font") } },
    ...extra,
    xaxis: { ...axis, ...(extra.xaxis || {}) },
    yaxis: { ...axis, ...(extra.yaxis || {}) },
  };
}
const plotCfg = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

function stacked(prefix, unit, digits) {
  const traces = [];
  for (const st of STACK) {
    const parts = st.parts.map((p) => tsSeries(`${prefix}_${p}`, ["history"])).filter((s) => s.x.length);
    if (!parts.length) continue;
    const x = parts[0].x;
    const y = x.map((_, i) => parts.reduce((a, s) => a + (s.y[i] || 0), 0));
    if (y.every((v) => v < 1e-6)) continue;
    traces.push({ type: "scatter", mode: "lines", x, y, name: t(`g_${st.g}`), stackgroup: "one",
                  line: { width: 0 }, fillcolor: cssVar(st.color),
                  hovertemplate: `${t(`g_${st.g}`)}: %{y:.${digits}f} ${unit}<extra></extra>` });
  }
  return traces;
}

function renderHistory() {
  if (!state.ts) return;
  const ink = cssVar("--ink"), ink2 = cssVar("--ink-2");
  const dash = (name, s, color, extra = {}) => ({ type: "scatter", mode: "lines+markers", x: s.x, y: s.y, name,
    line: { color, width: 2, dash: "dash" }, marker: { size: 7, color: cssVar("--surface"), line: { color, width: 2 } }, ...extra });

  // Generation: stacked history + total, derived official path, GEGIS default.
  const gen = stacked("generation", "TWh", 1);
  const tot = tsSeries("generation_total", ["history"]);
  gen.push({ type: "scatter", mode: "lines", x: tot.x, y: tot.y, name: t("s_total"), line: { color: ink, width: 2 },
             hovertemplate: `${t("s_total")}: %{y:.1f} TWh<extra></extra>` });
  const fc = tsSeries("generation_forecast", ["projection"]);
  gen.push(dash(t("s_forecast"), fc, ink, { hovertemplate: `${t("s_forecast")}: %{y:.1f} TWh<extra></extra>` }));
  const gg = tsSeries("gegis_demand", ["projection"]);
  gen.push({ type: "scatter", mode: "markers", x: gg.x, y: gg.y, name: t("s_gegis"),
             marker: { symbol: "diamond-open", size: 10, color: ink2, line: { width: 2 } },
             hovertemplate: `${t("s_gegis")}: %{y:.1f} TWh<extra></extra>` });
  Plotly.react("chart-h-gen", gen, layoutBase({ yaxis: { title: { text: "TWh", font: { size: 11 } } } }), plotCfg);

  Plotly.react("chart-h-cap", stacked("capacity", "GW", 2),
    layoutBase({ yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotCfg);

  // Peak load: day peak history, night peak history + forecast, night capability forecast.
  const day = tsSeries("peak_load", ["history"]);
  const nh = tsSeries("night_peak_load", ["history"]);
  const nf_ = tsSeries("night_peak_load", ["projection"]);
  const cap = tsSeries("night_capability", ["projection"]);
  const accent = cssVar("--accent");
  Plotly.react("chart-h-peak", [
    { type: "scatter", mode: "lines", x: day.x, y: day.y, name: t("s_day_peak"), line: { color: ink, width: 2 },
      hovertemplate: `${t("s_day_peak")}: %{y:.1f} GW<extra></extra>` },
    { type: "scatter", mode: "lines+markers", x: nh.x, y: nh.y, name: `${t("s_night_peak")} (${t("kind_history")})`,
      line: { color: accent, width: 2 }, marker: { size: 6, color: accent }, hovertemplate: `${t("s_night_peak")}: %{y:.1f} GW<extra></extra>` },
    dash(`${t("s_night_peak")} (${t("kind_projection")})`, nf_, accent, { hovertemplate: `${t("s_night_peak")}: %{y:.1f} GW<extra></extra>` }),
    dash(t("s_night_cap"), cap, cssVar("--muted"), { hovertemplate: `${t("s_night_cap")}: %{y:.1f} GW<extra></extra>` }),
  ], layoutBase({ yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotCfg);

  // Renewable capacity history + targets (same colour, dashed).
  const sumSeries = (ids, kinds) => {
    const ss = ids.map((id) => tsSeries(id, kinds)).filter((s) => s.x.length);
    if (!ss.length) return { x: [], y: [] };
    const years = [...new Set(ss.flatMap((s) => s.x))].sort();
    return { x: years, y: years.map((yr) => ss.reduce((a, s) => a + (s.y[s.x.indexOf(yr)] || 0), 0)) };
  };
  const reHist = sumSeries(["capacity_hydro", "capacity_solar", "capacity_wind", "capacity_geothermal", "capacity_biomass", "capacity_waste"], ["history"]);
  const reTarget = tsSeries("capacity_renewables", ["target"]);
  const solH = tsSeries("capacity_solar", ["history"]), solT = tsSeries("capacity_solar", ["target"]);
  const windH = tsSeries("capacity_wind", ["history"]), windT = sumSeries(["capacity_offshore_wind", "capacity_onshore_wind"], ["target"]);
  const bridge = (h, tg) => ({ x: [h.x[h.x.length - 1], ...tg.x], y: [h.y[h.y.length - 1], ...tg.y] });
  const cSolar = cssVar("--c-solar"), cWind = cssVar("--c-onwind");
  Plotly.react("chart-h-re", [
    { type: "scatter", mode: "lines", x: reHist.x, y: reHist.y, name: t("s_re_total"), line: { color: ink, width: 2 }, hovertemplate: `${t("s_re_total")}: %{y:.1f} GW<extra></extra>` },
    dash(`${t("s_re_total")} ${t("s_target")}`, bridge(reHist, reTarget), ink, { hovertemplate: `${t("s_re_total")} ${t("s_target")}: %{y:.1f} GW<extra></extra>` }),
    { type: "scatter", mode: "lines", x: solH.x, y: solH.y, name: t("s_solar"), line: { color: cSolar, width: 2 }, hovertemplate: `${t("s_solar")}: %{y:.1f} GW<extra></extra>` },
    dash(`${t("s_solar")} ${t("s_target")}`, bridge(solH, solT), cSolar, { hovertemplate: `${t("s_solar")} ${t("s_target")}: %{y:.1f} GW<extra></extra>` }),
    { type: "scatter", mode: "lines", x: windH.x, y: windH.y, name: t("s_wind"), line: { color: cWind, width: 2 }, hovertemplate: `${t("s_wind")}: %{y:.1f} GW<extra></extra>` },
    dash(`${t("s_wind")} ${t("s_target")}`, bridge(windH, windT), cWind, { hovertemplate: `${t("s_wind")} ${t("s_target")}: %{y:.1f} GW<extra></extra>` }),
  ], layoutBase({ yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotCfg);

  const shH = tsSeries("re_share", ["history"]), shT = tsSeries("re_share", ["target"]);
  Plotly.react("chart-h-share", [
    { type: "scatter", mode: "lines", x: shH.x, y: shH.y, name: t("s_re_share"), line: { color: cWind, width: 2 }, hovertemplate: `${t("s_re_share")}: %{y:.1f}%<extra></extra>` },
    dash(`${t("s_re_share")} ${t("s_target")}`, bridge(shH, shT), cWind, { hovertemplate: `${t("s_target")}: %{y:.0f}%<extra></extra>` }),
  ], layoutBase({ yaxis: { title: { text: "%", font: { size: 11 } }, rangemode: "tozero" } }), plotCfg);

  const ef = tsSeries("grid_emission_factor", ["history"]);
  Plotly.react("chart-h-ef", [
    { type: "scatter", mode: "lines+markers", x: ef.x, y: ef.y, name: t("s_ef"), line: { color: ink2, width: 2 }, marker: { size: 5, color: ink2 },
      hovertemplate: `${t("s_ef")}: %{y:.3f} kg CO2e/kWh<extra></extra>` },
  ], layoutBase({ showlegend: false, yaxis: { title: { text: "kg CO2e/kWh", font: { size: 11 } } } }), plotCfg);

  // Thermal plan: additions up, retirements down.
  const planBar = (id, key, color, sign, extra = {}) => {
    const p = tsSeries(id, ["projection"]);
    return { type: "bar", x: p.x, y: p.y.map((v) => sign * v), name: t(key),
             customdata: p.rows.map((r) => r.note.replace(/^Figure 3-3\. Units: /, "").split(", ").join("<br>")),
             marker: { color, line: { color: cssVar("--surface"), width: 1 } , ...extra},
             hovertemplate: `${t(key)}: %{y:.2f} GW<br>%{customdata}<extra></extra>` };
  };
  Plotly.react("chart-h-plan", [
    planBar("planned_add_gas", "s_add_gas", cssVar("--c-gas"), 1),
    planBar("planned_retire_coal", "s_ret_coal", cssVar("--c-coal"), -1),
    // Semi-transparent gas, so the legend swatch matches the bars.
    planBar("planned_retire_gas", "s_ret_gas", `${cssVar("--c-gas")}80`, -1),
    planBar("planned_retire_oil", "s_ret_oil", cssVar("--c-other"), -1),
  ], layoutBase({ barmode: "relative", hovermode: "closest", xaxis: { dtick: 1 }, yaxis: { title: { text: "GW", font: { size: 11 } } } }), plotCfg);

  renderSectors();
  Object.keys(CHART_SERIES).forEach(sourceLine);
  renderSeriesTable();
  renderRefs();
}


// ---------- Energy use in all sectors ----------
// Colour slots (--k-1..8, site.css) per entity, and stacking orders that passed the
// palette validator in light and dark (adjacent pairs).
const SECTORS = [["industry", 1], ["transport", 2], ["residential", 3], ["services", 4], ["agriculture", 5],
                 ["non_energy", 6], ["energy_own_use", 7]];
const CO2_SECTORS = [["industry", 1], ["transport", 2], ["residential", 3], ["services", 4], ["agriculture", 5], ["energy", 7]];
const FUELS = [["gas", 2], ["electricity", 1], ["heat", 8], ["coal", 7], ["biomass_waste", 6], ["oil", 5], ["solar_thermal", 4]];
const TFUELS = [["gasoline", 4], ["jet", 3], ["diesel", 7], ["fuel_oil", 8], ["electricity", 1], ["other", 6]];
const BRANCHES = [["chemicals", 1], ["basic_metals", 2], ["electronics", 3], ["non_metallic", 4], ["paper", 5], ["textiles", 6], ["other", 7]];
const END_USE_SECTORS = ["industry", "transport", "residential", "services", "agriculture"];
const slot = (k) => cssVar(`--k-${k}`);
const L = (group, id) => (I18N[state.lang][group] || {})[id] || id;
state.co2Method = "direct";

function areaStack(prefix, entities, group, unit, digits) {
  return entities.map(([id, k]) => {
    const s = tsSeries(`${prefix}${id}`, ["history"]);
    return { type: "scatter", mode: "lines", x: s.x, y: s.y, name: L(group, id), stackgroup: "one",
             line: { width: 0.5, color: cssVar("--surface") }, fillcolor: slot(k),
             hovertemplate: `${L(group, id)}: %{y:.${digits}f} ${unit}<extra></extra>` };
  }).filter((tr) => tr.x.length);
}

function renderSectors() {
  const tall = { yaxis: { title: { text: "TWh", font: { size: 11 } }, rangemode: "tozero" } };
  Plotly.react("chart-s-sector", areaStack("sector_energy_", SECTORS, "sec", "TWh", 1), layoutBase(tall), plotCfg);

  // Fuel mix by sector for one year: horizontal stacked bars.
  const years = tsSeries("sector_energy_industry", ["history"]).x;
  const sel = $("s-year");
  if (sel.options.length !== years.length) {
    sel.innerHTML = years.slice().reverse().map((y) => `<option value="${y}">${y}</option>`).join("");
  }
  const year = Number(sel.value || years[years.length - 1]);
  const val = (id) => { const r = state.ts.find((x) => x.series === id && Number(x.year) === year); return r ? Number(r.value) : 0; };
  const cats = END_USE_SECTORS.map((s) => L("sec", s));
  const totals = END_USE_SECTORS.map((s) => FUELS.reduce((a, [f]) => a + val(`sector_fuel_${s}_${f}`), 0));
  const fuelTraces = FUELS.map(([f, k]) => {
    const x = END_USE_SECTORS.map((s) => val(`sector_fuel_${s}_${f}`));
    return { type: "bar", orientation: "h", y: cats, x, name: L("fuel", f),
             customdata: x.map((v, i) => (totals[i] ? (100 * v) / totals[i] : 0)),
             marker: { color: slot(k), line: { color: cssVar("--surface"), width: 1.5 } },
             hovertemplate: `%{y} · ${L("fuel", f)}: %{x:.1f} TWh (%{customdata:.0f}%)<extra></extra>` };
  }).filter((tr) => tr.x.some((v) => v > 0.01));
  Plotly.react("chart-s-fuel", fuelTraces, layoutBase({
    barmode: "stack", hovermode: "closest", barcornerradius: 3,
    yaxis: { autorange: "reversed" }, xaxis: { title: { text: "TWh", font: { size: 11 } } },
  }), plotCfg);

  // Transport by fuel and industry by branch, with the 2018 break marked on industry.
  Plotly.react("chart-s-transport", areaStack("transport_fuel_", TFUELS, "tfuel", "TWh", 1), layoutBase(tall), plotCfg);
  const brk = { shapes: [{ type: "line", x0: 2017.5, x1: 2017.5, y0: 0, y1: 1, yref: "paper",
                           line: { color: cssVar("--muted"), width: 1, dash: "dot" } }],
                annotations: [{ x: 2017.5, y: 1, yref: "paper", text: t("break_2018"), showarrow: false, xanchor: "left",
                                yanchor: "top", font: { size: 10, color: cssVar("--muted") } }] };
  Plotly.react("chart-s-industry", areaStack("industry_branch_", BRANCHES, "branch", "TWh", 1), layoutBase({ ...tall, ...brk }), plotCfg);

  // CO2 by sector, direct or with electricity allocated.
  const m = state.co2Method;
  document.querySelectorAll("#co2-method button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.method === m)));
  $("h-co2s-sub").textContent = t(m === "direct" ? "co2_sub_direct" : "co2_sub_indirect");
  Plotly.react("chart-s-co2", areaStack(`co2_sector_${m}_`, CO2_SECTORS, "sec", "Mt", 1),
    layoutBase({ yaxis: { title: { text: "Mt CO2", font: { size: 11 } }, rangemode: "tozero" } }), plotCfg);

  // Household electricity by appliance (2024 survey), whole year and summer.
  const apps = [...new Set(state.ts.filter((r) => r.series.startsWith("home_elec_year_")).map((r) => r.series.slice(15)))];
  const share = (kind, a) => { const r = state.ts.find((x) => x.series === `home_elec_${kind}_${a}`); return r ? Number(r.value) : 0; };
  apps.sort((a, b) => (a === "other") - (b === "other") || share("year", b) - share("year", a));
  const appName = (a) => { const r = state.ts.find((x) => x.series === `home_elec_year_${a}`); return (state.lang === "zh" ? r.indicator_zh : r.indicator_en).split(/[:：]\s*/).pop(); };
  const bars = [["year", "home_year", 1], ["summer", "home_summer", 2]].map(([kind, key, k]) => ({
    type: "bar", orientation: "h", y: apps.map(appName), x: apps.map((a) => share(kind, a)), name: t(key),
    marker: { color: slot(k) }, hovertemplate: `%{y} · ${t(key)}: %{x:.1f}%<extra></extra>`,
  }));
  Plotly.react("chart-s-home", bars, layoutBase({
    barmode: "group", bargap: 0.25, bargroupgap: 0.1, hovermode: "closest", barcornerradius: 3,
    yaxis: { autorange: "reversed" }, xaxis: { ticksuffix: "%", rangemode: "tozero" },
  }), plotCfg);

  // Heating, cooling and hot water: numbers from the same data.
  const last = (id) => { const s = tsSeries(id, ["history"]); return { x: s.x[s.x.length - 1], y: s.y[s.y.length - 1] }; };
  const fact = (name) => (state.data.facts.find((f) => f.indicator_en === name) || {}).value;
  const ly = last("sector_fuel_residential_electricity").x;
  const res = ["electricity", "oil", "gas", "solar_thermal"].reduce((a, f) => a + (last(`sector_fuel_residential_${f}`).y || 0), 0);
  const fmt = (v, d = 1) => Number(v).toLocaleString(state.lang === "zh" ? "zh-TW" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
  const v = {
    year: ly, acYear: fmt(share("year", "air_conditioner")), acSummer: fmt(share("summer", "air_conditioner")),
    whYear: fmt(share("year", "water_heater")),
    acPer: fmt(Number(fact("Air conditioners per 100 households")) / 100), acOwn: fmt(Number(fact("Households with air conditioning"))),
    elecShare: fmt((100 * last("sector_fuel_residential_electricity").y) / res, 0),
    lpg: fmt(last("sector_fuel_residential_oil").y), gas: fmt(last("sector_fuel_residential_gas").y),
    heat: fmt(last("sector_fuel_industry_heat").y),
  };
  $("heatcool").innerHTML = t("heatcool")(v).map((s) => `<li>${esc(s)}</li>`).join("");
}


// ---------- Sources under each chart ----------
// Which series each chart plots (the source line lists their sources).
const CHART_SERIES = {
  "chart-h-gen": (id) => id.startsWith("generation_") || id === "gegis_demand",
  "chart-h-cap": (id, kind) => id.startsWith("capacity_") && kind === "history",
  "chart-h-peak": (id) => ["peak_load", "night_peak_load", "night_capability"].includes(id),
  "chart-h-re": (id) => ["capacity_hydro", "capacity_solar", "capacity_wind", "capacity_geothermal", "capacity_biomass",
                         "capacity_waste", "capacity_renewables", "capacity_offshore_wind", "capacity_onshore_wind"].includes(id),
  "chart-h-share": (id) => id === "re_share",
  "chart-h-ef": (id) => id === "grid_emission_factor",
  "chart-h-plan": (id) => id.startsWith("planned_"),
  "chart-s-sector": (id) => id.startsWith("sector_energy_"),
  "chart-s-fuel": (id) => id.startsWith("sector_fuel_"),
  "chart-s-transport": (id) => id.startsWith("transport_fuel_"),
  "chart-s-industry": (id) => id.startsWith("industry_branch_"),
  "chart-s-co2": (id) => id.startsWith("co2_sector_"),
  "chart-s-home": (id) => id.startsWith("home_elec_"),
};

function sourceLine(chartId) {
  const pick = CHART_SERIES[chartId];
  const rows = state.ts.filter((r) => pick(r.series, r.kind));
  // History: one entry per source. Projections and targets: one per source and locator.
  const entries = new Map();
  for (const r of rows) {
    const hist = r.kind === "history";
    const key = hist ? `h|${r.source_id}` : `p|${r.source_id}|${r.locator}`;
    if (!entries.has(key)) entries.set(key, { hist, r, kinds: new Set(), years: [] });
    const e = entries.get(key);
    e.kinds.add(r.kind);
    if (/^\d{4}$/.test(r.year)) e.years.push(Number(r.year));
  }
  const items = [...entries.values()].sort((a, b) => (a.hist === b.hist ? 0 : a.hist ? -1 : 1)).map((e) => {
    const src = state.src[e.r.source_id] || {};
    const kinds = [...e.kinds].map((k) => t(`kind_${k}`)).join(" / ");
    const span = e.years.length ? ` ${Math.min(...e.years)}${Math.max(...e.years) > Math.min(...e.years) ? `–${Math.max(...e.years)}` : ""}` : "";
    // History from files: the column (or sheet and row) is in the series table. A report page is shown here.
    const where = e.r.locator && !/^(column|sheet|Figure|附表)/.test(e.r.locator) ? `, ${esc(e.r.locator)}` : "";
    const link = src.landing_url ? ` <a href="${esc(src.landing_url)}" rel="noopener">${esc(hostOf(src.landing_url))}</a>` : "";
    return `<li><b>${esc(kinds)}${esc(span)}:</b> ${esc(src.short_cite || e.r.source_name)}${where}${link} ${evidenceBadge(e.r.evidence)}</li>`;
  });
  let el = document.getElementById(`src-${chartId}`);
  if (!el) {
    el = document.createElement("div");
    el.className = "sources";
    el.id = `src-${chartId}`;
    $(chartId).insertAdjacentElement("afterend", el);
  }
  el.innerHTML = `<span class="sources-label">${esc(t("src_label"))}</span><ul>${items.join("")}</ul>`;
}

const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

function renderRefs() {
  const used = new Set(state.ts.map((r) => r.source_id));
  const refs = Object.values(state.src).filter((r) => used.has(r.source_id));
  const head = [t("col_title"), t("col_publisher"), t("col_edition"), t("col_published"), t("col_origin"), t("col_evidence"), t("col_link"), t("col_local"), t("col_accessed"), t("col_note")];
  $("table-refs").innerHTML = `<table><thead><tr>${head.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>` +
    refs.map((r) => `<tr id="ref-${esc(r.source_id)}"><td><b>${esc(r.title || r.title_en)}</b>${r.title && r.title_en && r.title_en !== r.title ? `<br><span class="muted">${esc(r.title_en)}</span>` : ""}<br><code>${esc(r.source_id)}</code></td>
      <td>${esc(r.publisher)}</td><td>${esc(r.edition)}</td><td>${esc(r.published)}</td><td>${r.origin ? `<span class="origin o-${esc(r.origin)}">${esc(t(`origin_${r.origin.replace("-", "_")}`))}</span>` : "–"}</td><td>${evidenceBadge(r.evidence)}</td>
      <td>${r.landing_url ? `<a href="${esc(r.landing_url)}" rel="noopener">${esc(t("link_page"))}</a>` : "–"}${r.file_url ? ` · <a href="${esc(r.file_url)}" rel="noopener">${esc(t("link_file"))}</a>` : ""}</td>
      <td>${r.local_file ? `<code>${esc(r.local_file)}</code>${r.sha256 ? `<br><span class="muted" title="${esc(r.sha256)}">${esc(r.sha256.slice(0, 12))}…</span>` : ""}` : "–"}</td>
      <td>${esc(r.accessed || "–")}</td><td class="note-cell">${esc(r.note)}</td></tr>`).join("") + "</tbody></table>";
}

function renderSeriesTable() {
  const zh = state.lang === "zh";
  const ids = [...new Set(state.ts.map((r) => r.series))];
  const label = (id) => { const r = state.ts.find((x) => x.series === id); return r ? (zh ? r.indicator_zh : r.indicator_en) : id; };
  fillSelect("ts-series", ids.sort((a, b) => label(a).localeCompare(label(b))), label);
  fillSelect("ts-kind", ["history", "projection", "target"], (v) => t(`kind_${v}`));
  if (!$("ts-series").value) $("ts-series").value = "peak_load";
  const id = $("ts-series").value, kind = $("ts-kind").value;
  const rows = state.ts.filter((r) => (!id || r.series === id) && (!kind || r.kind === kind))
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  if (!rows.length) { $("table-ts").innerHTML = `<p class="muted">${esc(t("none"))}</p>`; return; }
  const head = [t("col_indicator"), t("col_year"), t("col_value"), t("col_kind"), t("col_scope"), t("col_evidence"), t("col_source"), t("col_note")];
  $("table-ts").innerHTML = `<table><thead><tr>${head.map((h, i) => `<th${i === 2 ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>` +
    rows.map((r) => `<tr><td>${esc(zh ? r.indicator_zh : r.indicator_en)}</td><td>${esc(r.year)}</td>
      <td class="num"><b>${esc(Number(r.value).toLocaleString(zh ? "zh-TW" : "en-US", { maximumFractionDigits: 3 }))}</b> ${esc(r.unit)}</td>
      <td>${esc(t(`kind_${r.kind}`))}</td><td>${esc(r.scope)}</td><td>${evidenceBadge(r.evidence)}</td>
      <td>${esc(r.source_name)}${r.locator ? `<br><span class="muted">${esc(r.locator)}</span>` : ""}${r.link ? `<br>${linkCell(r.link)}` : ""}</td><td class="note-cell">${esc(r.note)}</td></tr>`).join("") +
    "</tbody></table>";
}

function applyStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
}

function renderAll() {
  applyStaticText();
  if (!state.data) return;
  renderTiles();
  renderHistory();
  renderFacts();
  renderSources();
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
    document.documentElement.dataset.theme = next; storageSet("tw-theme", next);
    renderHistory();
  });
  for (const id of ["fact-topic", "fact-evidence"]) $(id).addEventListener("change", renderFacts);
  for (const id of ["src-category", "src-use"]) $(id).addEventListener("change", renderSources);
  $("fact-search").addEventListener("input", renderFacts);
  for (const id of ["ts-series", "ts-kind"]) $(id).addEventListener("change", renderSeriesTable);
  $("s-year").addEventListener("change", renderSectors);
  document.querySelectorAll("#co2-method button").forEach((b) => b.addEventListener("click", () => {
    state.co2Method = b.dataset.method; renderSectors();
  }));
  $("src-search").addEventListener("input", renderSources);
  try {
    const res = await fetch("data/taiwan_catalog.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();
    try {
      const r2 = await fetch("data/taiwan_timeseries.json");
      const tsData = r2.ok ? await r2.json() : null;
      state.ts = tsData ? tsData.rows : null;
      state.src = Object.fromEntries(((tsData && tsData.sources) || []).map((x) => [x.source_id, x]));
    } catch { state.ts = null; }
    renderAll();
  } catch (err) {
    applyStaticText();
    $("tiles").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${esc(t("loading_error"))}<br><small>${esc(err.message)}</small></span></div>`;
  }
}

init();
