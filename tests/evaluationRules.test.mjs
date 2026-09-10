import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageEvaluations,
  canReviewEvaluations,
  EvaluationInputError,
  evaluationDateBoundary,
  isCampaignOpen,
  isUuid,
  safeEvaluationError,
  validateAnswers,
  validateCampaignWindow,
} from "../lib/evaluations/rules.ts";

const selfAnswers = {
  comprehension: 1,
  confidence: 2,
  participation: 3,
  communication: 4,
  application: 5,
};
const programAnswers = {
  organization: 1,
  content: 2,
  mentoring: 3,
  practice: 4,
  infrastructure: 5,
  satisfaction: null,
};

test("avaliação do curso exige uma classificação e comentário de pelo menos vinte caracteres", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    assert.deepEqual(validateAnswers("self", { course_rating: rating, course_review: "x".repeat(20) }, true), { course_rating: rating, course_review: "x".repeat(20) });
  }
  const input = { course_rating: 4, course_review: "  Gostei muito deste curso  " };
  assert.deepEqual(validateAnswers("self", input, true), { course_rating: 4, course_review: "Gostei muito deste curso" });
  assert.equal(input.course_review, "  Gostei muito deste curso  ");
  for (const review of [undefined, null, "", "x".repeat(19), " ".repeat(30), " \n\tcurto\t\n "]) {
    assert.throws(() => validateAnswers("self", { course_rating: 4, course_review: review }, true), /pelo menos 20/);
  }
  assert.deepEqual(validateAnswers("self", { course_rating: 4 }, false), { course_rating: 4, course_review: "" });
});

test("rascunho do curso aceita comentário sem estrelas, mas envio exige classificação", () => {
  const draft = { course_review: "Ainda estou avaliando" };
  assert.deepEqual(validateAnswers("self", draft, false), draft);
  assert.throws(() => validateAnswers("self", draft, true), /1 a 5 estrelas/);
  for (const invalid of [0, 6, -1, 1.5, NaN, Infinity, "5", null, undefined, true, [], {}]) {
    assert.throws(() => validateAnswers("self", { course_rating: invalid }, true), /1 a 5 estrelas/);
  }
});

test("curso rejeita campos antigos misturados e respeita o limite do comentário", () => {
  assert.throws(() => validateAnswers("self", { course_rating: 4, comprehension: 4 }, true), /desconhecidos/);
  assert.throws(() => validateAnswers("program", { course_rating: 4 }, true), /desconhecidos/);
  assert.throws(() => validateAnswers("self", { course_rating: 4, profile_id: "outro-aluno" }, true), /desconhecidos/);
  assert.equal(validateAnswers("self", { course_review: "x".repeat(1500) }, false).course_review.length, 1500);
  for (const review of ["x".repeat(1501), 5, false, [], {}]) {
    assert.throws(() => validateAnswers("self", { course_review: review }, false), /1.500/);
  }
});

test("autoavaliação aceita a escala inteira e normaliza textos sem alterar a entrada", () => {
  const input = { ...selfAnswers, learning: "  Trabalho em equipe  " };
  assert.deepEqual(validateAnswers("self", input, true), {
    ...selfAnswers,
    learning: "Trabalho em equipe",
    difficulties: "",
    support: "",
    next_step: "",
  });
  assert.equal(input.learning, "  Trabalho em equipe  ");
});

test("não se aplica é uma resposta explícita válida, diferente de um item ausente", () => {
  const notApplicable = Object.fromEntries(Object.keys(selfAnswers).map((key) => [key, null]));
  assert.equal(validateAnswers("self", notApplicable, true).comprehension, null);
  assert.deepEqual(validateAnswers("program", programAnswers, true), programAnswers);
  const incomplete = { ...programAnswers };
  delete incomplete.satisfaction;
  assert.throws(() => validateAnswers("program", incomplete, true), /Responda todos/);
});

test("rascunho incompleto pode ser salvo, mas não enviado como avaliação final", () => {
  const draft = validateAnswers("self", { comprehension: 4, difficulties: "Revisar conteúdo" }, false);
  assert.equal(draft.comprehension, 4);
  assert.equal(draft.difficulties, "Revisar conteúdo");
  assert.equal(Object.hasOwn(draft, "confidence"), false);
  assert.doesNotThrow(() => validateAnswers("program", {}, false));
  assert.throws(() => validateAnswers("self", draft, true), /Responda todos/);
  assert.throws(() => validateAnswers("program", {}, true), /Responda todos/);
});

