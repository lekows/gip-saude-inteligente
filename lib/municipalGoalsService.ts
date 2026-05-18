import { getMunicipalReportData } from "@/lib/municipalReportService";
import type { HealthCondition } from "@/types/territorial";

export type GoalStatus = "verde" | "amarelo" | "vermelho";

export interface MunicipalGoal {
  id: string;
  neighborhoodId: string;
  neighborhoodName: string;
  unitName: string;
  condition: HealthCondition;
  metric: "cobertura" | "triagens" | "altoRisco" | "faltosos" | "retorno";
  target: number;
  current: number;
  deadline: string;
  owner: string;
  action: string;
}

export interface EnrichedMunicipalGoal extends MunicipalGoal {
  progress: number;
  gap: number;
  status: GoalStatus;
  riskOfDelay: number;
  aiRecommendation: string;
}

const metricLabels: Record<MunicipalGoal["metric"], string> = {
  cobertura: "Cobertura cadastral",
  triagens: "Triagens preventivas",
  altoRisco: "Alto risco acompanhado",
  faltosos: "Busca ativa de faltosos",
  retorno: "Retorno protegido"
};

const conditionLabels: Record<HealthCondition, string> = {
  hipertensao: "hipertensao",
  diabetes: "diabetes",
  obesidade: "obesidade",
  respiratoria: "respiratoria",
  saudeMental: "saude mental",
  retornoPrecoce: "retorno precoce"
};

export function getMunicipalGoalsData() {
  const municipal = getMunicipalReportData();
  const goals = enrichGoals(buildGoals());
  const urgentGoals = goals.filter((goal) => goal.status === "vermelho");
  const warningGoals = goals.filter((goal) => goal.status === "amarelo");
  const completedOrStable = goals.filter((goal) => goal.status === "verde");
  const totalTarget = goals.reduce((total, goal) => total + goal.target, 0);
  const totalCurrent = goals.reduce((total, goal) => total + goal.current, 0);
  const averageProgress = goals.length
    ? Math.round(goals.reduce((total, goal) => total + goal.progress, 0) / goals.length)
    : 0;

  return {
    city: municipal.city,
    ibgeCode: municipal.ibgeCode,
    periodLabel: "Pactuacao 2026",
    goals,
    kpis: {
      totalGoals: goals.length,
      averageProgress,
      totalTarget,
      totalCurrent,
      totalGap: Math.max(totalTarget - totalCurrent, 0),
      urgentGoals: urgentGoals.length,
      warningGoals: warningGoals.length,
      stableGoals: completedOrStable.length
    },
    charts: {
      progressByNeighborhood: goals.map((goal) => ({
        name: goal.neighborhoodName,
        progresso: goal.progress,
        risco: goal.riskOfDelay
      })),
      statusDistribution: [
        { name: "No prazo", value: completedOrStable.length, color: "#1f7a4d" },
        { name: "Atencao", value: warningGoals.length, color: "#f3d37a" },
        { name: "Critico", value: urgentGoals.length, color: "#c24a2c" }
      ],
      gapRanking: [...goals]
        .sort((a, b) => b.gap - a.gap)
        .map((goal) => ({
          name: goal.neighborhoodName,
          faltante: goal.gap,
          meta: goal.target
        }))
    },
    alerts: [
      `${urgentGoals.length} metas estao em risco alto de nao cumprimento e exigem plano corretivo.`,
      `${warningGoals.length} metas precisam de reforco de equipe, agenda protegida ou busca ativa.`,
      `Progresso medio municipal esta em ${averageProgress}% das metas pactuadas.`,
      "Todas as metas usam dados agregados por bairro, unidade e condicao, sem identificacao individual."
    ],
    aiPlan: buildAiPlan(urgentGoals[0] ?? warningGoals[0] ?? goals[0])
  };
}

