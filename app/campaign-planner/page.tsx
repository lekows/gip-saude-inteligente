import { CampaignPlannerClient } from "@/components/campaign/CampaignPlannerClient";
import {
  getCampaignChartData,
  getRecommendedCampaignPlan
} from "@/lib/campaignPlanningService";

export default function CampaignPlannerPage() {
  const data = getRecommendedCampaignPlan();
  const chartData = getCampaignChartData();

  return <CampaignPlannerClient {...data} chartData={chartData} />;
}
