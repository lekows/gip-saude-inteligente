import { campaignPlan } from "@/data/campaignPlanningData";
import { campaignLocationCandidates, neighborhoodRisks } from "@/data/territorialData";
import { calculateTerritorialRisk, predictCampaignLocations } from "@/lib/territorialRiskService";

export function getRecommendedCampaignPlan() {
  const predictions = predictCampaignLocations(
    neighborhoodRisks,
    campaignLocationCandidates,
    campaignPlan.condition
  );
  const targetNeighborhood = neighborhoodRisks.find(
    (item) => item.id === campaignPlan.targetNeighborhoodId
  );
  const territorialRisk = targetNeighborhood
    ? calculateTerritorialRisk(targetNeighborhood, campaignPlan.condition)
    : null;

  const microAreaTotals = campaignPlan.microAreas.reduce(
    (acc, item) => ({
      households: acc.households + item.households,
      people: acc.people + item.estimatedPeople,
      highRisk: acc.highRisk + item.highRiskEstimate
    }),
    { households: 0, people: 0, highRisk: 0 }
  );

  return {
    plan: campaignPlan,
    predictions,
    targetNeighborhood,
    territorialRisk,
    microAreaTotals,
    neighborhoods: neighborhoodRisks
  };
}

export function getCampaignChartData() {
  return {
    microAreas: campaignPlan.microAreas.map((item) => ({
      name: item.label.replace("Microarea ", ""),
      domicilios: item.households,
      altoRisco: item.highRiskEstimate
    })),
    timeline: campaignPlan.actionSteps.map((step, index) => ({
      etapa: step.time,
      intensidade: [30, 68, 92, 76, 48][index] ?? 50
    })),
    conditionMix: [
      { name: "HAS", value: 42, color: "#c24a2c" },
      { name: "DM", value: 27, color: "#1c5f9f" },
      { name: "Obesidade", value: 18, color: "#c9912d" },
      { name: "Retorno", value: 13, color: "#1f7a4d" }
    ]
  };
}
