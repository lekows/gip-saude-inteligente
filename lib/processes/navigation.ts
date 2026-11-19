/** Shareable UI state only: IDs still require server-side map access. */
export function normalizeProcessHash(raw: unknown, knownIds: readonly string[]): string {
  if (typeof raw !== "string" || raw.length > 1000) return "";
  const q = new URLSearchParams(raw.replace(/^#/, "")), out = new URLSearchParams(), ids = new Set(knownIds);
  const selected = q.get("n"), node = selected && ids.has(selected) ? selected : null;
  const activityMacro = node?.match(/^(M\d{2})\.A\d{2}$/)?.[1];
  const requestedMacro = activityMacro || q.get("m");
  const macro = requestedMacro && ids.has(requestedMacro) && /^M\d{2}$/.test(requestedMacro) ? requestedMacro : null;
  if (macro) out.set("m", macro);
  if (node && node !== "__map__") out.set("n", node);
  const view = q.get("v"), layout = q.get("l");
  if (view && ["tabela", "perguntas", "matriz", "validacao"].includes(view)) out.set("v", view);
  if (layout && ["camadas", "teia"].includes(layout)) out.set("l", layout);
  if (!macro && q.get("all") === "1") out.set("all", "1");
  const extras = [...new Set((q.get("x") || "").split(","))].filter(t => ["sistema", "pergunta", "risco", "proposta", "fonte", "decisao"].includes(t));
  if (extras.length) out.set("x", extras.join(","));
  if (node && q.get("wide") === "1") out.set("wide", "1");
  return out.size ? "#" + out.toString() : "";
}

export function parseProcessRound(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^[1-9]\d{0,9}$/.test(value)) return;
  const version = Number(value);
  return version <= 2147483647 ? version : undefined;
}

export function processHref(cnes: string, validation: boolean, hash: string, version?: number): string {
  if (!/^\d{7}$/.test(cnes)) throw new Error("CNES inválido.");
  const node = new URLSearchParams(hash.replace(/^#/, "")).get("n");
  const query = new URLSearchParams();
  if (version !== undefined && parseProcessRound(String(version))) query.set("rodada", String(version));
  if (node && /^M\d{2}\.A\d{2}$/.test(node)) query.set("atividade", node);
  return `/unidades/${cnes}/processos${validation ? "/validacao" : ""}${query.size ? "?" + query : ""}${hash}`;
}
