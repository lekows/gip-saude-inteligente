import { CampaignExecutionClient } from "@/components/campaign/CampaignExecutionClient";
import { getCampaignExecutionData } from "@/lib/campaignExecutionService";

export default function CampaignExecutionPage() {
  const data = getCampaignExecutionData();

  return <CampaignExecutionClient {...data} />;
}
