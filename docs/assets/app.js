/* PyPSA-Earth Taiwan dashboard.
   Data comes from docs/data/, written by pypsa_tw/viewer/export_dashboard_data.py. */

// Technology groups in stack order, bottom to top. Colours come from CSS tokens.
const GROUPS = ["coal", "nuclear", "onwind", "storage", "solar", "offwind", "gas", "hydro", "other_re", "other", "unserved"];
const CARRIER_GROUP = {
  coal: "coal", lignite: "coal", nuclear: "nuclear", onwind: "onwind", PHS: "storage",
  battery: "storage", solar: "solar", "offwind-ac": "offwind", "offwind-dc": "offwind",
  CCGT: "gas", OCGT: "gas", ror: "hydro", hydro: "hydro", oil: "other", geothermal: "other_re", biomass: "other_re",
  load: "unserved", "load shedding": "unserved",
};
const AVAILABILITY_ORDER = ["solar", "onwind", "offwind-ac", "offwind-dc", "ror"];

const I18N = {
  en: {
    title: "Taiwan electricity model", nav_results: "Results", nav_inputs: "Inputs",
    setup_title: "Model setup: which year does each input represent?",
    su_input: "Input", su_year: "Year / basis", su_note: "What it means",
    su_weather: "Weather (solar, wind, hydro availability)", su_weather_note: "Hourly ERA5 reanalysis weather of this year. It sets when the sun shines and the wind blows, not how much capacity exists.",
    su_demand_shape: "Demand profile (hourly shape)", su_demand_shape_note: (py, wy) => `GEGIS projection for ${py}, computed with ${wy} weather; only the daily and seasonal pattern is used.`,
    su_demand_level: "Demand level (annual total)", su_demand_level_note: (sc) => `The profile is scaled by ${sc} to Taipower-system generation in 2024 (251 TWh, still to verify).`,
    su_fleet: "Power plants (capacities)", su_fleet_note: (src) => `Today's fleet: ${src}, including new gas units in trial operation.`,
    su_grid: "Transmission grid", su_grid_note: (ll) => `Today's OpenStreetMap grid, ${ll === "v1.0" ? "kept fixed" : "allowed to expand (" + ll + ")"}.`,
    su_costs: "Costs and fuel prices", su_costs_note: "PyPSA technology-data projections for this year; they set the dispatch order (marginal costs).",
    su_resolution: "Resolution", su_resolution_note: (cl, opts) => `${cl} buses, time steps from ${opts}.`,
    su_summary: (wy, fd) => `In short: today's system (fleet ${fd}, demand at 2024 level) under the weather of ${wy}.`,
    su_demand_level_future: (sc, twh, sy) => `The profile is scaled by ${sc} to ${twh} TWh: Taipower-system generation in 2024 (251 TWh, still to verify) grown by 1.7%/yr to ${sy}, as in the MOEA outlook (2025 edition).`,
    su_fleet_future: (f) => `Planned fleet (${f}): today's fleet with the MOEA schedule of new gas units and retirements, and renewables at the government targets.`,
    su_planned: "planned",
    su_summary_future: (sy, wy) => `In short: the planned ${sy} system (fleet and demand) under the weather of ${wy}, with today's grid.`,
    nav_scenarios: "Scenarios", sc_title: "Scenarios: other weather years and future years",
    sc_intro: "Each scenario changes one thing against the 2013 run with today's system. Load shedding is allowed in all of them, so a shortfall shows up as unserved demand instead of an infeasible run. Select a row to open that run.",
    sc_weather: "Weather years: today's system", sc_weather_sub: "Same fleet, grid and annual demand (251 TWh); only the weather changes",
    sc_weather_note: "The weather year sets hourly solar, wind and hydro availability and the shape of the demand profile (GEGIS computes demand with that year's temperatures). Annual demand is rescaled to the same 251 TWh in every year.",
    sc_future: "Future years: the planned system", sc_future_sub: "Planned fleet and demand, 2013 weather, today's grid",
    sc_future_note: "Fleet: today's Taipower list plus the MOEA 2025 supply-demand report's unit-by-unit schedule of new gas plants and coal, oil and gas retirements (Figure 3-3; a unit counts if it runs on 1 July), with solar, wind, hydro, geothermal and biomass at the Table 3-1 targets (2032 targets held for 2034). Demand grows 1.7%/yr. The grid is not expanded, and costs are technology-data projections for 2030 and 2035. Sites of two unnamed gas units and of geothermal and biomass are assumptions.",
    sc_capacity: "Installed capacity: today and planned", sc_capacity_sub: "GW by technology in each future-year run",
    sc_case: "Scenario", sc_re: "Renewables", sc_pending: "not run yet", sc_today: "today",
    nav_data: "Taiwan energy data →",
    nav_compare: "Data comparison", compare_title: "PyPSA-Earth data vs Taiwan data",
    compare_intro: "PyPSA-Earth's default inputs for Taiwan (power plants from powerplantmatching with an IRENA top-up, and a GEGIS 2030 demand projection) compared with the Taiwan data used now (Taipower's unit list and demand calibrated to the Taipower system), and with reported statistics.",
    cmp_capacity: "Installed capacity", cmp_capacity_sub: "GW per technology",
    cmp_params: "Key inputs", cmp_params_sub: "What changed and why",
    cmp_mix: "Generation mix: model vs reported statistics", cmp_mix_sub: "Share of annual generation (%)",
    cmp_mix_note: "Model rows: full year, 2013 weather, load shedding allowed. The default-data run used demand scaled to the national total (288.6 TWh). Reported statistics are taken from secondary sources and still to be verified (see pypsa_tw/data/official/taiwan_electricity_statistics.csv).",
    src_default: "PyPSA-Earth default", src_taiwan: "Taiwan data (now)", src_reference: "Reported",
    row_model_default: "Model, PyPSA-Earth default data", row_model_taiwan: "Model, Taiwan data",
    p_item: "Input", p_demand: "Annual demand", p_peak: "Peak demand", p_nuclear: "Nuclear capacity",
    p_coal: "Coal capacity", p_gas: "Gas capacity", p_solar: "Solar PV capacity", p_offwind: "Offshore wind capacity",
    p_phs: "Pumped hydro storage", p_battery: "Battery capacity",
    p_demand_ref: "Taipower system 2024: 251.4 TWh (to verify); national 288.6 TWh",
    p_peak_ref: (gw) => `Taipower net peak 2024: ${gw} GW`,
    p_nuclear_ref: "0 since May 2025 (Maanshan 2 shut down); the default list also has Lungmen, which never operated",
    p_coal_ref: "Default includes Mailiao (4.5 GW, industrial self-generation)",
    p_solar_ref: "Default: IRENA 2023; Taiwan: Taipower list 2026-09",
    p_phs_ref: "About 6 h at full load (Sun Moon Lake)",
    grp_gas: "Gas", grp_nuclear: "Nuclear", grp_coal: "Coal", grp_renewables: "Renewables", grp_storage: "Pumped storage", grp_other: "Oil and other",
    cap_gas: "Gas", cap_coal: "Coal", cap_nuclear: "Nuclear", cap_oil: "Oil", cap_solar: "Solar PV", cap_onwind: "Onshore wind",
    cap_offwind: "Offshore wind", cap_hydro: "Hydro", cap_phs: "Pumped hydro", cap_battery: "Battery",
    nav_runs: "All runs", nav_findings: "Findings", select_case: "Run", results: "Results",
    energy_mix: "Generation mix", energy_mix_sub: "Annual energy by technology (TWh)",
    capacity: "Installed capacity", capacity_sub: "Capacity by technology (GW); capacity factor in the table",
    dispatch: "Dispatch",
    dispatch_sub: "National generation by technology and demand (GW). Storage charging is shown below zero. Drag to zoom, double-click to reset.",
    price: "Electricity price", price_sub: "Modelled wholesale price, national average, EUR/MWh; hover the line for NT$/kWh",
    price_note: "In every time step the model works out the cost of supplying one more kWh at each bus. That is set by the most expensive power plant still needed, or by the penalty for unserved demand when supply runs short. The national price averages the buses, weighted by their demand. It is a wholesale cost signal, not the retail tariff: Taipower tariffs are regulated and also cover the grid and other costs. Spikes are hours with unserved demand: the affected bus reaches the shortage penalty of 1,000 EUR/MWh (about 36 NT$/kWh), which lifts the national average.",
    fx_note: (rate, date) => `Prices are in EUR/MWh, as in the model's cost data. Values in brackets are NT$/kWh at ${rate} NT$/€ (Bank of Taiwan spot midpoint, ${date}); 1 EUR/MWh = ${(rate / 1000).toFixed(4)} NT$/kWh.`,
    map: "Network", map_sub: "Buses sized by demand; line width by capacity. Hover for loading.",
    show_table: "Show table", show_lines: "Show line table", show_buses: "Show demand by bus",
    inputs: "Inputs", demand: "Demand", demand_sub: "National electricity demand (GW)",
    availability: "Renewable potential (weather)",
    availability_sub: "Available output per MW installed, hour by hour (0–1), capacity-weighted per technology",
    availability_note: "This is not whether plants are working (outages or maintenance). It is how much the weather allows: 1 means the sun, wind or river flow would let every installed MW run at full power, 0 means none. Its yearly average is the potential capacity factor. The realised capacity factor is what the model actually used; the difference is curtailment. The technical potential is the maximum capacity that could be installed on eligible land and sea areas. CF = capacity factor.",
    pot_tech: "Technology", pot_installed: "Installed (GW)", pot_potential: "Technical potential (GW)",
    pot_cf: "Potential CF", pot_cf_real: "Realised CF", pot_curt: "Curtailed",
    technology: "Technology data", technology_sub: "Fleet and cost assumptions used in this run",
    all_runs: "All runs", inventory: "Run inventory", inventory_sub: "Select a row to view that run",
    compare_mix: "Generation mix by run", compare_mix_sub: "Share of annual generation (%)",
    findings: "Findings", details_in: "Details:",
    footer: "Generated from local model results by pypsa_tw/viewer/export_dashboard_data.py.",
    generated: "Data exported", t_demand: "Demand", t_co2: "CO₂ emissions", t_price: "Mean price",
    t_solve: "Solve time", t_solver_only: "solver only", t_rule: "whole step",
    technology_col: "Technology", capacity_col: "Capacity (GW)", energy_col: "Energy (TWh)",
    cf_col: "Capacity factor", count_col: "Units", mc_col: "Marginal cost (EUR/MWh)",
    cc_col: "Capital cost (EUR/MW/yr)", eff_col: "Efficiency", co2_col: "CO₂ (t/MWh fuel)",
    life_col: "Lifetime (yr)", hours_col: "Storage (h)", year_col: "Mean build year", ext_col: "Extendable",
    bus_col: "Bus", peak_col: "Peak (GW)", gen_col: "Generation (TWh)", price_col: "Mean price, EUR/MWh (NT$/kWh)",
    line_col: "Line", from_to: "From – to", snom_col: "Capacity (GW)", sopt_col: "Optimised (GW)",
    len_col: "Length (km)", load_mean_col: "Mean loading", load_max_col: "Max loading",
    status_col: "Status", run_col: "Run", grid_col: "Grid", solver_col: "Solver", period_col: "Period",
    buses_col: "Buses", time_col: "Solve (s)", co2_mt_col: "CO₂ (Mt)",
    yes: "yes", no: "no", demand_series: "Demand", grid_fixed: "fixed (v1.0)", grid_opt: "expandable (copt)",
    ok_label: "OK", warning_label: "Warning", critical_label: "Critical", ntd_unit: "NT$/kWh", more_info: "More information",
    no_issues: "No issues found by the automatic checks.",
    represents: (h, w) => `${h} h represented · ${w} h per snapshot`,
    loading_error: "Could not load the data. If you opened this file directly, serve the folder instead: python -m http.server -d docs",
  },
  zh: {
    title: "台灣電力系統模型", nav_results: "結果", nav_inputs: "輸入資料", nav_runs: "所有模擬",
    setup_title: "模型設定：各項輸入代表哪一年？",
    su_input: "輸入", su_year: "年份／依據", su_note: "意義",
    su_weather: "氣象（太陽光電、風力、水力可用率）", su_weather_note: "該年的 ERA5 逐時再分析氣象資料，決定何時有日照與風，而不是裝置容量。",
    su_demand_shape: "需求曲線（逐時形狀）", su_demand_shape_note: (py, wy) => `GEGIS ${py} 年預估，以 ${wy} 年氣象計算；只取用每日與季節變化型態。`,
    su_demand_level: "需求量（年總量）", su_demand_level_note: (sc) => `需求曲線乘以 ${sc}，校準至台電系統 2024 年發電量（251 TWh，待查證）。`,
    su_fleet: "發電機組（裝置容量）", su_fleet_note: (src) => `現有機組：${src}，含試運轉中的新燃氣機組。`,
    su_grid: "輸電網路", su_grid_note: (ll) => `目前的 OpenStreetMap 電網，${ll === "v1.0" ? "維持不變" : "允許擴建（" + ll + "）"}。`,
    su_costs: "成本與燃料價格", su_costs_note: "PyPSA technology-data 該年預估值，決定調度順序（邊際成本）。",
    su_resolution: "解析度", su_resolution_note: (cl, opts) => `${cl} 個節點，時間步長依 ${opts}。`,
    su_summary: (wy, fd) => `簡言之：今天的系統（機組 ${fd}、需求為 2024 年水準），套用 ${wy} 年的氣象。`,
    su_demand_level_future: (sc, twh, sy) => `需求曲線乘以 ${sc}，即 ${twh} TWh：台電系統 2024 年發電量（251 TWh，待查證）依經濟部展望（2025 年版）每年成長 1.7% 至 ${sy} 年。`,
    su_fleet_future: (f) => `規劃機組（${f}）：現有機組，加上經濟部規劃的新燃氣機組與除役時程，再生能源依政府目標。`,
    su_planned: "規劃",
    su_summary_future: (sy, wy) => `簡言之：${sy} 年規劃的系統（機組與需求），套用 ${wy} 年的氣象，電網維持現狀。`,
    nav_scenarios: "情境", sc_title: "情境：其他氣象年與未來年份",
    sc_intro: "每個情境只相對於「2013 年氣象、現有系統」改變一件事。所有情境都允許切負載，供電不足時會顯示為未供電量，而不是無可行解。點選一列可開啟該模擬。",
    sc_weather: "氣象年：現有系統", sc_weather_sub: "機組、電網與年需求（251 TWh）相同，只改變氣象",
    sc_weather_note: "氣象年決定逐時的太陽光電、風力與水力可用率，以及需求曲線的形狀（GEGIS 以該年氣溫計算需求）。各年的年需求都重新縮放為 251 TWh。",
    sc_future: "未來年份：規劃的系統", sc_future_sub: "規劃的機組與需求，2013 年氣象，現有電網",
    sc_future_note: "機組：現有台電清單，加上經濟部 2025 年全國電力資源供需報告的逐機組新燃氣機組與燃煤、燃油、燃氣除役時程（圖 3-3；7 月 1 日在役才計入），太陽光電、風力、水力、地熱與生質能依表 3-1 目標（2034 年沿用 2032 年目標）。需求每年成長 1.7%。電網不擴建，成本採 technology-data 2030 與 2035 年預估。兩部未指定地點的燃氣機組及地熱、生質能的位置為假設。",
    sc_capacity: "裝置容量：現有與規劃", sc_capacity_sub: "各未來年份模擬的裝置容量（GW）",
    sc_case: "情境", sc_re: "再生能源", sc_pending: "尚未模擬", sc_today: "現在",
    nav_data: "台灣能源資料 →",
    nav_compare: "資料比較", compare_title: "PyPSA-Earth 資料與台灣資料比較",
    compare_intro: "比較 PyPSA-Earth 對台灣的預設輸入（powerplantmatching 機組資料加上 IRENA 補足，以及 GEGIS 2030 年需求預估）、現在使用的台灣資料（台電機組清單，需求依台電系統校準），以及公開統計。",
    cmp_capacity: "裝置容量", cmp_capacity_sub: "各技術容量（GW）",
    cmp_params: "主要輸入", cmp_params_sub: "改了什麼、為什麼",
    cmp_mix: "發電結構：模型與公開統計", cmp_mix_sub: "年發電量占比（%）",
    cmp_mix_note: "模型列為全年、2013 年氣象、允許切負載；預設資料的模擬將需求縮放至全國總量（288.6 TWh）。公開統計取自二手來源，仍待查證（見 pypsa_tw/data/official/taiwan_electricity_statistics.csv）。",
    src_default: "PyPSA-Earth 預設", src_taiwan: "台灣資料（現在）", src_reference: "公開統計",
    row_model_default: "模型：PyPSA-Earth 預設資料", row_model_taiwan: "模型：台灣資料",
    p_item: "輸入", p_demand: "年需求", p_peak: "尖峰需求", p_nuclear: "核能容量",
    p_coal: "燃煤容量", p_gas: "燃氣容量", p_solar: "太陽光電容量", p_offwind: "離岸風電容量",
    p_phs: "抽蓄儲能時數", p_battery: "電池容量",
    p_demand_ref: "台電系統 2024 年：251.4 TWh（待查證）；全國 288.6 TWh",
    p_peak_ref: (gw) => `台電 2024 年淨尖峰：${gw} GW`,
    p_nuclear_ref: "2025 年 5 月起為 0（核三 2 號機停機）；預設清單還包含從未運轉的核四",
    p_coal_ref: "預設資料包含麥寮（4.5 GW，工業自用發電）",
    p_solar_ref: "預設：IRENA 2023；台灣：台電清單 2026-09",
    p_phs_ref: "滿載約 6 小時（日月潭）",
    grp_gas: "燃氣", grp_nuclear: "核能", grp_coal: "燃煤", grp_renewables: "再生能源", grp_storage: "抽蓄", grp_other: "燃油及其他",
    cap_gas: "燃氣", cap_coal: "燃煤", cap_nuclear: "核能", cap_oil: "燃油", cap_solar: "太陽光電", cap_onwind: "陸域風電",
    cap_offwind: "離岸風電", cap_hydro: "水力", cap_phs: "抽蓄水力", cap_battery: "電池",
    nav_findings: "發現", select_case: "模擬", results: "結果",
    energy_mix: "發電結構", energy_mix_sub: "各技術年發電量（TWh）",
    capacity: "裝置容量", capacity_sub: "各技術裝置容量（GW）；容量因數見表格",
    dispatch: "調度",
    dispatch_sub: "全國各技術發電量與需求（GW）。抽蓄充電顯示於零以下。拖曳可放大，雙擊可還原。",
    price: "電價", price_sub: "模型批發電價，全國平均，EUR/MWh；滑鼠移到曲線上可看元/度",
    price_note: "模型在每個時段計算各節點「多供應 1 度電」的成本，由當時仍需運轉、成本最高的電廠決定；供電不足時則由未供電的懲罰成本決定。全國電價是各節點依需求加權的平均。這是批發層級的成本訊號，不是零售電價：台電電價由政府核定，並涵蓋電網等其他成本。尖峰代表該時段有未供電：受影響的節點電價達到 1,000 EUR/MWh（約 36 元/度）的缺電懲罰成本，使全國平均升高。",
    fx_note: (rate, date) => `電價單位為 EUR/MWh，與模型成本資料一致。括號內為元/度，依臺灣銀行即期匯率中間價 ${rate} 元/歐元（${date}）換算；1 EUR/MWh = ${(rate / 1000).toFixed(4)} 元/度。`,
    map: "電網", map_sub: "節點大小代表需求；線寬代表容量。滑鼠移上可看負載率。",
    show_table: "顯示表格", show_lines: "顯示線路表", show_buses: "顯示各節點需求",
    inputs: "輸入資料", demand: "電力需求", demand_sub: "全國電力需求（GW）",
    availability: "再生能源潛力（氣象）", availability_sub: "每 MW 裝置容量逐時可發電比例（0–1），依技術容量加權",
    availability_note: "這不是機組是否正常運轉（停機或檢修），而是天氣允許的發電程度：1 代表日照、風或河川流量足以讓每 MW 滿載發電，0 代表完全無法發電。其年平均即為潛在容量因數。實際容量因數是模型真正使用的部分，兩者差距即為棄電。技術潛力是可用土地與海域上最多可設置的容量。",
    pot_tech: "技術", pot_installed: "已裝置（GW）", pot_potential: "技術潛力（GW）",
    pot_cf: "潛在容量因數", pot_cf_real: "實際容量因數", pot_curt: "棄電率",
    technology: "技術資料", technology_sub: "本次模擬使用的機組與成本假設",
    all_runs: "所有模擬", inventory: "模擬清單", inventory_sub: "點選一列以查看該模擬",
    compare_mix: "各模擬發電結構", compare_mix_sub: "年發電量占比（%）",
    findings: "發現", details_in: "詳細紀錄：",
    footer: "由 pypsa_tw/viewer/export_dashboard_data.py 從本機模擬結果產生。",
    generated: "資料匯出時間", t_demand: "電力需求", t_co2: "CO₂ 排放", t_price: "平均電價",
    t_solve: "求解時間", t_solver_only: "僅求解器", t_rule: "整個步驟",
    technology_col: "技術", capacity_col: "容量（GW）", energy_col: "發電量（TWh）",
    cf_col: "容量因數", count_col: "機組數", mc_col: "邊際成本（EUR/MWh）",
    cc_col: "資本成本（EUR/MW/年）", eff_col: "效率", co2_col: "CO₂（t/MWh 燃料）",
    life_col: "壽命（年）", hours_col: "儲能時數（h）", year_col: "平均商轉年", ext_col: "可擴建",
    bus_col: "節點", peak_col: "尖峰（GW）", gen_col: "發電量（TWh）", price_col: "平均電價，EUR/MWh（元/度）",
    line_col: "線路", from_to: "起訖", snom_col: "容量（GW）", sopt_col: "最佳化後（GW）",
    len_col: "長度（km）", load_mean_col: "平均負載率", load_max_col: "最大負載率",
    status_col: "狀態", run_col: "模擬", grid_col: "電網", solver_col: "求解器", period_col: "期間",
    buses_col: "節點數", time_col: "求解（秒）", co2_mt_col: "CO₂（百萬噸）",
    yes: "是", no: "否", demand_series: "需求", grid_fixed: "固定（v1.0）", grid_opt: "可擴建（copt）",
    ok_label: "正常", warning_label: "注意", critical_label: "嚴重", ntd_unit: "元/度", more_info: "更多資訊",
    no_issues: "自動檢查未發現問題。",
    represents: (h, w) => `代表 ${h} 小時 · 每個時段 ${w} 小時`,
    loading_error: "無法載入資料。若直接開啟檔案，請改用本機伺服器：python -m http.server -d docs",
  },
};

