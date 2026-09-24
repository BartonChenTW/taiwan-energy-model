/* Taiwan energy data page: key figures and data-source catalogue.
   Data: docs/data/taiwan_catalog.json, written by pypsa_tw/viewer/export_dashboard_data.py
   from pypsa_tw/data/taiwan_key_facts.csv and taiwan_energy_catalog.csv. */

const I18N = {
  en: {
    title: "Taiwan energy data", nav_dashboard: "← Model dashboard", nav_facts: "Key figures", nav_sources: "Data sources",
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
    ev_downloaded: "Downloaded", ev_page_opened: "Page checked", ev_search_summary: "To verify", ev_model_output: "Model output",
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
  },
  zh: {
    title: "台灣能源資料", nav_dashboard: "← 模型儀表板", nav_facts: "關鍵數據", nav_sources: "資料來源",
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
    ev_downloaded: "已下載", ev_page_opened: "已查頁面", ev_search_summary: "待查證", ev_model_output: "模型結果",
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
  },
};

const EVIDENCE = { downloaded: "good", page_opened: "good", search_summary: "warning", model_output: "neutral" };
const EVIDENCE_ICON = { good: "✓", warning: "!", neutral: "◆" };
const state = { lang: "en", data: null };

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

function applyStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
}

function renderAll() {
  applyStaticText();
  if (!state.data) return;
  renderTiles();
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
  });
  for (const id of ["fact-topic", "fact-evidence"]) $(id).addEventListener("change", renderFacts);
  for (const id of ["src-category", "src-use"]) $(id).addEventListener("change", renderSources);
  $("fact-search").addEventListener("input", renderFacts);
  $("src-search").addEventListener("input", renderSources);
  try {
    const res = await fetch("data/taiwan_catalog.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.data = await res.json();
    renderAll();
  } catch (err) {
    applyStaticText();
    $("tiles").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${esc(t("loading_error"))}<br><small>${esc(err.message)}</small></span></div>`;
  }
}

init();
