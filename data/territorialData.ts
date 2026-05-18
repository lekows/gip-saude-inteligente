import type {
  CampaignLocationCandidate,
  HealthCondition,
  HealthUnit,
  NeighborhoodRisk
} from "@/types/territorial";

export const conditionLabels: Record<HealthCondition, string> = {
  hipertensao: "Hipertensao",
  diabetes: "Diabetes",
  obesidade: "Obesidade",
  respiratoria: "Respiratoria",
  saudeMental: "Saude mental",
  retornoPrecoce: "Retorno precoce"
};

export const luzianiaCenter = [-16.253, -47.95] as const;

export const neighborhoodRisks: NeighborhoodRisk[] = [
  {
    id: "centro",
    name: "Centro",
    ibgeCityCode: "5212501",
    population: 18200,
    aggregatedPatients: 2680,
    centroid: [-16.252, -47.95],
    polygon: [
      [-16.238, -47.966],
      [-16.236, -47.94],
      [-16.254, -47.931],
      [-16.268, -47.947],
      [-16.261, -47.971]
    ],
    vulnerabilityIndex: 0.42,
    lastCampaignDaysAgo: 41,
    conditions: {
      hipertensao: 740,
      diabetes: 430,
      obesidade: 510,
      respiratoria: 260,
      saudeMental: 390,
      retornoPrecoce: 350
    }
  },
  {
    id: "jardim-inga",
    name: "Jardim Inga",
    ibgeCityCode: "5212501",
    population: 32400,
    aggregatedPatients: 6140,
    centroid: [-16.185, -47.952],
    polygon: [
      [-16.158, -47.982],
      [-16.153, -47.931],
      [-16.184, -47.911],
      [-16.214, -47.937],
      [-16.209, -47.991]
    ],
    vulnerabilityIndex: 0.78,
    lastCampaignDaysAgo: 96,
    conditions: {
      hipertensao: 1640,
      diabetes: 940,
      obesidade: 1120,
      respiratoria: 890,
      saudeMental: 760,
      retornoPrecoce: 790
    }
  },
  {
    id: "parque-estrela-dalva",
    name: "Parque Estrela Dalva",
    ibgeCityCode: "5212501",
    population: 14350,
    aggregatedPatients: 3320,
    centroid: [-16.225, -48.01],
    polygon: [
      [-16.196, -48.034],
      [-16.205, -47.989],
      [-16.233, -47.986],
      [-16.252, -48.014],
      [-16.235, -48.046]
    ],
    vulnerabilityIndex: 0.69,
    lastCampaignDaysAgo: 74,
    conditions: {
      hipertensao: 850,
      diabetes: 520,
      obesidade: 700,
      respiratoria: 430,
      saudeMental: 390,
      retornoPrecoce: 430
    }
  },
  {
    id: "mingone",
    name: "Mingone",
    ibgeCityCode: "5212501",
    population: 11800,
    aggregatedPatients: 2350,
    centroid: [-16.287, -47.925],
    polygon: [
      [-16.264, -47.944],
      [-16.266, -47.902],
      [-16.291, -47.891],
      [-16.313, -47.917],
      [-16.303, -47.956]
    ],
    vulnerabilityIndex: 0.57,
    lastCampaignDaysAgo: 58,
    conditions: {
      hipertensao: 610,
      diabetes: 340,
      obesidade: 480,
      respiratoria: 360,
      saudeMental: 260,
      retornoPrecoce: 300
    }
  },
  {
    id: "setor-aeroporto",
    name: "Setor Aeroporto",
    ibgeCityCode: "5212501",
    population: 9800,
    aggregatedPatients: 1770,
    centroid: [-16.276, -47.995],
    polygon: [
      [-16.249, -48.018],
      [-16.261, -47.973],
      [-16.289, -47.968],
      [-16.306, -47.997],
      [-16.291, -48.032]
    ],
    vulnerabilityIndex: 0.49,
    lastCampaignDaysAgo: 33,
    conditions: {
      hipertensao: 460,
      diabetes: 260,
      obesidade: 390,
      respiratoria: 210,
      saudeMental: 230,
      retornoPrecoce: 220
    }
  },
  {
    id: "pedregal",
    name: "Pedregal",
    ibgeCityCode: "5212501",
    population: 21300,
    aggregatedPatients: 5040,
    centroid: [-16.326, -47.973],
    polygon: [
      [-16.3, -48.003],
      [-16.304, -47.951],
      [-16.331, -47.932],
      [-16.358, -47.961],
      [-16.348, -48.016]
    ],
    vulnerabilityIndex: 0.83,
    lastCampaignDaysAgo: 121,
    conditions: {
      hipertensao: 1310,
      diabetes: 880,
      obesidade: 1020,
      respiratoria: 660,
      saudeMental: 520,
      retornoPrecoce: 650
    }
  }
];