const GROUP_LABEL = {
  en: { coal: "Coal", nuclear: "Nuclear", onwind: "Onshore wind", storage: "Storage (pumped hydro, battery)",
        solar: "Solar PV", offwind: "Offshore wind", gas: "Gas", hydro: "Hydro", other_re: "Geothermal, biomass", other: "Other (oil)", unserved: "Unserved demand" },
  zh: { coal: "燃煤", nuclear: "核能", onwind: "陸域風電", storage: "儲能（抽蓄、電池）", solar: "太陽光電",
        offwind: "離岸風電", gas: "燃氣", hydro: "水力", other_re: "地熱、生質能", other: "其他（燃油）", unserved: "未供電量" },
};
const CARRIER_LABEL = {
  en: { CCGT: "Gas (CCGT)", OCGT: "Gas (OCGT)", coal: "Coal", lignite: "Lignite", nuclear: "Nuclear",
        oil: "Oil", solar: "Solar PV", onwind: "Onshore wind", "offwind-ac": "Offshore wind (AC)",
        "offwind-dc": "Offshore wind (DC)", ror: "Run-of-river hydro", hydro: "Reservoir hydro",
        PHS: "Pumped hydro", battery: "Battery", geothermal: "Geothermal", biomass: "Biomass and waste",
        load: "Load shedding", "load shedding": "Load shedding" },
  zh: { CCGT: "燃氣複循環", OCGT: "燃氣單循環", coal: "燃煤", lignite: "褐煤", nuclear: "核能", oil: "燃油",
        solar: "太陽光電", onwind: "陸域風電", "offwind-ac": "離岸風電（交流）", "offwind-dc": "離岸風電（直流）",
        ror: "川流式水力", hydro: "水庫式水力", PHS: "抽蓄水力", battery: "電池儲能", geothermal: "地熱", biomass: "生質能及廢棄物",
        load: "切負載", "load shedding": "切負載" },
};

