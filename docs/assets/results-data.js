window.TAIWAN_RESULTS = {
  run: {
    title: "Taiwan PyPSA-Earth Simulation",
    status: "Optimal",
    completedAt: "2026-07-17 00:24 Europe/Zurich",
    objective: 728070931600.0,
    objectiveLabel: "7.28e11",
    scenario: "elec_s_6_ec_lcopt_Co2L-4H",
    clusters: 6,
    temporalResolution: "4H",
    resultNetwork: "results/networks/elec_s_6_ec_lcopt_Co2L-4H.nc",
    notebook: "../pypsa_tw/taiwan_simulation_results.ipynb",
    demandGWhHourlyInput: 5023.85,
    hourlyDemandSnapshots: 144,
    peakDemandMW: 40899.33,
    averageDemandMW: 34887.86
  },
  capacityMixGW: [
    { carrier: "CCGT", value: 18.32, kind: "thermal" },
    { carrier: "coal", value: 18.24, kind: "thermal" },
    { carrier: "solar", value: 12.42, kind: "renewable" },
    { carrier: "nuclear", value: 5.32, kind: "firm" },
    { carrier: "offwind-ac", value: 2.22, kind: "renewable" },
    { carrier: "hydro", value: 1.46, kind: "storage" },
    { carrier: "onwind", value: 1.10, kind: "renewable" },
    { carrier: "ror", value: 1.00, kind: "renewable" },
    { carrier: "oil", value: 0.28, kind: "thermal" },
    { carrier: "PHS", value: 2.71, kind: "storage" }
  ],
  irenaTargetsGW: [
    { carrier: "solar", existing: 3.81, target: 12.42, gapFilled: 8.60 },
    { carrier: "onwind", existing: 0.77, target: 1.10, gapFilled: 0.33 },
    { carrier: "offwind-ac", existing: 2.22, target: 1.57, gapFilled: 0.00 },
    { carrier: "offwind-dc", existing: 0.00, target: 0.00, gapFilled: 0.00 }
  ],
  buses: [
    { id: "TW0 0", lon: 120.3851, lat: 23.5525, capacityMW: 0 },
    { id: "TW0 1", lon: 121.5693, lat: 24.9826, capacityMW: 0 },
    { id: "TW0 2", lon: 120.9395, lat: 24.0337, capacityMW: 0 },
    { id: "TW0 3", lon: 120.5538, lat: 22.6194, capacityMW: 0 },
    { id: "TW1 0", lon: 121.0430, lat: 24.5487, capacityMW: 0 },
    { id: "TW2 0", lon: 120.6003, lat: 24.0727, capacityMW: 0 }
  ],
  mapLinks: [
    ["TW0 3", "TW0 0"],
    ["TW0 0", "TW0 2"],
    ["TW0 2", "TW1 0"],
    ["TW1 0", "TW0 1"],
    ["TW0 2", "TW2 0"]
  ],
  notes: [
    "This page is a lightweight static summary for GitHub Pages.",
    "Capacity values are from logs/add_electricity.log after the successful Taiwan run.",
    "Demand values are from resources/demand_profiles.csv before solve-network 4H aggregation.",
    "For full dispatch and generation-energy plots, open pypsa_tw/taiwan_simulation_results.ipynb locally."
  ]
};
