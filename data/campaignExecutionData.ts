import { campaignPlan } from "@/data/campaignPlanningData";
import type { CampaignExecutionSnapshot } from "@/types/campaign";

export const campaignExecutionSnapshot: CampaignExecutionSnapshot = {
  campaignId: campaignPlan.id,
  startedAt: "2026-06-15T07:30:00.000Z",
  status: "em_andamento",
  teams: [
    {
      id: "team-1",
      teamName: "Equipe ACS Norte",
      routeId: "route-acs-1",
      members: ["2 ACS", "1 tecnica de enfermagem"],
      status: "em_andamento",
      currentMicroAreaId: "mi-01"
    },
    {
      id: "team-2",
      teamName: "Equipe Triagem Escola",
      routeId: "route-acs-2",
      members: ["1 enfermeira", "1 medico", "1 administrativo"],
      status: "em_andamento",
      currentMicroAreaId: "mi-04"
    },
    {
      id: "team-3",
      teamName: "Equipe Retorno Protegido",
      routeId: "route-acs-2",
      members: ["1 ACS", "1 regulacao"],
      status: "nao_iniciado",
      currentMicroAreaId: "mi-03"
    }
  ],
  microAreas: [
    {
      microAreaId: "mi-01",
      status: "em_andamento",
      householdsVisited: 44,
      peopleScreened: 96,
      bloodPressureChecks: 88,
      glucoseChecks: 52,
      referrals: 14,
      highRiskFound: 21,
      absenteesLocated: 18,
      note: "Boa adesao; reforcar retorno de HAS descompensada."
    },
    {
      microAreaId: "mi-02",
      status: "bloqueado",
      householdsVisited: 12,
      peopleScreened: 20,
      bloodPressureChecks: 18,
      glucoseChecks: 15,
      referrals: 4,
      highRiskFound: 8,
      absenteesLocated: 6,
      note: "Equipe aguardando apoio de transporte para trecho de dificil acesso."
    },
    {
      microAreaId: "mi-03",
      status: "nao_iniciado",
      householdsVisited: 0,
      peopleScreened: 0,
      bloodPressureChecks: 0,
      glucoseChecks: 0,
      referrals: 0,
      highRiskFound: 0,
      absenteesLocated: 0,
      note: "Prevista para o periodo da tarde."
    },
    {
      microAreaId: "mi-04",
      status: "concluido",
      householdsVisited: 44,
      peopleScreened: 82,
      bloodPressureChecks: 79,
      glucoseChecks: 38,
      referrals: 9,
      highRiskFound: 13,
      absenteesLocated: 11,
      note: "Microarea concluida; direcionar equipe para apoio ao norte."
    },
    {
      microAreaId: "mi-05",
      status: "nao_iniciado",
      householdsVisited: 0,
      peopleScreened: 0,
      bloodPressureChecks: 0,
      glucoseChecks: 0,
      referrals: 0,
      highRiskFound: 0,
      absenteesLocated: 0,
      note: "Prevista para busca ativa no fim do dia."
    }
  ],
  occurrences: [
    {
      id: "occ-1",
      time: "08:45",
      severity: "info",
      title: "Ponto de comando ativado",
      description: "Triagem iniciou com 3 guiches e fluxo separado para retorno precoce."
    },
    {
      id: "occ-2",
      time: "10:20",
      severity: "alerta",
      title: "Microarea Norte 02 bloqueada",
      description: "Trecho precisa de apoio de transporte para equipe ACS."
    },
    {
      id: "occ-3",
      time: "11:10",
      severity: "info",
      title: "Primeira microarea concluida",
      description: "Equipe Escola concluiu visita sintética e voltou ao ponto de comando."
    }
  ]
};
