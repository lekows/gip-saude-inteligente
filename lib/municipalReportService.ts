import { managerDashboardData } from "@/data/managerDashboardData";
import { getCampaignReportData } from "@/lib/campaignReportService";
import {
  enrichAreas,
  getManagerKpis,
  getPriorityRanking,
  getRiskDistribution
} from "@/lib/managerDashboardService";
import type { EnrichedManagerArea } from "@/types/managerDashboard";
import type { HealthCondition } from "@/types/territorial";

export type MunicipalCampaignStatus = "concluido" | "em_andamento" | "planejado";

export interface MunicipalCampaignSummary {
  id: string;
  title: string;
  neighborhoodId: string;
  neighborhoodName: string;
  unitName: string;
  condition: HealthCondition;
  month: string;
  status: MunicipalCampaignStatus;
  plannedScreenings: number;
  realizedScreenings: number;
  highRiskFound: number;
  referrals: number;
  absenteesLocated: number;
  beforeScore: number;
  afterScore: number;
}

export interface MunicipalAreaImpact extends EnrichedManagerArea {
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  campaigns: number;
  lastCampaign: string;
  impactStatus: "melhorou" | "estavel" | "atencao";
}

export function getMunicipalReportData() {
  const areas = enrichAreas(managerDashboardData.areas, managerDashboardData.neighborhoods);
  const currentReport = getCampaignReportData();
  const campaigns = buildCampaignHistory(currentReport);
  const areaImpacts = buildAreaImpacts(areas, campaigns);
  const kpis = getManagerKpis(areas);
  const completedCampaigns = campaigns.filter((item) => item.status !== "planejado");
  const totalPlanned = sum(campaigns, "plannedScreenings");
  const totalRealized = sum(campaigns, "realizedScreenings");
  const averageEffectiveness = totalPlanned ? Math.round((totalRealized / totalPlanned) * 100) : 0;

  return {
    city: "Luziania-GO",
    ibgeCode: "5212501",
    periodLabel: "Jan-Jun 2026",
    center: managerDashboardData.center,
    units: managerDashboardData.units,
    areas: areaImpacts,
    campaigns,
    priorityRanking: getPriorityRanking(areas),
    riskDistribution: getRiskDistribution(areas),
    kpis: {
      targetPatients: kpis.targetPatients,
      registeredPatients: kpis.registeredPatients,
      missingPatients: kpis.missingPatients,
      coverage: kpis.coverage,
      totalCampaigns: campaigns.length,
      completedCampaigns: completedCampaigns.length,
      screenings: totalRealized,
      highRiskFound: sum(campaigns, "highRiskFound"),
      referrals: sum(campaigns, "referrals"),
      absenteesLocated: sum(campaigns, "absenteesLocated"),
      averageEffectiveness,
      neighborhoodsImpacted: new Set(campaigns.map((item) => item.neighborhoodId)).size
    },
    charts: {
      monthlyEvolution: [
        { month: "Jan", campanhas: 1, triagens: 520, altoRisco: 88, cobertura: 62 },
        { month: "Fev", campanhas: 2, triagens: 940, altoRisco: 146, cobertura: 65 },
        { month: "Mar", campanhas: 2, triagens: 1120, altoRisco: 188, cobertura: 68 },
        { month: "Abr", campanhas: 3, triagens: 1480, altoRisco: 231, cobertura: 72 },
        { month: "Mai", campanhas: 3, triagens: 1660, altoRisco: 264, cobertura: 75 },
        { month: "Jun", campanhas: 4, triagens: totalRealized, altoRisco: sum(campaigns, "highRiskFound"), cobertura: kpis.coverage }
      ],
      conditionDistribution: buildConditionDistribution(campaigns),
      impactRanking: campaigns
        .map((item) => ({
          name: item.neighborhoodName,
          impacto: Math.max(item.beforeScore - item.afterScore, 0),
          triagens: item.realizedScreenings
        }))
        .sort((a, b) => b.impacto - a.impacto),
      territorialBeforeAfter: areaImpacts.map((area) => ({
        name: area.label,
        antes: area.beforeScore,
        depois: area.afterScore,
        atual: area.territorialScore
      }))
    },
    alerts: buildAlerts(areaImpacts, campaigns, averageEffectiveness),
    aiSummary: suggestMunicipalNextStep(areaImpacts)
  };
}

