import { communityCampaignData, mobileMissionData } from "@/data/mobileMvpData";
import type {
  ApproachOutcome,
  OfflineApproachRecord,
  MobileMissionStats,
  QuickScreeningInput,
  ScreeningRisk
} from "@/types/mobile";

export function getMobileMvpData() {
  return {
    mission: mobileMissionData,
    communityCampaign: communityCampaignData
  };
}

export function applyApproachOutcome(
  stats: MobileMissionStats,
  outcome: ApproachOutcome
): MobileMissionStats {
  const next = {
    ...stats,
    approachesDone: stats.approachesDone + 1,
    remainingApproaches: Math.max(stats.remainingApproaches - 1, 0)
  };

  if (outcome === "orientada") next.orientedPeople += 1;
  if (outcome === "convidada") next.invitedToCampaign += 1;
  if (outcome === "ausente") next.absentPeople += 1;
  if (outcome === "recusou") next.refusedPeople += 1;
  if (outcome === "triagem") next.screeningNeeded += 1;

  return next;
}

export function createOfflineApproachRecord({
  outcome,
  missionTitle,
  neighborhood
}: {
  outcome: ApproachOutcome;
  missionTitle: string;
  neighborhood: string;
}): OfflineApproachRecord {
  return {
    id: `approach-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    missionTitle,
    neighborhood,
    outcome,
    createdAt: new Date().toISOString(),
    syncStatus: "pendente"
  };
}

export function markRecordsAsSynced(records: OfflineApproachRecord[]) {
  return records.map((record) => ({
    ...record,
    syncStatus: "sincronizado" as const
  }));
}

export function summarizeOfflineQueue(records: OfflineApproachRecord[]) {
  return {
    total: records.length,
    pending: records.filter((record) => record.syncStatus === "pendente").length,
    synced: records.filter((record) => record.syncStatus === "sincronizado").length
  };
}

export function classifyQuickScreening(input: QuickScreeningInput): {
  risk: ScreeningRisk;
  label: string;
  guidance: string;
} {
  const pressure = parsePressure(input.bloodPressure);
  const glucose = input.glucose ? Number(input.glucose.replace(",", ".")) : undefined;

  if (
    input.needsReferral ||
    (pressure && (pressure.systolic >= 180 || pressure.diastolic >= 110)) ||
    (glucose !== undefined && glucose >= 250)
  ) {
    return {
      risk: "vermelho",
      label: "Encaminhar para avaliacao",
      guidance: "Registrar abordagem agregada e orientar procura imediata da UBS/retaguarda."
    };
  }

  if (
    (pressure && (pressure.systolic >= 140 || pressure.diastolic >= 90)) ||
    (glucose !== undefined && glucose >= 180) ||
    input.complaint.trim().length > 0
  ) {
    return {
      risk: "amarelo",
      label: "Atencao",
      guidance: "Convidar para mutirao e recomendar retorno programado na APS."
    };
  }

  return {
    risk: "verde",
    label: "Sem alerta imediato",
    guidance: "Orientar cuidados gerais e manter acompanhamento territorial."
  };
}

function parsePressure(value: string) {
  const normalized = value.toLowerCase().replace("x", "/").replace("-", "/");
  const [systolic, diastolic] = normalized
    .split("/")
    .map((part) => Number(part.trim()))
    .filter(Boolean);

  if (!systolic || !diastolic) return null;
  return { systolic, diastolic };
}
