"use server";
import { revalidatePath } from "next/cache";
import { processContext } from "@/lib/processes/server";
import { isProcessUuid, processDatabaseError, processText, ProcessInputError, REVIEW_DECISIONS, safeProcessError, validateProcessFeedback } from "@/lib/processes/rules";
import type { ProcessActionResult } from "@/types/processReview";
function refresh() { revalidatePath("/processos", "layout"); revalidatePath("/unidades", "layout"); }
export async function sendProcessFeedback(input: { mapId: string; version: number; nonce: string; itemId: string; kind: string; message: string; proposal: string }): Promise<ProcessActionResult> {
  try {
    const value = validateProcessFeedback(input), { supabase } = await processContext();
    const { error } = await supabase.rpc("submit_process_feedback", { p_map_id: value.mapId, p_map_version: value.version, p_nonce: value.nonce, p_item_id: value.itemId, p_kind: value.kind, p_message: value.message, p_proposal: value.proposal });
    if (error) processDatabaseError(error); refresh(); return { success: "Contribuição registrada. Ela será analisada pela coordenação." };
  } catch (error) { return { error: safeProcessError(error) }; }
}
export async function setProcessMember(mapId: string, profileId: string, participation: string, active: boolean): Promise<ProcessActionResult> {
  try {
    if (!isProcessUuid(mapId) || !isProcessUuid(profileId) || !["viewer", "reviewer"].includes(participation) || typeof active !== "boolean") throw new ProcessInputError("Vínculo inválido.");
    const { supabase, user, manager } = await processContext(); if (!manager) throw new ProcessInputError("Somente a coordenação autorizada gerencia o acesso.");
    const { error } = await supabase.from("process_review_members").upsert({ map_id: mapId, profile_id: profileId, participation, active, granted_by: user.id }, { onConflict: "map_id,profile_id" });
    if (error) processDatabaseError(error); refresh(); return { success: active ? "Acesso concedido. Copie o link para compartilhar com a pessoa selecionada." : "Acesso revogado. As contribuições permanecem no histórico." };
  } catch (error) { return { error: safeProcessError(error) }; }
}
export async function reviewProcessFeedback(feedbackId: string, expectedRevision: number, decision: string, message: string): Promise<ProcessActionResult> {
  try {
    if (!isProcessUuid(feedbackId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || !Object.hasOwn(REVIEW_DECISIONS, decision)) throw new ProcessInputError("Análise inválida.");
    const note = processText(message, 2000, 5), { supabase, user, manager } = await processContext(); if (!manager) throw new ProcessInputError("Somente a coordenação autorizada analisa contribuições.");
    const { error } = await supabase.from("process_feedback_reviews").insert({ feedback_id: feedbackId, revision: expectedRevision + 1, decision, message: note, reviewer_id: user.id });
    if (error) processDatabaseError(error); refresh(); return { success: "Análise registrada no histórico. O conteúdo da teia permanece nesta versão." };
  } catch (error) { return { error: safeProcessError(error) }; }
}
export async function changeProcessRound(mapId: string, status: string): Promise<ProcessActionResult> {
  try {
    if (!isProcessUuid(mapId) || !["open", "closed"].includes(status)) throw new ProcessInputError("Rodada inválida.");
    const { supabase, manager } = await processContext(); if (!manager) throw new ProcessInputError("Somente a coordenação autorizada altera a rodada.");
    const { data, error } = await supabase.from("process_maps").update({ status }).eq("id", mapId).select("id").single();
    if (error || !data) processDatabaseError(error); refresh(); return { success: status === "open" ? "Rodada aberta para contribuições." : "Rodada encerrada. A leitura e o histórico foram preservados." };
  } catch (error) { return { error: safeProcessError(error) }; }
}
