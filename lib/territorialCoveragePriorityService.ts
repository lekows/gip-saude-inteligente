import { clampScore } from "./domainRules.ts";
import type { CoveragePriorityLevel } from "../types/sus.ts";

export interface CoveragePriorityInput {
  populationPercentile: number;
  densityPercentile: number;
  distanceKm: number;
}

export interface CoveragePriorityResult {
  score: number;
  level: CoveragePriorityLevel;
  factors: {
    populationLoad: number;
    densityPressure: number;
    accessDistance: number;
  };
}

export function calculateCoveragePriority(
  input: CoveragePriorityInput
): CoveragePriorityResult {
  const populationLoad = clampUnit(input.populationPercentile) * 40;
  const densityPressure = clampUnit(input.densityPercentile) * 30;
  const accessDistance = Math.min(Math.max(input.distanceKm, 0) / 5, 1) * 30;
  const score = clampScore(populationLoad + densityPressure + accessDistance);

  return {
    score,
    level: classifyCoveragePriority(score),
    factors: {
      populationLoad: roundFactor(populationLoad),
      densityPressure: roundFactor(densityPressure),
      accessDistance: roundFactor(accessDistance)
    }
  };
}

export function classifyCoveragePriority(score: number): CoveragePriorityLevel {
  if (score >= 70) return "vermelho";
  if (score >= 35) return "amarelo";
  return "verde";
}

export function explainCoveragePriority(result: CoveragePriorityResult) {
  const strongestFactor = Object.entries(result.factors).sort(
    (left, right) => right[1] - left[1]
  )[0]?.[0];
  const labels: Record<string, string> = {
    populationLoad: "maior carga populacional",
    densityPressure: "maior densidade demografica",
    accessDistance: "maior distancia ate a atencao primaria"
  };

  return `Prioridade ${result.level} explicada principalmente por ${
    labels[strongestFactor] ?? "fatores territoriais agregados"
  }. O resultado orienta exploracao de cobertura e nao representa risco clinico.`;
}

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

function roundFactor(value: number) {
  return Math.round(value * 10) / 10;
}