const FINDINGS = {
  en: [
    "<b>Future years 2030 and 2034.</b> With the government plan (new gas units, coal retirements, renewable targets) and demand growing 1.7%/yr, renewables reach 36% (2030) and 38% (2034) of generation, coal falls from 40% to 30% and 19%, and CO₂ from 134 to 113 and 97 Mt. The model beats the 30% target for 2030 partly because national capacity targets are applied to the smaller Taipower-system demand. Taipei's aggregated corridor still limits supply (0.36 and 0.83 TWh unserved): the new northern gas plants connect on the far side of it in the 6-bus model.",
    "<b>Official Taiwan fleet.</b> Power plants now come from Taipower's own unit list (snapshot 2026-09-24), including independent producers and 3.9 GW of new gas units in trial operation: 64.0 GW in total, no nuclear. Demand is scaled to Taipower-system generation (251 TWh in 2024), giving a 41.4 GW peak against the official 40.9 GW.",
    "<b>Generation mix close to Taipower 2024.</b> Model (full year): gas 46%, coal 40%, renewables 14%. Taipower system 2024: gas 47%, coal 31%, renewables 12%, nuclear 8% (nuclear has been 0 since May 2025). Coal still runs at 100% all year: its availability and emission limits are not modelled yet.",
    "<b>Full year: Taipei transmission is the bottleneck.</b> Without load shedding the full-year run is infeasible. The diagnostic leaves 0.83 TWh (0.33%) unserved, all at the Taipei bus in June–August, because the single aggregated line into Taipei is at its limit (70% of its rating) while spare gas capacity sits elsewhere. With lines allowed their full rating, no demand goes unserved. The 6-bus model lumps Taipei's corridors into one line, so the next step is more buses.",
    "<b>Weather data fixed.</b> Runs before 2026-09-23 used a weather file covering only 2013-03-01 to 03-06, so renewables were treated as fully available the rest of the time. Runs now use a full-year 2013 weather file (solar 13%, offshore wind 42%), and the workflow stops if the weather data doesn't cover the run.",
    "<b>Grid and connectivity fixed.</b> Small disconnected pieces of the OpenStreetMap grid are merged into the main network, and runs marked “v1.0” keep transmission at today's capacity.",
    "<b>Solvers agree.</b> HiGHS and Gurobi give identical results. On the full year Gurobi is about 11× faster (0.8 s vs 9 s).",
  ],
  zh: [
    "<b>未來年份 2030 與 2034。</b>依政府規劃（新燃氣機組、燃煤除役、再生能源目標）並以每年 1.7% 成長需求，再生能源發電占比達 36%（2030）與 38%（2034），燃煤由 40% 降至 30% 與 19%，CO₂ 由 134 降至 113 與 97 Mt。模型超過 2030 年 30% 目標，部分原因是全國容量目標套用在較小的台電系統需求上。台北的匯總輸電走廊仍限制供電（未供電 0.36 與 0.83 TWh）：在 6 節點模型中，北部新燃氣電廠位於走廊的另一端。",
    "<b>採用台灣官方機組資料。</b>發電機組改用台電機組清單（2026-09-24 快照），包含民營電廠及 3.9 GW 試運轉中的新燃氣機組，共 64.0 GW，無核能。電力需求按台電系統發電量縮放（2024 年 251 TWh），尖峰 41.4 GW，官方為 40.9 GW。",
    "<b>發電結構接近台電 2024 年。</b>模型（全年）：燃氣 46%、燃煤 40%、再生能源 14%。台電系統 2024 年：燃氣 47%、燃煤 31%、再生能源 12%、核能 8%（2025 年 5 月起核能為 0）。燃煤全年滿載運轉，尚未模擬其可用率與排放限制。",
    "<b>全年模擬：瓶頸在台北的輸電。</b>不允許切負載時全年模擬無可行解。診斷結果顯示有 0.83 TWh（0.33%）未供電，全部在 6 至 8 月的台北節點：進入台北的單一匯總線路達到上限（額定容量的 70%），其他地區仍有閒置的燃氣容量。若線路可用滿額定容量，則沒有未供電。6 節點模型把台北的多條輸電走廊合併成一條線，下一步是增加節點數。",
    "<b>氣象資料已修正。</b>2026-09-23 之前的模擬使用只涵蓋 2013-03-01 至 03-06 的氣象檔，其餘時間再生能源都被視為滿載可用。現在改用 2013 全年氣象檔（太陽光電 13%、離岸風電 42%），若氣象資料未涵蓋模擬期間，流程會直接停止。",
    "<b>電網與連通性已修正。</b>OpenStreetMap 電網中不相連的小區塊已併入主網；標示「v1.0」的模擬維持目前的輸電容量。",
    "<b>求解器結果一致。</b>HiGHS 與 Gurobi 結果相同；全年模擬 Gurobi 約快 11 倍（0.8 秒對 9 秒）。",
  ],
};

