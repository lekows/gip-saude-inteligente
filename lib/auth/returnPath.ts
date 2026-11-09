// Only known local destinations may be carried through OAuth/magic-link login.
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300 || /[\\\u0000-\u0020]/.test(value)) return null;
  if (/^\/unidades\/\d{7}\/processos(?:\/validacao)?\?atividade=M\d{2}\.A\d{2}$/.test(value)) return value;
  if (value === "/processos" || value === "/unidades" || /^\/unidades\/\d{7}(?:\/(?:painel|processos(?:\/validacao)?|acoes(?:\/catarata)?))?$/.test(value)) return value;
  // Preserve previously supported GIP internal routes, without URLs, fragments or queries.
  return /^\/(?:meu-gip|avaliacoes(?:\/[0-9a-f-]{36}|\/sugestoes)?|manager-dashboard|territorial-map|gestao-academica|gestao-avaliacoes)$/.test(value) ? value : null;
}