export const healthUnits: HealthUnit[] = [
  {
    id: "ubs-centro",
    name: "UBS Centro Integrado",
    type: "UBS",
    position: [-16.251, -47.951],
    neighborhoodId: "centro",
    capacityPerShift: 86,
    activeTeams: 4,
    notes: "Ponto de apoio para estratificacao de hipertensao e diabetes."
  },
  {
    id: "cais-centro",
    name: "CAIS Luziânia",
    type: "CAIS",
    position: [-16.258, -47.944],
    neighborhoodId: "centro",
    capacityPerShift: 140,
    activeTeams: 7,
    notes: "Retaguarda para demandas de maior complexidade no territorio."
  },
  {
    id: "ubs-inga",
    name: "UBS Jardim Inga",
    type: "UBS",
    position: [-16.184, -47.949],
    neighborhoodId: "jardim-inga",
    capacityPerShift: 102,
    activeTeams: 5,
    notes: "Alta demanda para acompanhamento respiratorio e retorno precoce."
  },
  {
    id: "mutirao-inga",
    name: "Mutirao previsto - Escola Comunitaria",
    type: "MUTIRAO",
    position: [-16.197, -47.965],
    neighborhoodId: "jardim-inga",
    capacityPerShift: 180,
    activeTeams: 6,
    notes: "Local simulado para acao preventiva de final de semana."
  },
  {
    id: "ubs-pedregal",
    name: "UBS Pedregal",
    type: "UBS",
    position: [-16.329, -47.971],
    neighborhoodId: "pedregal",
    capacityPerShift: 94,
    activeTeams: 4,
    notes: "Cobertura prioritaria para pacientes agregados de risco cardiometabolico."
  },
  {
    id: "mutirao-estrela",
    name: "Mutirao previsto - Quadra Estrela Dalva",
    type: "MUTIRAO",
    position: [-16.226, -48.018],
    neighborhoodId: "parque-estrela-dalva",
    capacityPerShift: 150,
    activeTeams: 5,
    notes: "Local simulado para busca ativa de obesidade e diabetes."
  },
  {
    id: "cais-mingone",
    name: "CAIS Mingone",
    type: "CAIS",
    position: [-16.291, -47.923],
    neighborhoodId: "mingone",
    capacityPerShift: 116,
    activeTeams: 5,
    notes: "Apoio a casos respiratorios e saude mental em demanda espontanea."
  }
];

export const campaignLocationCandidates: CampaignLocationCandidate[] = [
  {
    id: "loc-escola-inga",
    name: "Escola Comunitaria do Jardim Inga",
    type: "ESCOLA",
    position: [-16.196, -47.963],
    neighborhoodId: "jardim-inga",
    capacityPerShift: 220,
    accessibilityScore: 0.86,
    coveredNeighborhoodIds: ["jardim-inga", "parque-estrela-dalva", "centro"],
    setupComplexity: "media",
    notes: "Boa capilaridade para acao de fim de semana e triagem multiprofissional."
  },
  {
    id: "loc-ginasio-pedregal",
    name: "Ginasio Comunitario do Pedregal",
    type: "GINASIO",
    position: [-16.333, -47.982],
    neighborhoodId: "pedregal",
    capacityPerShift: 260,
    accessibilityScore: 0.8,
    coveredNeighborhoodIds: ["pedregal", "setor-aeroporto", "mingone"],
    setupComplexity: "media",
    notes: "Maior capacidade operacional para rastreio cardiometabolico agregado."
  },
  {
    id: "loc-cras-centro",
    name: "CRAS Regiao Central",
    type: "CRAS",
    position: [-16.246, -47.956],
    neighborhoodId: "centro",
    capacityPerShift: 150,
    accessibilityScore: 0.91,
    coveredNeighborhoodIds: ["centro", "mingone", "setor-aeroporto"],
    setupComplexity: "baixa",
    notes: "Local com fluxo social conhecido e acesso facilitado para busca ativa."
  },
  {
    id: "loc-praca-estrela",
    name: "Praca Estrela Dalva",
    type: "PRACA",
    position: [-16.229, -48.013],
    neighborhoodId: "parque-estrela-dalva",
    capacityPerShift: 170,
    accessibilityScore: 0.72,
    coveredNeighborhoodIds: ["parque-estrela-dalva", "jardim-inga"],
    setupComplexity: "alta",
    notes: "Alta visibilidade territorial, mas exige estrutura movel e plano climatico."
  },
  {
    id: "loc-parceiro-mingone",
    name: "Associacao de Moradores Mingone",
    type: "PARCEIRO",
    position: [-16.286, -47.934],
    neighborhoodId: "mingone",
    capacityPerShift: 130,
    accessibilityScore: 0.76,
    coveredNeighborhoodIds: ["mingone", "centro", "setor-aeroporto"],
    setupComplexity: "baixa",
    notes: "Parceiro comunitario adequado para saude mental, retornos e educacao em saude."
  },
  {
    id: "loc-ubs-aeroporto",
    name: "Polo UBS Setor Aeroporto",
    type: "UBS",
    position: [-16.279, -47.998],
    neighborhoodId: "setor-aeroporto",
    capacityPerShift: 120,
    accessibilityScore: 0.84,
    coveredNeighborhoodIds: ["setor-aeroporto", "centro", "pedregal"],
    setupComplexity: "baixa",
    notes: "Menor capacidade, mas reduz complexidade logistica e melhora continuidade do cuidado."
  }
];
