/* Taiwan Weather & Renewable Energy Potential page.
   Reads docs/data/weather_re_data.json exported by viewer/export_weather_re_data.py. */

(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const isZh = () => (document.documentElement.lang || "").toLowerCase().startsWith("zh");
  const pick = (en, zh) => (isZh() ? zh : en);
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (n, d = 1) => (n === null || n === undefined || Number.isNaN(Number(n))
    ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }));

  const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const MONTHS_ZH = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const WEATHER_VARS = [
    { key: "wnd_ann", unit: "m/s", cs: "YlGnBu", en: "100 m wind speed (annual mean)", zh: "100 公尺年平均風速 (m/s)" },
    { key: "wnd_win", unit: "m/s", cs: "Blues", en: "100 m wind speed — Winter NE monsoon (Nov–Feb)", zh: "100 公尺冬季東北季風風速 (11–2月)" },
    { key: "wnd_sum", unit: "m/s", cs: "YlOrRd", en: "100 m wind speed — Summer SW monsoon (Jun–Sep)", zh: "100 公尺夏季西南季風風速 (6–9月)" },
    { key: "ghi_kwh", unit: "kWh/m²/yr", cs: "Hot", en: "Solar GHI (annual irradiance)", zh: "年全天空水平日射量 GHI (kWh/m²/年)" },
    { key: "temp_c", unit: "°C", cs: "RdBu", rev: true, en: "2 m air temperature (annual mean)", zh: "2 公尺年平均氣溫 (°C)" },
    { key: "runoff_mm", unit: "mm/yr", cs: "Tealgrn", en: "Surface runoff (annual total)", zh: "年累積地表逕流 (mm/年)" },
  ];

  const state = {
    data: null,
    year: "2013",
    weatherVar: "wnd_ann",
    roseSite: "strait",
    carrier: "offwind-float",
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
      margin: { t: 26, r: 18, b: 44, l: 52 },
      legend: { orientation: "h", y: -0.2, x: 0 },
      ...extra,
    };
  }

  function regionOutlines(d) {
    const rlons = [];
    const rlats = [];
    for (const reg of d.regions || []) {
      for (const ring of reg.rings || []) {
        for (const [x, y] of ring) { rlons.push(x); rlats.push(y); }
        rlons.push(null); rlats.push(null);
      }
    }
    return {
      type: "scattergeo", mode: "lines", lon: rlons, lat: rlats,
      line: { width: 1.1, color: css("--ink-2") || "#64748b" },
      showlegend: false, hoverinfo: "skip",
    };
  }

  function renderAlerts(d) {
    const s13 = d.cutouts["2013"].summary;
    const s18 = d.cutouts["2018"].summary;
    const comp13 = d.variability["2013"].complementarity.solar_vs_offwind_dc || d.variability["2013"].complementarity["solar_vs_offwind-dc"];
    $("wr-alerts").innerHTML = `
      <div class="status note">
        <span class="icon" aria-hidden="true">i</span>
        <span>${pick(
          `<strong>2013 vs. 2018 weather contrast (ERA5 Taiwan box):</strong> 2013 had stronger wind (<strong>${fmt(s13.wnd100m_mean_ms, 2)} m/s</strong> vs. <strong>${fmt(s18.wnd100m_mean_ms, 2)} m/s</strong> in 2018) and more runoff (<strong>${fmt(s13.runoff_mm_yr, 0)}</strong> vs. <strong>${fmt(s18.runoff_mm_yr, 0)} mm/yr</strong>), while 2018 was sunnier (<strong>${fmt(s18.ghi_kwh_m2_yr, 0)}</strong> vs. <strong>${fmt(s13.ghi_kwh_m2_yr, 0)} kWh/m²/yr</strong>). Strong seasonal complementarity (monthly solar vs. offshore wind correlation r = <strong>${comp13 ? fmt(comp13.monthly_r, 2) : "—"}</strong>) pairs winter NE monsoon wind with summer midday solar.`,
          `<strong>2013 與 2018 氣象年對比（ERA5 台灣區域）：</strong>2013 年風速較強（平均 <strong>${fmt(s13.wnd100m_mean_ms, 2)} m/s</strong> vs. 2018 年 <strong>${fmt(s18.wnd100m_mean_ms, 2)} m/s</strong>）且地表逕流較高（<strong>${fmt(s13.runoff_mm_yr, 0)}</strong> vs. <strong>${fmt(s18.runoff_mm_yr, 0)} mm/年</strong>），而 2018 年日照較強（<strong>${fmt(s18.ghi_kwh_m2_yr, 0)}</strong> vs. <strong>${fmt(s13.ghi_kwh_m2_yr, 0)} kWh/m²/年</strong>）。台灣冬季東北季風與夏季強日照具顯著互補性（逐月風光相關係數 r = <strong>${comp13 ? fmt(comp13.monthly_r, 2) : "—"}</strong>）。`
        )}</span>
      </div>
      <div class="status warning">
        <span class="icon" aria-hidden="true">!</span>
        <span>${pick(
          `<strong>Spatial resolution caveat:</strong> ERA5 reanalysis sits on a <code>0.3° × 0.3°</code> (~30 km) grid, which smooths Taiwan's steep Central Mountain Range (~3,952 m peak vs. 1,846 m grid max) and local urban rooftop shading. Onshore wind and solar potentials therefore represent macro-scale land/EEZ envelopes rather than site-level bankable yields.`,
          `<strong>空間解析度限制：</strong>ERA5 再分析網格解析度為 <code>0.3° × 0.3°</code>（約 30 公里），會平滑化中央山脈陡峭地形（網格最高海拔 1,846 m）與都市屋頂遮蔭效應，因此陸域風光潛力代表宏觀空間上限，非單一案場實測發電量。`
        )}</span>
      </div>
    `;
  }

  function renderTiles(d) {
    const s = d.cutouts[state.year].summary;
    const byC = Object.fromEntries(d.potential.map((c) => [c.carrier, c]));
    const fixedGw = (byC["offwind-ac"]?.total_GW || 0) + (byC["offwind-dc"]?.total_GW || 0);
    const fixedTwh = (byC["offwind-ac"]?.potential_TWh_2013 || 0) + (byC["offwind-dc"]?.potential_TWh_2013 || 0);
    const fl = byC["offwind-float"] || {};
    const sol = byC.solar || {};
    const tiles = [
      {
        lbl: pick(`100 m mean wind (${state.year})`, `100 公尺平均風速 (${state.year})`),
        val: `${fmt(s.wnd100m_mean_ms, 2)} <span class="unit">m/s</span>`,
        note: pick(`Winter ${fmt(s.wnd100m_winter_ms, 2)} · Summer ${fmt(s.wnd100m_summer_ms, 2)} m/s`, `冬季 ${fmt(s.wnd100m_winter_ms, 2)} · 夏季 ${fmt(s.wnd100m_summer_ms, 2)} m/s`),
      },
      {
        lbl: pick(`Solar GHI (${state.year})`, `年水平日射量 (${state.year})`),
        val: `${fmt(s.ghi_kwh_m2_yr, 0)} <span class="unit">kWh/m²</span>`,
        note: pick(`${fmt(s.ghi_mean_wm2, 1)} W/m² · Direct share ${fmt(s.direct_share * 100, 1)}%`, `${fmt(s.ghi_mean_wm2, 1)} W/m² · 直射佔比 ${fmt(s.direct_share * 100, 1)}%`),
      },
      {
        lbl: pick("Solar PV model potential", "模型太陽光電潛力"),
        val: `${fmt(sol.total_GW, 1)} <span class="unit">GW</span>`,
        note: pick(`${fmt(sol.potential_TWh_2013, 1)} TWh/yr (CF ${fmt((sol.cf_2013 || 0) * 100, 1)}%)`, `${fmt(sol.potential_TWh_2013, 1)} TWh/年（CF ${fmt((sol.cf_2013 || 0) * 100, 1)}%）`),
      },
      {
        lbl: pick("Fixed offshore wind (<=50 m)", "固定式離岸風電 (<=50 m)"),
        val: `${fmt(fixedGw, 1)} <span class="unit">GW</span>`,
        note: pick(`${fmt(fixedTwh, 0)} TWh/yr (AC 12.4 + DC 37.9 GW)`, `${fmt(fixedTwh, 0)} TWh/年（AC 12.4 + DC 37.9 GW）`),
      },
      {
        lbl: pick("Floating offshore (50–1,000 m)", "浮動式離岸風電 (50–1,000 m)"),
        val: `${fmt(fl.total_GW, 1)} <span class="unit">GW</span>`,
        note: pick(`${fmt(fl.potential_TWh_2013, 0)} TWh/yr (CF ${fmt((fl.cf_2013 || 0) * 100, 1)}%)`, `${fmt(fl.potential_TWh_2013, 0)} TWh/年（CF ${fmt((fl.cf_2013 || 0) * 100, 1)}%）`),
      },
      {
        lbl: pick(`High-wind >=25 m/s (${state.year})`, `颱風級強風 >=25 m/s (${state.year})`),
        val: `${fmt(s.high_wind_25ms_hours, 0)} <span class="unit">${pick("h/yr", "小時")}</span>`,
        note: pick(`Peak ${fmt(s.peak_wind_ms, 1)} m/s (${s.peak_wind_time_utc} UTC)`, `最高陣風 ${fmt(s.peak_wind_ms, 1)} m/s (${s.peak_wind_time_utc} UTC)`),
      },
    ];
    $("wr-tiles").innerHTML = tiles.map((t) => `
      <div class="tile">
        <div class="label">${esc(t.lbl)}</div>
        <div class="value">${t.val}</div>
        <div class="note">${esc(t.note)}</div>
      </div>
    `).join("");
  }

  function populateSelectors(d) {
    $("wr-var").innerHTML = WEATHER_VARS.map((v) =>
      `<option value="${v.key}" ${v.key === state.weatherVar ? "selected" : ""}>${esc(pick(v.en, v.zh))}</option>`
    ).join("");
    const roses = d.cutouts[state.year].wind_roses;
    $("wr-rose-site").innerHTML = roses.map((r) =>
      `<option value="${r.id}" ${r.id === state.roseSite ? "selected" : ""}>${esc(pick(r.name_en, r.name_zh))}</option>`
    ).join("");
    $("wr-carrier").innerHTML = d.potential.map((c) =>
      `<option value="${c.carrier}" ${c.carrier === state.carrier ? "selected" : ""}>${esc(pick(c.name_en, c.name_zh))}</option>`
    ).join("");
  }

  function renderWeatherMaps(d) {
    const cut = d.cutouts[state.year];
    const vmeta = WEATHER_VARS.find((x) => x.key === state.weatherVar) || WEATHER_VARS[0];
    $("wr-map-title").textContent = `${pick(vmeta.en, vmeta.zh)} (${state.year})`;
    $("wr-map-sub").textContent = pick(
      `0.3° ERA5 grid across Taiwan and adjacent seas (118.5–123.0°E, 21.0–26.0°N). Hover cells for exact wind, irradiance, temperature, runoff and elevation.`,
      `ERA5 0.3° 氣象網格（涵蓋台灣本島、海峽與周邊海域）。移動滑鼠至網格可檢視風速、日射量、氣溫、逕流與海拔。`
    );

    const cells = cut.grid;
    const vals = cells.map((c) => c[vmeta.key]);
    const trace = {
      type: "scattergeo", mode: "markers",
      lon: cells.map((c) => c.lon), lat: cells.map((c) => c.lat),
      marker: {
        size: 13, symbol: "square", opacity: 0.85,
        color: vals, colorscale: vmeta.cs, reversescale: !!vmeta.rev,
        colorbar: { title: { text: vmeta.unit, font: { size: 11 } }, thickness: 12, len: 0.75 },
      },
      text: cells.map((c) =>
        `<b>${c.lat}°N, ${c.lon}°E</b> (elev ${c.height_m} m)<br>` +
        `${pick("Wind 100m (ann/win/sum)", "100m風速 (年/冬/夏)")}: <b>${c.wnd_ann}</b> / ${c.wnd_win} / ${c.wnd_sum} m/s<br>` +
        `GHI: <b>${c.ghi_kwh}</b> kWh/m²/yr (${Math.round(c.dir_share * 100)}% dir)<br>` +
        `${pick("Temp", "氣溫")}: ${c.temp_c} °C · ${pick("Runoff", "逕流")}: ${c.runoff_mm} mm/yr`
      ),
      hoverinfo: "text", showlegend: false,
    };

    Plotly.newPlot("chart-weather-map", [trace, regionOutlines(d)], plotLayout({
      margin: { t: 6, r: 6, b: 6, l: 6 },
      geo: {
        scope: "asia", projection: { type: "mercator" },
        lonaxis: { range: [118.4, 123.1] }, lataxis: { range: [20.9, 26.1] },
        showland: true, landcolor: css("--wash") || "#f1f5f9",
        showocean: true, oceancolor: css("--page") || "#ffffff",
        showcoastlines: true, coastlinecolor: css("--border") || "#94a3b8",
        resolution: 50, bgcolor: "transparent",
      },
    }), { responsive: true });

    // Wind rose (barpolar)
    const rose = cut.wind_roses.find((r) => r.id === state.roseSite) || cut.wind_roses[0];
    Plotly.newPlot("chart-wind-rose", [{
      type: "barpolar",
      theta: rose.sectors,
      r: rose.freq_pct,
      marker: {
        color: rose.mean_spd_ms,
        colorscale: "YlGnBu",
        colorbar: { title: { text: "m/s", font: { size: 10 } }, thickness: 10, len: 0.8 },
      },
      text: rose.sectors.map((s, i) => `${s}: ${rose.freq_pct[i]}% · ${rose.mean_spd_ms[i]} m/s`),
      hoverinfo: "text",
    }], plotLayout({
      margin: { t: 28, r: 30, b: 18, l: 30 },
      title: {
        text: `${pick(rose.name_en, rose.name_zh)} — ${pick("mean", "均速")} ${rose.mean_ms} m/s (P90: ${rose.p90_ms} m/s)`,
        font: { size: 12 },
      },
      polar: {
        bgcolor: "transparent",
        angularaxis: { direction: "clockwise", rotation: 90, gridcolor: css("--grid") },
        radialaxis: { ticksuffix: "%", gridcolor: css("--grid"), angle: 45 },
      },
    }), { responsive: true });

    // Monthly climate dual axis
    const months = isZh() ? MONTHS_ZH : MONTHS_EN;
    const mc = cut.monthly;
    Plotly.newPlot("chart-monthly-climate", [
      {
        type: "scatter", mode: "lines+markers",
        name: pick("Wind 100 m (m/s)", "100m 風速 (m/s)"),
        x: months, y: mc.map((m) => m.wnd100m_ms),
        line: { color: "#2563eb", width: 2.3 }, yaxis: "y",
      },
      {
        type: "scatter", mode: "lines+markers",
        name: pick("Solar GHI (W/m²)", "太陽日射量 (W/m²)"),
        x: months, y: mc.map((m) => m.ghi_wm2),
        line: { color: "#ea580c", width: 2.3 }, yaxis: "y2",
      },
    ], plotLayout({
      margin: { t: 14, r: 48, b: 36, l: 46 },
      yaxis: { title: "m/s", gridcolor: css("--grid") },
      yaxis2: { title: "W/m²", overlaying: "y", side: "right" },
    }), { responsive: true });
  }

  function renderVariability(d) {
    const months = isZh() ? MONTHS_ZH : MONTHS_EN;
    const v13 = d.variability["2013"];
    const v18 = d.variability["2018"];
    const styles = [
      ["solar", "#ea580c", pick("Solar PV", "太陽光電")],
      ["onwind", "#16a34a", pick("Onshore wind", "陸域風電")],
      ["offwind-ac", "#0284c7", pick("Offshore AC", "離岸風電 AC")],
      ["offwind-dc", "#1d4ed8", pick("Offshore DC", "離岸風電 DC")],
      ["offwind-float", "#7c3aed", pick("Floating offshore (2013)", "浮動離岸風電 (2013)")],
    ];
    const traces = [];
    for (const [k, color, lbl] of styles) {
      if (v13.monthly_cf[k]) {
        traces.push({
          type: "scatter", mode: "lines+markers", name: `${lbl} (2013)`,
          x: months, y: v13.monthly_cf[k].map((x) => +(x * 100).toFixed(1)),
          line: { color, width: 2.2 },
        });
      }
      if (v18.monthly_cf[k]) {
        traces.push({
          type: "scatter", mode: "lines", name: `${lbl} (2018)`,
          x: months, y: v18.monthly_cf[k].map((x) => +(x * 100).toFixed(1)),
          line: { color, width: 1.6, dash: "dot" }, showlegend: false,
        });
      }
    }
    Plotly.newPlot("chart-monthly-cf", traces, plotLayout({
      yaxis: { title: pick("Capacity factor (%)", "容量因數 (%)"), rangemode: "tozero", gridcolor: css("--grid") },
    }), { responsive: true });

    // Complementarity correlation table
    const pairs = [
      ["solar_vs_offwind-dc", pick("Solar vs. Offshore Wind DC", "光電 vs. 離岸風電 DC")],
      ["solar_vs_offwind-ac", pick("Solar vs. Offshore Wind AC", "光電 vs. 離岸風電 AC")],
      ["solar_vs_onwind", pick("Solar vs. Onshore Wind", "光電 vs. 陸域風電")],
    ];
    $("table-complementarity").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Solar–Wind Complementarity", "風光互補配對")}</th>
          <th class="num">${pick("Monthly r (2013)", "逐月相關 (2013)")}</th>
          <th class="num">${pick("Monthly r (2018)", "逐月相關 (2018)")}</th>
          <th class="num">${pick("Hourly r (2013)", "逐時相關 (2013)")}</th>
        </tr></thead>
        <tbody>
          ${pairs.map(([k, lbl]) => {
            const c13 = v13.complementarity[k] || {};
            const c18 = v18.complementarity[k] || {};
            return `<tr><td><strong>${esc(lbl)}</strong></td><td class="num">${fmt(c13.monthly_r, 3)}</td><td class="num">${fmt(c18.monthly_r, 3)}</td><td class="num">${fmt(c13.hourly_r, 3)}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
    `;

    // Diurnal profile (UTC+8)
    const vcur = d.variability[state.year];
    const hrs = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    Plotly.newPlot("chart-diurnal", [
      { type: "scatter", mode: "lines", name: pick("Solar (Summer)", "光電（夏月）"), x: hrs, y: (vcur.diurnal_tw_local.summer.solar || []).map((x) => +(x * 100).toFixed(1)), line: { color: "#ea580c", width: 2.5 } },
      { type: "scatter", mode: "lines", name: pick("Solar (Winter)", "光電（冬月）"), x: hrs, y: (vcur.diurnal_tw_local.winter.solar || []).map((x) => +(x * 100).toFixed(1)), line: { color: "#fb923c", width: 2, dash: "dash" } },
      { type: "scatter", mode: "lines", name: pick("Offshore DC (Winter)", "離岸 DC（冬月）"), x: hrs, y: (vcur.diurnal_tw_local["winter"]["offwind-dc"] || []).map((x) => +(x * 100).toFixed(1)), line: { color: "#1d4ed8", width: 2.5 } },
      { type: "scatter", mode: "lines", name: pick("Offshore DC (Summer)", "離岸 DC（夏月）"), x: hrs, y: (vcur.diurnal_tw_local["summer"]["offwind-dc"] || []).map((x) => +(x * 100).toFixed(1)), line: { color: "#60a5fa", width: 2, dash: "dash" } },
    ], plotLayout({
      yaxis: { title: "CF (%)", rangemode: "tozero", gridcolor: css("--grid") },
      xaxis: { dtick: 3 },
    }), { responsive: true });

    // Hydro inflow (2013 vs 2018)
    Plotly.newPlot("chart-hydro-inflow", [
      { type: "bar", name: "2013", x: months, y: v13.hydro_monthly_gwh, marker: { color: "#0891b2" } },
      { type: "bar", name: "2018", x: months, y: v18.hydro_monthly_gwh, marker: { color: "#67e8f9" } },
    ], plotLayout({
      barmode: "group", margin: { t: 10, r: 14, b: 34, l: 48 },
      yaxis: { title: "GWh", gridcolor: css("--grid") },
    }), { responsive: true });
  }

  function renderExtremes(d) {
    const s13 = d.cutouts["2013"].summary;
    const s18 = d.cutouts["2018"].summary;
    $("wr-extremes-sub").textContent = pick(
      `Combined 50/50 solar + offshore DC rolling minimum windows (Dunkelflaute) in 2013 and 2018, plus hours when ERA5 100 m wind speed hits >=25 m/s (turbine cut-out threshold): ${s13.high_wind_25ms_hours} h in 2013 (peak ${s13.peak_wind_ms} m/s on ${s13.peak_wind_time_utc} UTC) vs. ${s18.high_wind_25ms_hours} h in 2018 (peak ${s18.peak_wind_ms} m/s on ${s18.peak_wind_time_utc} UTC).`,
      `以 50% 太陽光電 + 50% 離岸風電 DC 滑動平均找出 2013 與 2018 年最嚴峻無風無光期（Dunkelflaute），並統計 ERA5 100 公尺風速達 >=25 m/s（風機切出門檻）時數：2013 年 ${s13.high_wind_25ms_hours} 小時（最高 ${s13.peak_wind_ms} m/s，${s13.peak_wind_time_utc} UTC）、2018 年 ${s18.high_wind_25ms_hours} 小時（最高 ${s18.peak_wind_ms} m/s，${s18.peak_wind_time_utc} UTC）。`
    );
    const rows = [
      ...d.variability["2013"].extremes.map((e) => ({ year: 2013, ...e })),
      ...d.variability["2018"].extremes.map((e) => ({ year: 2018, ...e })),
    ];
    $("table-extremes").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Year", "年份")}</th>
          <th>${pick("Window", "極端時段")}</th>
          <th>${pick("Period (UTC)", "發生時間 (UTC)")}</th>
          <th class="num">${pick("Solar CF", "光電 CF")}</th>
          <th class="num">${pick("Offshore DC CF", "離岸 DC CF")}</th>
          <th class="num">${pick("Offshore AC CF", "離岸 AC CF")}</th>
          <th class="num">${pick("50/50 Combined CF", "風光綜合 CF")}</th>
        </tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>
            <td><strong>${r.year}</strong></td>
            <td>${esc(pick(r.label_en, r.label_zh))}</td>
            <td><code>${esc(r.start_utc)}</code> → <code>${esc(r.end_utc)}</code></td>
            <td class="num">${fmt(r.solar_cf * 100, 1)}%</td>
            <td class="num">${fmt(r.offwind_dc_cf * 100, 1)}%</td>
            <td class="num">${r.offwind_ac_cf !== null ? fmt(r.offwind_ac_cf * 100, 1) + "%" : "—"}</td>
            <td class="num"><strong>${fmt(r.combined_50_50_cf * 100, 1)}%</strong></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderPotential(d) {
    const c = d.potential.find((x) => x.carrier === state.carrier) || d.potential[0];
    $("wr-pot-map-title").textContent = `${pick(c.name_en, c.name_zh)} — ${fmt(c.total_GW, 2)} GW (${fmt(c.potential_TWh_2013, 1)} TWh/yr)`;
    $("wr-pot-map-sub").textContent = pick(
      `Eligible 0.3° grid cells (${c.cells.length} cells >1 MW). Weighted mean CF: ${fmt((c.cf_2013 || 0) * 100, 1)}% (2013)${c.cf_2018 ? ` / ${fmt(c.cf_2018 * 100, 1)}% (2018)` : ""}${c.avg_distance_km ? ` · Avg grid/shore distance ${c.avg_distance_km} km` : ""}.`,
      `可用 0.3° 網格分布（共 ${c.cells.length} 個 >1 MW 網格）。加權平均容量因數：2013 年 ${fmt((c.cf_2013 || 0) * 100, 1)}%${c.cf_2018 ? ` ／ 2018 年 ${fmt(c.cf_2018 * 100, 1)}%` : ""}${c.avg_distance_km ? ` · 平均連線距離 ${c.avg_distance_km} km` : ""}。`
    );

    const trace = {
      type: "scattergeo", mode: "markers",
      lon: c.cells.map((x) => x[0]), lat: c.cells.map((x) => x[1]),
      marker: {
        size: c.cells.map((x) => Math.max(6, Math.min(20, Math.sqrt(x[2]) * 0.25))),
        color: c.cells.map((x) => x[2]),
        colorscale: "Viridis", opacity: 0.85,
        colorbar: { title: { text: "MW", font: { size: 11 } }, thickness: 12, len: 0.75 },
      },
      text: c.cells.map((x) => `<b>${x[1]}°N, ${x[0]}°E</b><br>${pick("Eligible potential", "可用技術潛力")}: <b>${fmt(x[2], 0)} MW</b>`),
      hoverinfo: "text", showlegend: false,
    };
    Plotly.newPlot("chart-potential-map", [trace, regionOutlines(d)], plotLayout({
      margin: { t: 6, r: 6, b: 6, l: 6 },
      geo: {
        scope: "asia", projection: { type: "mercator" },
        lonaxis: { range: [118.4, 123.1] }, lataxis: { range: [20.9, 26.1] },
        showland: true, landcolor: css("--wash") || "#f1f5f9",
        showocean: true, oceancolor: css("--page") || "#ffffff",
        showcoastlines: true, coastlinecolor: css("--border") || "#94a3b8",
        resolution: 50, bgcolor: "transparent",
      },
    }), { responsive: true });

    $("table-potential-regions").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Model region", "模型分區")}</th>
          <th class="num">${pick("Potential (GW)", "潛力 (GW)")}</th>
          <th class="num">${pick("Existing (GW)", "既有 (GW)")}</th>
          <th class="num">CF 2013</th>
          <th class="num">CF 2018</th>
          <th class="num">${pick("Output (TWh/yr)", "年發電潛力 (TWh)")}</th>
        </tr></thead>
        <tbody>
          ${c.regions.map((r) => `<tr>
            <td><strong>${esc(r.region)}</strong> <small class="muted">${esc(pick(r.name_en, r.name_zh))}</small></td>
            <td class="num">${fmt(r.p_nom_max_GW, 2)}</td>
            <td class="num">${fmt(r.existing_GW, 2)}</td>
            <td class="num">${r.cf_2013 !== null ? fmt(r.cf_2013 * 100, 1) + "%" : "—"}</td>
            <td class="num">${r.cf_2018 !== null ? fmt(r.cf_2018 * 100, 1) + "%" : "—"}</td>
            <td class="num">${fmt(r.potential_TWh_2013, 1)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    Plotly.newPlot("chart-potential-bars", [{
      type: "bar",
      x: d.potential.map((p) => p.carrier),
      y: d.potential.map((p) => p.potential_TWh_2013),
      text: d.potential.map((p) => `${fmt(p.total_GW, 1)} GW`),
      textposition: "outside",
      marker: { color: ["#ea580c", "#16a34a", "#0284c7", "#1d4ed8", "#7c3aed"] },
    }], plotLayout({
      margin: { t: 22, r: 12, b: 36, l: 50 },
      yaxis: { title: "TWh/yr (2013)", gridcolor: css("--grid") },
    }), { responsive: true });
  }

  function renderExclusions(d) {
    $("table-exclusions").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Carrier", "技術類別")}</th>
          <th>${pick("Turbine / Panel", "機組／模組型號")}</th>
          <th class="num">${pick("Density", "容量密度")}</th>
          <th>${pick("Depth / Shore / Buffer", "水深／離岸／緩衝距離")}</th>
          <th>${pick("WDPA / Factor", "保護區／修正係數")}</th>
          <th>${pick("Allowed Copernicus LC100 Classes", "允許之 Copernicus 地覆類別")}</th>
        </tr></thead>
        <tbody>
          ${d.potential.map((c) => {
            const e = c.exclusions;
            const depth = e.min_depth_m != null || e.max_depth_m != null ? `${e.min_depth_m ?? 0}–${e.max_depth_m ?? "∞"} m` : "";
            const shore = e.min_shore_km != null ? `>=${e.min_shore_km} km` : e.max_shore_km != null ? `<=${e.max_shore_km} km` : "";
            const buf = e.urban_buffer_m ? `${e.urban_buffer_m} m urban buffer` : "";
            const geoStr = [depth, shore, buf].filter(Boolean).join(" · ") || "—";
            const codes = e.copernicus_codes.map((x) => `${x.code} (${pick(x.en, x.zh)})`).join(", ");
            return `<tr>
              <td><strong>${esc(pick(c.name_en, c.name_zh))}</strong></td>
              <td><code>${esc(e.model)}</code>${e.orientation ? `<br><small class="muted">${esc(e.orientation)}</small>` : ""}</td>
              <td class="num">${e.capacity_per_sqkm} MW/km²</td>
              <td>${esc(geoStr)}</td>
              <td>${e.natura_excluded ? pick("WDPA excluded", "排除 WDPA 保護區") : "—"}<br><small class="muted">× ${e.correction_factor}</small></td>
              <td><small>${esc(codes)}</small></td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  function renderTaiwanLocal(d) {
    const tl = d.taiwan_local;
    if (!tl) return;
    const emp = tl.empirical_cf_2016_2025 || [];
    const yrs = emp.map((r) => r.year);
    Plotly.newPlot("chart-tw-empirical-cf", [
      { type: "scatter", mode: "lines+markers", name: pick("Solar PV (actual)", "太陽光電（實績）"), x: yrs, y: emp.map((r) => +(r.solar_cf * 100).toFixed(1)), line: { color: "#ea580c", width: 2.3 } },
      { type: "scatter", mode: "lines+markers", name: pick("Wind fleet (on+offshore actual)", "風力整體（陸＋離岸實績）"), x: yrs, y: emp.map((r) => +(r.wind_cf * 100).toFixed(1)), line: { color: "#2563eb", width: 2.5 } },
      { type: "scatter", mode: "lines+markers", name: pick("Conventional hydro (actual)", "慣常水力（實績）"), x: yrs, y: emp.map((r) => +(r.hydro_cf * 100).toFixed(1)), line: { color: "#0891b2", width: 2.2 } },
      { type: "scatter", mode: "lines+markers", name: pick("Biomass (actual)", "生質能（實績）"), x: yrs, y: emp.map((r) => +(r.biomass_cf * 100).toFixed(1)), line: { color: "#16a34a", width: 1.8, dash: "dot" } },
    ], plotLayout({
      yaxis: { title: pick("Empirical CF (%)", "實際容量因數 (%)"), rangemode: "tozero", gridcolor: css("--grid") },
      xaxis: { dtick: 1 },
    }), { responsive: true });

    $("table-tw-surveys").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Taiwan Agency", "台灣主管／調查機構")}</th>
          <th>${pick("Dataset / Survey", "資料集與調查項目")}</th>
          <th>${pick("Key Taiwan Findings", "核心本土數據")}</th>
          <th>${pick("Evidence", "證據")}</th>
        </tr></thead>
        <tbody>
          ${(tl.taiwan_resource_surveys || []).map((s) => `<tr>
            <td><strong><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(pick(s.agency_en, s.agency_zh))}</a></strong></td>
            <td>${esc(pick(s.resource_en, s.resource_zh))}</td>
            <td><small>${esc(pick(s.figures_en, s.figures_zh))}</small></td>
            <td>${evidenceChip(s.evidence)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;

    $("table-era5-vs-tw").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Technology", "技術別")}</th>
          <th>${pick("ERA5 / Atlite Model", "ERA5 模型結果")}</th>
          <th>${pick("MOEA FiT Benchmark", "經濟部躉購基準")}</th>
          <th>${pick("Actual Taiwan Fleet (MOEA)", "台灣全國實績 (2016–2025)")}</th>
          <th>${pick("Key Takeaway", "比對重點")}</th>
        </tr></thead>
        <tbody>
          ${(tl.era5_vs_taiwan_benchmarks || []).map((r) => `<tr>
            <td><strong>${esc(pick(r.tech_en, r.tech_zh))}</strong></td>
            <td>${esc(r.era5_cf)}</td>
            <td>${esc(r.fit_benchmark)}</td>
            <td><strong>${esc(r.actual_taiwan)}</strong></td>
            <td><small>${esc(pick(r.finding_en, r.finding_zh))}</small></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderCountyAndPolicy(d) {
    const cs = d.county_solar;
    const top = cs.counties.slice(0, 15).reverse();
    Plotly.newPlot("chart-county-solar", [{
      type: "bar", orientation: "h",
      y: top.map((c) => pick(c.county_en, c.county_zh)),
      x: top.map((c) => c.total_MW),
      text: top.map((c) => `${fmt(c.total_MW, 0)} MW (${c.share_pct}%)`),
      textposition: "outside",
      marker: { color: css("--k-4") || "#d97706" },
    }], plotLayout({
      margin: { t: 16, r: 90, b: 36, l: 120 },
      xaxis: { title: pick("Cumulative approved MW (2015–2025)", "累計同意備案 MW (2015–2025)"), gridcolor: css("--grid") },
    }), { responsive: true });

    $("table-policy-potential").innerHTML = `
      <table>
        <thead><tr>
          <th>${pick("Technology", "技術別")}</th>
          <th>${pick("Model Potential", "模型技術潛力")}</th>
          <th>${pick("2030 Target", "2030 目標")}</th>
          <th>${pick("2050 Target", "2050 目標")}</th>
          <th>${pick("Notes", "說明")}</th>
        </tr></thead>
        <tbody>
          ${d.policy_vs_potential.map((r) => `<tr>
            <td><strong>${esc(pick(r.tech_en, r.tech_zh))}</strong></td>
            <td>${esc(r.model_gw)}<br><small class="muted">${esc(r.model_twh)}</small></td>
            <td>${esc(r.target_2030)}</td>
            <td>${esc(r.target_2050)}</td>
            <td><small>${esc(pick(r.note_en, r.note_zh))}</small></td>
          </tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function renderSources(d) {
    $("wr-sources").innerHTML = d.sources.map((s) => {
      const title = pick(s.title_en || s.short_cite, s.title_zh || s.short_cite);
      const link = s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(title)}</a>` : esc(title);
      return `<li><strong>${esc(s.short_cite)}</strong> — ${link} (${esc(s.publisher)}) ${evidenceChip(s.evidence)}<br><small class="muted">${esc(s.note)}</small></li>`;
    }).join("");
  }

  function renderAll() {
    if (!state.data) return;
    populateSelectors(state.data);
    renderAlerts(state.data);
    renderTiles(state.data);
    renderWeatherMaps(state.data);
    renderVariability(state.data);
    renderExtremes(state.data);
    renderPotential(state.data);
    renderExclusions(state.data);
    renderTaiwanLocal(state.data);
    renderCountyAndPolicy(state.data);
    renderSources(state.data);
  }

  function wireEvents() {
    $("wr-year").addEventListener("change", (e) => { state.year = e.target.value; renderAll(); });
    $("wr-var").addEventListener("change", (e) => { state.weatherVar = e.target.value; renderWeatherMaps(state.data); });
    $("wr-rose-site").addEventListener("change", (e) => { state.roseSite = e.target.value; renderWeatherMaps(state.data); });
    $("wr-carrier").addEventListener("change", (e) => { state.carrier = e.target.value; renderPotential(state.data); });
    new MutationObserver(() => renderAll()).observe(document.documentElement, {
      attributes: true, attributeFilter: ["lang", "data-theme"],
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (!document.documentElement.dataset.theme) renderAll();
    });
  }

  async function init() {
    try {
      const res = await fetch("data/weather_re_data.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.data = await res.json();
      wireEvents();
      renderAll();
    } catch (err) {
      $("wr-alerts").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${pick("Failed to load docs/data/weather_re_data.json", "無法載入 docs/data/weather_re_data.json")}: ${esc(err.message)}</span></div>`;
    }
  }

  init();
})();
