"""Export Taiwan electrical grid, OSM topology, and gas/fuel network data for docs/grid.html.

Reads PyPSA-Earth OSM raw/clean tables, elec.nc, elec_s.nc, elec_s_6_ec.nc,
official MOEA/Taipower CSVs in data/, and verified official/open grid & LNG
infrastructure records, writing docs/data/grid_data.json.
"""

from __future__ import annotations

import ast
from collections import deque
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
for p in (str(ROOT), str(ROOT / "viewer")):
    if p not in sys.path:
        sys.path.insert(0, p)

import geopandas as gpd  # noqa: E402
import pandas as pd  # noqa: E402
import pypsa  # noqa: E402

from export_model_data import BASE_RUN, _r, busmaps, region_labels  # noqa: E402
from paths import MODEL_DIR  # noqa: E402


OFFICIAL_GRID_STATS = {
    "transmission_ckt_km": 18782,
    "distribution_ckt_km": 444649,
    "underground_cable_ckt_km": {
        "345": 122.591,
        "161": 3451.525,
        "69": 1869.180,
        "total": round(122.591 + 3451.525 + 1869.180, 3),
    },
    "substations_total": 627,
    "substations_by_class": [
        {
            "tier": "E/S",
            "voltage_kv": "345 / 161",
            "name_en": "Extra-high voltage substations (E/S)",
            "name_zh": "超高壓變電所 (E/S)",
            "count": 37,
            "role_en": "Link major power plants and the 345 kV north-south trunk corridors to 161 kV regional grids.",
            "role_zh": "串聯大型電廠與 345 kV 南北超高壓主幹線，並降壓轉供 161 kV 區域電網。",
        },
        {
            "tier": "P/S",
            "voltage_kv": "161 / 69",
            "name_en": "Primary substations (P/S)",
            "name_zh": "一次變電所 (P/S)",
            "count": 53,
            "role_en": "Step down 161 kV sub-transmission to 69 kV sub-transmission or industrial feeders.",
            "role_zh": "將 161 kV 一次輸電降壓為 69 kV 二次輸電，供應區域變電所及大型工業用戶。",
        },
        {
            "tier": "D/S",
            "voltage_kv": "161 / 22–11",
            "name_en": "Distribution substations (D/S)",
            "name_zh": "一次配電變電所 (D/S)",
            "count": 257,
            "role_en": "Step directly from 161 kV to 22/11 kV distribution for dense urban areas and science parks.",
            "role_zh": "直接由 161 kV 降壓為 22/11 kV 配電，近年都會區與科學園區擴建主力。",
        },
        {
            "tier": "S/S",
            "voltage_kv": "69 / 22–11",
            "name_en": "Secondary substations (S/S)",
            "name_zh": "二次變電所 (S/S)",
            "count": 280,
            "role_en": "Step 69 kV regional transmission down to 22/11 kV distribution feeders.",
            "role_zh": "接受 69 kV 區域輸電電力，降壓為 22/11 kV 配電饋線供一般用戶。",
        },
    ],
    "source_id": "taipower_transmission_stats",
    "evidence": "search_summary",
}

RESILIENCE_PLAN = {
    "title_en": "10-Year Grid Resilience Strengthening Plan (2022–2032)",
    "title_zh": "強化電網韌性建設計畫（2022–2032 年）",
    "total_billion_ntd": 564.5,
    "source_id": "taipower_grid_resilience_2022",
    "evidence": "search_summary",
    "pillars": [
        {
            "key": "decentralisation",
            "name_en": "Force decentralisation (力求分散)",
            "name_zh": "力求分散（降低電網集中風險）",
            "budget_billion_ntd": 437.9,
            "details_en": "Direct generation supply to science/industrial parks, local green-power consumption, decoupling Longtan/Zhongliao/Longqi 345 kV super-hubs, new urban substations (e.g. Daan, Wanlong), multi-tier CDCC/ADCC/DDCC dispatch.",
            "details_zh": "電廠直供科學與產業園區、綠能分散就地供電、龍潭/中寮/龍崎三大 345 kV 樞紐節點分群、增設大安/萬隆等都會節點、精進多層級調度。",
        },
        {
            "key": "strengthening",
            "name_en": "Continuous strengthening (持續強固)",
            "name_zh": "持續強固（設備更新與儲能）",
            "budget_billion_ntd": 125.0,
            "details_en": "Line capacity expansion & aging equipment replacement, grid storage expansion, indoor substation conversion to shield against extreme weather, salt mist, and wildlife.",
            "details_zh": "汰換老舊輸配電設備與線路擴容、廣增儲能系統、變電所屋內化改建以降低颱風、鹽塵害與外力干擾。",
        },
        {
            "key": "defence",
            "name_en": "Strengthened defence (加強防衛)",
            "name_zh": "加強防衛（保護電驛與動態監測）",
            "budget_billion_ntd": 1.69,
            "details_en": "Multi-layer protection relay coordination across plants and substations to isolate faults instantaneously plus real-time insulation/condition monitoring.",
            "details_zh": "全面檢視電廠、變電所與線路保護電驛設定以建立防衛縱深、即時隔離故障點，並強化動態監測與絕緣診斷。",
        },
    ],
}

