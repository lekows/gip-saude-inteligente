export const PATIENT_SCORE_LIMITS = {
  alteredBloodPressure: 25,
  alteredGlucose: 20,
  bmiObesity: 10,
  chronicDiseases: 15,
  lowMedicationAdherence: 10,
  earlyReturn: 10,
  vulnerabilityAge: 10
} as const;

export const TERRITORIAL_SCORE_LIMITS = {
  lowCoverage: 20,
  highRiskPercent: 25,
  missingPatients: 15,
  earlyReturns: 10,
  waitingTime: 10,
  hasDmLoad: 10,
  interviews360: 10
} as const;

export function calculateBoundedScore<T extends object>(
  factors: T,
  limits: { [K in keyof T]: number }
) {
  const factorNames = Object.keys(limits) as Array<keyof T>;
  const total = factorNames.reduce((score, factor) => {
    const value = Number(factors[factor]);
    const limit = limits[factor];
    return score + clampFiniteNumber(value, 0, limit);
  }, 0);

  return clampScore(total);
}

export function clampScore(value: number) {
  return Math.round(clampFiniteNumber(value, 0, 100));
}

function clampFiniteNumber(value: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