const state = { lang: "en", index: null, current: null, cache: {} };

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const t = (key) => I18N[state.lang][key] ?? key;
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const groupColor = (g) => cssVar(`--c-${g}`);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function nf(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "–";
  return new Intl.NumberFormat(state.lang === "zh" ? "zh-TW" : "en-US", {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value);
}
// EUR/MWh -> NT$/kWh with the exported exchange rate (model costs are in EUR).
const ntd = (eurPerMWh) => (eurPerMWh === null || eurPerMWh === undefined ? null
  : (eurPerMWh * (state.index?.currency?.eur_twd ?? NaN)) / 1000);
const pct = (v, d = 0) => (v === null || v === undefined ? "–" : `${nf(v * 100, d)}%`);

function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } }

function groupSum(byCarrier) {
  const out = {};
  for (const [carrier, v] of Object.entries(byCarrier || {})) {
    const g = CARRIER_GROUP[carrier] || "other";
    out[g] = (out[g] || 0) + (v || 0);
  }
  return out;
}

function severityOf(summary) {
  if (summary.warnings.some((w) => w.severity === "critical")) return "critical";
  if (summary.warnings.length) return "warning";
  return "good";
}

function warningText(w) {
  const zh = state.lang === "zh";
  const carrier = (c) => CARRIER_LABEL[state.lang][c] || c;
  switch (w.code) {
    case "subnetworks": return zh ? `電網分成 ${w.n} 個互不相連的子網路` : `${w.n} disconnected subnetworks`;
    case "load_shedding": return zh ? `使用切負載 ${nf(w.gwh)} GWh` : `Load shedding used: ${nf(w.gwh)} GWh`;
    case "cf_implausible":
      return zh ? `${carrier(w.carrier)} 容量因數 ${pct(w.cf)} 不合理（上限約 ${pct(w.limit)}）`
                : `${carrier(w.carrier)} capacity factor ${pct(w.cf)} is implausible (limit about ${pct(w.limit)})`;
    case "availability_saturated":
      return zh ? `太陽光電在 ${pct(w.share)} 的時段可用率為 1.0（氣象資料缺漏）`
                : `Solar availability is 1.0 in ${pct(w.share)} of snapshots (weather data gap)`;
    case "gens_extendable": return zh ? "部分發電機組可擴建" : "Some generators are extendable";
    case "lines_extendable":
      return zh ? `輸電線路可擴建，增加 ${nf(w.added_gw)} GW` : `Transmission lines can expand; ${nf(w.added_gw)} GW added`;
    default: return w.code;
  }
}

function caseLabel(s) {
  const grid = s.transmission ? ` · ${s.transmission}` : "";
  return `${s.run}${grid}`;
}

function gridLabel(s) {
  if (!s.transmission) return "–";
  return s.transmission === "v1.0" ? t("grid_fixed") : s.transmission === "copt" ? t("grid_opt") : s.transmission;
}

function statusBadge(sev) {
  const label = { good: t("ok_label"), warning: t("warning_label"), critical: t("critical_label") }[sev];
  return `<span class="badge"><span class="dot" style="background:var(--${sev})"></span>${label}</span>`;
}