BOTTLENECKS_AND_UPGRADES = {
    "transfer_margins_2022": {
        "south_to_central_MW": 1608,
        "central_to_north_MW": 104,
        "source_id": "ndc_2050_grid_storage",
        "evidence": "downloaded",
        "pdf_page": "22 (printed p. 20)",
    },
    "trunk_upgrades": [
        {
            "corridor_en": "345 kV Trunk Line 1 (Longtan–Zhongliao / Longqi S.–Renwu)",
            "corridor_zh": "345 kV 超一路（龍潭~中寮段、龍崎南~仁武線）",
            "before_MW": 1000,
            "after_MW": 3000,
            "target_year": "2030",
        },
        {
            "corridor_en": "345 kV Trunk Line 2 (Longtan–Emei / Yihe–Zhongliao)",
            "corridor_zh": "345 kV 超二路（龍潭~峨眉線、義和~中寮線）",
            "before_MW": 2000,
            "after_MW": 3000,
            "target_year": "2030",
        },
        {
            "corridor_en": "345 kV Trunk Line 3 (Zhuyuan–Zhongliao)",
            "corridor_zh": "345 kV 超三路（竹園~中寮段）",
            "before_MW": 2000,
            "after_MW": 3000,
            "target_year": "2030",
        },
    ],
    "renewable_and_storage_kpis": [
        {
            "item_en": "Offshore wind grid strengthening (7 stations / 7 lines)",
            "item_zh": "離岸風電加強電力網（7 站 7 線）",
            "value": "+11.0 GW",
            "timeline": "2025",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "Dedicated coastal collector substations and trunk connections in western offshore corridors.",
            "note_zh": "西部離岸風電上岸併網專用變電站與輸電幹線補強。",
        },
        {
            "item_en": "Solar PV grid strengthening (9 stations / 10 lines)",
            "item_zh": "太陽光電加強電力網（9 站 10 線）",
            "value": "+6.5 GW",
            "timeline": "2025",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "Central–south and eastern solar booster substations and trunk tie-lines.",
            "note_zh": "中南部及東部光電熱區升壓與輸電線路擴建。",
        },
        {
            "item_en": "Dynamic reactive power compensators (STATCOM)",
            "item_zh": "靜態同步補償器 (STATCOM)",
            "value": "4 units",
            "timeline": "2025",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "Installed at key 161/345 kV substations to maintain voltage stability under high inverter share.",
            "note_zh": "設置於關鍵輸電變電所，維持高再生能源佔比下之動態電壓穩定。",
        },
        {
            "item_en": "Grid-connected battery storage (actual Jul 2025)",
            "item_zh": "全國併網型儲能實際建置（2025 年 7 月）",
            "value": "1.42 GW",
            "timeline": "2025-07",
            "source_id": "moea_psd_fy2024",
            "note_en": "1.41 GW AFC/E-dReg utility/market storage + 0.01 GW behind-the-meter (printed p. 17).",
            "note_zh": "含 1.41 GW 電力交易平台調頻與 E-dReg 及 0.01 GW 用戶端儲能（報告第 17 頁）。",
        },
        {
            "item_en": "Battery storage policy targets (2025 / 2030)",
            "item_zh": "儲能系統政策目標（2025 / 2030 年）",
            "value": "1.5 GW / 5.5 GW",
            "timeline": "2025 / 2030",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "Plus new pumped-hydro projects under assessment at Guangming and Shimen (PDF p. 15).",
            "note_zh": "另推動光明、石門等新抽蓄水力計畫（關鍵戰略 PDF 第 15 頁）。",
        },
        {
            "item_en": "Demand response peak-reduction achieved (2024)",
            "item_zh": "需量反應抑低尖峰實績（2024 年）",
            "value": "1,314 MW",
            "timeline": "2024",
            "source_id": "moea_psd_fy2024",
            "note_en": "934 MW traditional utility programmes + 380 MW aggregator bidding & E-dReg (printed p. 10).",
            "note_zh": "含傳統需量反應 934 MW 及電力交易平台聚合需量反應／E-dReg 380 MW（報告第 10 頁）。",
        },
        {
            "item_en": "Smart meters (AMI) deployment (2022 -> 2025 -> 2030)",
            "item_zh": "智慧電表 (AMI) 累計布建目標",
            "value": "2.25M -> 3.0M -> 6.0M",
            "timeline": "2022–2030",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "AMI rollout supporting time-of-use pricing and automated distribution visibility (PDF pp. 30–31).",
            "note_zh": "支撐時間電價與配電網即時資訊可視化（PDF 第 30–31 頁）。",
        },
        {
            "item_en": "IEC 61850 digital substations (2025 -> 2030)",
            "item_zh": "變電所 IEC 61850 數位化自動化累計目標",
            "value": "50 -> 185 stations",
            "timeline": "2025 / 2030",
            "source_id": "ndc_2050_grid_storage",
            "note_en": "Paired with 4,200 (2025) to 8,600 (2030) FDIR fault-isolating feeders and CDCC/ADCC/DDCC centres.",
            "note_zh": "搭配 FDIR 自動化饋線 4,200（2025）至 8,600（2030）條及分級調度中心（CDCC/ADCC/DDCC）。",
        },
    ],
}

