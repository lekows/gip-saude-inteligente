import type {
  EnrichedManagerArea,
  ManagerArea,
  ManagerKpis,
  ManagerRiskLevel,
  PatientScoreFactors,
  TerritorialScoreFactors
} from "@/types/managerDashboard";
import type { HealthCondition, NeighborhoodRisk } from "@/types/territorial";

export function calculatePatientScore(factors: PatientScoreFactors) {
  return clampScore(
    factors.alteredBloodPressure +
      factors.alteredGlucose +
      factors.bmiObesity +
      factors.chronicDiseases +
      factors.lowMedicationAdherence +
      factors.earlyReturn +
      factors.vulnerabilityAge
  );
}

export function classifyPatientRisk(score: number): ManagerRiskLevel {
  if (score >= 60) return "vermelho";
  if (score >= 30) return "amarelo";
  return "verde";
}

export function calculateTerritorialScore(factors: TerritorialScoreFactors) {
  return clampScore(
    factors.lowCoverage +
      factors.highRiskPercent +
      factors.missingPatients +
      factors.earlyReturns +
      factors.waitingTime +
      factors.hasDmLoad +
      factors.interviews360
  );
}

export function classifyTerritorialRisk(score: number): ManagerRiskLevel {
  if (score >= 70) return "vermelho";
  if (score >= 35) return "amarelo";
  return "verde";
}

export function enrichAreas(
  areas: ManagerArea[],
  neighborhoods: NeighborhoodRisk[]
): EnrichedManagerArea[] {
  return areas.map((area) => {
    const neighborhood = neighborhoods.find((item) => item.id === area.neighborhoodId);
    const coverage = area.meta ? Math.round((area.registered / area.meta) * 100) : 0;
    const patientScore = calculatePatientScore(area.patientScoreFactors);
    const territorialScore = calculateTerritorialScore(area.territorialScoreFactors);

    return {
      ...area,
      missing: Math.max(area.meta - area.registered, 0),
      coverage,
      patientScore,
      patientRiskLevel: classifyPatientRisk(patientScore),
      territorialScore,
      territorialRiskLevel: classifyTerritorialRisk(territorialScore),
      polygon: neighborhood?.polygon ?? [],
      centroid: neighborhood?.centroid ?? [-16.253, -47.95]
    };
  });
}

export function getManagerKpis(areas: EnrichedManagerArea[]): ManagerKpis {
  const targetPatients = sum(areas, "meta");
  const registeredPatients = sum(areas, "registered");

  return {
    targetPatients,
    registeredPatients,
    missingPatients: Math.max(targetPatients - registeredPatients, 0),
    coverage: targetPatients ? Math.round((registeredPatients / targetPatients) * 100) : 0,
    screenings: sum(areas, "screenings"),
    highRiskPatients: sum(areas, "highRiskPatients"),
    campaignsDone: sum(areas, "campaignsDone")
  };
}

export function getRiskDistribution(areas: EnrichedManagerArea[]) {
  return [
    {
      name: "Baixo risco",
      value: areas.filter((area) => area.territorialRiskLevel === "verde").length,
      color: "#1f7a4d"
    },
    {
      name: "Medio risco",
      value: areas.filter((area) => area.territorialRiskLevel === "amarelo").length,
      color: "#f3d37a"
    },
    {
      name: "Alto risco",
      value: areas.filter((area) => area.territorialRiskLevel === "vermelho").length,
      color: "#c24a2c"
    }
  ];
}

export function getPriorityRanking(areas: EnrichedManagerArea[]) {
  return [...areas]
    .sort((a, b) => b.territorialScore - a.territorialScore)
    .map((area) => ({
      name: area.label,
      score: area.territorialScore,
      faltantes: area.missing,
      altoRisco: area.highRiskPatients
    }));
}

export function createManagerAlerts(areas: EnrichedManagerArea[], condition: HealthCondition) {
  const top = [...areas].sort((a, b) => b.territorialScore - a.territorialScore)[0];
  const lowCoverage = areas.filter((area) => area.coverage < 70);
  const highRiskTotal = areas.reduce((total, area) => total + area.highRiskPatients, 0);

  return [
    `${top.label} lidera prioridade territorial com score ${top.territorialScore} e ${top.missing} pacientes faltantes.`,
    `${lowCoverage.length} areas estao abaixo de 70% de cobertura cadastral no filtro atual.`,
    `${highRiskTotal.toLocaleString("pt-BR")} pacientes agregados estao classificados como alto risco; foco recomendado em ${condition}.`
  ];
}

export function suggestManagerCampaign(areas: EnrichedManagerArea[], condition: HealthCondition) {
  const [priority] = [...areas].sort((a, b) => b.territorialScore - a.territorialScore);

  return `IA sugere mutirao em ${priority.label}, com apoio da ${priority.unitName}, priorizando ${condition}, busca ativa de ${priority.missing} faltantes e triagem de ${priority.highRiskPatients} pessoas em alto risco agregado.`;
}

type NumericAreaKey = {
  [K in keyof EnrichedManagerArea]: EnrichedManagerArea[K] extends number ? K : never;
}[keyof EnrichedManagerArea];

function sum(items: EnrichedManagerArea[], key: NumericAreaKey) {
  return items.reduce((total, item) => total + item[key], 0);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
