import type {
  AiCampaignSuggestion,
  CampaignLocationCandidate,
  CampaignLocationPrediction,
  CampaignOperationalPlan,
  HealthCondition,
  HealthUnit,
  NeighborhoodRisk,
  TerritorialScore
} from "@/types/territorial";

const conditionWeights: Record<HealthCondition, number> = {
  hipertensao: 1.08,
  diabetes: 1.14,
  obesidade: 1.02,
  respiratoria: 0.96,
  saudeMental: 0.92,
  retornoPrecoce: 1.18
};

export function calculateTerritorialRisk(
  neighborhood: NeighborhoodRisk,
  condition: HealthCondition
): TerritorialScore {
  const conditionCount = neighborhood.conditions[condition];
  const prevalence = conditionCount / neighborhood.population;
  const aggregateLoad = neighborhood.aggregatedPatients / neighborhood.population;
  const campaignDelay = Math.min(neighborhood.lastCampaignDaysAgo / 120, 1);
  const rawScore =
    prevalence * 46 * conditionWeights[condition] +
    aggregateLoad * 22 +
    neighborhood.vulnerabilityIndex * 22 +
    campaignDelay * 10;
  const score = Math.min(100, Math.round(rawScore));

  const drivers = [
    `${conditionCount.toLocaleString("pt-BR")} registros agregados da condicao`,
    `${Math.round(neighborhood.vulnerabilityIndex * 100)}% de vulnerabilidade territorial`,
    `${neighborhood.lastCampaignDaysAgo} dias desde o ultimo mutirao`
  ];

  return {
    score,
    level: getRiskLevel(score),
    drivers,
    suggestedAction: getSuggestedAction(score, condition)
  };
}

export function rankNeighborhoods(
  neighborhoods: NeighborhoodRisk[],
  condition: HealthCondition
) {
  return [...neighborhoods]
    .map((neighborhood) => ({
      neighborhood,
      risk: calculateTerritorialRisk(neighborhood, condition)
    }))
    .sort((a, b) => b.risk.score - a.risk.score);
}

export function suggestNextCampaign(
  neighborhoods: NeighborhoodRisk[],
  units: HealthUnit[],
  condition: HealthCondition
): AiCampaignSuggestion {
  const [priority] = rankNeighborhoods(neighborhoods, condition);
  const candidateUnits = units
    .filter((unit) => unit.neighborhoodId === priority.neighborhood.id)
    .sort((a, b) => b.capacityPerShift - a.capacityPerShift);
  const recommendedUnit = candidateUnits[0];

  return {
    targetNeighborhoodId: priority.neighborhood.id,
    targetNeighborhoodName: priority.neighborhood.name,
    condition,
    expectedReach: Math.round(
      Math.min(
        priority.neighborhood.conditions[condition] * 0.34,
        recommendedUnit?.capacityPerShift ? recommendedUnit.capacityPerShift * 1.6 : 160
      )
    ),
    recommendedUnitId: recommendedUnit?.id,
    rationale: `Prioridade definida por score ${priority.risk.score}, volume agregado de casos, vulnerabilidade territorial e tempo desde a ultima acao preventiva.`
  };
}

