import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EvaluationInputError, canManageEvaluations, canReviewEvaluations } from "@/lib/evaluations/rules";
import type { EvaluationCampaign, EvaluationFeedback, EvaluationResponse, SuggestionPublication } from "@/types/evaluations";

export async function evaluationContext(mode: "member" | "reviewer" | "manager" = "member") {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new EvaluationInputError("Sua sessão expirou. Entre novamente para continuar.");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role, account_status, active").eq("id", user.id).single();
  if (profileError || !profile || profile.account_status !== "aprovado" || !profile.active) {
    throw new EvaluationInputError("É necessário ter uma conta aprovada e ativa.");
  }
  if ((mode === "manager" && !canManageEvaluations(profile.role)) || (mode === "reviewer" && !canReviewEvaluations(profile.role))) {
    throw new EvaluationInputError("Você não tem permissão para esta ação.");
  }
  return { supabase, user, profile: profile as { role: string }, manager: canManageEvaluations(profile.role) };
}

export async function evaluationPageContext(mode: "member" | "reviewer" | "manager" = "member") {
  try { return await evaluationContext(mode); }
  catch { redirect(mode === "member" ? "/entrar?redirect=/avaliacoes" : "/avaliacoes"); }
}

export async function getMyEvaluations() {
  const context = await evaluationPageContext();
  const { supabase, user } = context;
  const [campaigns, responses, publications, membership] = await Promise.all([
    supabase.from("evaluation_campaigns").select("*").order("closes_at", { ascending: false }),
    supabase.from("evaluation_responses").select("*").eq("profile_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("suggestion_publications").select("*").limit(100),
    supabase.from("program_members").select("id").eq("profile_id", user.id).eq("status", "ativo").limit(1),
  ]);
  if (campaigns.error || responses.error || publications.error || membership.error) throw new EvaluationInputError("O módulo de avaliações está temporariamente indisponível.");
  const responseIds = (responses.data ?? []).map((response) => response.id);
  const feedback = responseIds.length ? await supabase.from("evaluation_feedback").select("*").in("response_id", responseIds).order("created_at") : { data: [], error: null };
  if (feedback.error) throw new EvaluationInputError("Não foi possível carregar as devolutivas.");
  return { ...context, campaigns: (campaigns.data ?? []) as EvaluationCampaign[], responses: (responses.data ?? []) as EvaluationResponse[], feedback: (feedback.data ?? []) as EvaluationFeedback[], publications: (publications.data ?? []) as SuggestionPublication[], hasMembership: Boolean(membership.data?.length) };
}
