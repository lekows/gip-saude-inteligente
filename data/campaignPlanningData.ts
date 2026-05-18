import type { CampaignPlan } from "@/types/campaign";

export const campaignPlan: CampaignPlan = {
  id: "campaign-jardim-inga-has-dm",
  title: "Mutirao preventivo Jardim Inga",
  condition: "hipertensao",
  targetNeighborhoodId: "jardim-inga",
  targetNeighborhoodName: "Jardim Inga",
  commandPoint: [-16.196, -47.963],
  commandPointName: "Escola Comunitaria do Jardim Inga",
  coverageRadiusMeters: 1650,
  expectedReach: 384,
  expectedScreenings: 260,
  expectedHighRiskFound: 96,
  requiredTeams: 6,
  estimatedDurationHours: 8,
  microAreas: [
    {
      id: "mi-01",
      label: "Microarea Norte 01",
      position: [-16.174, -47.958],
      neighborhoodId: "jardim-inga",
      households: 78,
      estimatedPeople: 246,
      highRiskEstimate: 42,
      conditionFocus: "hipertensao",
      risk: "alto",
      visitWindow: "manha"
    },
    {
      id: "mi-02",
      label: "Microarea Norte 02",
      position: [-16.182, -47.939],
      neighborhoodId: "jardim-inga",
      households: 63,
      estimatedPeople: 205,
      highRiskEstimate: 31,
      conditionFocus: "diabetes",
      risk: "alto",
      visitWindow: "manha"
    },
    {
      id: "mi-03",
      label: "Microarea Oeste",
      position: [-16.194, -47.982],
      neighborhoodId: "jardim-inga",
      households: 52,
      estimatedPeople: 171,
      highRiskEstimate: 24,
      conditionFocus: "retornoPrecoce",
      risk: "medio",
      visitWindow: "tarde"
    },
    {
      id: "mi-04",
      label: "Microarea Escola",
      position: [-16.199, -47.963],
      neighborhoodId: "jardim-inga",
      households: 44,
      estimatedPeople: 138,
      highRiskEstimate: 18,
      conditionFocus: "obesidade",
      risk: "medio",
      visitWindow: "tarde"
    },
    {
      id: "mi-05",
      label: "Microarea Sul",
      position: [-16.208, -47.948],
      neighborhoodId: "jardim-inga",
      households: 37,
      estimatedPeople: 119,
      highRiskEstimate: 12,
      conditionFocus: "respiratoria",
      risk: "baixo",
      visitWindow: "noite"
    }
  ],
  routes: [
    {
      id: "route-acs-1",
      name: "Rota ACS 1 - Norte",
      points: [
        [-16.196, -47.963],
        [-16.186, -47.956],
        [-16.174, -47.958],
        [-16.182, -47.939]
      ],
      householdsCovered: 141,
      agentTeam: "ACS + Enfermagem"
    },
    {
      id: "route-acs-2",
      name: "Rota ACS 2 - Oeste",
      points: [
        [-16.196, -47.963],
        [-16.194, -47.982],
        [-16.205, -47.976],
        [-16.208, -47.948]
      ],
      householdsCovered: 89,
      agentTeam: "ACS + Educacao em saude"
    }
  ],
  actionSteps: [
    {
      time: "07:30",
      title: "Montagem e briefing",
      description: "Definir equipes por rota, conferir insumos e revisar microareas sintéticas.",
      owner: "Coordenacao APS"
    },
    {
      time: "08:30",
      title: "Busca ativa georreferenciada",
      description: "ACS percorrem rotas prioritarias e direcionam pessoas para o ponto de comando.",
      owner: "ACS"
    },
    {
      time: "10:00",
      title: "Triagem HAS/DM",
      description: "Afericao de PA, glicemia capilar, IMC e estratificacao de risco.",
      owner: "Enfermagem"
    },
    {
      time: "13:30",
      title: "Retorno precoce e encaminhamento",
      description: "Organizar agenda protegida para pessoas agregadas em alto risco.",
      owner: "Regulacao local"
    },
    {
      time: "16:30",
      title: "Fechamento territorial",
      description: "Registrar resultados agregados por bairro e microarea, sem endereco individual.",
      owner: "Gestao"
    }
  ]
};
