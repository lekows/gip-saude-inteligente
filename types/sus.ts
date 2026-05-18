import type { HealthCondition, LatLngTuple } from "./territorial";

export type SusSource =
  | "CNES"
  | "SISAB"
  | "SIA"
  | "SIH"
  | "SIM"
  | "SINAN"
  | "SISVAN"
  | "PNI"
  | "IBGE";

export type SusRiskLevel = "verde" | "amarelo" | "vermelho";

export interface HealthUnit {
  cnes: string;
  name: string;
  type: "UBS" | "CAIS" | "HOSPITAL" | "OUTRO";
  ibgeCityCode: string;
  city: string;
  state: string;
  neighborhoodId: string;
  neighborhood: string;
  position: LatLngTuple;
  teams: number;
  source: SusSource | string;
}

export interface APSIndicator {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  unitCnes: string;
  condition: HealthCondition;
  targetPopulation: number;
  registeredPatients: number;
  screenings: number;
  highRiskPatients: number;
  earlyReturns: number;
  coveragePercent: number;
  source: SusSource | string;
}

export interface OutpatientProduction {
  period: string;
  ibgeCityCode: string;
  unitCnes: string;
  neighborhoodId: string;
  procedureGroup: string;
  quantity: number;
  source: SusSource | string;
}

export interface HospitalMorbidity {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  cidGroup: string;
  admissions: number;
  averageStayDays: number;
  source: SusSource | string;
}

export interface MortalityRecord {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  causeGroup: string;
  deaths: number;
  simulated: boolean;
  source: SusSource | string;
}

export interface NotifiableDiseaseRecord {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  disease: string;
  cases: number;
  source: SusSource | string;
}

export interface NutritionalStatusRecord {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  ageGroup: string;
  overweightCount: number;
  obesityCount: number;
  assessedCount: number;
  source: SusSource | string;
}

export interface ImmunizationRecord {
  period: string;
  ibgeCityCode: string;
  neighborhoodId: string;
  vaccine: string;
  coveragePercent: number;
  dosesApplied: number;
  source: SusSource | string;
}

export interface TerritorialIndicator {
  neighborhoodId: string;
  neighborhoodName: string;
  ibgeCityCode: string;
  population: number;
  targetPopulation: number;
  registeredPatients: number;
  missingPatients: number;
  coveragePercent: number;
  screenings: number;
  highRiskPatients: number;
  earlyReturns: number;
  outpatientProduction: number;
  hospitalAdmissions: number;
  notifiableCases: number;
  obesityCount: number;
  immunizationCoverage: number;
  mortalityCount: number;
}

export interface RiskMapArea extends TerritorialIndicator {
  polygon: LatLngTuple[];
  centroid: LatLngTuple;
  territorialScore: number;
  riskLevel: SusRiskLevel;
  suggestedAction: string;
}

export interface SusDataset {
  healthUnits: HealthUnit[];
  apsIndicators: APSIndicator[];
  outpatientProduction: OutpatientProduction[];
  hospitalMorbidity: HospitalMorbidity[];
  mortalityRecords: MortalityRecord[];
  notifiableDiseases: NotifiableDiseaseRecord[];
  nutritionalStatus: NutritionalStatusRecord[];
  immunization: ImmunizationRecord[];
  riskMapAreas: RiskMapArea[];
}