LNG_TERMINALS = [
    {
        "order": 1,
        "code": "LNG-1",
        "name_en": "Yongan LNG Terminal",
        "name_zh": "一接｜永安液化天然氣接收站",
        "operator": "CPC 中油",
        "location_en": "Yongan, Kaohsiung",
        "location_zh": "高雄市永安區",
        "lat": 22.8098,
        "lon": 120.2053,
        "status_en": "Operating (Phase 5 tank expansion planned)",
        "status_zh": "營運中（永安五期儲槽擴建規劃）",
        "tanks_capacity_en": "6 existing tanks (~690k kL); expanding underground/aboveground (~400k kL); >12 Mt/yr design",
        "tanks_capacity_zh": "既有 6 座儲槽約 69 萬公秉；規劃五期增建約 40 萬公秉，年輸氣設計量逾 1,200 萬噸",
        "pipelines_en": "Subsea Line #1 & new 36\" 233 km Subsea Line #2 to Tongxiao; onshore western trunk",
        "pipelines_zh": "既有一條及新建 36 吋約 233 km 永安–通霄第二條海底輸氣管；接西部陸上幹線",
    },
    {
        "order": 2,
        "code": "LNG-2",
        "name_en": "Taichung LNG Terminal",
        "name_zh": "二接｜台中液化天然氣接收站",
        "operator": "CPC 中油",
        "location_en": "Taichung Port (Wuqi)",
        "location_zh": "台中市梧棲區（台中港）",
        "lat": 24.2750,
        "lon": 120.5125,
        "status_en": "Operating (Phase 3 & 4 outer-port expansion)",
        "status_zh": "營運中（推動三期與四期港外擴建）",
        "tanks_capacity_en": "6 existing tanks (960k kL); Phase 3 +2×180k kL (+360k kL); Phase 4 outer-port plan up to ~8 tanks",
        "tanks_capacity_zh": "既有 6 座共 96 萬公秉；三期增建 2 座各 18 萬公秉；四期港外擴建持續增容",
        "pipelines_en": "Central–north onshore & subsea interconnects; tee backups shared with Taipower LNG-5",
        "pipelines_zh": "通往中北部轉輸中心之海陸管線，並與台電五接預留分歧管互為備援",
    },
    {
        "order": 3,
        "code": "LNG-3",
        "name_en": "Guantang (Datan) LNG Terminal",
        "name_zh": "三接｜觀塘液化天然氣接收站",
        "operator": "CPC 中油",
        "location_en": "Guanyin (Datan), Taoyuan",
        "location_zh": "桃園市觀音區大潭",
        "lat": 25.0455,
        "lon": 121.0608,
        "status_en": "Commissioning / Operating (Phase 1 offshore-shift)",
        "status_zh": "試轉／啟用（外推一期）；規劃後線二期",
        "tanks_capacity_en": "Phase 1: 2×160k kL (320k kL); Phase 2 planning +6×180k kL (1,080k kL)",
        "tanks_capacity_zh": "一期（外推方案）2 座各 16 萬公秉（共 32 萬公秉）；二期規劃增設 6 座共 108 萬公秉",
        "pipelines_en": "Feeds Datan Power Plant + northern grid; backed by 2nd Tongxiao–Datan subsea pipeline",
        "pipelines_zh": "直供大潭電廠及北部用氣；搭配「通霄–大潭第二條海底輸氣管線」強化備援",
    },
    {
        "order": 4,
        "code": "LNG-4",
        "name_en": "Xiehe (Hsieh-ho) LNG Terminal",
        "name_zh": "四接｜協和液化天然氣接收站",
        "operator": "Taipower 台電",
        "location_en": "Waimushan / Hsieh-ho, Keelung",
        "location_zh": "基隆市中山區（協和電廠）",
        "lat": 25.1573,
        "lon": 121.7393,
        "status_en": "EIA approved (reclaimed eastern-shift plan)",
        "status_zh": "已通過環評大會（東移填海造陸方案）",
        "tanks_capacity_en": "2 planned tanks (~160k–180k kL each, ~320k kL total)",
        "tanks_capacity_zh": "規劃 2 座各約 16–18 萬公秉儲槽（合計約 32 萬公秉）",
        "pipelines_en": "Supplies Keelung Hsieh-ho oil-to-gas CCGT conversion as an independent eastern–northern gas source",
        "pipelines_zh": "專供協和電廠「油改氣」新建燃氣機組，形成東北部獨立區域氣源",
    },
    {
        "order": 5,
        "code": "LNG-5",
        "name_en": "Taichung Harbor Taipower Terminal",
        "name_zh": "五接｜台中港液化天然氣接收站",
        "operator": "Taipower 台電",
        "location_en": "Taichung Port Outer Zone",
        "location_zh": "台中港外港區（配合中火燃氣）",
        "lat": 24.2480,
        "lon": 120.4950,
        "status_en": "Under development (with Taichung new CCGT)",
        "status_zh": "推動興建（配合中火一、二期燃氣機組）",
        "tanks_capacity_en": "Taichung CCGT Phase 1 (5×160k kL = 800k kL) + Phase 2 planned (4 tanks, ~640k–720k kL)",
        "tanks_capacity_zh": "含中火一期 5 座 16 萬公秉（80 萬公秉）及二期規劃 4 座（約 64–72 萬公秉）",
        "pipelines_en": "~3 km onshore line to Taichung Power Plant + planned 36\" subsea pipeline to Tunghsiao",
        "pipelines_zh": "以約 3 公里陸管直供中火，並規劃 36 吋海管連接通霄電廠與中油管網互聯",
    },
    {
        "order": 6,
        "code": "LNG-6",
        "name_en": "Mailiao LNG Terminal",
        "name_zh": "六接｜麥寮液化天然氣接收站",
        "operator": "FPCC 台塑石化（民營首例）",
        "location_en": "Mailiao Industrial Port, Yunlin",
        "location_zh": "雲林縣麥寮六輕工業區南碼頭",
        "lat": 23.7699,
        "lon": 120.1665,
        "status_en": "Broke ground late 2025; target COD late 2029",
        "status_zh": "2025 年底聯合動土，預計 2029 年底商轉",
        "tanks_capacity_en": "Phase 1: 2×160k kL double-dome aboveground tanks (full build up to 4 tanks, ~640k–720k kL)",
        "tanks_capacity_zh": "一期興建 2 座各 16 萬公秉地上型儲槽（全期規劃最多 4 座，約 64–72 萬公秉）",
        "pipelines_en": "Dedicated southern wharf (260k m3 LNG carrier) + plant onshore line to 2×1.2 GW Mailiao CCGT",
        "pipelines_zh": "新建麥寮南公用碼頭（可泊靠 26 萬公秉 LNG 船），以廠區陸管直供台塑煤轉氣機組",
    },
    {
        "order": 7,
        "code": "LNG-7",
        "name_en": "Kaohsiung Intercontinental LNG Terminal",
        "name_zh": "七接｜高雄洲際液化天然氣接收站",
        "operator": "CPC 中油",
        "location_en": "Port of Kaohsiung Intercontinental Phase 2 (Siaogang)",
        "location_zh": "高雄市小港區（高雄港洲際貨櫃二期）",
        "lat": 22.5183,
        "lon": 120.3136,
        "status_en": "EIA approved late 2024",
        "status_zh": "2024 年底通過環評大會審查",
        "tanks_capacity_en": "Initial 4×180k kL tanks (720k kL), expandable to 6 tanks (~1,080k kL); Phase 1 ~6 Mt/yr capacity",
        "tanks_capacity_zh": "初期規劃 4 座各 18 萬公秉儲槽（長期 4–6 座、72–108 萬公秉），一期年接收能力約 600 萬噸",
        "pipelines_en": "Dual 36\" onshore lines to Talin PP isolation station + Dalinpu distribution station linking Hsinta & Yongan",
        "pipelines_zh": "規劃雙條 36 吋陸管至大林電廠隔離站，遠程銜接大林蒲配氣站並支援興達、永安站",
    },
]

