import { MunicipalReportClient } from "@/components/municipal/MunicipalReportClient";
import { getMunicipalReportData } from "@/lib/municipalReportService";

export default function MunicipalReportPage() {
  const data = getMunicipalReportData();

  return <MunicipalReportClient data={data} />;
}
