"use server";

import { revalidatePath } from "next/cache";
import { evaluationContext } from "@/lib/evaluations/server";
import { EvaluationInputError, evaluationDateBoundary, isUuid, safeEvaluationError, SUGGESTION_CATEGORIES, SUGGESTION_STATUSES, validateAnswers, validateCampaignWindow } from "@/lib/evaluations/rules";
import type { EvaluationActionResult, EvaluationAnswers } from "@/types/evaluations";

function refreshEvaluations() {
  revalidatePath("/avaliacoes", "layout");
  revalidatePath("/gestao-avaliacoes", "layout");
}
function id(value: unknown) {
  if (!isUuid(value)) throw new EvaluationInputError("Identificador inválido.");
  return value;
}
function textValue(value: unknown, max: number, min = 0) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new EvaluationInputError(`Preencha o texto com ${min} a ${max} caracteres.`);
  return value.trim();
}
function databaseFailure(error: unknown): never {
  const code = (error as { code?: string } | null)?.code;
  if (code === "40001") throw new EvaluationInputError("Esta avaliação mudou em outra aba. Atualize a página antes de salvar novamente.");
  if (code === "23505") throw new EvaluationInputError("Este registro já foi recebido. Atualize a página para conferir.");
  throw new EvaluationInputError("Não foi possível gravar. Confira sua participação e o prazo; mantenha o formulário aberto e tente novamente.");
}

export async function saveSelfEvaluation(expectedRevision: number, input: { campaignId: string; answers: EvaluationAnswers; submit: boolean }): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext();
    const campaignId = id(input.campaignId);
    if (typeof input.submit !== "boolean" || !Number.isInteger(expectedRevision) || expectedRevision < 0) throw new EvaluationInputError("Envio inválido.");
    const answers = validateAnswers("self", input.answers, input.submit);
    const { error } = await supabase.rpc("save_evaluation_response", { p_campaign_id: campaignId, p_answers: answers, p_submit: input.submit, p_expected_revision: expectedRevision });
    if (error) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: input.submit ? "Avaliação enviada e registrada." : "Rascunho salvo. Você pode continuar depois." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function submitProgramEvaluation(input: { campaignId: string; nonce: string; answers: Record<string, number | null> }): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext();
    const { error } = await supabase.rpc("submit_anonymous_program_evaluation", { p_campaign_id: id(input.campaignId), p_answers: validateAnswers("program", input.answers, true), p_nonce: id(input.nonce) });
    if (error) databaseFailure(error);
    // Never log the input, auth identity, nonce, or raw database error on anonymous paths.
    return { success: true, message: "Avaliação recebida. Obrigado por contribuir." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function submitSuggestion(input: { nonce: string; category: string; message: string; proposal: string }): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext();
    if (!SUGGESTION_CATEGORIES.includes(input.category as typeof SUGGESTION_CATEGORIES[number])) throw new EvaluationInputError("Selecione uma categoria válida.");
    const { error } = await supabase.rpc("submit_anonymous_suggestion", {
      p_nonce: id(input.nonce), p_category: input.category,
      p_message: textValue(input.message, 3000, 10), p_proposal: textValue(input.proposal, 1500),
    });
    if (error) databaseFailure(error);
    return { success: true, message: "Sugestão recebida. Os encaminhamentos serão publicados no mural." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function createEvaluationCampaign(form: FormData): Promise<EvaluationActionResult> {
  try {
    const { supabase, user } = await evaluationContext("manager");
    const kind = form.get("kind"), stage = form.get("stage"), status = form.get("status");
    if (!(kind === "self" || kind === "program") || !["initial", "module", "final"].includes(String(stage)) || !["draft", "open"].includes(String(status))) throw new EvaluationInputError("Configuração inválida.");
    const opensAt = evaluationDateBoundary(form.get("opens_at"), false), closesAt = evaluationDateBoundary(form.get("closes_at"), true);
    validateCampaignWindow(opensAt, closesAt);
    const classId = form.get("class_id") ? id(form.get("class_id")) : null;
    if (stage === "module" && !classId) throw new EvaluationInputError("Selecione a capacitação para avaliar um módulo.");
    const { error } = await supabase.from("evaluation_campaigns").insert({
      title: textValue(form.get("title"), 160, 5), cycle_id: id(form.get("cycle_id")), class_id: classId,
      kind, stage, status, opens_at: opensAt, closes_at: closesAt, version: 1, created_by: user.id,
    });
    if (error) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: "Avaliação criada. As contas elegíveis terão acesso durante o período de abertura." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}


export async function changeCampaignWindow(campaignId: string, form: FormData): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext("manager");
    const status = String(form.get("status"));
    if (!["open", "closed"].includes(status)) throw new EvaluationInputError("Situação inválida.");
    const update = status === "closed" ? { status } : { status, opens_at: evaluationDateBoundary(form.get("opens_at"), false), closes_at: evaluationDateBoundary(form.get("closes_at"), true) };
    if ("opens_at" in update) validateCampaignWindow(update.opens_at!, update.closes_at!);
    const { data, error } = await supabase.from("evaluation_campaigns").update(update).eq("id", id(campaignId)).select("id").single();
    if (error || !data) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: "Período atualizado." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function addEvaluationFeedback(responseId: string, form: FormData): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext("reviewer");
    const { error } = await supabase.rpc("add_evaluation_feedback", { p_response_id: id(responseId), p_message: textValue(form.get("message"), 3000, 5) });
    if (error) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: "Devolutiva registrada e disponível ao aluno." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function reopenEvaluation(responseId: string, form: FormData): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext("manager");
    const { error } = await supabase.rpc("reopen_evaluation_response", { p_response_id: id(responseId), p_reason: textValue(form.get("reason"), 500, 10) });
    if (error) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: "Avaliação reaberta. O envio anterior permanece no histórico." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}

export async function reviewSuggestion(suggestionId: string, form: FormData): Promise<EvaluationActionResult> {
  try {
    const { supabase } = await evaluationContext("manager");
    const status = String(form.get("status"));
    if (!(Object.hasOwn(SUGGESTION_STATUSES, status))) throw new EvaluationInputError("Situação inválida.");
    const publish = form.get("publish") === "on";
    const resolution = textValue(form.get("resolution_summary") ?? "", 1500, publish || status === "declined" ? 10 : 0);
    const summary = textValue(form.get("public_summary") ?? "", 1000, publish ? 10 : 0);
    const dueDate = form.get("due_date") || null;
    if (dueDate !== null) evaluationDateBoundary(dueDate, false);
    const { error } = await supabase.rpc("review_anonymous_suggestion", {
      p_suggestion_id: id(suggestionId), p_status: status, p_resolution_summary: resolution,
      p_owner_label: textValue(form.get("owner_label") ?? "", 120), p_due_date: dueDate,
      p_publish: publish, p_public_summary: summary,
    });
    if (error) databaseFailure(error);
    refreshEvaluations();
    return { success: true, message: publish ? "Encaminhamento publicado no mural." : "Análise salva. Esta sugestão não está publicada no mural." };
  } catch (error) { return { error: safeEvaluationError(error) }; }
}