# Schematic polylines joining verified terminal/plant coordinates to illustrate the figure-8 subsea & onshore corridors.
GAS_PIPELINE_CORRIDORS = [
    {
        "id": "gp_yongan_tongxiao_subsea",
        "name_en": "Yongan – Tongxiao Subsea Pipeline #1 & #2 (~233 km, 36\")",
        "name_zh": "永安 – 通霄海管第一及第二條（36 吋、約 233 公里）",
        "kind": "subsea",
        "status_en": "#1 Operating; #2 Under investment plan",
        "status_zh": "一號營運中；二號海管強化南氣北送備援",
        "points": [[120.2053, 22.8098], [119.95, 23.35], [119.98, 23.85], [120.28, 24.28], [120.6714, 24.4906]],
        "role_en": "Main offshore spine moving southern LNG gas past central hubs directly to the Tongxiao hub.",
        "role_zh": "台灣西部海域主幹輸氣線，直接將南部氣源北送通霄轉輸中心。",
    },
    {
        "id": "gp_taichung_tongxiao_subsea",
        "name_en": "Taichung Port (LNG-2 / LNG-5) – Tongxiao Subsea Interconnect (36\")",
        "name_zh": "台中港（二接／五接）– 通霄 36 吋海管互聯線",
        "kind": "subsea",
        "status_en": "Operating (CPC) + Planned backup (Taipower LNG-5)",
        "status_zh": "中油既設；台電五接規劃 36 吋海管備援",
        "points": [[120.5125, 24.2750], [120.4950, 24.2480], [120.43, 24.38], [120.6714, 24.4906]],
        "role_en": "Links central LNG receiving and Taichung Power Plant gas supply to Tongxiao Hub.",
        "role_zh": "連結台中港接收站群、中火廠區與通霄樞紐。",
    },
    {
        "id": "gp_tongxiao_datan_subsea",
        "name_en": "Tongxiao – Datan Subsea Pipelines #1 & #2",
        "name_zh": "通霄 – 大潭第一及第二條海底輸氣管線",
        "kind": "subsea",
        "status_en": "#1 Operating; #2 Built with LNG-3 backup",
        "status_zh": "雙迴路備援北部大潭電廠與北部配氣",
        "points": [[120.6714, 24.4906], [120.72, 24.75], [120.88, 24.93], [121.0458, 25.0253]],
        "role_en": "Connects central-north gas transfer centre at Tongxiao with Datan Power Plant & Guantang (LNG-3).",
        "role_zh": "連接通霄轉輸中心與桃園大潭電廠／觀塘三接。",
    },
    {
        "id": "gp_west_onshore_trunk",
        "name_en": "Western Onshore Long-Distance Trunk (Yongan – Taichung – Tongxiao – Hsinchu/Taoyuan)",
        "name_zh": "西部陸上長途輸氣幹線（永安 – 台中 – 通霄 – 觀塘/大潭）",
        "kind": "onshore",
        "status_en": "Operating (paired with regional distribution stations)",
        "status_zh": "營運中（搭配各配氣／隔離計量站構成 8 字路網）",
        "points": [[120.2053, 22.8098], [120.27, 23.15], [120.36, 23.52], [120.52, 24.02], [120.5125, 24.2750], [120.6714, 24.4906], [120.96, 24.78], [121.0608, 25.0455]],
        "role_en": "Forms the onshore loop paired with the western subsea spine ('figure-8 redundancy').",
        "role_zh": "與海域輸氣管構成陸海雙線「8 字形相互備援環網」。",
    },
    {
        "id": "gp_south_kaohsiung_ring",
        "name_en": "Southern Power-Plant Ring (Intercontinental LNG-7 – Talin – Nanpu – Hsinta – Yongan)",
        "name_zh": "南區電廠輸氣環線（洲際七接 – 大林 – 南部 – 興達 – 永安）",
        "kind": "onshore",
        "status_en": "Existing southern links + LNG-7 dual 36\" onshore extension",
        "status_zh": "既有南區管網 + 七接雙 36 吋陸管延伸串聯",
        "points": [[120.3136, 22.5183], [120.3337, 22.5353], [120.3005, 22.6005], [120.25, 22.74], [120.2053, 22.8098], [120.1973, 22.8523]],
        "role_en": "Directly links southern Kaohsiung coal-to-gas thermal cluster with Yongan and Intercontinental terminals.",
        "role_zh": "直供大林、南部、興達電廠群並互通永安與洲際兩大南部接收站。",
    },
]

