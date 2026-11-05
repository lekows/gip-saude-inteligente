import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProcessInputError } from "@/lib/processes/rules";
export async function processContext() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ProcessInputError("Entre na sua conta para acessar os processos.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("account_status,active").eq("id", user.id).single();
  if (profileError || !profile?.active || profile.account_status !== "aprovado") throw new ProcessInputError("É necessária uma conta aprovada e ativa.");
  const { data: manager, error: managerError } = await supabase.rpc("can_manage_gip");
  if (managerError) throw new ProcessInputError("Não foi possível verificar suas permissões.");
  return { supabase, user, manager: manager === true };
}
