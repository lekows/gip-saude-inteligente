import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ManagerDashboardClient } from "@/components/dashboard/ManagerDashboardClient";
import { loadSusDataset } from "@/lib/dataLoaders/susFileRepository";
import { susToManagerDashboardData } from "@/lib/dataLoaders/susAdapters";

export default async function ManagerDashboardPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/entrar?redirect=/manager-dashboard");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/aguardando-aprovacao");
  }

  if (!profile.active || profile.account_status !== "aprovado") {
    redirect("/aguardando-aprovacao");
  }

  const susDataset = loadSusDataset();
  const dashboardData = susToManagerDashboardData(susDataset);

  return <ManagerDashboardClient data={dashboardData} />;
}
