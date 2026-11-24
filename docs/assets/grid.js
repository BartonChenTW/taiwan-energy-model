/* Taiwan energy networks page: electrical grid (official, OSM, PyPSA) & LNG/fuel networks.
   Reads docs/data/grid_data.json exported by viewer/export_grid_data.py. */

(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const isZh = () => (document.documentElement.lang || "").toLowerCase().startsWith("zh");
  const pick = (en, zh) => (isZh() ? zh : en);
  const regLabel = (id) => {
    const r = state.data?.regions?.find((x) => x.id === id);
    return r ? pick(r.name_en, r.name_zh) : (id || "");
  };
  const osmUrl = (type, id) => `https://www.openstreetmap.org/${type === "node" ? "node" : "way"}/${id}`;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmtNum = (n, d = 0) => (n === null || n === undefined || Number.isNaN(Number(n))
    ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));

  const LAYER_DEFS = [
    { key: "k345", color: "#dc2626", en: "OSM 345 kV lines", zh: "OSM 345 kV 超高壓線" },
    { key: "k161", color: "#ea580c", en: "OSM 161 kV lines", zh: "OSM 161 kV 一次線" },
    { key: "k69", color: "#d97706", en: "OSM 69 kV lines", zh: "OSM 69 kV 二次線" },
    { key: "cable", color: "#0891b2", en: "OSM underground & subsea cables", zh: "OSM 地下與海底電纜" },
    { key: "subs", color: "#2563eb", en: "OSM substations", zh: "OSM 變電所" },
    { key: "pypsa", color: "#7c3aed", en: "PyPSA 6 regions & 193 buses", zh: "PyPSA 六區廊道與 193 節點" },
    { key: "lng", color: "#059669", en: "7 LNG terminals & figure-8 gas grid", zh: "7 座 LNG 接收站與 8 字輸氣網" },
    { key: "fuel", color: "#475569", en: "Coal ports & refineries", zh: "卸煤港與煉油廠" },
  ];

  const PRESETS = [
    {
      id: "hv", en: "HV grid + LNG", zh: "高壓電網 + 天然氣",
      layers: { k345: true, k161: true, k69: false, cable: true, subs: true, pypsa: false, lng: true, fuel: false },
    },
    {
      id: "full_osm", en: "All OSM voltages", zh: "全部 OSM 電壓層",
      layers: { k345: true, k161: true, k69: true, cable: true, subs: true, pypsa: false, lng: false, fuel: false },
    },
    {
      id: "model", en: "PyPSA 6-region model", zh: "PyPSA 六區簡化模型",
      layers: { k345: false, k161: false, k69: false, cable: false, subs: false, pypsa: true, lng: false, fuel: false },
    },
    {
      id: "gas", en: "Gas & fuel network", zh: "天然氣與燃料路網",
      layers: { k345: false, k161: false, k69: false, cable: false, subs: false, pypsa: false, lng: true, fuel: true },
    },
  ];

  const state = {
    data: null,
    layers: { ...PRESETS[0].layers },
    subSort: { key: "v_max_kv", dir: -1 },
    lineSort: { key: "length_km", dir: -1 },
  };

  function evidenceChip(ev) {
    const map = {
      downloaded: ["chip good", "✓", pick("Downloaded", "已下載實查")],
      page_opened: ["chip good", "✓", pick("Page checked", "已開啟查核")],
      search_summary: ["chip warning", "!", pick("To verify", "搜尋摘要待查")],
      model_input: ["chip neutral", "•", pick("Model input", "模型輸入")],
      model_output: ["chip neutral", "•", pick("Model output", "模型輸出")],
      derived: ["chip neutral", "•", pick("Derived", "推算")],
    };
    const [cls, icon, label] = map[ev] || ["chip neutral", "•", ev || ""];
    return `<span class="${cls}"><span class="chip-icon" aria-hidden="true">${icon}</span>${esc(label)}</span>`;
  }

  function plotLayout(extra = {}) {
    return {
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: css("--ink"), family: css("--font") || "sans-serif", size: 12 },
      margin: { t: 28, r: 16, b: 44, l: 54 },
      legend: { orientation: "h", y: -0.18, x: 0 },
      ...extra,
    };
  }

  function renderAlerts(d) {
    const osm = d.osm.counts;
    const off = d.official_grid;
    const bus91 = d.pypsa.buses.find((b) => (b.v_nom_kv || 0) > 345);
    const way690 = d.osm.lines.find((l) => l.v_max_kv === 690);
    $("grid-alerts").innerHTML = `
      <div class="status note">
        <span class="icon" aria-hidden="true">i</span>
        <span>${pick(
          `<strong>OSM vs. Taipower completeness:</strong> Taipower reports <strong>${fmtNum(off.substations_total)}</strong> substations and <strong>${fmtNum(off.transmission_ckt_km)} ckt-km</strong> of transmission lines, whereas the open OSM extract captures <strong>${fmtNum(osm.raw_substations)}</strong> raw polygon/node features (${fmtNum(osm.named_substations)} named) and <strong>${fmtNum(osm.raw_lines + osm.raw_cables)}</strong> ways; many OSM lines omit <code>circuits</code> tags or underground detail, and distribution feeders (11/22.8 kV) are excluded.`,
          `<strong>OSM 圖資與台電官方統計差異：</strong>台電統計全台共有 <strong>${fmtNum(off.substations_total)}</strong> 座變電所及 <strong>${fmtNum(off.transmission_ckt_km)}</strong> 回線公里輸電線；本模型採用的 OpenStreetMap 圖資共擷取 <strong>${fmtNum(osm.raw_substations)}</strong> 筆變電所幾何（其中 ${fmtNum(osm.named_substations)} 筆具名稱）與 <strong>${fmtNum(osm.raw_lines + osm.raw_cables)}</strong> 筆線路與電纜，部分線路缺少迴路數（<code>circuits</code>）或地下化細節，且不含 11/22.8 kV 配電饋線。`
        )}</span>
      </div>
      <div class="status warning">
        <span class="icon" aria-hidden="true">!</span>
        <span>${pick(
          `<strong>Hualien 690 kV OSM tagging artifact &amp; North-Central bottleneck contrast:</strong> In <code>elec.nc</code>, Bus <code>${esc(bus91?.id || "91")}</code> near Hualien shows <code>v_nom = 690 kV</code> because OSM way <code>${esc(way690?.id || 1331526157)}</code> (${esc(way690?.name || "初英分歧線")}) carries <code>tags.voltage=690000</code> (an extra zero on a 69 kV feeder). Meanwhile, the 6-region model aggregates Taipei–Taoyuan into <code>13,927 MVA</code> nominal (9,749 MW usable), which is much larger than Taipower's real 2022 Central→North remaining transfer margin (<strong>104 MW</strong>).`,
          `<strong>花蓮 690 kV 圖資異常與中送北瓶頸對照：</strong>在未簡化模型 <code>elec.nc</code> 中，花蓮節點 <code>Bus ${esc(bus91?.id || "91")}</code> 出現異常的 <code>690 kV</code>，實因 OSM 線路 <code>${esc(way690?.id || 1331526157)}</code>（${esc(way690?.name || "初英分歧線")}）誤標為 <code>690000</code> 伏特（應為 69 kV）。此外，六區模型將桃園–台北跨區廊道簡化為 <code>13,927 MVA</code>（可用 9,749 MW），對照台電 2022 年實際中送北輸電裕度僅 <strong>104 MW</strong>。`
        )}</span>
      </div>
    `;
  }

  function renderTiles(d) {
    const off = d.official_grid;
    const latest = d.history[d.history.length - 1] || {};
    const m = d.bottlenecks_and_upgrades.transfer_margins_2022;
    const tiles = [
      {
        val: `${fmtNum(off.transmission_ckt_km)} <span class="unit">${pick("ckt-km", "回線公里")}</span>`,
        lbl: pick("Transmission lines (search summary)", "輸電線路總長（待查原始年報）"),
        sub: pick(
          `Incl. ${fmtNum(off.underground_cable_ckt_km.total, 0)} ckt-km underground; dist. ${fmtNum(off.distribution_ckt_km)} ckt-km`,
          `含地下電纜 ${fmtNum(off.underground_cable_ckt_km.total, 0)} 回線公里；配電 ${fmtNum(off.distribution_ckt_km)} 回線公里`
        ),
      },
      {
        val: `${fmtNum(off.substations_total)} <span class="unit">${pick("sites", "座")}</span>`,
        lbl: pick("Taipower substations (E/S–S/S)", "全台各級變電所總數"),
        sub: "37 E/S · 53 P/S · 257 D/S · 280 S/S",
      },
      {
        val: `${fmtNum(latest.line_loss_pct, 2)}<span class="unit">%</span>`,
        lbl: pick(`Line loss rate (${latest.year || 2025})`, `線路損失率 (${latest.year || 2025})`),
        sub: pick(
          `Down from 4.76% in 2005; load factor ${fmtNum(latest.load_factor_pct, 2)}%`,
          `較 2005 年 4.76% 明顯下降；系統負載率 ${fmtNum(latest.load_factor_pct, 2)}%`
        ),
      },
      {
        val: `${fmtNum(m.central_to_north_MW)} / ${fmtNum(m.south_to_central_MW)} <span class="unit">MW</span>`,
        lbl: pick("2022 Central→North / South→Central margin", "2022 中送北／南送中輸電裕度"),
        sub: pick("Expanding Trunk Lines 1–3 to 3,000 MW each by 2030", "超一至超三路目標 2030 年擴至各 3,000 MW"),
      },
      {
        val: `${fmtNum(d.resilience_plan.total_billion_ntd, 1)} <span class="unit">${pick("B NT$", "十億元")}</span>`,
        lbl: pick("10-Year Grid Resilience Plan", "十年強化電網韌性建設計畫"),
        sub: pick("1.42 GW battery built (Jul 2025); 5.5 GW target (2030)", "併網儲能已達 1.42 GW (2025.07)；2030 目標 5.5 GW"),
      },
      {
        val: `${d.lng_terminals.length} <span class="unit">LNG</span>`,
        lbl: pick("LNG terminals & figure-8 gas network", "LNG 接收站與 8 字海陸輸氣網"),
        sub: pick("Statutory stock 8 d → 11 d (2025) → 14 d (2027)", "法定安全存量：8 天 → 11 天 (2025) → 14 天 (2027)"),
      },
    ];
    $("grid-tiles").innerHTML = tiles.map((t) => `
      <div class="tile">
        <div class="label">${esc(t.lbl)}</div>
        <div class="value">${t.val}</div>
        <div class="note">${esc(t.sub)}</div>
      </div>
    `).join("");
  }

  function renderMapControls() {
    const presetHtml = PRESETS.map((p) =>
      `<button type="button" class="ghost" data-preset="${p.id}">${esc(pick(p.en, p.zh))}</button>`
    ).join("");
    const checksHtml = LAYER_DEFS.map((l) => `
      <label style="flex-direction:row;align-items:center;gap:6px;cursor:pointer;">
        <input type="checkbox" data-layer="${l.key}" ${state.layers[l.key] ? "checked" : ""} />
        <span class="swatch" style="background:${l.color};margin-right:2px;"></span>
        <span>${esc(pick(l.en, l.zh))}</span>
      </label>
    `).join("");
    $("map-controls").innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-bottom:4px;">${presetHtml}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px 14px;width:100%;">${checksHtml}</div>
    `;
    $("map-controls").querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = PRESETS.find((x) => x.id === btn.dataset.preset);
        if (!p) return;
        state.layers = { ...p.layers };
        renderMapControls();
        renderMap(state.data);
      });
    });
    $("map-controls").querySelectorAll("[data-layer]").forEach((cb) => {
      cb.addEventListener("change", () => {
        state.layers[cb.dataset.layer] = cb.checked;
        renderMap(state.data);
      });
    });
  }

  function packLineCoords(items) {
    const lons = [];
    const lats = [];
    const midLons = [];
    const midLats = [];
    const texts = [];
    for (const item of items) {
      if (!item.coords || item.coords.length < 2) continue;
      for (const [x, y] of item.coords) {
        lons.push(x);
        lats.push(y);
      }
      lons.push(null);
      lats.push(null);
      const mid = item.coords[Math.floor(item.coords.length / 2)];
      midLons.push(mid[0]);
      midLats.push(mid[1]);
      const cir = item.circuits ? ` · ${item.circuits} ${pick("ckt", "回線")}` : "";
      const anom = item.anomaly ? `<br>⚠ ${esc(item.anomaly)}` : "";
      texts.push(`<b>${esc(item.name)}</b><br>${item.v_max_kv || "?"} kV (${esc(item.kind)}) · ${fmtNum(item.length_km, 1)} km${cir}${anom}`);
    }
    return { lons, lats, midLons, midLats, texts };
  }

  function renderMap(d) {
    const traces = [];
    const regionColors = ["#cbd5e1", "#93c5fd", "#fdba74", "#86efac", "#f9a8d4", "#fcd34d"];

    // Subtle Taiwan island + 6-region outlines
    d.regions.forEach((reg, idx) => {
      const rlons = [];
      const rlats = [];
      for (const ring of reg.rings) {
        for (const [x, y] of ring) { rlons.push(x); rlats.push(y); }
        rlons.push(null); rlats.push(null);
      }
      traces.push({
        type: "scattergeo", mode: "lines",
        lon: rlons, lat: rlats,
        line: { width: state.layers.pypsa ? 1.5 : 0.8, color: state.layers.pypsa ? css("--accent") : css("--border") },
        fill: state.layers.pypsa ? "toself" : "none",
        fillcolor: state.layers.pypsa ? regionColors[idx % regionColors.length] + "33" : undefined,
        name: `${reg.id} (${pick(reg.name_en, reg.name_zh)})`,
        legendgroup: "regions", showlegend: false, hoverinfo: state.layers.pypsa ? "name" : "skip",
      });
    });

    // OSM transmission lines & cables
    const addOsmLines = (key, pred, color, width, dash = "solid") => {
      if (!state.layers[key]) return;
      const subset = d.osm.lines.filter(pred);
      const packed = packLineCoords(subset);
      const meta = LAYER_DEFS.find((x) => x.key === key);
      traces.push({
        type: "scattergeo", mode: "lines",
        lon: packed.lons, lat: packed.lats,
        line: { width, color, dash },
        name: `${pick(meta.en, meta.zh)} (${subset.length})`,
        hoverinfo: "skip",
      });
      // Named midpoints hover trace (especially useful for 345 kV and cables)
      if (key === "k345" || key === "cable") {
        const named = subset.filter((l) => l.named || l.anomaly);
        const np = packLineCoords(named);
        traces.push({
          type: "scattergeo", mode: "markers",
          lon: np.midLons, lat: np.midLats, text: np.texts,
          marker: { size: 5, color, opacity: 0.75 },
          hoverinfo: "text", showlegend: false,
        });
      }
    };

    addOsmLines("k69", (l) => l.kind === "overhead" && (l.v_max_kv === 69 || l.v_max_kv === 690 || !l.v_max_kv), "#d97706", 1.0);
    addOsmLines("k161", (l) => l.kind === "overhead" && l.v_max_kv === 161, "#ea580c", 1.5);
    addOsmLines("k345", (l) => l.kind === "overhead" && l.v_max_kv === 345, "#dc2626", 2.4);
    addOsmLines("cable", (l) => l.kind !== "overhead", "#0891b2", 1.8, "dot");

    // OSM substations
    if (state.layers.subs) {
      const tierColors = { "E/S": "#b91c1c", "P/S": "#ea580c", "D/S": "#2563eb", "S/S": "#64748b", "Other": "#94a3b8" };
      const subs = d.osm.substations;
      traces.push({
        type: "scattergeo", mode: "markers",
        lon: subs.map((s) => s.lon), lat: subs.map((s) => s.lat),
        name: `${pick("OSM substations", "OSM 變電所")} (${subs.length})`,
        marker: {
          size: subs.map((s) => (s.tier === "E/S" ? 8 : s.tier === "P/S" ? 6 : 4.5)),
          color: subs.map((s) => tierColors[s.tier] || "#94a3b8"),
          line: { width: 0.6, color: "#ffffff" },
          opacity: 0.88,
        },
        text: subs.map((s) => `<b>${esc(pick(s.name_en, s.name_zh))}</b> (${esc(s.tier)})<br>${s.voltages_kv.join("/") || "?"} kV${s.rating ? " · " + esc(s.rating) : ""}${s.location ? " · " + esc(s.location) : ""}<br>${esc(regLabel(s.region))}`),
        hoverinfo: "text",
      });
    }

    // PyPSA-Earth 193 buses, 243 elec.nc lines, & 6 corridors
    if (state.layers.pypsa) {
      const ep = packLineCoords(d.pypsa.lines);
      traces.push({
        type: "scattergeo", mode: "lines", lon: ep.lons, lat: ep.lats,
        line: { width: 1.3, color: "#8b5cf6" },
        name: `elec.nc lines (${d.pypsa.summary.elec_lines})`,
        hoverinfo: "skip",
      });
      const clons = [];
      const clats = [];
      const ctexts = [];
      const cmidsX = [];
      const cmidsY = [];
      for (const c of d.pypsa.corridors) {
        clons.push(c.p0[0], c.p1[0], null);
        clats.push(c.p0[1], c.p1[1], null);
        cmidsX.push((c.p0[0] + c.p1[0]) / 2);
        cmidsY.push((c.p0[1] + c.p1[1]) / 2);
        ctexts.push(`<b>${esc(pick(c.name_en, c.name_zh))}</b><br>s_nom: ${fmtNum(c.s_nom_MVA, 0)} MVA (usable ${fmtNum(c.usable_MW, 0)} MW)<br>elec_s lines: ${c.elec_s_line_count}`);
      }
      traces.push({
        type: "scattergeo", mode: "lines", lon: clons, lat: clats,
        line: { width: 4.5, color: "#6d28d9" },
        name: `elec_s_6 corridors (6)`,
        hoverinfo: "skip",
      });
      traces.push({
        type: "scattergeo", mode: "markers", lon: cmidsX, lat: cmidsY, text: ctexts,
        marker: { size: 9, symbol: "diamond", color: "#6d28d9", line: { width: 1, color: "#fff" } },
        name: pick("6-region corridor metrics", "六區廊道容量標註"),
        hoverinfo: "text",
      });
      const buses = d.pypsa.buses;
      traces.push({
        type: "scattergeo", mode: "markers",
        lon: buses.map((b) => b.lon), lat: buses.map((b) => b.lat),
        name: `elec.nc buses (${buses.length})`,
        marker: {
          size: buses.map((b) => ((b.v_nom_kv || 0) > 345 ? 11 : b.v_nom_kv === 345 ? 7 : 5)),
          color: buses.map((b) => ((b.v_nom_kv || 0) > 345 ? "#ef4444" : b.v_nom_kv === 345 ? "#7c3aed" : b.v_nom_kv === 161 ? "#a78bfa" : "#c4b5fd")),
          line: { width: 0.7, color: "#1e1b4b" },
        },
        text: buses.map((b) => `<b>Bus ${esc(b.id)}</b> (${b.v_nom_kv} kV)<br>${esc(regLabel(b.region))}${b.nearest_osm_name ? "<br>" + esc(b.nearest_osm_name) : ""}${b.anomaly ? "<br>⚠ " + esc(b.anomaly) : ""}`),
        hoverinfo: "text",
      });
    }

    // LNG terminals & schematic figure-8 gas corridors
    if (state.layers.lng) {
      d.gas_pipelines.forEach((gp, idx) => {
        traces.push({
          type: "scattergeo", mode: "lines",
          lon: gp.points.map((p) => p[0]), lat: gp.points.map((p) => p[1]),
          line: { width: gp.kind === "subsea" ? 2.6 : 2.2, color: gp.kind === "subsea" ? "#059669" : "#10b981", dash: gp.kind === "subsea" ? "dot" : "solid" },
          name: idx === 0 ? pick("Subsea/onshore gas trunks (schematic)", "海陸雙輸氣幹線（示意廊道）") : undefined,
          showlegend: idx === 0,
          text: `${esc(pick(gp.name_en, gp.name_zh))}<br>${esc(pick(gp.status_en, gp.status_zh))}`,
          hoverinfo: "text",
        });
      });
      const terms = d.lng_terminals;
      traces.push({
        type: "scattergeo", mode: "markers+text",
        lon: terms.map((t) => t.lon), lat: terms.map((t) => t.lat),
        text: terms.map((t) => `${t.order}`),
        textposition: "top right",
        textfont: { size: 11, color: "#065f46" },
        hovertext: terms.map((t) => `<b>${esc(pick(t.name_en, t.name_zh))}</b><br>${esc(t.operator)} · ${esc(pick(t.status_en, t.status_zh))}<br>${esc(pick(t.tanks_capacity_en, t.tanks_capacity_zh))}`),
        hoverinfo: "text",
        marker: { size: 11, symbol: "triangle-up", color: "#059669", line: { width: 1.2, color: "#ffffff" } },
        name: pick("7 LNG receiving terminals", "全台 7 座 LNG 接收站"),
      });
    }

    // Coal ports & refineries
    if (state.layers.fuel) {
      const ports = d.fuel_ports_and_stocks.filter((p) => p.category !== "lng_rule");
      traces.push({
        type: "scattergeo", mode: "markers",
        lon: ports.map((p) => p.lon), lat: ports.map((p) => p.lat),
        marker: {
          size: 9,
          symbol: ports.map((p) => (p.category === "refinery" ? "square" : "pentagon")),
          color: ports.map((p) => (p.category === "refinery" ? "#78350f" : "#334155")),
          line: { width: 1, color: "#ffffff" },
        },
        text: ports.map((p) => `<b>${esc(pick(p.name_en, p.name_zh))}</b><br>${esc(pick(p.capacity_en, p.capacity_zh))}<br>${esc(pick(p.stock_rule_en, p.stock_rule_zh))}`),
        hoverinfo: "text",
        name: pick("Coal ports & oil refineries", "卸煤港與煉油廠"),
      });
    }

    const layout = plotLayout({
      margin: { t: 8, r: 8, b: 8, l: 8 },
      legend: { orientation: "h", y: -0.04, x: 0 },
      geo: {
        scope: "asia",
        projection: { type: "mercator" },
        lonaxis: { range: [119.1, 122.4] },
        lataxis: { range: [21.7, 25.55] },
        showland: true,
        landcolor: css("--wash") || "#f1f5f9",
        showocean: true,
        oceancolor: css("--page") || "#ffffff",
        showcoastlines: true,
        coastlinecolor: css("--border") || "#cbd5e1",
        resolution: 50,
        bgcolor: "transparent",
      },
    });
    Plotly.newPlot("map-network", traces, layout, { responsive: true, displayModeBar: true });
    $("map-caption").textContent = pick(
      "Note: Electrical transmission coordinates come from OpenStreetMap & PyPSA-Earth (elec.nc). LNG terminal markers reflect public WGS84 facility locations; gas trunk lines shown are schematic corridor arcs illustrating the figure-8 subsea/onshore topology rather than pipeline CAD alignments.",
      "說明：輸電線與變電所座標取自 OpenStreetMap 與 PyPSA-Earth（elec.nc）。LNG 接收站座標為公開廠址位置；天然氣海陸管線為依起訖樞紐繪製之「8 字型備援廊道示意線」，非實測埋管路徑 CAD 圖資。"
    );
  }

  function renderOfficialStats(d) {
    const off = d.official_grid;
    const osmTierCounts = {};
    for (const s of d.osm.substations) {
      osmTierCounts[s.tier] = (osmTierCounts[s.tier] || 0) + 1;
    }
    const tiers = off.substations_by_class;
    Plotly.newPlot("chart-grid-tiers", [
      {
        type: "bar",
        name: pick("Taipower Official Count", "台電官方變電所數"),
        x: tiers.map((t) => t.tier),
        y: tiers.map((t) => t.count),
        marker: { color: css("--k-1") || "#2563eb" },
      },
      {
        type: "bar",
        name: pick("OSM Classified Features", "OSM 歸類物件數"),
        x: tiers.map((t) => t.tier),
        y: tiers.map((t) => osmTierCounts[t.tier] || 0),
        marker: { color: css("--k-3") || "#0d9488" },
      },
    ], plotLayout({ barmode: "group", yaxis: { title: pick("Substations", "座數"), gridcolor: css("--grid") } }), { responsive: true });

    const cab = off.underground_cable_ckt_km;
    $("table-grid-official").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Tier", "層級")}</th>
          <th>${pick("Voltage (kV)", "電壓")}</th>
          <th class="num">${pick("Official count", "官方座數")}</th>
          <th class="num">${pick("Underground cable (ckt-km)", "輸電地下電纜 (回線公里)")}</th>
          <th>${pick("System role", "電網功能")}</th>
        </tr></thead>
        <tbody>
          ${tiers.map((t) => {
            const vKey = t.tier === "E/S" ? "345" : t.tier === "S/S" ? "69" : t.tier === "P/S" ? "161" : null;
            const km = vKey ? fmtNum(cab[vKey], 1) : pick("incl. above", "併計 161 kV");
            return `<tr><td><strong>${esc(t.tier)}</strong></td><td>${esc(t.voltage_kv)}</td><td class="num">${t.count}</td><td class="num">${km}</td><td>${esc(pick(t.role_en, t.role_zh))}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
    `;

    const hist = d.history;
    Plotly.newPlot("chart-grid-losses", [
      {
        type: "scatter", mode: "lines+markers",
        name: pick("Line loss rate (%)", "線路損失率 (%)"),
        x: hist.map((h) => h.year), y: hist.map((h) => h.line_loss_pct),
        line: { color: "#dc2626", width: 2.5 }, yaxis: "y",
      },
      {
        type: "scatter", mode: "lines+markers",
        name: pick("System load factor (%)", "負載率 (%)"),
        x: hist.map((h) => h.year), y: hist.map((h) => h.load_factor_pct),
        line: { color: "#2563eb", width: 2.2 }, yaxis: "y2",
      },
    ], plotLayout({
      margin: { t: 28, r: 54, b: 44, l: 54 },
      yaxis: { title: pick("Line loss (%)", "線損率 (%)"), rangemode: "tozero", gridcolor: css("--grid") },
      yaxis2: { title: pick("Load factor (%)", "負載率 (%)"), overlaying: "y", side: "right", range: [64, 78] },
    }), { responsive: true });

    const pickYears = new Set([2005, 2010, 2013, 2018, 2022, 2023, 2024, 2025]);
    const rows = hist.filter((h) => pickYears.has(h.year));
    $("table-grid-losses").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Year", "年")}</th>
          <th class="num">${pick("Peak (MW)", "尖峰 (MW)")}</th>
          <th class="num">${pick("Avg (MW)", "平均 (MW)")}</th>
          <th class="num">${pick("Load factor", "負載率")}</th>
          <th class="num">${pick("Line loss", "線損率")}</th>
          <th class="num">${pick("Reserve", "備用率")}</th>
        </tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>
            <td>${r.year}</td>
            <td class="num">${fmtNum(r.peak_load_MW, 0)}</td>
            <td class="num">${fmtNum(r.avg_load_MW, 0)}</td>
            <td class="num">${fmtNum(r.load_factor_pct, 2)}%</td>
            <td class="num">${fmtNum(r.line_loss_pct, 2)}%</td>
            <td class="num">${fmtNum(r.reserve_margin_pct, 2)}%</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderModelSection(d) {
    const cors = d.pypsa.corridors;
    $("corridor-sub").textContent = pick(
      "PyPSA-Earth clusters Taiwan into 6 regions connected by 6 equivalent 380 kV corridors (s_max_pu = 0.7). Notice how nominal clustered MVA compares with both elec.nc cross-region lines and Taipower's real operational transfer margins.",
      "PyPSA-Earth 將台灣整併為六大節點與六條等效 380 kV 聯絡廊道（s_max_pu = 0.7）。下表顯示聚合後容量與未簡化跨區線路、以及台電實際輸電裕度的對照。"
    );
    $("table-corridors").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Corridor", "跨區廊道")}</th>
          <th class="num">s_nom (MVA)</th>
          <th class="num">${pick("Usable 0.7× (MW)", "可用上限 (MW)")}</th>
          <th class="num">${pick("Length (km)", "距離 (km)")}</th>
          <th class="num">${pick("elec_s lines", "elec_s 線段數")}</th>
          <th class="num">${pick("elec.nc border lines", "elec.nc 跨區線數")}</th>
          <th>${pick("elec.nc border kV mix", "跨區線路電壓組成")}</th>
        </tr></thead>
        <tbody>
          ${cors.map((c) => {
            const kvmix = Object.entries(c.elec_nc_crossing_voltages || {}).sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([k, v]) => `${k}kV×${v}`).join(", ") || "—";
            return `<tr>
              <td><strong>${esc(c.bus0)} ↔ ${esc(c.bus1)}</strong><br><small class="muted">${esc(pick(c.name_en, c.name_zh))}</small></td>
              <td class="num">${fmtNum(c.s_nom_MVA, 1)}</td>
              <td class="num">${fmtNum(c.usable_MW, 0)}</td>
              <td class="num">${fmtNum(c.length_km, 1)}</td>
              <td class="num">${c.elec_s_line_count}</td>
              <td class="num">${c.elec_nc_crossing_count} (${fmtNum(c.elec_nc_crossing_sum_s_nom_MVA, 0)} MVA)</td>
              <td>${esc(kvmix)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;

    const osmLen = d.osm.counts.line_length_km_by_vmax_kv;
    const pypsaLines = d.pypsa.lines;
    const pypsaLenByKv = {};
    for (const l of pypsaLines) {
      const k = String(l.v_nom_kv || "unknown");
      pypsaLenByKv[k] = (pypsaLenByKv[k] || 0) + (l.length_km || 0);
    }
    const tiers = ["345", "161", "69"];
    Plotly.newPlot("chart-osm-voltage", [
      {
        type: "bar",
        name: pick("OSM raw route length (km)", "OSM 原始路線長度 (km)"),
        x: tiers.map((k) => `${k} kV`),
        y: tiers.map((k) => Math.round(osmLen[k] || 0)),
        marker: { color: css("--k-2") || "#ea580c" },
      },
      {
        type: "bar",
        name: pick("PyPSA elec.nc route length (km)", "PyPSA elec.nc 路線長度 (km)"),
        x: tiers.map((k) => `${k} kV`),
        y: tiers.map((k) => Math.round(pypsaLenByKv[k] || 0)),
        marker: { color: css("--k-1") || "#2563eb" },
      },
    ], plotLayout({ barmode: "group", yaxis: { title: "km", gridcolor: css("--grid") } }), { responsive: true });

    const ps = d.pypsa.summary;
    const checks = [
      [pick("OSM raw extract", "OSM 原始圖資"), `${fmtNum(d.osm.counts.raw_substations)} substations · ${fmtNum(d.osm.counts.raw_lines)} lines · ${fmtNum(d.osm.counts.raw_cables)} cables`, pick("Downloaded via earth-osm (2026-07-17); multi-circuit tags often missing", "由 earth-osm 擷取，部分缺乏雙迴路／四迴路標記")],
      [pick("PyPSA base network (elec.nc)", "PyPSA 基礎電網 (elec.nc)"), `${ps.elec_buses} buses · ${ps.elec_lines} lines · ${ps.elec_transformers} transformers`, pick(`Voltages: ${Object.entries(ps.elec_bus_v_nom_counts).map(([k, v]) => `${k}kV:${v}`).join(", ")}`, `節點電壓：${Object.entries(ps.elec_bus_v_nom_counts).map(([k, v]) => `${k}kV:${v}`).join("、")}`)],
      [pick("elec.nc graph connectivity", "elec.nc 連通分量分析"), `Lines only: [${ps.connected_components_lines_only.join(", ")}] · +Transformers: [${ps.connected_components_with_transformers.join(", ")}]`, pick("Isolated components include Penghu islands (台澎海纜 mapped separately) & voltage clusters", "分離子圖包含澎湖離岸系統與不同電壓層級島網")],
      [pick("Simplified / 6-region clustered", "簡化與六區整併路網"), `elec_s: ${ps.elec_s_buses} buses / ${ps.elec_s_lines} lines → elec_s_6: ${ps.elec_6_buses} buses / ${ps.elec_6_corridors} corridors`, pick("All voltages scaled to equivalent 380 kV base during simplify/cluster", "simplify_network 將全數線路等效折算至 380 kV 基準")],
      [pick("690 kV anomaly (Bus 91)", "花蓮 690 kV 異常節點 (Bus 91)"), "OSM way/1331526157 (初英分歧線) tags.voltage=690000", pick("Isolated 1-bus 690 kV artifact stepped via artificial 2,000 MVA transf_41_0", "單一 69 kV 分歧線誤標多一個零所致，經虛擬變壓器連接 69 kV 節點 90")],
    ];
    $("table-topology-checks").innerHTML = `
      <table>
        <thead><tr><th>${pick("Stage / Check", "階段／項目")}</th><th>${pick("Metrics", "量化結果")}</th><th>${pick("Detail", "說明")}</th></tr></thead>
        <tbody>${checks.map((c) => `<tr><td><strong>${esc(c[0])}</strong></td><td>${esc(c[1])}</td><td>${esc(c[2])}</td></tr>`).join("")}</tbody>
      </table>
    `;

    // Populate filter dropdowns once
    const regOpts = [...new Set(d.osm.substations.map((s) => s.region).filter(Boolean))].sort();
    $("sub-volt").innerHTML = `<option value="">${pick("All", "全部")}</option>` +
      ["345", "161", "69", "25", "23", "22", "unknown"].map((v) => `<option value="${v}">${v === "unknown" ? pick("Unspecified", "未標註") : `${v} kV`}</option>`).join("");
    const locs = [...new Set(d.osm.substations.map((s) => s.location).filter(Boolean))].sort();
    $("sub-loc").innerHTML = `<option value="">${pick("All", "全部")}</option>` + locs.map((l) => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
    $("sub-reg").innerHTML = `<option value="">${pick("All regions", "全部區域")}</option>` +
      regOpts.map((r) => {
        const regObj = d.regions.find((x) => x.id === r);
        return `<option value="${esc(r)}">${esc(r)} · ${esc(regObj ? pick(regObj.name_en, regObj.name_zh) : r)}</option>`;
      }).join("");

    $("line-volt").innerHTML = `<option value="">${pick("All", "全部")}</option>` +
      ["345", "161", "69", "690", "unknown"].map((v) => `<option value="${v}">${v === "unknown" ? pick("Unspecified", "未標註") : `${v} kV`}</option>`).join("");
    $("line-kind").innerHTML = `
      <option value="">${pick("All", "全部")}</option>
      <option value="overhead">${pick("Overhead line", "架空輸電線")}</option>
      <option value="cable">${pick("Underground cable", "地下電纜")}</option>
      <option value="subsea_cable">${pick("Subsea cable (台澎海纜)", "海底電纜")}</option>
    `;

    renderSubstationTable();
    renderLineTable();
    renderHighResCutsets(d);
  }

  function renderHighResCutsets(d) {
    const hr = d.high_res_analysis;
    if (!hr) return;
    $("cutsets-sub").textContent = pick(
      "Comparing the 3 key latitudinal transmission cutsets across raw OSM circuits (elec.nc), a 12-subregion network (separating Taipei Basin, Taoyuan/Hsinchu, Taichung, Changhua, Tainan & Kaohsiung), and the 6-region sandbox grid. Config overlay: config/scenarios/clusters_12.yaml.",
      "跨區南北輸電瓶頸於三種空間解析度之比較：OSM 原始路網（elec.nc）、12 分區高解析度網路（明確區分大台北、桃竹、中苗、彰投、南科與高雄）及 6 區基準模型；對應設定檔為 config/scenarios/clusters_12.yaml。"
    );
    $("table-cutsets").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Cutset Border", "跨區斷面界線")}</th>
          <th class="num">${pick("OSM elec.nc Total", "OSM 全電路容量")}</th>
          <th class="num">${pick("345 kV Share", "345 kV 主幹線")}</th>
          <th class="num">${pick("12-Node Usable (0.7×)", "12 區可用容量 (0.7×)")}</th>
          <th class="num">${pick("6-Node Usable (0.7×)", "6 區可用容量 (0.7×)")}</th>
          <th>${pick("Operational Bottleneck", "系統運轉與瓶頸說明")}</th>
        </tr></thead>
        <tbody>
          ${hr.cutsets.map((c) => `<tr>
            <td><strong>${esc(pick(c.name_en, c.name_zh))}</strong></td>
            <td class="num">${c.elec_lines} lines · ${fmtNum(c.elec_mva)} MVA</td>
            <td class="num">${c.elec_345_lines} lines · ${fmtNum(c.elec_345_mva)} MVA</td>
            <td class="num"><strong>${fmtNum(c.clusters_12_usable_mw)} MW</strong><br><small class="muted">${c.clusters_12_lines} lines (${fmtNum(c.clusters_12_mva)} MVA)</small></td>
            <td class="num">${fmtNum(c.clusters_6_usable_mw)} MW<br><small class="muted">${c.clusters_6_lines} lines (${fmtNum(c.clusters_6_mva)} MVA)</small></td>
            <td><small>${esc(c.note_en)}</small></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
    $("table-clusters-12").innerHTML = `
      <table>
        <thead><tr>
          <th>#</th>
          <th>${pick("12-Node Subregion (N -> S)", "12 分區名稱（由北至南）")}</th>
          <th class="num">${pick("79-Bus Substations", "含 79 節點變電所數")}</th>
          <th class="num">${pick("Avg Load (MW)", "平均負載 (MW)")}</th>
          <th class="num">${pick("Installed Gen (MW)", "裝置容量 (MW)")}</th>
        </tr></thead>
        <tbody>
          ${hr.clusters_12.map((r) => `<tr>
            <td>${r.rank}</td>
            <td><strong>${esc(pick(r.name_en, r.name_zh))}</strong></td>
            <td class="num">${r.substations}</td>
            <td class="num">${fmtNum(r.avg_load_MW)}</td>
            <td class="num">${fmtNum(r.gen_capacity_MW)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function sortItems(arr, sortSpec) {
    const { key, dir } = sortSpec;
    return [...arr].sort((a, b) => {
      const av = a[key] ?? (typeof a[key] === "number" ? -1 : "");
      const bv = b[key] ?? (typeof b[key] === "number" ? -1 : "");
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  function renderSubstationTable() {
    const d = state.data;
    const q = ($("sub-search").value || "").trim().toLowerCase();
    const fv = $("sub-volt").value;
    const fl = $("sub-loc").value;
    const fr = $("sub-reg").value;

    const filtered = d.osm.substations.filter((s) => {
      if (fv) {
        if (fv === "unknown" && s.v_max_kv !== null) return false;
        if (fv !== "unknown" && String(s.v_max_kv) !== fv && !s.voltages_kv.includes(Number(fv))) return false;
      }
      if (fl && s.location !== fl) return false;
      if (fr && s.region !== fr) return false;
      if (q) {
        const hay = `${s.id} ${s.name_zh} ${s.name_en} ${s.operator} ${s.rating} ${s.tier}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = sortItems(filtered, state.subSort);
    const limit = 250;
    const shown = sorted.slice(0, limit);
    $("sub-count").textContent = pick(
      `Showing ${shown.length} of ${filtered.length} matching substations (${d.osm.substations.length} total). Click column headers to sort.`,
      `顯示 ${shown.length} / ${filtered.length} 筆符合變電所（共 ${d.osm.substations.length} 筆）。點擊欄位標題可排序。`
    );

    const th = (k, label, num = false) =>
      `<th data-sort="${k}" class="${num ? "num" : ""}" tabindex="0">${esc(label)}${state.subSort.key === k ? (state.subSort.dir > 0 ? " ↑" : " ↓") : ""}</th>`;

    $("table-substations").innerHTML = `
      <table>
        <thead><tr>
          ${th("name_zh", pick("Name", "變電所名稱"))}
          ${th("tier", pick("Tier", "層級"))}
          ${th("v_max_kv", pick("Voltage (kV)", "電壓"), true)}
          ${th("rating", pick("Rating", "容量"))}
          ${th("location", pick("Type", "型式"))}
          ${th("region", pick("Model region", "模型分區"))}
          <th>OSM</th>
        </tr></thead>
        <tbody>
          ${shown.map((s) => `<tr>
            <td><strong>${esc(pick(s.name_en, s.name_zh))}</strong>${s.operator ? `<br><small class="muted">${esc(s.operator)}</small>` : ""}</td>
            <td>${esc(s.tier)}</td>
            <td class="num">${s.voltages_kv.length ? s.voltages_kv.join(" / ") : "—"}</td>
            <td>${esc(s.rating || "—")}</td>
            <td>${esc(s.location || s.substation_tag || "—")}</td>
            <td>${esc(s.region)} <small class="muted">${esc(regLabel(s.region))}</small></td>
            <td><a href="${esc(osmUrl(s.osm_type, s.id))}" target="_blank" rel="noopener">${s.osm_type === "node" ? "node" : "way"}/${s.id}</a></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
    $("table-substations").querySelectorAll("th[data-sort]").forEach((el) => {
      const toggle = () => {
        const k = el.dataset.sort;
        state.subSort = { key: k, dir: state.subSort.key === k ? -state.subSort.dir : -1 };
        renderSubstationTable();
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
  }

  function renderLineTable() {
    const d = state.data;
    const q = ($("line-search").value || "").trim().toLowerCase();
    const fv = $("line-volt").value;
    const fk = $("line-kind").value;

    const filtered = d.osm.lines.filter((l) => {
      if (fv) {
        if (fv === "unknown" && l.v_max_kv !== null) return false;
        if (fv !== "unknown" && String(l.v_max_kv) !== fv) return false;
      }
      if (fk && l.kind !== fk) return false;
      if (q) {
        const hay = `${l.id} ${l.name} ${l.operator} ${l.anomaly}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = sortItems(filtered, state.lineSort);
    const limit = 250;
    const shown = sorted.slice(0, limit);
    $("line-count").textContent = pick(
      `Showing ${shown.length} of ${filtered.length} matching lines/cables (${d.osm.lines.length} total). Click column headers to sort.`,
      `顯示 ${shown.length} / ${filtered.length} 筆符合線路／電纜（共 ${d.osm.lines.length} 筆）。點擊欄位標題可排序。`
    );

    const th = (k, label, num = false) =>
      `<th data-sort="${k}" class="${num ? "num" : ""}" tabindex="0">${esc(label)}${state.lineSort.key === k ? (state.lineSort.dir > 0 ? " ↑" : " ↓") : ""}</th>`;

    $("table-lines").innerHTML = `
      <table>
        <thead><tr>
          ${th("name", pick("Circuit / Line name", "線路名稱"))}
          ${th("kind", pick("Kind", "類型"))}
          ${th("v_max_kv", pick("Voltage (kV)", "電壓"), true)}
          ${th("circuits", pick("Circuits", "回線"), true)}
          ${th("length_km", pick("Length (km)", "長度 (km)"), true)}
          ${th("region", pick("Region", "區域"))}
          <th>OSM</th>
        </tr></thead>
        <tbody>
          ${shown.map((l) => `<tr>
            <td><strong>${esc(l.name)}</strong>${l.anomaly ? `<br><small style="color:var(--critical);">⚠ ${esc(l.anomaly)}</small>` : ""}</td>
            <td>${esc(l.kind)}</td>
            <td class="num">${l.voltages_kv.length ? l.voltages_kv.join(" / ") : "—"}</td>
            <td class="num">${l.circuits ?? "—"}</td>
            <td class="num">${fmtNum(l.length_km, 2)}</td>
            <td>${esc(l.region)}</td>
            <td><a href="${esc(osmUrl("way", l.id))}" target="_blank" rel="noopener">way/${l.id}</a></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
    $("table-lines").querySelectorAll("th[data-sort]").forEach((el) => {
      const toggle = () => {
        const k = el.dataset.sort;
        state.lineSort = { key: k, dir: state.lineSort.key === k ? -state.lineSort.dir : -1 };
        renderLineTable();
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
  }

  function renderUpgrades(d) {
    const rp = d.resilience_plan;
    Plotly.newPlot("chart-resilience-budget", [{
      type: "bar",
      x: rp.pillars.map((p) => pick(p.name_en, p.name_zh)),
      y: rp.pillars.map((p) => p.budget_billion_ntd),
      text: rp.pillars.map((p) => `NT$${p.budget_billion_ntd}B`),
      textposition: "outside",
      marker: { color: [css("--k-1") || "#2563eb", css("--k-3") || "#0d9488", css("--k-4") || "#d97706"] },
    }], plotLayout({ yaxis: { title: pick("Billion NT$", "十億元新台幣"), range: [0, 520], gridcolor: css("--grid") } }), { responsive: true });

    const tu = d.bottlenecks_and_upgrades.trunk_upgrades;
    $("table-trunk-upgrades").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("345 kV Trunk Corridor", "345 kV 超高壓主幹線強化")}</th>
          <th class="num">${pick("Before (MW)", "補強前")}</th>
          <th class="num">${pick("After (MW)", "補強後")}</th>
          <th class="num">${pick("Target", "目標年")}</th>
        </tr></thead>
        <tbody>
          ${tu.map((u) => `<tr>
            <td>${esc(pick(u.corridor_en, u.corridor_zh))}</td>
            <td class="num">${fmtNum(u.before_MW)}</td>
            <td class="num">${fmtNum(u.after_MW)}</td>
            <td class="num">${esc(u.target_year)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    const kpis = d.bottlenecks_and_upgrades.renewable_and_storage_kpis;
    $("table-storage-kpis").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Programme / KPI", "計畫與關鍵指標")}</th>
          <th class="num">${pick("Target / Actual", "目標／實績")}</th>
          <th>${pick("Year", "時程")}</th>
          <th>${pick("Notes", "說明")}</th>
        </tr></thead>
        <tbody>
          ${kpis.map((k) => `<tr>
            <td><strong>${esc(pick(k.item_en, k.item_zh))}</strong></td>
            <td class="num">${esc(k.value)}</td>
            <td>${esc(k.timeline)}</td>
            <td>${esc(pick(k.note_en, k.note_zh))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderGasAndFuel(d) {
    $("table-lng-terminals").innerHTML = `
      <table>
        <thead><tr>
          <th>#</th>
          <th>${pick("Terminal", "接收站名稱")}</th>
          <th>${pick("Operator", "單位")}</th>
          <th>${pick("Location", "地點")}</th>
          <th>${pick("Tanks & capacity", "儲槽與容量配置")}</th>
          <th>${pick("Subsea / onshore links", "海管與陸管聯結")}</th>
          <th>${pick("Status", "現況")}</th>
        </tr></thead>
        <tbody>
          ${d.lng_terminals.map((t) => `<tr>
            <td><strong>${t.order}</strong></td>
            <td><strong>${esc(pick(t.name_en, t.name_zh))}</strong></td>
            <td>${esc(t.operator)}</td>
            <td>${esc(pick(t.location_en, t.location_zh))}</td>
            <td>${esc(pick(t.tanks_capacity_en, t.tanks_capacity_zh))}</td>
            <td>${esc(pick(t.pipelines_en, t.pipelines_zh))}</td>
            <td>${esc(pick(t.status_en, t.status_zh))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    $("table-gas-pipelines").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Corridor", "輸氣幹道")}</th>
          <th>${pick("Type", "型式")}</th>
          <th>${pick("Status & Role", "狀態與功能")}</th>
        </tr></thead>
        <tbody>
          ${d.gas_pipelines.map((g) => `<tr>
            <td><strong>${esc(pick(g.name_en, g.name_zh))}</strong></td>
            <td>${esc(g.kind)}</td>
            <td>${esc(pick(g.status_en, g.status_zh))}<br><small class="muted">${esc(pick(g.role_en, g.role_zh))}</small></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    $("table-fuel-stocks").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Facility / Rule", "港埠／煉油廠／法規")}</th>
          <th>${pick("Capacity / Requirement", "規模／天數規定")}</th>
          <th>${pick("Role / Stockpile", "備註與安全存量")}</th>
        </tr></thead>
        <tbody>
          ${d.fuel_ports_and_stocks.map((f) => `<tr>
            <td><strong>${esc(pick(f.name_en, f.name_zh))}</strong></td>
            <td>${esc(pick(f.capacity_en, f.capacity_zh))}</td>
            <td>${esc(pick(f.stock_rule_en, f.stock_rule_zh))}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    const lb = d.regional_lng_blockade || [];
    if (lb.length) {
      $("table-lng-blockade").innerHTML = `
        <table>
          <thead><tr>
            <th>${pick("Disruption Scenario (30-day Summer, 50% Imports)", "破壞情境（夏季 30 天封鎖、進口減半）")}</th>
            <th class="num">${pick("Unserved Energy", "缺電／限電量")}</th>
            <th class="num">${pick("Total Gas Gen", "全國燃氣發電")}</th>
            <th class="num">${pick("North Gas Gen", "北部燃氣發電")}</th>
            <th class="num">${pick("System Cost (bn €)", "30 天總成本")}</th>
            <th>${pick("End LNG Stock by Terminal", "期末分區儲槽存量比")}</th>
          </tr></thead>
          <tbody>
            ${lb.map((r) => {
              const stStr = r.stock_remaining_pct.national !== undefined
                ? `${pick("National", "全國均池")}: ${r.stock_remaining_pct.national}%`
                : `S:${r.stock_remaining_pct.south ?? "—"}% · C:${r.stock_remaining_pct.central ?? "—"}% · N:${r.stock_remaining_pct.north ?? "—"}%`;
              return `<tr>
                <td><strong>${esc(pick(r.name_en, r.name_zh))}</strong><br><small class="muted"><code>${esc(r.hash)}</code></small></td>
                <td class="num"><strong>${fmtNum(r.unserved_GWh, 1)} GWh</strong></td>
                <td class="num">${fmtNum(r.gas_gen_GWh, 0)} GWh</td>
                <td class="num">${fmtNum(r.north_gas_gen_GWh, 0)} GWh</td>
                <td class="num">${fmtNum(r.objective_bn_eur, 3)}</td>
                <td><small>${esc(stStr)}</small></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      `;
    }
  }

  function renderSources(d) {
    $("sources-legend").textContent = pick(
      "Downloaded: official PDF or CSV read directly. To verify: public report figure taken from search summary and awaiting direct page confirmation. Model input/output: PyPSA-Earth OSM/NetCDF artifacts.",
      "已下載實查：已下載並讀取官方報告或統計 CSV。待查證：取自公開搜尋結果摘要，待確認原始頁面 URL。模型輸入／輸出：取自 PyPSA-Earth 路網檔案。"
    );
    $("list-sources").innerHTML = d.sources.map((s) => {
      const title = pick(s.title_en || s.short_cite, s.title_zh || s.short_cite);
      const link = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(title)}</a>` : esc(title);
      return `<li><strong>${esc(s.short_cite)}</strong> — ${link} (${esc(s.publisher)}) ${evidenceChip(s.evidence)}<br><small class="muted">${esc(s.note)}</small></li>`;
    }).join("");
  }

  function renderAll() {
    if (!state.data) return;
    renderAlerts(state.data);
    renderTiles(state.data);
    renderMapControls();
    renderMap(state.data);
    renderOfficialStats(state.data);
    renderModelSection(state.data);
    renderUpgrades(state.data);
    renderGasAndFuel(state.data);
    renderSources(state.data);
  }

  function wireEvents() {
    ["sub-search", "sub-volt", "sub-loc", "sub-reg"].forEach((id) => {
      $(id).addEventListener("input", renderSubstationTable);
      $(id).addEventListener("change", renderSubstationTable);
    });
    ["line-search", "line-volt", "line-kind"].forEach((id) => {
      $(id).addEventListener("input", renderLineTable);
      $(id).addEventListener("change", renderLineTable);
    });
    new MutationObserver(() => renderAll()).observe(document.documentElement, {
      attributes: true, attributeFilter: ["lang", "data-theme"],
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (!document.documentElement.dataset.theme) renderAll();
    });
  }

  async function init() {
    try {
      const res = await fetch("data/grid_data.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
      wireEvents();
      renderAll();
    } catch (err) {
      $("grid-alerts").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${pick("Failed to load docs/data/grid_data.json", "無法載入 docs/data/grid_data.json")}: ${esc(err.message)}</span></div>`;
    }
  }

  init();
})();
