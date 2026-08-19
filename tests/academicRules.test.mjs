import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAcademicPercent,
  calculateTrainingHours,
  getCreditedTrainingHours,
} from "../lib/academic/academicRules.ts";

test("progresso acadêmico respeita zero e teto de cem por cento", () => {
  assert.equal(calculateAcademicPercent(22, 86), 26);
  assert.equal(calculateAcademicPercent(100, 86), 100);
  assert.equal(calculateAcademicPercent(10, 0), 0);
  assert.equal(calculateAcademicPercent(Number.NaN, 86), 0);
});

test("carga horária usa a duração real da capacitação", () => {
  assert.equal(
    calculateTrainingHours(
      "2026-08-26T18:30:00-03:00",
      "2026-08-26T22:30:00-03:00",
    ),
    4,
  );
  assert.equal(
    calculateTrainingHours(
      "2026-08-26T22:30:00-03:00",
      "2026-08-26T18:30:00-03:00",
    ),
    0,
  );
});

test("somente presença confirmada gera horas", () => {
  const start = "2026-08-26T18:30:00-03:00";
  const end = "2026-08-26T22:30:00-03:00";

  assert.equal(getCreditedTrainingHours("presente", start, end), 4);
  assert.equal(getCreditedTrainingHours("ausente", start, end), 0);
  assert.equal(getCreditedTrainingHours("justificado", start, end), 0);
});