function table(headers, rows) {
  const head = headers.map(([label, num]) => `<th${num ? ' class="num"' : ""}>${label}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map(([v, num]) => `<td${num ? ' class="num"' : ""}>${v}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const swatch = (g) => `<span class="swatch" style="background:${groupColor(g)}"></span>`;

// ---------- Plotly theming ----------
function baseLayout(extra = {}) {
  const ink2 = cssVar("--ink-2");
  const axis = { gridcolor: cssVar("--grid"), linecolor: cssVar("--axis"), zerolinecolor: cssVar("--axis"),
                 tickfont: { color: cssVar("--muted"), size: 11 }, automargin: true };
  return {
    paper_bgcolor: cssVar("--surface"),
    plot_bgcolor: cssVar("--surface"),
    font: { family: cssVar("--font"), color: ink2, size: 12 },
    margin: { l: 8, r: 12, t: 8, b: 8 },
    xaxis: { ...axis, ...(extra.xaxis || {}) },
    yaxis: { ...axis, ...(extra.yaxis || {}) },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", font: { color: ink2, size: 12 } },
    hoverlabel: { bgcolor: cssVar("--surface"), bordercolor: cssVar("--border"),
                  font: { color: cssVar("--ink"), family: cssVar("--font") } },
    barcornerradius: 4,
    ...Object.fromEntries(Object.entries(extra).filter(([k]) => k !== "xaxis" && k !== "yaxis")),
  };
}
const plotConfig = { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["select2d", "lasso2d"] };

// ---------- rendering ----------
function renderStatus(s) {
  const el = $("case-status");
  if (!s.warnings.length) {
    el.innerHTML = `<div class="status good"><span class="icon" aria-hidden="true">✓</span><span><b>${t("ok_label")}</b> · ${t("no_issues")}</span></div>`;
    return;
  }
  el.innerHTML = s.warnings.map((w) => {
    const label = w.severity === "critical" ? t("critical_label") : t("warning_label");
    return `<div class="status ${w.severity}"><span class="icon" aria-hidden="true">!</span><span><b>${label}</b> · ${esc(warningText(w))}</span></div>`;
  }).join("");
}

function renderTiles(s) {
  const tile = (label, value, unit, note = "") =>
    `<div class="tile"><div class="label">${label}</div><div class="value">${value}<span class="unit">${unit}</span></div>${note ? `<div class="note">${note}</div>` : ""}</div>`;
  const solve = s.solver_s !== null ? nf(s.solver_s, 2) : nf(s.solve_rule_s, 1);
  const solveNote = `${s.solver || ""} · ${t("t_solver_only")}; ${t("t_rule")} ${nf(s.solve_rule_s, 1)} s`;
  $("tiles").innerHTML = [
    tile(t("t_demand"), nf(s.demand_TWh, 1), "TWh", t("represents")(nf(s.represented_hours, 0), nf(s.weight_h_per_snapshot, 1))),
    tile(t("t_co2"), nf(s.co2_Mt, 1), "Mt"),
    tile(t("t_price"), nf(s.price_mean, 1), "EUR/MWh", `(${nf(ntd(s.price_mean), 2)} ${t("ntd_unit")})`),
    ...(s.unserved_GWh > 0 ? [tile(GROUP_LABEL[state.lang].unserved, nf(s.unserved_GWh, 1), "GWh",
        `${t("peak_col")} ${nf(s.unserved_peak_GW, 2)}`)] : []),
    tile(t("t_solve"), solve, "s", solveNote),
  ].join("");
}

function carrierBars(targetId, byGroup, unit, digits) {
  const groups = GROUPS.filter((g) => (byGroup[g] || 0) > 1e-6);
  const labels = groups.map((g) => GROUP_LABEL[state.lang][g]);
  const values = groups.map((g) => byGroup[g]);
  Plotly.react(targetId, [{
    type: "bar", orientation: "h", y: labels, x: values,
    marker: { color: groups.map(groupColor), line: { color: cssVar("--surface"), width: 2 } },
    text: values.map((v) => nf(v, digits)), textposition: "outside", cliponaxis: false,
    textfont: { color: cssVar("--ink-2") },
    hovertemplate: `%{y}: %{x:.${digits}f} ${unit}<extra></extra>`,
  }], baseLayout({ yaxis: { autorange: "reversed" }, xaxis: { title: { text: unit, font: { size: 11 } } }, showlegend: false }), plotConfig);
}

function renderMix(d) {
  const energy = groupSum(d.results.energy_TWh);
  const cap = groupSum(d.results.capacity_GW);
  carrierBars("chart-energy", energy, "TWh", 1);
  carrierBars("chart-capacity", cap, "GW", 1);

  const groups = GROUPS.filter((g) => (energy[g] || 0) > 1e-6 || (cap[g] || 0) > 1e-6);
  const total = Object.values(energy).reduce((a, b) => a + b, 0);
  $("table-energy").innerHTML = table(
    [[t("technology_col")], [t("energy_col"), 1], ["%", 1]],
    groups.map((g) => [[swatch(g) + GROUP_LABEL[state.lang][g]], [nf(energy[g] || 0, 1), 1], [pct((energy[g] || 0) / total, 1), 1]]),
  );
  const hours = d.summary.represented_hours;
  $("table-capacity").innerHTML = table(
    [[t("technology_col")], [t("capacity_col"), 1], [t("cf_col"), 1]],
    groups.map((g) => [[swatch(g) + GROUP_LABEL[state.lang][g]], [nf(cap[g] || 0, 2), 1],
      [cap[g] ? pct((energy[g] || 0) * 1e3 / (cap[g] * hours), 1) : "–", 1]]),
  );
}

function renderDispatch(d) {
  const x = d.inputs.time;
  const byGroup = {};
  for (const [carrier, series] of Object.entries(d.results.dispatch_MW)) {
    const g = CARRIER_GROUP[carrier] || "other";
    byGroup[g] = byGroup[g] ? byGroup[g].map((v, i) => v + series[i]) : series.slice();
  }
  const traces = [];
  for (const g of GROUPS) {
    const s = byGroup[g];
    if (!s || s.every((v) => Math.abs(v) < 1)) continue;
    const common = { type: "scatter", mode: "lines", x, line: { width: 0 }, fillcolor: groupColor(g),
                     name: GROUP_LABEL[state.lang][g], legendgroup: g,
                     hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{y:.1f} GW<extra></extra>` };
    const pos = s.map((v) => Math.max(v, 0) / 1e3);
    const neg = s.map((v) => Math.min(v, 0) / 1e3);
    if (pos.some((v) => v > 1e-3)) traces.push({ ...common, y: pos, stackgroup: "pos" });
    if (neg.some((v) => v < -1e-3)) traces.push({ ...common, y: neg, stackgroup: "neg", showlegend: false });
  }
  traces.push({ type: "scatter", mode: "lines", x, y: d.inputs.demand_MW.map((v) => v / 1e3),
                name: t("demand_series"), line: { color: cssVar("--ink"), width: 2 },
                hovertemplate: `${t("demand_series")}: %{y:.1f} GW<extra></extra>` });
  Plotly.react("chart-dispatch", traces, baseLayout({
    hovermode: "x unified", yaxis: { title: { text: "GW", font: { size: 11 } } },
    xaxis: { showspikes: true, spikemode: "across", spikethickness: 1, spikecolor: cssVar("--axis"), spikedash: "solid" },
  }), plotConfig);
}

function singleLine(targetId, x, y, name, unit, color, digits = 1) {
  Plotly.react(targetId, [{ type: "scatter", mode: "lines", x, y, name, line: { color, width: 2 },
    hovertemplate: `%{x}<br>${name}: %{y:.${digits}f} ${unit}<extra></extra>` }],
    baseLayout({ showlegend: false, hovermode: "x", yaxis: { title: { text: unit, font: { size: 11 } } } }), plotConfig);
}

function renderPrice(d) {
  const eur = d.results.price_national;
  Plotly.react("chart-price", [{
    type: "scatter", mode: "lines", x: d.inputs.time, y: eur, customdata: eur.map(ntd),
    name: t("price"), line: { color: cssVar("--accent"), width: 2 },
    hovertemplate: `%{x}<br>%{y:.1f} EUR/MWh (%{customdata:.2f} ${t("ntd_unit")})<extra></extra>`,
  }], baseLayout({ showlegend: false, hovermode: "x", yaxis: { title: { text: "EUR/MWh", font: { size: 11 } } } }), plotConfig);
  const fx = state.index.currency;
  $("price-note").textContent = t("price_note");
  $("fx-note").textContent = fx ? t("fx_note")(fx.eur_twd, fx.date) : "";
}

function renderMap(d) {
  const buses = Object.fromEntries(d.results.buses.map((b) => [b.name, b]));
  const lines = d.results.lines;
  const maxCap = Math.max(...lines.map((l) => l.s_nom_opt_MVA || 0), 1);
  const lineColor = cssVar("--ink-2");
  // scattergeo needs no WebGL or tile server, so the map renders everywhere.
  const traces = lines.map((l) => ({
    type: "scattergeo", mode: "lines", hoverinfo: "skip", showlegend: false,
    lon: [buses[l.bus0].x, buses[l.bus1].x], lat: [buses[l.bus0].y, buses[l.bus1].y],
    line: { color: lineColor, width: 1.5 + 6 * (l.s_nom_opt_MVA / maxCap) },
  }));
  traces.push({
    type: "scattergeo", mode: "markers", showlegend: false,
    lon: lines.map((l) => (buses[l.bus0].x + buses[l.bus1].x) / 2),
    lat: lines.map((l) => (buses[l.bus0].y + buses[l.bus1].y) / 2),
    marker: { size: 14, opacity: 0 },
    hovertemplate: lines.map((l) => `${esc(l.bus0)} – ${esc(l.bus1)}<br>${nf(l.s_nom_opt_MVA / 1e3, 1)} GW · ${t("load_mean_col")} ${pct(l.loading_mean)} · ${t("load_max_col")} ${pct(l.loading_max)}<extra></extra>`),
  });
  const maxDemand = Math.max(...d.results.buses.map((b) => b.demand_TWh || 0), 1);
  traces.push({
    type: "scattergeo", mode: "markers+text", showlegend: false,
    lon: d.results.buses.map((b) => b.x), lat: d.results.buses.map((b) => b.y),
    text: d.results.buses.map((b) => b.name),
    textposition: d.results.buses.map((b) => (b.x < 120.9 ? "middle left" : "middle right")),
    textfont: { color: cssVar("--ink-2"), size: 11 },
    marker: { size: d.results.buses.map((b) => 10 + 22 * Math.sqrt((b.demand_TWh || 0) / maxDemand)), color: cssVar("--accent"),
              line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: d.results.buses.map((b) => `${esc(b.name)}<br>${t("t_demand")} ${nf(b.demand_TWh, 1)} TWh · ${t("peak_col")} ${nf(b.peak_GW, 1)}<br>${t("gen_col")} ${nf(b.generation_TWh, 1)}<extra></extra>`),
  });
  // Invisible corner points so the fitted view always shows the whole main island.
  traces.push({ type: "scattergeo", mode: "markers", lon: [119.9, 122.1], lat: [21.85, 25.35],
                marker: { size: 1, opacity: 0 }, hoverinfo: "skip", showlegend: false });
  Plotly.react("chart-map", traces, baseLayout({
    geo: {
      projection: { type: "mercator" }, resolution: 50, fitbounds: "locations",
      bgcolor: cssVar("--surface"), showland: true, landcolor: cssVar("--wash"), showocean: true,
      oceancolor: cssVar("--surface"), showcoastlines: true, coastlinecolor: cssVar("--axis"),
      showcountries: false, showframe: false, showlakes: false,
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
  }), plotConfig);

  $("table-lines").innerHTML = table(
    [[t("from_to")], [t("snom_col"), 1], [t("sopt_col"), 1], [t("len_col"), 1], [t("load_mean_col"), 1], [t("load_max_col"), 1]],
    lines.map((l) => [[`${esc(l.bus0)} – ${esc(l.bus1)}`], [nf(l.s_nom_MVA / 1e3, 2), 1], [nf(l.s_nom_opt_MVA / 1e3, 2), 1],
      [nf(l.length_km, 0), 1], [pct(l.loading_mean), 1], [pct(l.loading_max), 1]]),
  );
}

function renderInputs(d) {
  singleLine("chart-demand", d.inputs.time, d.inputs.demand_MW.map((v) => v / 1e3), t("demand_series"), "GW", cssVar("--ink-2"), 1);
  $("table-buses").innerHTML = table(
    [[t("bus_col")], [`${t("t_demand")} (TWh)`, 1], [t("peak_col"), 1], [t("gen_col"), 1], [t("price_col"), 1]],
    d.results.buses.map((b) => [[esc(b.name)], [nf(b.demand_TWh, 1), 1], [nf(b.peak_GW, 1), 1], [nf(b.generation_TWh, 1), 1], [`${nf(b.price_mean, 1)} (${nf(ntd(b.price_mean), 2)})`, 1]]),
  );

  // Small multiples: one row per technology, shared time axis.
  const carriers = AVAILABILITY_ORDER.filter((c) => d.inputs.availability[c]);
  const rows = carriers.length;
  const gap = 0.06;
  const h = (1 - gap * (rows - 1)) / rows;
  const layout = baseLayout({ showlegend: false, hovermode: "x unified", margin: { l: 8, r: 12, t: 18, b: 8 } });
  const traces = carriers.map((c, i) => {
    const axis = i === 0 ? "" : String(i + 1);
    const top = 1 - i * (h + gap);
    layout[`yaxis${axis}`] = { ...layout.yaxis, domain: [top - h, top], range: [0, 1.05], tickvals: [0, 0.5, 1] };
    layout[`xaxis${axis}`] = { ...layout.xaxis, anchor: `y${axis}`, matches: i === 0 ? undefined : "x", showticklabels: i === rows - 1 };
    const mean = d.inputs.availability_mean[c];
    (layout.annotations ||= []).push({ text: `${CARRIER_LABEL[state.lang][c] || c} · ${state.lang === "zh" ? "平均" : "mean"} ${nf(mean, 2)}`,
      xref: "paper", yref: "paper", x: 0, y: top + 0.01, xanchor: "left", yanchor: "bottom", showarrow: false,
      font: { size: 11, color: cssVar("--ink-2") } });
    return { type: "scatter", mode: "lines", x: d.inputs.time, y: d.inputs.availability[c], xaxis: `x${axis}`, yaxis: `y${axis}`,
             name: CARRIER_LABEL[state.lang][c] || c, line: { width: 1.2, color: groupColor(CARRIER_GROUP[c]) },
             hovertemplate: `${CARRIER_LABEL[state.lang][c] || c}: %{y:.2f}<extra></extra>` };
  });
  Plotly.react("chart-availability", traces, layout, plotConfig);
  $("availability-note").textContent = t("availability_note");
  const pot = d.inputs.renewable_potential || {};
  $("table-potential").innerHTML = table(
    [[t("pot_tech")], [t("pot_installed"), 1], [t("pot_potential"), 1], [t("pot_cf"), 1], [t("pot_cf_real"), 1], [t("pot_curt"), 1]],
    AVAILABILITY_ORDER.filter((c) => pot[c]).map((c) => [
      [swatch(CARRIER_GROUP[c]) + esc(CARRIER_LABEL[state.lang][c] || c)],
      [nf(pot[c].installed_GW, 2), 1], [pot[c].potential_GW === null ? "–" : nf(pot[c].potential_GW, 1), 1],
      [pct(pot[c].cf_potential, 1), 1], [pct(pot[c].cf_realised, 1), 1], [pct(pot[c].curtailment, 1), 1],
    ]),
  );

  $("table-technology").innerHTML = table(
    [[t("technology_col")], [t("count_col"), 1], [t("capacity_col"), 1], [t("mc_col"), 1], [t("cc_col"), 1],
     [t("eff_col"), 1], [t("co2_col"), 1], [t("life_col"), 1], [t("hours_col"), 1], [t("year_col"), 1], [t("ext_col")]],
    d.inputs.technology.map((r) => [
      [swatch(CARRIER_GROUP[r.carrier] || "other") + esc(CARRIER_LABEL[state.lang][r.carrier] || r.carrier)],
      [r.count, 1], [nf(r.p_nom_GW, 2), 1], [nf(r.marginal_cost, 2), 1], [nf(r.capital_cost, 0), 1],
      [nf(r.efficiency, 2), 1], [nf(r.co2_t_per_MWh_fuel, 3), 1], [nf(r.lifetime, 0), 1], [r.max_hours === undefined ? "–" : nf(r.max_hours, 1), 1],
      [r.build_year_mean ? String(Math.round(r.build_year_mean)) : "–", 1], [r.extendable ? t("yes") : t("no")],
    ]),
  );
}

function renderRuns() {
  const cases = state.index.cases;
  const rows = cases.map((s) => {
    const sel = s.id === state.current ? " selected" : "";
    const period = `${s.start.slice(0, 10)} → ${s.end.slice(0, 10)} · ${nf(s.step_h, 0)}h`;
    const time = s.solver_s !== null ? `${nf(s.solver_s, 2)} / ${nf(s.solve_rule_s, 1)}` : nf(s.solve_rule_s, 1);
    return `<tr class="clickable${sel}" data-id="${esc(s.id)}" tabindex="0">
      <td>${statusBadge(severityOf(s))}</td><td>${esc(s.run)}</td><td>${gridLabel(s)}</td><td>${esc(s.solver || "–")}</td>
      <td>${period}</td><td class="num">${s.buses}</td><td class="num">${time}</td>
      <td class="num">${nf(s.demand_TWh, 1)}</td><td class="num">${nf(s.co2_Mt, 1)}</td></tr>`;
  }).join("");
  $("table-runs").innerHTML = `<table><thead><tr><th>${t("status_col")}</th><th>${t("run_col")}</th><th>${t("grid_col")}</th>
    <th>${t("solver_col")}</th><th>${t("period_col")}</th><th class="num">${t("buses_col")}</th><th class="num">${t("time_col")}</th>
    <th class="num">${t("t_demand")} (TWh)</th><th class="num">${t("co2_mt_col")}</th></tr></thead><tbody>${rows}</tbody></table>`;
  $("table-runs").querySelectorAll("tr[data-id]").forEach((tr) => {
    const go = () => { selectCase(tr.dataset.id); document.getElementById("results").scrollIntoView(); };
    tr.addEventListener("click", go);
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
  });
}

async function renderCompare() {
  const details = await Promise.all(state.index.cases.map((s) => loadCase(s.id)));
  const labels = state.index.cases.map(caseLabel);
  const shares = details.map((d) => {
    const g = groupSum(d.results.energy_TWh);
    const total = Object.values(g).reduce((a, b) => a + b, 0) || 1;
    return { g, total };
  });
  const traces = GROUPS.filter((g) => shares.some((s) => (s.g[g] || 0) > 1e-6)).map((g) => ({
    type: "bar", orientation: "h", name: GROUP_LABEL[state.lang][g], y: labels,
    x: shares.map((s) => (100 * (s.g[g] || 0)) / s.total),
    customdata: shares.map((s) => s.g[g] || 0),
    marker: { color: groupColor(g), line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: `${GROUP_LABEL[state.lang][g]}: %{x:.1f}% · %{customdata:.1f} TWh<extra></extra>`,
  }));
  $("chart-compare").style.height = `${Math.max(240, 60 + 44 * labels.length)}px`;
  Plotly.react("chart-compare", traces, baseLayout({
    barmode: "stack", barcornerradius: 0, xaxis: { range: [0, 100], ticksuffix: "%" }, yaxis: { autorange: "reversed" },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 12 } },
  }), plotConfig);
}


// ---------- PyPSA-Earth default data vs Taiwan data ----------
// Mix categories in stack order; this order passes the palette's adjacent-pair checks.
const CMP_MIX = ["gas", "nuclear", "coal", "renewables", "storage", "other"];
const CMP_MIX_COLOR = { gas: "--c-gas", nuclear: "--c-nuclear", coal: "--c-coal", renewables: "--c-onwind",
                        storage: "--c-storage", other: "--c-other" };
const CMP_CAP = ["gas", "coal", "nuclear", "oil", "solar", "onwind", "offwind", "hydro", "phs", "battery"];

async function renderComparison() {
  if (state.comparison === undefined) {
    try {
      const res = await fetch("data/comparison.json");
      state.comparison = res.ok ? await res.json() : null;
    } catch { state.comparison = null; }
  }
  const c = state.comparison;
  if (!c) { $("compare").hidden = true; return; }
  $("compare").hidden = false;

  const labels = CMP_CAP.map((k) => t(`cap_${k}`));
  const bar = (key, name, color) => ({
    type: "bar", orientation: "h", name, y: labels, x: CMP_CAP.map((k) => c[key].capacity_GW[k] || 0),
    marker: { color, line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: `${name}<br>%{y}: %{x:.2f} GW<extra></extra>`,
  });
  Plotly.react("chart-cmp-capacity", [bar("default", t("src_default"), cssVar("--muted")), bar("taiwan", t("src_taiwan"), cssVar("--accent"))],
    baseLayout({ barmode: "group", yaxis: { autorange: "reversed" }, xaxis: { title: { text: "GW", font: { size: 11 } } } }), plotConfig);

  const gw = (v) => (v === undefined || v === null ? "0" : nf(v, 2));
  const d = c.default, tw = c.taiwan;
  const rows = [
    [t("p_demand"), `${nf(d.demand_TWh, 1)} TWh`, `${nf(tw.demand_TWh, 1)} TWh`, t("p_demand_ref")],
    [t("p_peak"), `${nf(d.peak_GW, 1)} GW`, `${nf(tw.peak_GW, 1)} GW`, t("p_peak_ref")(nf(c.reference.peak_GW_2024, 1))],
    [t("p_nuclear"), `${gw(d.capacity_GW.nuclear)} GW`, `${gw(tw.capacity_GW.nuclear)} GW`, t("p_nuclear_ref")],
    [t("p_coal"), `${gw(d.capacity_GW.coal)} GW`, `${gw(tw.capacity_GW.coal)} GW`, t("p_coal_ref")],
    [t("p_gas"), `${gw(d.capacity_GW.gas)} GW`, `${gw(tw.capacity_GW.gas)} GW`, ""],
    [t("p_solar"), `${gw(d.capacity_GW.solar)} GW`, `${gw(tw.capacity_GW.solar)} GW`, t("p_solar_ref")],
    [t("p_offwind"), `${gw(d.capacity_GW.offwind)} GW`, `${gw(tw.capacity_GW.offwind)} GW`, ""],
    [t("p_phs"), `${nf(d.phs_hours ?? 0, 0)} h`, `${nf(tw.phs_hours ?? 0, 0)} h`, t("p_phs_ref")],
    [t("p_battery"), `${gw(d.capacity_GW.battery)} GW`, `${gw(tw.capacity_GW.battery)} GW`, ""],
  ];
  $("table-cmp-params").innerHTML = table(
    [[t("p_item")], [t("src_default"), 1], [t("src_taiwan"), 1], [t("src_reference")]],
    rows.map((r) => [[r[0]], [r[1], 1], [r[2], 1], [esc(r[3])]]),
  );

  const mixRows = [
    { label: t("row_model_default"), share: d.mix_share },
    { label: t("row_model_taiwan"), share: tw.mix_share },
    ...c.actual_mix.map((a) => ({ label: `${t("src_reference")}: ${a.label}`, share: a.mix_share })),
  ];
  // Fold oil into "other" so that model and statistics use the same categories.
  const fold = (share) => { const f = { ...share }; f.other = (f.other || 0) + (f.oil || 0); delete f.oil; return f; };
  const traces = CMP_MIX.map((k) => ({
    type: "bar", orientation: "h", name: t(`grp_${k}`), y: mixRows.map((r) => r.label),
    x: mixRows.map((r) => 100 * (fold(r.share)[k] || 0)),
    marker: { color: cssVar(CMP_MIX_COLOR[k]), line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: `${t(`grp_${k}`)}: %{x:.1f}%<extra></extra>`,
  }));
  $("chart-cmp-mix").style.height = `${Math.max(260, 70 + 46 * mixRows.length)}px`;
  Plotly.react("chart-cmp-mix", traces, baseLayout({
    barmode: "stack", barcornerradius: 0, xaxis: { range: [0, 100], ticksuffix: "%" }, yaxis: { autorange: "reversed" },
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 12 } },
  }), plotConfig);
}


function renderSetup(summary) {
  const su = (summary && summary.setup) || (state.index && state.index.setup);
  if (!su) { $("setup-panel").hidden = true; return; }
  $("setup-panel").hidden = false;
  const sy = su.system_year;
  const rows = [
    [t("su_weather"), `${su.weather_year} (${su.cutout})`, t("su_weather_note")],
    [t("su_demand_shape"), `${su.demand_profile_year} / ${su.demand_profile_weather_year}`, t("su_demand_shape_note")(su.demand_profile_year, su.demand_profile_weather_year)],
    sy ? [t("su_demand_level"), `${sy} (${nf(su.demand_target_TWh, 1)} TWh)`, t("su_demand_level_future")(su.demand_scale, nf(su.demand_target_TWh, 1), sy)]
       : [t("su_demand_level"), "2024", t("su_demand_level_note")(su.demand_scale)],
    sy ? [t("su_fleet"), `${sy} (${t("su_planned")})`, t("su_fleet_future")(su.fleet_file)]
       : [t("su_fleet"), su.fleet_date || "–", t("su_fleet_note")(su.fleet)],
    [t("su_grid"), "today", t("su_grid_note")(su.transmission)],
    [t("su_costs"), String(su.costs_year), t("su_costs_note")],
    [t("su_resolution"), `${su.clusters} · ${su.opts}`, t("su_resolution_note")(su.clusters, su.opts)],
  ];
  const summaryText = sy ? t("su_summary_future")(sy, su.weather_year) : t("su_summary")(su.weather_year, su.fleet_date);
  $("table-setup").innerHTML = `<p class="note">${esc(summaryText)}</p>` +
    table([[t("su_input")], [t("su_year")], [t("su_note")]], rows.map((r) => [[esc(r[0])], [`<b>${esc(r[1])}</b>`], [esc(r[2])]])) +
    `<p class="note muted">${esc(su.config)}</p>`;
}


// ---------- Scenarios: other weather years and future years ----------
async function renderScenarios() {
  if (state.scenarios === undefined) {
    try {
      const res = await fetch("data/scenarios.json");
      state.scenarios = res.ok ? await res.json() : null;
    } catch { state.scenarios = null; }
  }
  const sc = state.scenarios;
  if (!sc) { $("scenarios").hidden = true; return; }
  $("scenarios").hidden = false;
  const label = (r) => (r.label === "today" ? t("sc_today") : r.label);

  const shareChart = (targetId, rows) => {
    const ok = rows.filter((r) => r.available);
    const groups = ok.map((r) => groupSum(r.energy_TWh));
    const totals = groups.map((g) => Object.values(g).reduce((a, b) => a + b, 0) || 1);
    const y = ok.map(label);
    const traces = GROUPS.filter((g) => groups.some((x) => (x[g] || 0) > 1e-6)).map((g) => ({
      type: "bar", orientation: "h", name: GROUP_LABEL[state.lang][g], y,
      x: groups.map((x, i) => (100 * (x[g] || 0)) / totals[i]),
      customdata: groups.map((x) => x[g] || 0),
      marker: { color: groupColor(g), line: { color: cssVar("--surface"), width: 2 } },
      hovertemplate: `%{y} · ${GROUP_LABEL[state.lang][g]}: %{x:.1f}% · %{customdata:.1f} TWh<extra></extra>`,
    }));
    $(targetId).style.height = `${Math.max(220, 110 + 44 * y.length)}px`;
    Plotly.react(targetId, traces, baseLayout({
      barmode: "stack", barcornerradius: 0, xaxis: { range: [0, 100], ticksuffix: "%" }, yaxis: { autorange: "reversed", type: "category" },
      legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 11 } },
    }), plotConfig);
  };

  const scenarioTable = (targetId, rows, withDemand) => {
    const head = [[t("sc_case")], ...(withDemand ? [[`${t("t_demand")} (TWh)`, 1], [t("peak_col"), 1]] : []),
      [t("sc_re"), 1], [`${GROUP_LABEL[state.lang].unserved} (GWh)`, 1], [t("co2_mt_col"), 1], [`${t("t_price")} (EUR/MWh)`, 1]];
    const body = rows.map((r) => {
      if (!r.available) return [[`<b>${esc(label(r))}</b>`], ...head.slice(1).map((_, i) => [i === 0 ? `<span class="muted">${t("sc_pending")}</span>` : "", 1])];
      return [[`<b>${esc(label(r))}</b>`],
        ...(withDemand ? [[nf(r.demand_TWh, 1), 1], [nf(r.peak_GW, 1), 1]] : []),
        [pct(r.re_share, 1), 1], [nf(r.unserved_GWh, 1), 1], [nf(r.co2_Mt, 1), 1],
        [`${nf(r.price_mean, 1)} <span class="muted">(${nf(ntd(r.price_mean), 2)})</span>`, 1]];
    });
    $(targetId).innerHTML = table(head, body);
    // Make available rows open their run.
    $(targetId).querySelectorAll("tbody tr").forEach((tr, i) => {
      const r = rows[i];
      if (!r.available) return;
      tr.classList.add("clickable");
      tr.tabIndex = 0;
      if (r.id === state.current) tr.classList.add("selected");
      const go = () => { selectCase(r.id); document.getElementById("results").scrollIntoView(); };
      tr.addEventListener("click", go);
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    });
  };

  shareChart("chart-sc-weather", sc.weather);
  scenarioTable("table-sc-weather", sc.weather, false);
  shareChart("chart-sc-future", sc.future);
  scenarioTable("table-sc-future", sc.future, true);

  // Installed capacity by group, one bar per future-year run.
  const ok = sc.future.filter((r) => r.available);
  const caps = ok.map((r) => groupSum(r.capacity_GW));
  const x = ok.map(label);
  const traces = GROUPS.filter((g) => g !== "unserved" && caps.some((c) => (c[g] || 0) > 1e-6)).map((g) => ({
    type: "bar", name: GROUP_LABEL[state.lang][g], x, y: caps.map((c) => c[g] || 0),
    marker: { color: groupColor(g), line: { color: cssVar("--surface"), width: 2 } },
    hovertemplate: `%{x} · ${GROUP_LABEL[state.lang][g]}: %{y:.1f} GW<extra></extra>`,
  }));
  const totals = caps.map((c) => Object.entries(c).filter(([g]) => g !== "unserved").reduce((a, [, v]) => a + v, 0));
  Plotly.react("chart-sc-capacity", traces, baseLayout({
    barmode: "stack", barcornerradius: 0, xaxis: { type: "category" }, yaxis: { title: { text: "GW", font: { size: 11 } } },
    // Category axes read numeric-looking x as an index, so annotate by position.
    annotations: x.map((xi, i) => ({ x: i, y: totals[i], text: `${nf(totals[i], 1)} GW`, showarrow: false, yanchor: "bottom",
                                     font: { color: cssVar("--ink-2"), size: 12 } })),
    legend: { orientation: "h", x: 0, y: 1.02, yanchor: "bottom", traceorder: "normal", font: { color: cssVar("--ink-2"), size: 11 } },
  }), plotConfig);
}

function renderFindings() {
  $("findings-list").innerHTML = FINDINGS[state.lang].map((f) => `<li>${f}</li>`).join("");
}

function applyStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-info-label]").forEach((el) => el.setAttribute("aria-label", t("more_info")));
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
  $("generated").textContent = state.index ? `${t("generated")}: ${state.index.generated}` : "";
  const select = $("case-select");
  if (state.index) {
    select.innerHTML = state.index.cases.map((s) => {
      const sev = { good: "✓", warning: "!", critical: "✕" }[severityOf(s)];
      return `<option value="${esc(s.id)}">${sev} ${esc(caseLabel(s))}</option>`;
    }).join("");
    select.value = state.current;
  }
}

async function loadCase(id) {
  if (!state.cache[id]) {
    const res = await fetch(`data/cases/${encodeURIComponent(id)}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${id}`);
    state.cache[id] = await res.json();
  }
  return state.cache[id];
}

async function renderAll() {
  applyStaticText();
  renderFindings();
  const d = await loadCase(state.current);
  renderSetup(d.summary);
  renderStatus(d.summary);
  renderTiles(d.summary);
  renderMix(d);
  renderDispatch(d);
  renderPrice(d);
  renderMap(d);
  renderInputs(d);
  renderRuns();
  await renderCompare();
  await renderScenarios();
  await renderComparison();
}

async function selectCase(id) {
  state.current = id;
  const url = new URL(location.href);
  url.searchParams.set("case", id);
  history.replaceState(null, "", url);
  await renderAll();
}

function defaultCase(cases) {
  const requested = new URL(location.href).searchParams.get("case");
  if (requested && cases.some((c) => c.id === requested)) return requested;
  if (state.index.featured) return state.index.featured;
  // Prefer a full-year run without extendable lines; among those, one that passes every check.
  const current = cases.filter((c) => c.transmission !== "copt");
  const fullYear = current.filter((c) => c.snapshots >= 1000);
  const pick = fullYear.find((c) => severityOf(c) === "good") || fullYear[fullYear.length - 1]
    || current.find((c) => severityOf(c) === "good") || cases[cases.length - 1];
  return pick.id;
}

function setupControls() {
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang;
    storageSet("tw-lang", state.lang);
    renderAll();
  }));
  $("case-select").addEventListener("change", (e) => selectCase(e.target.value));
  $("theme-toggle").addEventListener("click", () => {
    const dark = cssVar("color-scheme") === "dark";
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    storageSet("tw-theme", next);
    renderAll();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) renderAll();
  });
}

async function init() {
  const urlLang = new URL(location.href).searchParams.get("lang");
  state.lang = (urlLang || storageGet("tw-lang")) === "zh" ? "zh" : "en";
  const theme = storageGet("tw-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  setupControls();
  try {
    const res = await fetch("data/index.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    state.index = await res.json();
    state.current = defaultCase(state.index.cases);
    await renderAll();
  } catch (err) {
    applyStaticText();
    $("case-status").innerHTML = `<div class="status critical"><span class="icon" aria-hidden="true">!</span><span>${esc(t("loading_error"))}<br><small>${esc(err.message)}</small></span></div>`;
  }
}

init();
