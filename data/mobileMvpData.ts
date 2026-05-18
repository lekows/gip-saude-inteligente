import { healthUnits, luzianiaCenter, neighborhoodRisks } from "@/data/territorialData";
import type { CommunityCampaign, MobileMission } from "@/types/mobile";

const selectedNeighborhood = "jardim-inga";

export const mobileMissionData: MobileMission = {
  title: "Busca Ativa GIP",
  neighborhood: "Jardim Inga",
  conditionTheme: "Hipertensao e diabetes",
  online: true,
  center: luzianiaCenter,
  stats: {
    dailyTarget: 80,
    approachesDone: 34,
    remainingApproaches: 46,
    highRiskPeople: 9,
    invitedToCampaign: 21,
    orientedPeople: 18,
    absentPeople: 4,
    refusedPeople: 2,
    screeningNeeded: 10
  },
  riskAreas: neighborhoodRisks.map((area) => ({
    id: area.id,
    name: area.name,
    polygon: area.polygon,
    centroid: area.centroid,
    level:
      area.vulnerabilityIndex >= 0.75
        ? "alto"
        : area.vulnerabilityIndex >= 0.55
          ? "medio"
          : "baixo"
  })),
  markers: healthUnits
    .filter((unit) => unit.neighborhoodId === selectedNeighborhood || unit.type === "MUTIRAO")
    .map((unit) => ({
      id: unit.id,
      label: unit.name,
      type: unit.type === "MUTIRAO" ? "MUTIRAO" : "UBS",
      position: unit.position
    }))
};

export const communityCampaignData: CommunityCampaign = {
  title: "Mutirao preventivo GIP",
  neighborhood: "Jardim Inga",
  location: "Escola Comunitaria do Jardim Inga",
  date: "15/06/2026",
  time: "08h as 16h",
  focus: "Hipertensao, diabetes, orientacao e triagem rapida"
};
