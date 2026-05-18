import type { HealthCondition, HealthUnit, LatLngTuple, NeighborhoodRisk } from "./territorial";

export type ManagerRiskLevel = "verde" | "amarelo" | "vermelho";

export interface PatientScoreFactors {
  alteredBloodPressure: number;
  alteredGlucose: number;
  bmiObesity: number;
  chronicDiseases: number;
  lowMedicationAdherence: number;
  earlyReturn: number;
  vulnerabilityAge: number;
}

export interface TerritorialScoreFactors {
  lowCoverage: number;
  highRiskPercent: number;
  missingPatients: number;
  earlyReturns: number;
  waitingTime: number;
  hasDmLoad: number;
  interviews360: number;
}

export interface ManagerArea {
  id: string;
  neighborhoodId: string;
  label: string;
  unitName: string;
  meta: number;
  registered: number;
  screenings: number;
  highRiskPatients: number;
  campaignsDone: number;
  averageWaitingDays: number;
  interviews360Alerts: number;
  earlyReturns: number;
  patientScoreFactors: PatientScoreFactors;
  territorialScoreFactors: TerritorialScoreFactors;
  suggestedAction: string;
}

export interface MonthlyManagerMetric {
  month: string;
  cadastros: number;
  triagens: number;
}

export interface ManagerDashboardData {
  neighborhoods: NeighborhoodRisk[];
  units: HealthUnit[];
  areas: ManagerArea[];
  monthlyEvolution: MonthlyManagerMetric[];
  center: readonly [number, number];
}

export interface ManagerKpis {
  targetPatients: number;
  registeredPatients: number;
  missingPatients: number;
  coverage: number;
  screenings: number;
  highRiskPatients: number;
  campaignsDone: number;
}

export interface EnrichedManagerArea extends ManagerArea {
  missing: number;
  coverage: number;
  patientScore: number;
  patientRiskLevel: ManagerRiskLevel;
  territorialScore: number;
  territorialRiskLevel: ManagerRiskLevel;
  polygon: LatLngTuple[];
  centroid: LatLngTuple;
}
