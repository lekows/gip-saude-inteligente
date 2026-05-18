import type { ManagerDashboardData } from "@/types/managerDashboard";
import type { HealthUnit, NeighborhoodRisk } from "@/types/territorial";
import type { RiskMapArea, SusDataset } from "@/types/sus";

export function susToManagerDashboardData(dataset: SusDataset): ManagerDashboardData {
  const neighborhoods = riskAreasToNeighborhoods(dataset.riskMapAreas);

  return {
    center: [-16.253, -47.95],
    neighborhoods,
    units: dataset.healthUnits.map(susUnitToAppUnit),
    areas: dataset.riskMapAreas.map((area) => {
      const unit = dataset.healthUnits.find((item) => item.neighborhoodId === area.neighborhoodId);
      const highRiskPercent = area.registeredPatients
        ? Math.min(25, Math.round((area.highRiskPatients / area.registeredPatients) * 160))
        : 0;

      return {
        id: `area-${area.neighborhoodId}`,
        neighborhoodId: area.neighborhoodId,
        label: area.neighborhoodName,
        unitName: unit?.name ?? "Unidade de referencia APS",
        meta: area.targetPopulation,
        registered: area.registeredPatients,
        screenings: area.screenings,
        highRiskPatients: area.highRiskPatients,
        campaignsDone: Math.max(1, Math.round(area.screenings / 1000)),
        averageWaitingDays: Math.max(8, Math.round(area.hospitalAdmissions / 2)),
        interviews360Alerts: area.notifiableCases,
        earlyReturns: area.earlyReturns,
        patientScoreFactors: {
          alteredBloodPressure: Math.min(25, Math.round(area.highRiskPatients / 45)),
          alteredGlucose: Math.min(20, Math.round(area.highRiskPatients / 60)),
          bmiObesity: Math.min(10, Math.round(area.obesityCount / 70)),
          chronicDiseases: Math.min(15, Math.round(area.hospitalAdmissions / 3)),
          lowMedicationAdherence: Math.min(10, Math.round(area.missingPatients / 220)),
          earlyReturn: Math.min(10, Math.round(area.earlyReturns / 90)),
          vulnerabilityAge: Math.min(10, Math.round(area.population / 5000))
        },
        territorialScoreFactors: {
          lowCoverage: area.coveragePercent < 70 ? 20 : area.coveragePercent < 85 ? 10 : 0,
          highRiskPercent,
          missingPatients: area.targetPopulation
            ? Math.min(15, Math.round((area.missingPatients / area.targetPopulation) * 60))
            : 0,
          earlyReturns: area.registeredPatients
            ? Math.min(10, Math.round((area.earlyReturns / area.registeredPatients) * 70))
            : 0,
          waitingTime: Math.min(10, Math.round(area.hospitalAdmissions / 5)),
          hasDmLoad: Math.min(10, Math.round(area.highRiskPatients / 95)),
          interviews360: Math.min(10, Math.round(area.notifiableCases / 10))
        },
        suggestedAction: area.suggestedAction
      };
    }),
    monthlyEvolution: [
      { month: "Jan", cadastros: 2180, triagens: 1220 },
      { month: "Fev", cadastros: 2760, triagens: 1560 },
      { month: "Mar", cadastros: 3440, triagens: 2020 },
      { month: "Abr", cadastros: 4190, triagens: 2580 },
      { month: "Mai", cadastros: 5010, triagens: 3090 },
      {
        month: "Jun",
        cadastros: dataset.riskMapAreas.reduce(
          (total, area) => total + area.registeredPatients,
          0
        ),
        triagens: dataset.riskMapAreas.reduce((total, area) => total + area.screenings, 0)
      }
    ]
  };
}

export function susToTerritorialData(dataset: SusDataset) {
  return {
    neighborhoods: riskAreasToNeighborhoods(dataset.riskMapAreas),
    units: dataset.healthUnits.map(susUnitToAppUnit)
  };
}

function riskAreasToNeighborhoods(areas: RiskMapArea[]): NeighborhoodRisk[] {
  return areas.map((area) => ({
    id: area.neighborhoodId,
    name: area.neighborhoodName,
    ibgeCityCode: "5212501",
    population: area.population,
    aggregatedPatients: area.registeredPatients,
    polygon: area.polygon,
    centroid: area.centroid,
    vulnerabilityIndex: Math.min(0.95, area.territorialScore / 100),
    lastCampaignDaysAgo: area.riskLevel === "vermelho" ? 110 : area.riskLevel === "amarelo" ? 70 : 35,
    conditions: {
      hipertensao: Math.round(area.highRiskPatients * 0.72),
      diabetes: Math.round(area.highRiskPatients * 0.46),
      obesidade: area.obesityCount,
      respiratoria: Math.round(area.notifiableCases * 0.55),
      saudeMental: Math.round(area.highRiskPatients * 0.28),
      retornoPrecoce: area.earlyReturns
    }
  }));
}

function susUnitToAppUnit(unit: import("@/types/sus").HealthUnit): HealthUnit {
  return {
    id: unit.cnes,
    name: unit.name,
    type: unit.type === "CAIS" ? "CAIS" : "UBS",
    position: unit.position,
    neighborhoodId: unit.neighborhoodId,
    capacityPerShift: unit.type === "CAIS" ? 140 : 96,
    activeTeams: unit.teams,
    notes: `Unidade carregada da camada CNES agregada (${unit.source}).`
  };
}