FUEL_PORTS_AND_STOCKS = [
    {
        "category": "coal_port",
        "name_en": "Linkou Power Plant Coal Unloading Jetty",
        "name_zh": "林口電廠專用卸煤碼頭",
        "capacity_en": "2,400 MW ultra-supercritical coal",
        "capacity_zh": "2,400 MW 超超臨界燃煤",
        "lat": 25.1200,
        "lon": 121.2991,
        "stock_rule_en": "~41 days Taipower coal stockpile (search summary; varies seasonally)",
        "stock_rule_zh": "台電燃煤安全存量約 41 天（搜尋摘要參考值，隨季變動）",
    },
    {
        "category": "coal_port",
        "name_en": "Taichung Port / Taichung Power Plant Coal Terminal",
        "name_zh": "台中港／台中電廠卸煤儲煤場",
        "capacity_en": "5,500 MW coal + indoor coal storage domes",
        "capacity_zh": "5,500 MW 燃煤機組與室內煤倉",
        "lat": 24.2152,
        "lon": 120.4815,
        "stock_rule_en": "Major central coal import & enclosed storage hub",
        "stock_rule_zh": "中部最重要煤炭輸入與封閉式煤倉調度樞紐",
    },
    {
        "category": "coal_port",
        "name_en": "Mailiao Industrial Port (Coal & Crude / Refined Oil)",
        "name_zh": "麥寮工業專用港（卸煤與石化油品）",
        "capacity_en": "FPCC refinery + Mailiao coal/CFB power plants",
        "capacity_zh": "台塑石化煉油與麥寮發電廠",
        "lat": 23.8031,
        "lon": 120.1905,
        "stock_rule_en": "Petroleum Administration Act: >=60 days industry + >=30 days govt oil stockpile",
        "stock_rule_zh": "《石油管理法》規定：石油業者 >=60 天 + 政府儲油 >=30 天（實務逾 100–146 天）",
    },
    {
        "category": "coal_port",
        "name_en": "Kaohsiung Talin / Hsinta Coal Terminals",
        "name_zh": "高雄大林／興達燃煤卸運點",
        "capacity_en": "1,600 MW Talin coal + 550 MW Hsinta legacy coal (retiring/standby)",
        "capacity_zh": "大林燃煤 1,600 MW 及興達備役／除役機組",
        "lat": 22.5353,
        "lon": 120.3337,
        "stock_rule_en": "Also co-located with CPC Dalin Oil Refinery",
        "stock_rule_zh": "鄰近中油大林煉油廠之南部海運能源門戶",
    },
    {
        "category": "coal_port",
        "name_en": "Heping Industrial Port (East Taiwan Coal)",
        "name_zh": "花蓮和平工業專用港（東部唯一卸煤樞紐）",
        "capacity_en": "1,308.6 MW Ho-Ping IPP coal plant",
        "capacity_zh": "和平民營燃煤電廠 1,308.6 MW",
        "lat": 24.3066,
        "lon": 121.7657,
        "stock_rule_en": "Feeds east-coast baseload independently of west-coast ports",
        "stock_rule_zh": "台灣東部唯一卸煤工業港，支應東部基載電源",
    },
    {
        "category": "refinery",
        "name_en": "CPC Taoyuan Refinery",
        "name_zh": "台灣中油桃園煉油廠",
        "capacity_en": "Northern petroleum refining & storage",
        "capacity_zh": "北部石油煉製與油料調度中心",
        "lat": 25.0250,
        "lon": 121.3010,
        "stock_rule_en": "Statutory oil reserves >=90 days total (reported >100–146 days actual)",
        "stock_rule_zh": "法定石油儲量合計 >=90 天（公開摘要實績常逾 100–146 天）",
    },
    {
        "category": "lng_rule",
        "name_en": "Statutory LNG Safety Stock Schedule",
        "name_zh": "天然氣事業法定安全存量與儲槽容積規範",
        "capacity_en": "Safety stock: 7 d (2019) -> 8 d (2022) -> 11 d (2025) -> 14 d (2027)",
        "capacity_zh": "安全存量天數：7天(2019) -> 8天(2022) -> 11天(2025) -> 14天(2027)",
        "lat": 25.0455,
        "lon": 121.0608,
        "stock_rule_en": "Required tank volume capacity: 16 d (2022–24) -> 20 d (2025–26) -> 24 d (2027+)",
        "stock_rule_zh": "法定儲槽容積天數：16天(2022-24) -> 20天(2025-26) -> 24天(2027起)",
    },
]


def _clean_str(val) -> str:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return ""
    s = str(val).strip()
    return "" if s.lower() == "nan" else s