export function predictCampaignLocations(
  neighborhoods: NeighborhoodRisk[],
  candidates: CampaignLocationCandidate[],
  condition: HealthCondition
): CampaignLocationPrediction[] {
  const rankedNeighborhoods = rankNeighborhoods(neighborhoods, condition);

  return candidates
    .map((location) => {
      const targetNeighborhood =
        neighborhoods.find((item) => item.id === location.neighborhoodId) ??
        rankedNeighborhoods[0].neighborhood;
      const targetRisk = calculateTerritorialRisk(targetNeighborhood, condition);
      const coveredRiskAverage =
        location.coveredNeighborhoodIds.reduce((total, id) => {
          const covered = neighborhoods.find((item) => item.id === id);
          return total + (covered ? calculateTerritorialRisk(covered, condition).score : 0);
        }, 0) / Math.max(location.coveredNeighborhoodIds.length, 1);
      const capacityFactor = Math.min(location.capacityPerShift / 240, 1);
      const setupPenalty =
        location.setupComplexity === "alta"
          ? 9
          : location.setupComplexity === "media"
            ? 4
            : 0;
      const score = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            targetRisk.score * 0.38 +
              coveredRiskAverage * 0.28 +
              location.accessibilityScore * 18 +
              capacityFactor * 16 -
              setupPenalty
          )
        )
      );
      const expectedReach = Math.round(
        Math.min(
          targetNeighborhood.conditions[condition] * 0.42,
          location.capacityPerShift * (score >= 78 ? 1.75 : 1.45)
        )
      );
      const coverageRadiusMeters = Math.round(
        900 + location.accessibilityScore * 700 + capacityFactor * 350
      );
      const teamRecommendation = Math.max(3, Math.ceil(location.capacityPerShift / 38));

      return {
        location,
        targetNeighborhood,
        score,
        expectedReach,
        coverageRadiusMeters,
        teamRecommendation,
        priorityCondition: condition,
        strengths: buildLocationStrengths(location, score, coveredRiskAverage),
        risks: buildLocationRisks(location, targetRisk.score),
        rationale: `Predicao local simulada combinando risco do bairro, risco medio de cobertura, capacidade, acessibilidade e complexidade de montagem.`
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function createOperationalPlan(
  prediction: CampaignLocationPrediction
): CampaignOperationalPlan {
  const conditionLabel = formatCondition(prediction.priorityCondition);

  return {
    title: `Plano operacional - ${conditionLabel} em ${prediction.targetNeighborhood.name}`,
    locationName: prediction.location.name,
    targetNeighborhoodName: prediction.targetNeighborhood.name,
    condition: prediction.priorityCondition,
    expectedReach: prediction.expectedReach,
    shifts: [
      "08:00-10:00 acolhimento, cadastro territorial agregado e estratificacao inicial",
      "10:00-12:00 atendimentos clinicos, educacao em saude e encaminhamentos",
      "13:30-16:30 busca ativa por ACS e fechamento de retornos prioritarios"
    ],
    teamMix: [
      `${prediction.teamRecommendation} equipes de atendimento e triagem`,
      "ACS para mobilizacao por microarea sem exposicao de enderecos",
      "Enfermagem, medico de apoio, farmacia, regulacao e assistencia social"
    ],
    actions: [
      `Priorizar ${conditionLabel} com base em indicadores agregados por bairro`,
      "Separar agenda de retorno para casos descompensados e retorno precoce",
      "Registrar resultado por bairro, faixa agregada e condicao, sem dado individual no painel"
    ],
    dataGovernance: [
      "Usar somente dados autorizados, minimizados e agregados para planejamento",
      "Separar identificacao assistencial do painel territorial de gestao",
      "Auditar origem dos dados antes de qualquer integracao com bases reais do SUS"
    ]
  };
}

function getRiskLevel(score: number): TerritorialScore["level"] {
  if (score >= 78) return "critico";
  if (score >= 62) return "alto";
  if (score >= 46) return "medio";
  return "baixo";
}

function getSuggestedAction(score: number, condition: HealthCondition) {
  if (score >= 78) {
    return `Mutirao prioritario com busca ativa para ${condition}.`;
  }
  if (score >= 62) {
    return `Agenda ampliada e contato ativo de grupos de risco para ${condition}.`;
  }
  if (score >= 46) {
    return `Monitorar microterritorios e reforcar acompanhamento de ${condition}.`;
  }
  return `Manter vigilancia territorial e rotina preventiva para ${condition}.`;
}

function buildLocationStrengths(
  location: CampaignLocationCandidate,
  score: number,
  coveredRiskAverage: number
) {
  const strengths = [
    `${location.capacityPerShift} atendimentos por turno`,
    `${Math.round(location.accessibilityScore * 100)}% de acessibilidade estimada`
  ];

  if (score >= 75) {
    strengths.push("alto impacto preditivo para mutirao preventivo");
  }
  if (coveredRiskAverage >= 60) {
    strengths.push("cobre bairros com risco territorial elevado");
  }
  if (location.setupComplexity === "baixa") {
    strengths.push("baixa complexidade de montagem");
  }

  return strengths;
}

function buildLocationRisks(
  location: CampaignLocationCandidate,
  targetRiskScore: number
) {
  const risks: string[] = [];

  if (location.setupComplexity === "alta") {
    risks.push("exige plano logistico, estrutura movel e contingencia climatica");
  }
  if (location.capacityPerShift < 150) {
    risks.push("capacidade limitada pode exigir mais de um turno");
  }
  if (targetRiskScore >= 78) {
    risks.push("bairro critico pode demandar retaguarda clinica e regulacao");
  }

  return risks.length ? risks : ["risco operacional baixo na simulacao"];
}

function formatCondition(condition: HealthCondition) {
  const labels: Record<HealthCondition, string> = {
    hipertensao: "hipertensao",
    diabetes: "diabetes",
    obesidade: "obesidade",
    respiratoria: "condicoes respiratorias",
    saudeMental: "saude mental",
    retornoPrecoce: "retorno precoce"
  };

  return labels[condition];
}
