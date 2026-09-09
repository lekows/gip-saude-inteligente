import type { EvaluationAnswers, EvaluationCampaign, EvaluationKind } from "../../types/evaluations.ts";

export const SELF_RATINGS = {
  comprehension: "Compreensão dos conteúdos", confidence: "Segurança nas atividades",
  participation: "Participação e colaboração", communication: "Comunicação e postura ética",
  application: "Aplicação prática do aprendizado",
} as const;
export const SELF_TEXTS = {
  learning: "Principais aprendizados", difficulties: "Dificuldades encontradas",
  support: "Apoio necessário", next_step: "Objetivo para a próxima etapa",
} as const;
export const PROGRAM_RATINGS = {
  organization: "Organização", content: "Conteúdo", mentoring: "Orientação docente",
  practice: "Atividades práticas", infrastructure: "Infraestrutura", satisfaction: "Satisfação geral",
} as const;
export const SUGGESTION_CATEGORIES = ["aulas", "comunicacao", "organizacao", "materiais", "campo", "site", "outro"] as const;
export const SUGGESTION_STATUSES = {
  received: "Recebida", reviewing: "Em análise", planned: "Planejada",
  implemented: "Implementada", declined: "Não adotada",
} as const;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateAnswers(kind: EvaluationKind, value: unknown, submit: boolean): EvaluationAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Respostas inválidas.");
  const source = value as Record<string, unknown>;
  const ratings = kind === "self" ? SELF_RATINGS : PROGRAM_RATINGS;
  const allowed = new Set([...Object.keys(ratings), ...(kind === "self" ? Object.keys(SELF_TEXTS) : [])]);
  if (Object.keys(source).some((key) => !allowed.has(key))) throw new Error("O formulário contém campos desconhecidos.");
  const result: EvaluationAnswers = {};
  for (const key of Object.keys(ratings)) {
    if (!(key in source)) {
      if (submit) throw new Error("Responda todos os itens ou selecione não se aplica.");
      continue;
    }
    const rating = source[key];
    if (rating !== null && (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new Error("Use notas de 1 a 5 ou não se aplica.");
    }
    result[key] = rating as number | null;
  }
  if (kind === "self") {
    for (const key of Object.keys(SELF_TEXTS)) {
      const raw = source[key] ?? "";
      if (typeof raw !== "string" || raw.length > 1500) throw new Error("Cada texto pode ter até 1.500 caracteres.");
      result[key] = raw.trim();
    }
  }
  return result;
}

export function isCampaignOpen(campaign: Pick<EvaluationCampaign, "status" | "opens_at" | "closes_at">, now = Date.now()) {
  return campaign.status === "open" && Date.parse(campaign.opens_at) <= now && now < Date.parse(campaign.closes_at);
}

export function validateCampaignWindow(opensAt: string, closesAt: string) {
  const start = Date.parse(opensAt), end = Date.parse(closesAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("O encerramento deve ser posterior à abertura.");
  }
}

export function canManageEvaluations(role: string) {
  return role === "administrador" || role === "professor_coordenador";
}

export function canReviewEvaluations(role: string) {
  return canManageEvaluations(role) || role === "professor_colaborador";
}

export function safeEvaluationError(error: unknown) {
  // Validation messages created by the application are safe; database messages can contain answers.
  return error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente; suas respostas continuam no formulário.";
}
