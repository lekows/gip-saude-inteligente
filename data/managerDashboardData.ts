import { healthUnits, luzianiaCenter, neighborhoodRisks } from "@/data/territorialData";
import type { ManagerDashboardData } from "@/types/managerDashboard";

export const managerDashboardData: ManagerDashboardData = {
  center: luzianiaCenter,
  neighborhoods: neighborhoodRisks,
  units: healthUnits.filter((unit) => unit.type === "UBS" || unit.type === "CAIS"),
  areas: [
    {
      id: "area-jardim-inga",
      neighborhoodId: "jardim-inga",
      label: "Jardim Inga",
      unitName: "UBS Jardim Inga",
      meta: 7200,
      registered: 5140,
      screenings: 2980,
      highRiskPatients: 910,
      campaignsDone: 3,
      averageWaitingDays: 22,
      interviews360Alerts: 18,
      earlyReturns: 790,
      patientScoreFactors: {
        alteredBloodPressure: 21,
        alteredGlucose: 16,
        bmiObesity: 7,
        chronicDiseases: 12,
        lowMedicationAdherence: 7,
        earlyReturn: 8,
        vulnerabilityAge: 8
      },
      territorialScoreFactors: {
        lowCoverage: 15,
        highRiskPercent: 22,
        missingPatients: 14,
        earlyReturns: 9,
        waitingTime: 8,
        hasDmLoad: 9,
        interviews360: 8
      },
      suggestedAction: "Mutirao preventivo com triagem cardiometabolica e retorno ativo."
    },
    {
      id: "area-pedregal",
      neighborhoodId: "pedregal",
      label: "Pedregal",
      unitName: "UBS Pedregal",
      meta: 6100,
      registered: 4260,
      screenings: 2450,
      highRiskPatients: 840,
      campaignsDone: 2,
      averageWaitingDays: 27,
      interviews360Alerts: 21,
      earlyReturns: 650,
      patientScoreFactors: {
        alteredBloodPressure: 23,
        alteredGlucose: 18,
        bmiObesity: 8,
        chronicDiseases: 13,
        lowMedicationAdherence: 8,
        earlyReturn: 7,
        vulnerabilityAge: 9
      },
      territorialScoreFactors: {
        lowCoverage: 16,
        highRiskPercent: 24,
        missingPatients: 13,
        earlyReturns: 8,
        waitingTime: 9,
        hasDmLoad: 10,
        interviews360: 9
      },
      suggestedAction: "Ampliar agenda, mutirao em ginasio e busca ativa de faltantes."
    },
    {
      id: "area-estrela",
      neighborhoodId: "parque-estrela-dalva",
      label: "Parque Estrela Dalva",
      unitName: "Mutirao Quadra Estrela Dalva",
      meta: 3600,
      registered: 2790,
      screenings: 1520,
      highRiskPatients: 410,
      campaignsDone: 2,
      averageWaitingDays: 18,
      interviews360Alerts: 13,
      earlyReturns: 430,
      patientScoreFactors: {
        alteredBloodPressure: 18,
        alteredGlucose: 13,
        bmiObesity: 7,
        chronicDiseases: 11,
        lowMedicationAdherence: 6,
        earlyReturn: 6,
        vulnerabilityAge: 6
      },
      territorialScoreFactors: {
        lowCoverage: 11,
        highRiskPercent: 17,
        missingPatients: 10,
        earlyReturns: 6,
        waitingTime: 6,
        hasDmLoad: 7,
        interviews360: 6
      },
      suggestedAction: "Realizar acao de obesidade, diabetes e educacao alimentar."
    },
    {
      id: "area-centro",
      neighborhoodId: "centro",
      label: "Centro",
      unitName: "UBS Centro Integrado",
      meta: 4400,
      registered: 3920,
      screenings: 2260,
      highRiskPatients: 360,
      campaignsDone: 4,
      averageWaitingDays: 12,
      interviews360Alerts: 8,
      earlyReturns: 350,
      patientScoreFactors: {
        alteredBloodPressure: 13,
        alteredGlucose: 9,
        bmiObesity: 4,
        chronicDiseases: 8,
        lowMedicationAdherence: 4,
        earlyReturn: 4,
        vulnerabilityAge: 5
      },
      territorialScoreFactors: {
        lowCoverage: 5,
        highRiskPercent: 10,
        missingPatients: 5,
        earlyReturns: 4,
        waitingTime: 3,
        hasDmLoad: 5,
        interviews360: 3
      },
      suggestedAction: "Manter acompanhamento e captar grupos sem cadastro atualizado."
    },
    {
      id: "area-mingone",
      neighborhoodId: "mingone",
      label: "Mingone",
      unitName: "CAIS Mingone",
      meta: 3300,
      registered: 2510,
      screenings: 1310,
      highRiskPatients: 330,
      campaignsDone: 1,
      averageWaitingDays: 20,
      interviews360Alerts: 11,
      earlyReturns: 300,
      patientScoreFactors: {
        alteredBloodPressure: 16,
        alteredGlucose: 11,
        bmiObesity: 6,
        chronicDiseases: 9,
        lowMedicationAdherence: 6,
        earlyReturn: 5,
        vulnerabilityAge: 6
      },
      territorialScoreFactors: {
        lowCoverage: 10,
        highRiskPercent: 15,
        missingPatients: 9,
        earlyReturns: 5,
        waitingTime: 7,
        hasDmLoad: 6,
        interviews360: 5
      },
      suggestedAction: "Busca ativa para retorno precoce e saude mental."
    },
    {
      id: "area-aeroporto",
      neighborhoodId: "setor-aeroporto",
      label: "Setor Aeroporto",
      unitName: "Polo UBS Setor Aeroporto",
      meta: 2700,
      registered: 2260,
      screenings: 1190,
      highRiskPatients: 210,
      campaignsDone: 2,
      averageWaitingDays: 11,
      interviews360Alerts: 7,
      earlyReturns: 220,
      patientScoreFactors: {
        alteredBloodPressure: 11,
        alteredGlucose: 8,
        bmiObesity: 5,
        chronicDiseases: 7,
        lowMedicationAdherence: 4,
        earlyReturn: 4,
        vulnerabilityAge: 5
      },
      territorialScoreFactors: {
        lowCoverage: 7,
        highRiskPercent: 9,
        missingPatients: 5,
        earlyReturns: 3,
        waitingTime: 3,
        hasDmLoad: 4,
        interviews360: 2
      },
      suggestedAction: "Reforcar cadastramento e monitorar fila de triagem."
    }
  ],
  monthlyEvolution: [
    { month: "Jan", cadastros: 2180, triagens: 1220 },
    { month: "Fev", cadastros: 2760, triagens: 1560 },
    { month: "Mar", cadastros: 3440, triagens: 2020 },
    { month: "Abr", cadastros: 4190, triagens: 2580 },
    { month: "Mai", cadastros: 5010, triagens: 3090 },
    { month: "Jun", cadastros: 5830, triagens: 3710 }
  ]
};