test("notas inválidas não são convertidas silenciosamente", () => {
  for (const invalid of [0, 6, -1, 1.5, NaN, Infinity, -Infinity, "5", "", true, false, undefined, [], {}]) {
    assert.throws(() => validateAnswers("self", { ...selfAnswers, confidence: invalid }, true), /notas/);
    assert.throws(() => validateAnswers("program", { ...programAnswers, content: invalid }, false), /notas/);
  }
});

test("respostas precisam de objeto e campos desconhecidos são rejeitados", () => {
  for (const invalid of [null, undefined, false, 3, "respostas", [], [selfAnswers]]) {
    assert.throws(() => validateAnswers("self", invalid, false), /Respostas inválidas/);
  }
  assert.throws(() => validateAnswers("self", { ...selfAnswers, profile_id: "outro-aluno" }, true), /desconhecidos/);
  assert.throws(() => validateAnswers("program", { ...programAnswers, email: "fixture@example.invalid" }, true), /desconhecidos/);
  assert.throws(() => validateAnswers("program", { ...programAnswers, learning: "texto pessoal" }, true), /desconhecidos/);
});

test("textos opcionais respeitam tipo e limite, inclusive em rascunhos", () => {
  for (const field of ["learning", "difficulties", "support", "next_step"]) {
    assert.equal(validateAnswers("self", { ...selfAnswers, [field]: "x".repeat(1500) }, true)[field].length, 1500);
    assert.equal(validateAnswers("self", { ...selfAnswers, [field]: null }, true)[field], "");
    assert.throws(() => validateAnswers("self", { [field]: "x".repeat(1501) }, false), /1.500/);
    for (const value of [5, false, [], {}]) {
      assert.throws(() => validateAnswers("self", { ...selfAnswers, [field]: value }, true), /1.500/);
    }
  }
});

test("janela de participação inclui abertura e exclui encerramento", () => {
  const campaign = { status: "open", opens_at: "2026-09-09T09:00:00-03:00", closes_at: "2026-09-10T09:00:00-03:00" };
  const start = Date.parse("2026-09-09T12:00:00Z");
  const end = Date.parse("2026-09-10T12:00:00Z");
  assert.equal(isCampaignOpen(campaign, start - 1), false);
  assert.equal(isCampaignOpen(campaign, start), true);
  assert.equal(isCampaignOpen(campaign, end - 1), true);
  assert.equal(isCampaignOpen(campaign, end), false);
  assert.equal(isCampaignOpen({ ...campaign, status: "draft" }, start), false);
  assert.equal(isCampaignOpen({ ...campaign, status: "closed" }, start), false);
  assert.equal(isCampaignOpen({ ...campaign, opens_at: "inválida" }, start), false);
  assert.equal(isCampaignOpen({ ...campaign, closes_at: "inválida" }, start), false);
});

test("configuração de período rejeita datas ausentes, inválidas, iguais ou invertidas", () => {
  const opening = "2026-09-09T09:00:00-03:00";
  assert.doesNotThrow(() => validateCampaignWindow(opening, "2026-09-09T12:00:01Z"));
  for (const [start, end] of [[opening, opening], [opening, "2026-09-08T09:00:00-03:00"], ["", opening], [opening, ""], ["inválida", opening], [opening, "inválida"]]) {
    assert.throws(() => validateCampaignWindow(start, end), /posterior/);
  }
});

test("permissões distinguem coordenação, docentes e alunos sem ampliar papéis desconhecidos", () => {
  for (const role of ["administrador", "professor_coordenador"]) {
    assert.equal(canManageEvaluations(role), true);
    assert.equal(canReviewEvaluations(role), true);
  }
  assert.equal(canManageEvaluations("professor_colaborador"), false);
  assert.equal(canReviewEvaluations("professor_colaborador"), true);
  for (const role of ["academico_participante", "academico_colaborador", "gestor_municipal", "admin", "", "toString"]) {
    assert.equal(canManageEvaluations(role), false);
    assert.equal(canReviewEvaluations(role), false);
  }
});

