import { getCampaignExecutionData } from "@/lib/campaignExecutionService";

export function getCampaignReportData() {
  const execution = getCampaignExecutionData();
  const { plan, totals, progress, snapshot, microAreaRows, chartData } = execution;
  const planned = {
    reach: plan.expectedReach,
    screenings: plan.expectedScreenings,
    highRisk: plan.expectedHighRiskFound,
    households: plan.microAreas.reduce((total, item) => total + item.households, 0)
  };
  const realized = {
    reach: totals.peopleScreened,
    screenings: totals.peopleScreened,
    highRisk: totals.highRiskFound,
    households: totals.householdsVisited
  };
  const effectiveness = {
    screenings: planned.screenings
      ? Math.round((realized.screenings / planned.screenings) * 100)
      : 0,
    highRisk: planned.highRisk
      ? Math.round((realized.highRisk / planned.highRisk) * 100)
      : 0,
    households: planned.households
      ? Math.round((realized.households / planned.households) * 100)
      : 0
  };

  return {
    ...execution,
    planned,
    realized,
    effectiveness,
    comparisonChart: [
      { name: "Domicilios", planejado: planned.households, realizado: realized.households },
      { name: "Triagens", planejado: planned.screenings, realizado: realized.screenings },
      { name: "Alto risco", planejado: planned.highRisk, realizado: realized.highRisk }
    ],
    recommendations: [
      "Reprogramar Microarea Norte 02 com apoio de transporte e equipe ACS extra.",
      "Abrir agenda protegida para alto risco encontrado em ate 7 dias.",
      "Manter ponto de comando na escola para nova rodada de retorno precoce.",
      "Atualizar dashboard com resultados agregados por bairro e microarea."
    ],
    pendingActions: [
      "Concluir visita na microarea Sul.",
      "Resolver bloqueio logistico na Norte 02.",
      "Consolidar encaminhamentos com regulacao local.",
      "Publicar resumo agregado para gestao municipal."
    ],
    snapshot,
    totals,
    progress,
    plan,
    microAreaRows,
    chartData
  };
}
