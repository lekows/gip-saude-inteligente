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
export type CoveragePriorityLevel = SusRiskLevel;
export type VulnerabilityPriorityLevel = SusRiskLevel;
export type VulnerabilityDataStatus =
  | "complete"
  | "published_lower_bound"
  | "insufficient";

export interface CensusSectorProperties {
  sector_code: string;
  ibge_city_code: string;
  municipality: string;
  state: string;
  situation: "Urbana" | "Rural";
  area_km2: number;
  population_2022: number;
  occupied_households_2022: number;
  population_density_km2: number;
  centroid_lat: number;
  centroid_lng: number;
  nearest_primary_care_cnes: string;
  nearest_primary_care_name: string;
  centroid_distance_km: number;
  coverage_priority_score: number;
  coverage_priority_level: CoveragePriorityLevel;
  score_population_load: number;
  score_density_pressure: number;
  score_access_distance: number;
  score_model: "demonstrative_access_v1";
  residents_in_households_2022: number | null;
  children_0_9_2022: number | null;
  children_0_9_percent: number | null;
  older_people_70_plus_2022: number | null;
  older_people_70_plus_percent: number | null;
  permanent_occupied_households_2022: number | null;
  households_non_network_water_min_2022: number | null;
  households_non_network_water_min_percent: number | null;
  households_inadequate_sewage_min_2022: number | null;
  households_inadequate_sewage_min_percent: number | null;
  households_uncollected_waste_min_2022: number | null;
  households_uncollected_waste_min_percent: number | null;
  vulnerability_context_score: number | null;
  vulnerability_context_level: VulnerabilityPriorityLevel | null;
  score_children_share: number | null;
  score_older_people_share: number | null;
  score_water_gap: number | null;
  score_sewage_gap: number | null;
  score_waste_gap: number | null;
  vulnerability_score_model: "demonstrative_vulnerability_v1";
  vulnerability_data_status: VulnerabilityDataStatus;
  suppressed_values_count: number;
  dataset_status: "official_geography_demonstrative_score";
}

export interface CensusSectorFeature {
  type: "Feature";
  id: string;
  properties: CensusSectorProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface CensusSectorFeatureCollection {
  type: "FeatureCollection";
  name: string;
  metadata: {
    generated_at: string;
    municipality_ibge_code: string;
    official_geography_source: string;
    official_aggregate_source: string;
      official_geography_url: string;
      official_aggregate_url: string;
      official_demography_url: string;
      official_household_part1_url: string;
      official_household_part2_url: string;
    sector_count: number;
    population_2022: number;
    occupied_households_2022: number;
      score_notice: string;
      score_formula: string;
      vulnerability_notice: string;
      vulnerability_formula: string;
      suppression_notice: string;
    privacy: string;
    source_sha256: Record<string, string>;
  };
  features: CensusSectorFeature[];
}

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

export interface SISABPerformanceIndicator {
  period: string;
  quadrimester: string;
  ibgeCityCode: string;
  municipality: string;
  state: string;
  indicatorCode: string;
  indicatorName: string;
  numerator: number;
  denominator: number;
  resultPercent: number;
  teamView: "homologadas" | "validas" | "geral" | string;
  registeredPopulation: number;
  populationReference: number;
  sourceCreatedAt: string;
  source: SusSource | string;
  datasetStatus: string;
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
  sisabPerformanceIndicators: SISABPerformanceIndicator[];
  outpatientProduction: OutpatientProduction[];
  hospitalMorbidity: HospitalMorbidity[];
  mortalityRecords: MortalityRecord[];
  notifiableDiseases: NotifiableDiseaseRecord[];
  nutritionalStatus: NutritionalStatusRecord[];
  immunization: ImmunizationRecord[];
  riskMapAreas: RiskMapArea[];
  censusSectors: CensusSectorFeatureCollection;
}
