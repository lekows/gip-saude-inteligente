export const VALID_ROLES = [
  "administrador",
  "professor_coordenador",
  "professor_colaborador",
  "academico_colaborador",
  "academico_participante",
  "gestor_municipal",
] as const;

export const VALID_STATUSES = ["pendente", "aprovado", "suspenso"] as const;

export type AppRole = typeof VALID_ROLES[number];
export type AccountStatus = typeof VALID_STATUSES[number];
