import { ManagerDashboardClient } from "@/components/dashboard/ManagerDashboardClient";
import { loadSusDataset } from "@/lib/dataLoaders/susFileRepository";
import { susToManagerDashboardData } from "@/lib/dataLoaders/susAdapters";

export default function ManagerDashboardPage() {
  const susDataset = loadSusDataset();
  const dashboardData = susToManagerDashboardData(susDataset);

  return <ManagerDashboardClient data={dashboardData} />;
}
