import assert from "node:assert/strict";
import test from "node:test";
import { buildCoordinationMatrix } from "../lib/academic/coordinationMatrix.ts";

test("matriz separa treinamentos, reuniões e falta de crédito por etapa", () => {
  const result = buildCoordinationMatrix(
    [{ profileId: "maria", memberId: "member-maria", fullName: "Maria Eduarda" }],
    [
      { id: "class-1", date: "2026-08-12", title: "Integração" },
      { id: "class-2", date: "2026-08-19", title: "Capacitação" },
    ],
    [
      { classId: "class-1", memberId: "member-maria", status: "presente", hours: 4 },
      { classId: "class-2", memberId: "member-maria", status: "ausente", hours: 0 },
    ],
    [
      { profileId: "maria", date: "2026-08-11", title: "Reunião preparatória", preparationHours: 2, meetingHours: 2 },
      { profileId: "outra", date: "2026-09-15", title: "Resultados", preparationHours: 2, meetingHours: 2 },
    ],
  );

  assert.deepEqual(result.stages.map((stage) => stage.date), ["2026-08-11", "2026-08-12", "2026-08-19", "2026-09-15"]);
  assert.deepEqual(result.participants[0].cells.map((cell) => cell.status), ["recebeu", "recebeu", "ausente", "sem_registro"]);
  assert.equal(result.participants[0].trainingHours, 4);
  assert.equal(result.participants[0].coordinationHours, 4);
  assert.equal(result.participants[0].totalHours, 8);
});