function buildGoals(): MunicipalGoal[] {
  return [
    {
      id: "goal-jardim-inga-cobertura",
      neighborhoodId: "jardim-inga",
      neighborhoodName: "Jardim Inga",
      unitName: "UBS Jardim Inga",
      condition: "hipertensao",
      metric: "cobertura",
      target: 85,
      current: 71,
      deadline: "30/06/2026",
      owner: "Coordenacao APS Norte",
      action: "Elevar cobertura de hipertensos cadastrados e estratificados."
    },
    {
      id: "goal-pedregal-alto-risco",
      neighborhoodId: "pedregal",
      neighborhoodName: "Pedregal",
      unitName: "UBS Pedregal",
      condition: "diabetes",
      metric: "altoRisco",
      target: 620,
      current: 410,
      deadline: "15/07/2026",
      owner: "Equipe Saude da Familia Pedregal",
      action: "Acompanhar alto risco cardiometabolico com retorno protegido."
    },
    {
      id: "goal-estrela-triagens",
      neighborhoodId: "parque-estrela-dalva",
      neighborhoodName: "Parque Estrela Dalva",
      unitName: "Mutirao Quadra Estrela Dalva",
      condition: "obesidade",
      metric: "triagens",
      target: 480,
      current: 318,
      deadline: "31/07/2026",
      owner: "Nucleo de Prevencao",
      action: "Expandir triagem de IMC, glicemia e educacao alimentar."
    },
    {
      id: "goal-mingone-retorno",
      neighborhoodId: "mingone",
      neighborhoodName: "Mingone",
      unitName: "CAIS Mingone",
      condition: "retornoPrecoce",
      metric: "retorno",
      target: 260,
      current: 194,
      deadline: "20/07/2026",
      owner: "Regulacao local",
      action: "Garantir retorno em ate 7 dias para grupos vulneraveis."
    },
    {
      id: "goal-aeroporto-faltosos",
      neighborhoodId: "setor-aeroporto",
      neighborhoodName: "Setor Aeroporto",
      unitName: "Polo UBS Setor Aeroporto",
      condition: "respiratoria",
      metric: "faltosos",
      target: 210,
      current: 176,
      deadline: "10/08/2026",
      owner: "Equipe ACS Aeroporto",
      action: "Localizar faltosos respiratorios e atualizar cadastro."
    },
    {
      id: "goal-centro-saude-mental",
      neighborhoodId: "centro",
      neighborhoodName: "Centro",
      unitName: "UBS Centro Integrado",
      condition: "saudeMental",
      metric: "triagens",
      target: 240,
      current: 92,
      deadline: "31/08/2026",
      owner: "Equipe Multiprofissional",
      action: "Aplicar escuta 360 e classificar necessidade de acompanhamento."
    }
  ];
}

function enrichGoals(goals: MunicipalGoal[]): EnrichedMunicipalGoal[] {
  return goals.map((goal) => {
    const progress = goal.target ? Math.round((goal.current / goal.target) * 100) : 0;
    const gap = Math.max(goal.target - goal.current, 0);
    const riskOfDelay = calculateRiskOfDelay(progress, gap, goal.metric);
    const status = riskOfDelay >= 70 ? "vermelho" : riskOfDelay >= 40 ? "amarelo" : "verde";

    return {
      ...goal,
      progress,
      gap,
      riskOfDelay,
      status,
      aiRecommendation: buildGoalRecommendation(goal, gap, progress, status)
    };
  });
}

function calculateRiskOfDelay(progress: number, gap: number, metric: MunicipalGoal["metric"]) {
  const metricWeight = metric === "altoRisco" || metric === "retorno" ? 18 : 10;
  const gapWeight = gap > 150 ? 22 : gap > 80 ? 14 : 6;
  return Math.min(100, Math.max(0, 100 - progress + metricWeight + gapWeight));
}

function buildGoalRecommendation(
  goal: MunicipalGoal,
  gap: number,
  progress: number,
  status: GoalStatus
) {
  if (status === "vermelho") {
    return `IA sugere mutirao em ${goal.neighborhoodName}, busca ativa de ${gap.toLocaleString("pt-BR")} faltantes da meta e agenda protegida para ${conditionLabels[goal.condition]}.`;
  }

  if (status === "amarelo") {
    return `IA sugere reforco de ACS e revisao semanal da meta de ${metricLabels[goal.metric].toLowerCase()}, hoje com ${progress}% de cumprimento.`;
  }

  return `Meta em curso adequado; manter monitoramento e registrar resultado agregado no relatorio municipal.`;
}

function buildAiPlan(goal: EnrichedMunicipalGoal) {
  return [
    `Priorizar ${goal.neighborhoodName} pela combinacao de risco ${goal.status}, gap de ${goal.gap.toLocaleString("pt-BR")} e prazo ${goal.deadline}.`,
    `Acionar ${goal.owner} para pactuar microplano de 14 dias com revisao semanal.`,
    `Direcionar campanha para ${conditionLabels[goal.condition]} e medir entrega por bairro/unidade, sem dados identificaveis.`,
    "Ao final, publicar resultado no relatorio municipal e recalcular ranking territorial."
  ];
}

export function getGoalMetricLabel(metric: MunicipalGoal["metric"]) {
  return metricLabels[metric];
}

export function getGoalConditionLabel(condition: HealthCondition) {
  return conditionLabels[condition];
}
