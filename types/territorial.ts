export type HealthCondition =
  | "hipertensao"
  | "diabetes"
  | "obesidade"
  | "respiratoria"
  | "saudeMental"
  | "retornoPrecoce";

export type HealthUnitType = "UBS" | "CAIS" | "MUTIRAO";

export type RiskLevel = "baixo" | "medio" | "alto" | "critico";

export type CampaignLocationType =
  | "UBS"
  | "ESCOLA"
  | "CRAS"
  | "GINASIO"
  | "PRACA"
  | "PARCEIRO";

export type LatLngTuple = [number, number];

export interface NeighborhoodConditionTotals {
  hipertensao: number;
  diabetes: number;
  obesidade: number;
  respiratoria: number;
  saudeMental: number;
  retornoPrecoce: number;
}

export interface NeighborhoodRisk {
  id: string;
  name: string;
  ibgeCityCode: "5212501";
  population: number;
  aggregatedPatients: number;
  polygon: LatLngTuple[];
  centroid: LatLngTuple;
  vulnerabilityIndex: number;
  lastCampaignDaysAgo: number;
  conditions: NeighborhoodConditionTotals;
}

export interface HealthUnit {
  id: string;
  name: string;
  type: HealthUnitType;
  position: LatLngTuple;
  neighborhoodId: string;
  capacityPerShift: number;
  activeTeams: number;
  notes: string;
}

export interface CampaignLocationCandidate {
  id: string;
  name: string;
  type: CampaignLocationType;
  position: LatLngTuple;
  neighborhoodId: string;
  capacityPerShift: number;
  accessibilityScore: number;
  coveredNeighborhoodIds: string[];
  setupComplexity: "baixa" | "media" | "alta";
  notes: string;
}

export interface TerritorialScore {
  score: number;
  level: RiskLevel;
  drivers: string[];
  suggestedAction: string;
}

export interface AiCampaignSuggestion {
  targetNeighborhoodId: string;
  targetNeighborhoodName: string;
  condition: HealthCondition;
  expectedReach: number;
  rationale: string;
  recommendedUnitId?: string;
}

export interface CampaignLocationPrediction {
  location: CampaignLocationCandidate;
  targetNeighborhood: NeighborhoodRisk;
  score: number;
  expectedReach: number;
  coverageRadiusMeters: number;
  teamRecommendation: number;
  priorityCondition: HealthCondition;
  strengths: string[];
  risks: string[];
  rationale: string;
}

export interface CampaignOperationalPlan {
  title: string;
  locationName: string;
  targetNeighborhoodName: string;
  condition: HealthCondition;
  expectedReach: number;
  shifts: string[];
  teamMix: string[];
  actions: string[];
  dataGovernance: string[];
}
