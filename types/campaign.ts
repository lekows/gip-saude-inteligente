import type { HealthCondition, LatLngTuple } from "./territorial";

export type MicroAreaRisk = "baixo" | "medio" | "alto";

export interface SimulatedHouseholdCluster {
  id: string;
  label: string;
  position: LatLngTuple;
  neighborhoodId: string;
  households: number;
  estimatedPeople: number;
  highRiskEstimate: number;
  conditionFocus: HealthCondition;
  risk: MicroAreaRisk;
  visitWindow: "manha" | "tarde" | "noite";
}

export interface CampaignActionStep {
  time: string;
  title: string;
  description: string;
  owner: string;
}

export interface CampaignRouteSegment {
  id: string;
  name: string;
  points: LatLngTuple[];
  householdsCovered: number;
  agentTeam: string;
}

export interface CampaignPlan {
  id: string;
  title: string;
  condition: HealthCondition;
  targetNeighborhoodId: string;
  targetNeighborhoodName: string;
  commandPoint: LatLngTuple;
  commandPointName: string;
  coverageRadiusMeters: number;
  expectedReach: number;
  expectedScreenings: number;
  expectedHighRiskFound: number;
  requiredTeams: number;
  estimatedDurationHours: number;
  microAreas: SimulatedHouseholdCluster[];
  routes: CampaignRouteSegment[];
  actionSteps: CampaignActionStep[];
}

export type ExecutionStatus = "nao_iniciado" | "em_andamento" | "concluido" | "bloqueado";

export interface CampaignTeamAssignment {
  id: string;
  teamName: string;
  routeId: string;
  members: string[];
  status: ExecutionStatus;
  currentMicroAreaId?: string;
}

export interface MicroAreaExecution {
  microAreaId: string;
  status: ExecutionStatus;
  householdsVisited: number;
  peopleScreened: number;
  bloodPressureChecks: number;
  glucoseChecks: number;
  referrals: number;
  highRiskFound: number;
  absenteesLocated: number;
  note: string;
}

export interface CampaignOccurrence {
  id: string;
  time: string;
  severity: "info" | "alerta" | "critico";
  title: string;
  description: string;
}

export interface CampaignExecutionSnapshot {
  campaignId: string;
  startedAt: string;
  status: ExecutionStatus;
  teams: CampaignTeamAssignment[];
  microAreas: MicroAreaExecution[];
  occurrences: CampaignOccurrence[];
}
