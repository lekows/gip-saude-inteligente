import { CampaignReportClient } from "@/components/campaign/CampaignReportClient";
import { getCampaignReportData } from "@/lib/campaignReportService";

export default function CampaignReportPage() {
  const data = getCampaignReportData();

  return <CampaignReportClient data={data} />;
}
