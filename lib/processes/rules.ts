export const FEEDBACK_KINDS = { understood: "Etapa compreendida", question: "Tenho uma dúvida", change: "Sugiro uma alteração", new_step: "Falta uma etapa ou ligação" } as const;
export const REVIEW_DECISIONS = { accepted: "Acolhida para próxima revisão", declined: "Não acolhida, com justificativa", needs_information: "Precisa de esclarecimento" } as const;
export class ProcessInputError extends Error {}
export function isProcessUuid(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function processText(value: unknown, max: number, min = 0): string {
  if (typeof value !== "string" || value.length > max || value.trim().length < min) throw new ProcessInputError(`Use entre ${min} e ${max} caracteres.`);
  return value.trim();
}
export function validateProcessFeedback(input: { mapId: unknown; version: unknown; nonce: unknown; itemId: unknown; kind: unknown; message: unknown; proposal: unknown }) {
  if (!isProcessUuid(input.mapId) || !isProcessUuid(input.nonce) || !Number.isSafeInteger(input.version) || Number(input.version) < 1) throw new ProcessInputError("Identificador ou versão inválidos. Atualize a página.");
  if (typeof input.kind !== "string" || !Object.hasOwn(FEEDBACK_KINDS, input.kind)) throw new ProcessInputError("Selecione o tipo de contribuição.");
  const itemId = processText(input.itemId, 100, 1);
  if (!/^[A-Za-z0-9_.-]+$/.test(itemId)) throw new ProcessInputError("Selecione uma etapa válida.");
  const message = processText(input.message, 3000, 10);
  const proposal = processText(input.proposal, 2000, input.kind === "change" || input.kind === "new_step" ? 10 : 0);
  return { mapId: input.mapId, version: Number(input.version), nonce: input.nonce, itemId, kind: input.kind as keyof typeof FEEDBACK_KINDS, message, proposal };
}
export function safeProcessError(error: unknown) { return error instanceof ProcessInputError ? error.message : "Não foi possível concluir. Confira seu acesso, mantenha o formulário aberto e tente novamente."; }
export function processDatabaseError(error: unknown): never {
  const code = (error as { code?: string } | null)?.code;
  if (code === "40001") throw new ProcessInputError("Outra alteração foi registrada ou a versão mudou. Atualize a página antes de continuar.");
  if (code === "54000") throw new ProcessInputError("Limite de contribuições por hora atingido. Tente novamente mais tarde.");
  if (code === "42501") throw new ProcessInputError("Sua sessão ou permissão mudou, ou a rodada foi encerrada. Atualize a página.");
  throw new ProcessInputError("Não foi possível gravar. Confira seu acesso e a etapa selecionada; seu texto foi mantido no formulário.");
}
