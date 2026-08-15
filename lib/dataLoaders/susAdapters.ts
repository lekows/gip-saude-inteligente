import type { ManagerDashboardData } from "@/types/managerDashboard";
import type { HealthUnit, NeighborhoodRisk } from "@/types/territorial";
import type { RiskMapArea, SusDataset } from "@/types/sus";

export function susToManagerDashboardData(dataset: SusDataset): ManagerDashboardData {
  const neighborhoods = riskAreasToNeighborhoods(dataset.riskMapAreas);
  const primaryUnits = primaryCareUnits(dataset);
  const priorityLevels = ["verde", "amarelo", "vermelho"] as const;
  const rankedSectors = [...dataset.censusSectors.features].sort(
    (left, right) =>
      right.properties.coverage_priority_score -
      left.properties.coverage_priority_score
  );
  const rankedVulnerabilitySectors = dataset.censusSectors.features
    .filter(
      (sector) => sector.properties.vulnerability_context_score !== null
    )
    .sort(
      (left, right) =>
        (right.properties.vulnerability_context_score ?? -1) -
        (left.properties.vulnerability_context_score ?? -1)
    );

  return {
    center: [-16.253, -47.95],
    neighborhoods,
    units: primaryUnits.map(susUnitToAppUnit),
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
    ],
    officialEvidence: {
      network: {
        totalEstablishments: dataset.healthUnits.length,
        primaryCareUnits: primaryUnits.length,
        ubs: primaryUnits.filter((unit) => unit.type === "UBS").length,
        cais: primaryUnits.filter((unit) => unit.type === "CAIS").length,
        validTeamLinks: primaryUnits.reduce((total, unit) => total + unit.teams, 0)
      },
      census: {
        sectors: dataset.censusSectors.features.length,
        urbanSectors: dataset.censusSectors.features.filter(
          (sector) => sector.properties.situation === "Urbana"
        ).length,
        ruralSectors: dataset.censusSectors.features.filter(
          (sector) => sector.properties.situation === "Rural"
        ).length,
        population2022: dataset.censusSectors.metadata.population_2022,
        occupiedHouseholds2022:
          dataset.censusSectors.metadata.occupied_households_2022,
        priorityDistribution: priorityLevels.map((level) => ({
          level,
          value: dataset.censusSectors.features.filter(
            (sector) => sector.properties.coverage_priority_level === level
          ).length
        })),
        vulnerabilityScoredSectors: rankedVulnerabilitySectors.length,
        vulnerabilitySuppressedSectors: dataset.censusSectors.features.filter(
          (sector) => sector.properties.suppressed_values_count > 0
        ).length,
        vulnerabilityDistribution: priorityLevels.map((level) => ({
          level,
          value: rankedVulnerabilitySectors.filter(
            (sector) => sector.properties.vulnerability_context_level === level
          ).length
        })),
        topPrioritySectors: rankedSectors.slice(0, 8).map((sector) => ({
          sectorCode: sector.properties.sector_code,
          population: sector.properties.population_2022,
          distanceKm: sector.properties.centroid_distance_km,
          nearestUnit: sector.properties.nearest_primary_care_name,
          score: sector.properties.coverage_priority_score,
          level: sector.properties.coverage_priority_level
        })),
        topVulnerabilitySectors: rankedVulnerabilitySectors
          .slice(0, 8)
          .map((sector) => ({
            sectorCode: sector.properties.sector_code,
            population: sector.properties.population_2022,
            childrenPercent: sector.properties.children_0_9_percent ?? 0,
            olderPeoplePercent:
              sector.properties.older_people_70_plus_percent ?? 0,
            waterGapPercent:
              sector.properties.households_non_network_water_min_percent ?? 0,
            sewageGapPercent:
              sector.properties.households_inadequate_sewage_min_percent ?? 0,
            wasteGapPercent:
              sector.properties.households_uncollected_waste_min_percent ?? 0,
            score: sector.properties.vulnerability_context_score ?? 0,
            level: sector.properties.vulnerability_context_level ?? "verde",
            hasSuppressedValues: sector.properties.suppressed_values_count > 0
          }))
      },
      sisabIndicators: dataset.sisabPerformanceIndicators
    }
  };
}

export function susToTerritorialData(dataset: SusDataset) {
  return {
    neighborhoods: riskAreasToNeighborhoods(dataset.riskMapAreas),
    units: primaryCareUnits(dataset).map(susUnitToAppUnit)
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
    notes: `Unidade carregada do cadastro publico oficial ${unit.source}.`
  };
}

function primaryCareUnits(dataset: SusDataset) {
  return dataset.healthUnits.filter(
    (unit) => unit.type === "UBS" || unit.type === "CAIS"
  );
}
