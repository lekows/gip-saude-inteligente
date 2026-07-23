import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateBoundedScore,
  PATIENT_SCORE_LIMITS,
  TERRITORIAL_SCORE_LIMITS
} from "../lib/domainRules.ts";
import {
  createSyntheticCnsIdentifier,
  findIdentifiablePatientColumns,
  isSyntheticCnsIdentifier
} from "../lib/dataGovernance/privacyRules.ts";

test("patient score respects every factor limit and the 100 point ceiling", () => {
  const score = calculateBoundedScore(
    {
      alteredBloodPressure: 200,
      alteredGlucose: 200,
      bmiObesity: 200,
      chronicDiseases: 200,
      lowMedicationAdherence: 200,
      earlyReturn: 200,
      vulnerabilityAge: 200
    },
    PATIENT_SCORE_LIMITS
  );

  assert.equal(score, 100);
});

test("territorial score ignores negative and non-finite values", () => {
  const score = calculateBoundedScore(
    {
      lowCoverage: 20,
      highRiskPercent: Number.POSITIVE_INFINITY,
      missingPatients: -10,
      earlyReturns: 10,
      waitingTime: 10,
      hasDmLoad: 10,
      interviews360: 10
    },
    TERRITORIAL_SCORE_LIMITS
  );

  assert.equal(score, 60);
});

test("synthetic CNS identifiers are explicit and cannot resemble a real CNS", () => {
  assert.equal(createSyntheticCnsIdentifier(42), "SIM-CNS-000042");
  assert.equal(isSyntheticCnsIdentifier("sim-cns-000042"), true);
  assert.equal(isSyntheticCnsIdentifier("123456789012345"), false);
  assert.throws(() => createSyntheticCnsIdentifier(0), RangeError);
});

test("identifiable patient columns are detected in aggregate imports", () => {
  assert.deepEqual(
    findIdentifiablePatientColumns(["period", "CNS", "nome paciente", "target_population"]),
    ["cns", "nome_paciente"]
  );
  assert.deepEqual(
    findIdentifiablePatientColumns(["period", "unit_cnes", "target_population"]),
    []
  );
});
