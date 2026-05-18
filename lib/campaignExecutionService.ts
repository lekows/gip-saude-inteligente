import { campaignExecutionSnapshot } from "@/data/campaignExecutionData";
import { campaignPlan } from "@/data/campaignPlanningData";
import type { CampaignExecutionSnapshot, CampaignPlan, ExecutionStatus } from "@/types/campaign";

export function getCampaignExecutionData() {
  const snapshot = campaignExecutionSnapshot;
  const totals = calculateExecutionTotals(snapshot);
  const progress = calculateProgress(campaignPlan, snapshot);
  const microAreaRows = campaignPlan.microAreas.map((area) => {
    const execution = snapshot.microAreas.find((item) => item.microAreaId === area.id);
    return {
      ...area,
      execution
    };
  });

  return {
    plan: campaignPlan,
    snapshot,
    totals,
    progress,
    microAreaRows,
    chartData: {
      production: microAreaRows.map((item) => ({
        name: item.label.replace("Microarea ", ""),
        triados: item.execution?.peopleScreened ?? 0,
        altoRisco: item.execution?.highRiskFound ?? 0,
        encaminhados: item.execution?.referrals ?? 0
      })),
      status: statusOrder.map((status) => ({
        name: statusLabels[status],
        value: snapshot.microAreas.filter((item) => item.status === status).length,
        color: statusColors[status]
      })),
      timeline: [
        { hour: "08h", triagens: 38 },
        { hour: "09h", triagens: 72 },
        { hour: "10h", triagens: 116 },
        { hour: "11h", triagens: totals.peopleScreened }
      ]
    }
  };
}

export const statusLabels: Record<ExecutionStatus, string> = {
  nao_iniciado: "Nao iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluido",
  bloqueado: "Bloqueado"
};

export const statusColors: Record<ExecutionStatus, string> = {
  nao_iniciado: "#78716c",
  em_andamento: "#1c5f9f",
  concluido: "#1f7a4d",
  bloqueado: "#c24a2c"
};

const statusOrder: ExecutionStatus[] = [
  "nao_iniciado",
  "em_andamento",
  "concluido",
  "bloqueado"
];

function calculateExecutionTotals(snapshot: CampaignExecutionSnapshot) {
  return snapshot.microAreas.reduce(
    (acc, item) => ({
      householdsVisited: acc.householdsVisited + item.householdsVisited,
      peopleScreened: acc.peopleScreened + item.peopleScreened,
      bloodPressureChecks: acc.bloodPressureChecks + item.bloodPressureChecks,
      glucoseChecks: acc.glucoseChecks + item.glucoseChecks,
      referrals: acc.referrals + item.referrals,
      highRiskFound: acc.highRiskFound + item.highRiskFound,
      absenteesLocated: acc.absenteesLocated + item.absenteesLocated
    }),
    {
      householdsVisited: 0,
      peopleScreened: 0,
      bloodPressureChecks: 0,
      glucoseChecks: 0,
      referrals: 0,
      highRiskFound: 0,
      absenteesLocated: 0
    }
  );
}

function calculateProgress(plan: CampaignPlan, snapshot: CampaignExecutionSnapshot) {
  const householdsTarget = plan.microAreas.reduce((total, item) => total + item.households, 0);
  const totals = calculateExecutionTotals(snapshot);

  return {
    households: householdsTarget
      ? Math.round((totals.householdsVisited / householdsTarget) * 100)
      : 0,
    screenings: plan.expectedScreenings
      ? Math.round((totals.peopleScreened / plan.expectedScreenings) * 100)
      : 0,
    highRisk: plan.expectedHighRiskFound
      ? Math.round((totals.highRiskFound / plan.expectedHighRiskFound) * 100)
      : 0
  };
}
