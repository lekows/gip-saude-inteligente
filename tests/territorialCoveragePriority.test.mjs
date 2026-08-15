import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCoveragePriority,
  classifyCoveragePriority,
  explainCoveragePriority
} from "../lib/territorialCoveragePriorityService.ts";

test("prioridade de cobertura respeita pesos e teto", () => {
  const result = calculateCoveragePriority({
    populationPercentile: 1,
    densityPercentile: 1,
    distanceKm: 8
  });

  assert.equal(result.score, 100);
  assert.equal(result.level, "vermelho");
  assert.deepEqual(result.factors, {
    populationLoad: 40,
    densityPressure: 30,
    accessDistance: 30
  });
});

test("prioridade de cobertura usa as faixas territoriais documentadas", () => {
  assert.equal(classifyCoveragePriority(34), "verde");
  assert.equal(classifyCoveragePriority(35), "amarelo");
  assert.equal(classifyCoveragePriority(69), "amarelo");
  assert.equal(classifyCoveragePriority(70), "vermelho");
});

test("explicacao deixa claro que o score nao e risco clinico", () => {
  const result = calculateCoveragePriority({
    populationPercentile: 0.2,
    densityPercentile: 0.3,
    distanceKm: 4
  });

  assert.match(explainCoveragePriority(result), /nao representa risco clinico/);
});