function buildCampaignHistory(currentReport: ReturnType<typeof getCampaignReportData>): MunicipalCampaignSummary[] {
  return [
    {
      id: currentReport.plan.id,
      title: currentReport.plan.title,
      neighborhoodId: currentReport.plan.targetNeighborhoodId,
      neighborhoodName: currentReport.plan.targetNeighborhoodName,
      unitName: "UBS Jardim Inga",
      condition: currentReport.plan.condition,
      month: "Jun",
      status: "em_andamento",
      plannedScreenings: currentReport.planned.screenings,
      realizedScreenings: currentReport.realized.screenings,
      highRiskFound: currentReport.realized.highRisk,
      referrals: currentReport.totals.referrals,
      absenteesLocated: currentReport.totals.absenteesLocated,
      beforeScore: 86,
      afterScore: 74
    },
    {
      id: "campaign-pedregal-has-dm",
      title: "Mutirao cardiometabolico Pedregal",
      neighborhoodId: "pedregal",
      neighborhoodName: "Pedregal",
      unitName: "UBS Pedregal",
      condition: "diabetes",
      month: "Mai",
      status: "concluido",
      plannedScreenings: 430,
      realizedScreenings: 462,
      highRiskFound: 91,
      referrals: 38,
      absenteesLocated: 74,
      beforeScore: 92,
      afterScore: 77
    },
    {
      id: "campaign-estrela-obesidade",
      title: "Acao saude alimentar Estrela Dalva",
      neighborhoodId: "parque-estrela-dalva",
      neighborhoodName: "Parque Estrela Dalva",
      unitName: "Mutirao Quadra Estrela Dalva",
      condition: "obesidade",
      month: "Abr",
      status: "concluido",
      plannedScreenings: 290,
      realizedScreenings: 318,
      highRiskFound: 44,
      referrals: 19,
      absenteesLocated: 41,
      beforeScore: 66,
      afterScore: 55
    },
    {
      id: "campaign-mingone-retorno",
      title: "Busca ativa retorno precoce Mingone",
      neighborhoodId: "mingone",
      neighborhoodName: "Mingone",
      unitName: "CAIS Mingone",
      condition: "retornoPrecoce",
      month: "Mar",
      status: "concluido",
      plannedScreenings: 260,
      realizedScreenings: 244,
      highRiskFound: 37,
      referrals: 21,
      absenteesLocated: 56,
      beforeScore: 61,
      afterScore: 52
    },
    {
      id: "campaign-aeroporto-respiratoria",
      title: "Triagem respiratoria Setor Aeroporto",
      neighborhoodId: "setor-aeroporto",
      neighborhoodName: "Setor Aeroporto",
      unitName: "Polo UBS Setor Aeroporto",
      condition: "respiratoria",
      month: "Fev",
      status: "concluido",
      plannedScreenings: 220,
      realizedScreenings: 236,
      highRiskFound: 24,
      referrals: 11,
      absenteesLocated: 30,
      beforeScore: 45,
      afterScore: 36
    },
    {
      id: "campaign-centro-saude-mental",
      title: "Escuta 360 e saude mental Centro",
      neighborhoodId: "centro",
      neighborhoodName: "Centro",
      unitName: "UBS Centro Integrado",
      condition: "saudeMental",
      month: "Jul",
      status: "planejado",
      plannedScreenings: 240,
      realizedScreenings: 0,
      highRiskFound: 0,
      referrals: 0,
      absenteesLocated: 0,
      beforeScore: 35,
      afterScore: 35
    }
  ];
}

function buildAreaImpacts(areas: EnrichedManagerArea[], campaigns: MunicipalCampaignSummary[]) {
  return areas.map((area) => {
    const related = campaigns.filter((item) => item.neighborhoodId === area.neighborhoodId);
    const last = related[0];
    const beforeScore = last?.beforeScore ?? Math.min(area.territorialScore + 7, 100);
    const afterScore = last?.afterScore ?? area.territorialScore;
    const scoreDelta = beforeScore - afterScore;

    return {
      ...area,
      beforeScore,
      afterScore,
      scoreDelta,
      campaigns: related.length,
      lastCampaign: last?.month ?? "Sem acao",
      impactStatus: scoreDelta >= 10 ? "melhorou" : afterScore >= 70 ? "atencao" : "estavel"
    } satisfies MunicipalAreaImpact;
  });
}

function buildConditionDistribution(campaigns: MunicipalCampaignSummary[]) {
  const labels: Record<HealthCondition, string> = {
    hipertensao: "Hipertensao",
    diabetes: "Diabetes",
    obesidade: "Obesidade",
    respiratoria: "Respiratoria",
    saudeMental: "Saude mental",
    retornoPrecoce: "Retorno precoce"
  };

  return Object.entries(labels).map(([condition, label]) => ({
    name: label,
    value: campaigns.filter((item) => item.condition === condition).length
  }));
}

function buildAlerts(
  areas: MunicipalAreaImpact[],
  campaigns: MunicipalCampaignSummary[],
  effectiveness: number
) {
  const attention = areas.filter((area) => area.afterScore >= 70);
  const planned = campaigns.filter((item) => item.status === "planejado");

  return [
    `${attention.length} bairros permanecem em faixa vermelha ou proxima do limite apos acoes recentes.`,
    `Efetividade media municipal em ${effectiveness}% considerando triagens planejadas x realizadas.`,
    `${planned.length} campanha planejada precisa de validacao de equipe, local e insumos antes da publicacao.`,
    "Todos os indicadores exibidos estao agregados por bairro, unidade ou campanha, sem pacientes identificaveis."
  ];
}

function suggestMunicipalNextStep(areas: MunicipalAreaImpact[]) {
  const [priority] = [...areas].sort((a, b) => {
    if (b.afterScore !== a.afterScore) return b.afterScore - a.afterScore;
    return b.missing - a.missing;
  });

  return `IA recomenda nova rodada em ${priority.label}, com foco em cobertura cadastral, retorno precoce e HAS/DM. O bairro segue com score ${priority.afterScore}, ${priority.missing.toLocaleString("pt-BR")} pacientes faltantes agregados e ${priority.highRiskPatients.toLocaleString("pt-BR")} pessoas em alto risco agregado.`;
}

type CampaignNumericKey = {
  [K in keyof MunicipalCampaignSummary]: MunicipalCampaignSummary[K] extends number ? K : never;
}[keyof MunicipalCampaignSummary];

function sum(items: MunicipalCampaignSummary[], key: CampaignNumericKey) {
  return items.reduce((total, item) => total + item[key], 0);
}
