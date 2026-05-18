import type { LatLngTuple, RiskLevel } from "@/types/territorial";

export type ApproachOutcome =
  | "orientada"
  | "convidada"
  | "ausente"
  | "recusou"
  | "triagem";

export type ScreeningRisk = "verde" | "amarelo" | "vermelho";

export type MobileSyncStatus = "pendente" | "sincronizado";

export interface MobileMissionStats {
  dailyTarget: number;
  approachesDone: number;
  remainingApproaches: number;
  highRiskPeople: number;
  invitedToCampaign: number;
  orientedPeople: number;
  absentPeople: number;
  refusedPeople: number;
  screeningNeeded: number;
}

export interface MobileRiskArea {
  id: string;
  name: string;
  level: RiskLevel;
  polygon: LatLngTuple[];
  centroid: LatLngTuple;
}

export interface MobileMapMarker {
  id: string;
  label: string;
  type: "UBS" | "MUTIRAO";
  position: LatLngTuple;
}

export interface MobileMission {
  title: string;
  neighborhood: string;
  conditionTheme: string;
  online: boolean;
  stats: MobileMissionStats;
  riskAreas: MobileRiskArea[];
  markers: MobileMapMarker[];
  center: readonly [number, number];
}

export interface CommunityCampaign {
  title: string;
  neighborhood: string;
  location: string;
  date: string;
  time: string;
  focus: string;
}

export interface QuickScreeningInput {
  bloodPressure: string;
  glucose?: string;
  complaint: string;
  needsReferral: boolean;
}

export interface OfflineApproachRecord {
  id: string;
  missionTitle: string;
  neighborhood: string;
  outcome: ApproachOutcome;
  createdAt: string;
  syncStatus: MobileSyncStatus;
}