def parse_lonlat(raw: str):
    """Parse earth-osm lonlat string into (points_list, lon_center, lat_center)."""
    s = _clean_str(raw)
    if not s:
        return [], None, None
    try:
        parsed = ast.literal_eval(s)
    except (ValueError, SyntaxError):
        return [], None, None
    if isinstance(parsed, tuple) and len(parsed) == 2 and isinstance(parsed[0], (int, float)):
        pts = [(round(float(parsed[0]), 4), round(float(parsed[1]), 4))]
    elif isinstance(parsed, (list, tuple)) and parsed:
        pts = [(round(float(p[0]), 4), round(float(p[1]), 4)) for p in parsed if len(p) >= 2]
    else:
        return [], None, None
    if not pts:
        return [], None, None
    lon_c = round(sum(p[0] for p in pts) / len(pts), 4)
    lat_c = round(sum(p[1] for p in pts) / len(pts), 4)
    pts = [(round(p[0], 3), round(p[1], 3)) for p in pts]
    if len(pts) > 5:
        step = max(1, (len(pts) - 1) // 4)
        pts = pts[:-1:step] + [pts[-1]]
    return pts, lon_c, lat_c


def line_length_km(raw: str) -> float:
    """Compute approximate polyline length (km) from full earth-osm coordinate string."""
    s = _clean_str(raw)
    if not s:
        return 0.0
    try:
        parsed = ast.literal_eval(s)
    except (ValueError, SyntaxError):
        return 0.0
    if not isinstance(parsed, (list, tuple)) or len(parsed) < 2 or isinstance(parsed[0], (int, float)):
        return 0.0
    total = 0.0
    r_km = 6371.0
    for a, b in zip(parsed[:-1], parsed[1:]):
        lon1, lat1, lon2, lat2 = map(math.radians, [a[0], a[1], b[0], b[1]])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        total += 2 * r_km * math.asin(min(1.0, math.sqrt(h)))
    return round(total, 2)


def parse_voltages_kv(raw) -> tuple[list[int], int | None]:
    s = _clean_str(raw)
    if not s:
        return [], None
    vals = []
    for part in s.replace(",", ";").split(";"):
        part = part.strip()
        if not part:
            continue
        try:
            v = float(part)
        except ValueError:
            continue
        # OSM tags.voltage is in Volts; ignore secondary LV tags (< 1 kV) like 750 V / 220 V / 120 V.
        if v < 1000.0:
            continue
        kv = int(round(v / 1000.0))
        if kv > 0 and kv not in vals:
            vals.append(kv)
    vals.sort(reverse=True)
    return vals, (vals[0] if vals else None)


def classify_substation_tier(v_max: int | None, sub_tag: str, name: str) -> str:
    nm = name or ""
    if "超高壓" in nm or "E/S" in nm or (v_max is not None and v_max >= 345):
        return "E/S"
    if "一次配電" in nm or "配電" in nm or "D/S" in nm:
        return "D/S"
    if "一次" in nm or "P/S" in nm:
        return "P/S"
    if "二次" in nm or "S/S" in nm:
        return "S/S"
    if v_max == 161:
        return "D/S" if sub_tag == "distribution" else "P/S"
    if v_max is not None and 50 <= v_max <= 100:
        return "S/S"
    if sub_tag in ("distribution", "minor_distribution"):
        return "D/S"
    if sub_tag == "transmission":
        return "P/S"
    return "Other"


def osm_url(osm_type: str, osm_id) -> str:
    kind = "node" if osm_type == "node" else "way"
    return f"https://www.openstreetmap.org/{kind}/{osm_id}"


def assign_regions(points: list[tuple[float, float]], reg6_gdf: gpd.GeoDataFrame) -> list[str]:
    """Assign each (lon, lat) point to one of TW0 0..TW0 5 by polygon containment or nearest region."""
    if not points:
        return []
    pts_gdf = gpd.GeoDataFrame(
        {"idx": range(len(points))},
        geometry=gpd.points_from_xy([p[0] for p in points], [p[1] for p in points]),
        crs="EPSG:4326",
    )
    joined = gpd.sjoin(pts_gdf, reg6_gdf[["name", "geometry"]], how="left", predicate="within")
    joined = joined.drop_duplicates(subset=["idx"])
    out = list(joined.sort_values("idx")["name"].fillna(""))
    centroids = [(str(r["name"]), r.geometry.centroid.x, r.geometry.centroid.y) for _, r in reg6_gdf.iterrows()]
    for i, val in enumerate(out):
        if not val:
            lon, lat = points[i]
            out[i] = min(centroids, key=lambda c: (c[1] - lon) ** 2 + (c[2] - lat) ** 2)[0]
    return out


def connected_components_sizes(buses: pd.Index, edges: list[tuple[str, str]]) -> list[int]:
    adj = {str(b): [] for b in buses}
    for u, v in edges:
        su, sv = str(u), str(v)
        if su in adj and sv in adj:
            adj[su].append(sv)
            adj[sv].append(su)
    seen = set()
    sizes = []
    for b in adj:
        if b in seen:
            continue
        q = deque([b])
        seen.add(b)
        cnt = 0
        while q:
            cur = q.popleft()
            cnt += 1
            for nxt in adj[cur]:
                if nxt not in seen:
                    seen.add(nxt)
                    q.append(nxt)
        sizes.append(cnt)
    return sorted(sizes, reverse=True)


def simplify_region_shapes(reg6_gdf: gpd.GeoDataFrame, labels: dict) -> list[dict]:
    shapes = []
    for _, row in reg6_gdf.sort_values("name").iterrows():
        rid = str(row["name"])
        geom = row.geometry.simplify(0.015, preserve_topology=True)
        polys = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
        rings = []
        for poly in polys:
            coords = [[round(x, 3), round(y, 3)] for x, y in poly.exterior.coords]
            if len(coords) >= 4:
                rings.append(coords)
        lbl = labels.get(rid, {"en": rid, "zh": rid})
        shapes.append({
            "id": rid,
            "name_en": lbl["en"],
            "name_zh": lbl["zh"],
            "lon": _r(row.geometry.centroid.x, 4),
            "lat": _r(row.geometry.centroid.y, 4),
            "rings": rings,
        })
    return shapes


def build_historical_series() -> list[dict]:
    """Read MOEA annual indicators (2005–2025) for line losses, load factor, peak/avg load & reserve."""
    ind = pd.read_csv(ROOT / "data" / "official" / "moeaea_energy_indicators_annual.csv", encoding="utf-8-sig")
    rows = []
    for _, r in ind.sort_values("西元年").iterrows():
        rows.append({
            "year": int(r["西元年"]),
            "line_loss_pct": _r(r["線路損失率(%)"], 2),
            "load_factor_pct": _r(r["負載率(%)"], 2),
            "avg_load_MW": _r(float(r["平均負載(千瓩)"]) / 1.0, 1),
            "peak_load_MW": _r(float(r["尖峰負載(千瓩)"]) / 1.0, 1),
            "reserve_margin_pct": _r(r["備用容量率(%)"], 2),
        })
    return rows


def build_osm_grid(res: Path, reg6_gdf: gpd.GeoDataFrame, labels: dict) -> dict:
    raw_sub = pd.read_csv(res / "osm" / "raw" / "all_raw_substations.csv", low_memory=False)
    raw_lin = pd.read_csv(res / "osm" / "raw" / "all_raw_lines.csv", low_memory=False)
    raw_cab = pd.read_csv(res / "osm" / "raw" / "all_raw_cables.csv", low_memory=False)

    sub_pts = []
    substations = []
    for _, r in raw_sub.iterrows():
        _, lon_c, lat_c = parse_lonlat(r.get("lonlat"))
        if lon_c is None or lat_c is None:
            continue
        name_zh = _clean_str(r.get("tags.name:zh")) or _clean_str(r.get("tags.name"))
        name_en = _clean_str(r.get("tags.name:en")) or name_zh or f"OSM {r.get('id')}"
        vs, vmax = parse_voltages_kv(r.get("tags.voltage"))
        sub_tag = _clean_str(r.get("tags.substation"))
        tier = classify_substation_tier(vmax, sub_tag, name_zh or name_en)
        sub_pts.append((lon_c, lat_c))
        substations.append({
            "id": int(r["id"]),
            "osm_type": _clean_str(r.get("Type")) or "area",
            "name_zh": name_zh or f"OSM #{int(r['id'])}",
            "name_en": name_en,
            "operator": _clean_str(r.get("tags.operator:zh")) or _clean_str(r.get("tags.operator")),
            "voltages_kv": vs,
            "v_max_kv": vmax,
            "tier": tier,
            "substation_tag": sub_tag,
            "location": _clean_str(r.get("tags.location")),
            "rating": _clean_str(r.get("tags.rating")),
            "lon": lon_c,
            "lat": lat_c,
        })

    sub_regs = assign_regions(sub_pts, reg6_gdf)
    for item, reg in zip(substations, sub_regs):
        item["region"] = reg

    def extract_ways(df: pd.DataFrame, default_kind: str) -> list[dict]:
        items = []
        mid_pts = []
        for _, r in df.iterrows():
            pts, lon_c, lat_c = parse_lonlat(r.get("lonlat"))
            if len(pts) < 2 or lon_c is None:
                continue
            vs, vmax = parse_voltages_kv(r.get("tags.voltage"))
            loc = _clean_str(r.get("tags.location"))
            kind = "subsea_cable" if loc == "underwater" else ("cable" if default_kind == "cable" else "overhead")
            if vmax == 690:
                anomaly = "OSM tags.voltage=690000 typo (likely 69 kV Chuying feeder) creates 690 kV Bus 91 in elec.nc"
            else:
                anomaly = ""
            name_zh = _clean_str(r.get("tags.name"))
            cir = r.get("tags.circuits")
            circuits = int(cir) if pd.notna(cir) and str(cir).replace(".", "", 1).isdigit() else None
            length = line_length_km(r.get("lonlat"))
            mid_pts.append((lon_c, lat_c))
            items.append({
                "id": int(r["id"]),
                "name": name_zh or f"Unnamed {kind}",
                "named": bool(name_zh),
                "operator": _clean_str(r.get("tags.operator:zh")) or _clean_str(r.get("tags.operator")),
                "voltages_kv": vs,
                "v_max_kv": vmax,
                "kind": kind,
                "location": loc,
                "circuits": circuits,
                "length_km": length,
                "coords": pts,
                "anomaly": anomaly,
            })
        regs = assign_regions(mid_pts, reg6_gdf)
        for item, reg in zip(items, regs):
            item["region"] = reg
        return items

    lines = extract_ways(raw_lin, "overhead")
    cables = extract_ways(raw_cab, "cable")
    all_lines = lines + cables

    # Summary stats across OSM raw files
    sub_by_vmax = {}
    for s in substations:
        k = str(s["v_max_kv"]) if s["v_max_kv"] is not None else "unknown"
        sub_by_vmax[k] = sub_by_vmax.get(k, 0) + 1
    line_len_by_kv = {}
    for l in all_lines:
        k = str(l["v_max_kv"]) if l["v_max_kv"] is not None else "unknown"
        line_len_by_kv[k] = round(line_len_by_kv.get(k, 0.0) + l["length_km"], 1)

    return {
        "counts": {
            "raw_substations": len(raw_sub),
            "raw_lines": len(raw_lin),
            "raw_cables": len(raw_cab),
            "named_substations": sum(1 for s in substations if not s["name_zh"].startswith("OSM #")),
            "named_lines_and_cables": sum(1 for l in all_lines if l["named"]),
            "sub_by_vmax_kv": sub_by_vmax,
            "line_length_km_by_vmax_kv": line_len_by_kv,
        },
        "substations": substations,
        "lines": all_lines,
    }


def build_pypsa_networks(repo: Path, run: str, osm_subs: list[dict], labels: dict) -> dict:
    res = repo / "resources" / run
    net_dir = repo / "networks" / run
    ne = pypsa.Network(str(net_dir / "elec.nc"))
    ns = pypsa.Network(str(net_dir / "elec_s.nc"))
    n6 = pypsa.Network(str(net_dir / "elec_s_6_ec.nc"))
    bm = busmaps(repo, run)
    lm6 = pd.read_csv(res / "bus_regions" / "linemap_elec_s_6.csv")

    sub_coords = [(s["lon"], s["lat"], s["name_zh"]) for s in osm_subs]
    buses = []
    for bid, row in ne.buses.iterrows():
        reg = str(bm.get(str(bid), ""))
        lon, lat = float(row["x"]), float(row["y"])
        best = min(sub_coords, key=lambda c: (c[0] - lon) ** 2 + (c[1] - lat) ** 2) if sub_coords else None
        dist_km = round(math.hypot((best[0] - lon) * 101.0, (best[1] - lat) * 111.0), 2) if best else None
        buses.append({
            "id": str(bid),
            "lon": _r(lon, 4),
            "lat": _r(lat, 4),
            "v_nom_kv": _r(row["v_nom"], 0),
            "region": reg,
            "substation_lv": bool(row.get("substation_lv", False)),
            "substation_off": bool(row.get("substation_off", False)),
            "nearest_osm_name": best[2] if best and dist_km is not None and dist_km <= 5.0 else "",
            "anomaly": "690 kV OSM typo cluster (Chuying way/1331526157)" if float(row["v_nom"]) > 345 else "",
        })

    bus_xy = {b["id"]: (b["lon"], b["lat"]) for b in buses}
    bus_reg = {b["id"]: b["region"] for b in buses}
    lines = []
    for lid, row in ne.lines.iterrows():
        b0, b1 = str(row["bus0"]), str(row["bus1"])
        p0, p1 = bus_xy.get(b0), bus_xy.get(b1)
        lines.append({
            "id": str(lid),
            "bus0": b0,
            "bus1": b1,
            "reg0": bus_reg.get(b0, ""),
            "reg1": bus_reg.get(b1, ""),
            "v_nom_kv": _r(row["v_nom"], 0),
            "s_nom_MVA": _r(row["s_nom"], 1),
            "num_parallel": _r(row["num_parallel"], 2),
            "length_km": _r(row["length"], 1),
            "underwater_fraction": _r(row["underwater_fraction"], 2),
            "coords": [list(p0), list(p1)] if p0 and p1 else [],
        })

    corridors = []
    for cid, row in n6.lines.iterrows():
        b0, b1 = str(row["bus0"]), str(row["bus1"])
        lbl0 = labels.get(b0, {"en": b0, "zh": b0})
        lbl1 = labels.get(b1, {"en": b1, "zh": b1})
        sub_ids = lm6[lm6["0"] == int(cid)]["Line"].astype(str)
        es_lines = ns.lines.loc[ns.lines.index.isin(sub_ids)]
        crossing = [
            ln for ln in lines
            if {ln["reg0"], ln["reg1"]} == {b0, b1}
        ]
        corridors.append({
            "id": str(cid),
            "bus0": b0,
            "bus1": b1,
            "name_en": f"{lbl0['en']} <-> {lbl1['en']}",
            "name_zh": f"{lbl0['zh']} <-> {lbl1['zh']}",
            "s_nom_MVA": _r(row["s_nom"], 1),
            "s_max_pu": _r(row["s_max_pu"], 2),
            "usable_MW": _r(float(row["s_nom"]) * float(row["s_max_pu"]), 1),
            "length_km": _r(row["length"], 1),
            "num_parallel_380kv_eq": _r(row["num_parallel"], 2),
            "elec_s_line_count": int(len(es_lines)),
            "elec_s_sum_s_nom_MVA": _r(es_lines["s_nom"].sum(), 1),
            "elec_nc_crossing_count": len(crossing),
            "elec_nc_crossing_sum_s_nom_MVA": _r(sum(ln["s_nom_MVA"] or 0.0 for ln in crossing), 1),
            "elec_nc_crossing_voltages": pd.Series([ln["v_nom_kv"] for ln in crossing]).value_counts().to_dict(),
            "p0": [_r(n6.buses.loc[b0, "x"], 4), _r(n6.buses.loc[b0, "y"], 4)],
            "p1": [_r(n6.buses.loc[b1, "x"], 4), _r(n6.buses.loc[b1, "y"], 4)],
        })

    line_edges = [(str(r["bus0"]), str(r["bus1"])) for _, r in ne.lines.iterrows()]
    tf_edges = [(str(r["bus0"]), str(r["bus1"])) for _, r in ne.transformers.iterrows()]
    comp_lines_only = connected_components_sizes(ne.buses.index, line_edges)
    comp_with_tf = connected_components_sizes(ne.buses.index, line_edges + tf_edges)

    return {
        "summary": {
            "elec_buses": len(ne.buses),
            "elec_lines": len(ne.lines),
            "elec_transformers": len(ne.transformers),
            "elec_s_buses": len(ns.buses),
            "elec_s_lines": len(ns.lines),
            "elec_6_buses": len(n6.buses),
            "elec_6_corridors": len(n6.lines),
            "elec_bus_v_nom_counts": {str(int(k)): int(v) for k, v in ne.buses["v_nom"].value_counts().items()},
            "elec_line_v_nom_counts": {str(int(k)): int(v) for k, v in ne.lines["v_nom"].value_counts().items()},
            "connected_components_lines_only": comp_lines_only,
            "connected_components_with_transformers": comp_with_tf,
        },
        "buses": buses,
        "lines": lines,
        "corridors": corridors,
    }


def load_grid_sources() -> list[dict]:
    wanted = [
        "ndc_2050_grid_storage",
        "moea_psd_fy2024",
        "moeaea_indicators_annual",
        "taipower_peak_annual",
        "osm_grid_earth_osm",
        "taipower_transmission_stats",
        "taipower_grid_resilience_2022",
        "taipower_feeder_capacity",
        "cpc_lng_network",
        "moeaea_lng_safety_stock",
        "spglobal_2024_tw_lng",
        "taipeitimes_2022_coal_stock",
        "taipeitimes_2026_oil_stock",
        "gti_2022_stockpiles",
    ]
    src_df = pd.read_csv(ROOT / "data" / "sources.csv", dtype=str, keep_default_na=False)
    by_id = src_df.set_index("source_id").to_dict("index")
    out = []
    for sid in wanted:
        r = by_id.get(sid)
        if not r:
            continue
        out.append({
            "source_id": sid,
            "short_cite": r["short_cite"],
            "title_zh": r["title"],
            "title_en": r["title_en"],
            "publisher": r["publisher"],
            "url": r["file_url"] or r["landing_url"],
            "landing_url": r["landing_url"],
            "evidence": r["evidence"],
            "origin": r["origin"],
            "note": r["note"],
        })
    return out


def export_grid_data(repo: Path, out: Path) -> Path:
    res = repo / "resources" / BASE_RUN
    reg6 = gpd.read_file(res / "bus_regions" / "regions_onshore_elec_s_6.geojson")
    labels = region_labels(reg6)
    osm = build_osm_grid(res, reg6, labels)
    pypsa_net = build_pypsa_networks(repo, BASE_RUN, osm["substations"], labels)

    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "base_run": BASE_RUN,
        "official_grid": OFFICIAL_GRID_STATS,
        "resilience_plan": RESILIENCE_PLAN,
        "bottlenecks_and_upgrades": BOTTLENECKS_AND_UPGRADES,
        "history": build_historical_series(),
        "regions": simplify_region_shapes(reg6, labels),
        "osm": osm,
        "pypsa": pypsa_net,
        "lng_terminals": LNG_TERMINALS,
        "gas_pipelines": GAS_PIPELINE_CORRIDORS,
        "fuel_ports_and_stocks": FUEL_PORTS_AND_STOCKS,
        "sources": load_grid_sources(),
    }
    target = out / "grid_data.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    size_kb = round(target.stat().st_size / 1024.0, 1)
    print(f"wrote {target.relative_to(ROOT)} ({size_kb} KB): "
          f"{osm['counts']['raw_substations']} OSM substations, "
          f"{osm['counts']['raw_lines']}+{osm['counts']['raw_cables']} lines/cables, "
          f"{pypsa_net['summary']['elec_buses']} elec.nc buses, {len(LNG_TERMINALS)} LNG terminals")
    return target


if __name__ == "__main__":
    export_grid_data(MODEL_DIR, ROOT / "docs" / "data")