test("identificadores precisam de UUID completo e variante válida", () => {
  assert.equal(isUuid("99999999-9999-4999-8999-999999999999"), true);
  assert.equal(isUuid("ABCDEFAB-1234-4ABC-A123-ABCDEFABCDEF"), true);
  for (const value of [null, undefined, 1, "", "99999999-9999-4999-8999", "99999999-9999-0999-8999-999999999999", "99999999-9999-4999-0999-999999999999", " 99999999-9999-4999-8999-999999999999", "99999999-9999-4999-8999-999999999999;drop table"]) {
    assert.equal(isUuid(value), false);
  }
});

test("erros de SDK, transporte e banco não expõem conteúdo das respostas", () => {
  const privateMarker = "conteudo-restrito-da-sugestao-sintetica";
  const fallback = safeEvaluationError(null);
  for (const error of [
    new Error(`Database rejected payload: ${privateMarker}`),
    new TypeError(`Failed to fetch: ${privateMarker}`),
    { message: privateMarker, code: "23514", details: privateMarker },
    { name: "EvaluationInputError", message: privateMarker },
    privateMarker,
    undefined,
  ]) {
    assert.equal(safeEvaluationError(error), fallback);
    assert.doesNotMatch(safeEvaluationError(error), new RegExp(privateMarker));
  }
  assert.match(fallback, /Tente novamente/);
});

test("validação própria preserva orientação útil sem incluir a resposta inválida", () => {
  const privateMarker = "resposta-sintetica-invalida";
  try {
    validateAnswers("self", { ...selfAnswers, comprehension: privateMarker }, true);
    assert.fail("A resposta precisa ser rejeitada.");
  } catch (error) {
    assert.ok(error instanceof EvaluationInputError);
    assert.match(safeEvaluationError(error), /notas de 1 a 5/);
    assert.doesNotMatch(safeEvaluationError(error), new RegExp(privateMarker));
  }
  assert.equal(safeEvaluationError(new EvaluationInputError("Selecione uma categoria válida.")), "Selecione uma categoria válida.");
});

test("datas civis impossíveis não são normalizadas para outro mês", () => {
  for (const date of ["2026-02-29", "2026-02-30", "2026-02-31", "2026-04-31", "1900-02-29", "2100-02-29", "2026-13-01", "2026-00-01", "2026-09-00", "2026-09-32"]) {
    for (const end of [false, true]) {
      assert.throws(() => evaluationDateBoundary(date, end), EvaluationInputError);
    }
  }
});

test("datas bissextas válidas preservam o dia selecionado", () => {
  for (const date of ["2024-02-29", "2028-02-29", "2000-02-29", "2026-04-30", "2026-12-31"]) {
    assert.equal(evaluationDateBoundary(date, false).slice(0, 10), date);
    assert.equal(evaluationDateBoundary(date, true).slice(0, 10), date);
  }
});

test("períodos usam o dia local de Brasília, inclusive ao atravessar o mês em UTC", () => {
  const opening = evaluationDateBoundary("2026-09-30", false);
  const closing = evaluationDateBoundary("2026-09-30", true);
  assert.equal(new Date(opening).toISOString(), "2026-09-30T03:00:00.000Z");
  assert.equal(new Date(closing).toISOString(), "2026-10-01T02:59:59.000Z");
  assert.doesNotThrow(() => validateCampaignWindow(opening, closing));
  const campaign = { status: "open", opens_at: opening, closes_at: closing };
  assert.equal(isCampaignOpen(campaign, Date.parse("2026-09-30T02:59:59Z")), false);
  assert.equal(isCampaignOpen(campaign, Date.parse("2026-10-01T02:59:58Z")), true);
  assert.equal(isCampaignOpen(campaign, Date.parse("2026-10-01T03:00:00Z")), false);
});

test("limites de data rejeitam formatos ambíguos e entradas de outro tipo", () => {
  for (const value of [null, undefined, 20260909, {}, "", "09/09/2026", "2026-9-9", "2026-09-09 ", "2026-09-09T12:00:00Z", "2026-09-09T00:00:00-03:00"]) {
    assert.throws(() => evaluationDateBoundary(value, false), EvaluationInputError);
  }
});
