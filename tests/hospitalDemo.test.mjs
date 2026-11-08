import assert from "node:assert/strict";
import test from "node:test";
import { agendaComposition, agendaSignal, initialDemo, rowError, summarize } from "../lib/processes/hospitalDemo.ts";
import { safeReturnPath } from "../lib/auth/returnPath.ts";

test("demo aggregates records by stage and never derives people or postoperative coverage", () => {
  const data = initialDemo(true);
  const operations = data.filter(row => row.stage === "cirurgias");
  const reviews = data.filter(row => row.stage === "revisoes");
  assert.equal(summarize(operations).completed, 198);
  assert.equal(summarize(reviews).completed, 168);
  assert.equal(summarize(operations.filter(row => row.day === "Segunda")).completed, 40);
  assert.equal(summarize([]).completion, null);
  assert.equal(rowError({ ...operations[0], completed: 1000 }), "Realizados, faltas e adiamentos somados precisam caber na agenda.");
  for (const invalid of [-1, NaN, Infinity, 0.5, 100000]) assert(rowError({ ...operations[0], absent: invalid }));
  assert.equal(rowError({ ...operations[0], scheduled: 0, completed: 0, absent: 0, postponed: 0 }), null);
  assert.equal(safeReturnPath("/unidades/5882451/painel"), "/unidades/5882451/painel");
  assert.equal(safeReturnPath("/unidades/5882451/painel?next=//external.invalid"), null);
});

test("illustrative agenda signals preserve empty scope and unclassified records", () => {
  assert.equal(agendaSignal(null).tone, "neutral");
  assert.equal(agendaSignal(0).tone, "red");
  assert.equal(agendaSignal(74.999).tone, "red");
  assert.equal(agendaSignal(75).tone, "amber");
  assert.equal(agendaSignal(89.999).tone, "amber");
  assert.equal(agendaSignal(90).tone, "green");
  assert.equal(agendaSignal(100).tone, "green");
  const rows = [{ day: "Segunda", stage: "cirurgias", scheduled: 10, completed: 6, absent: 1, postponed: 1 }];
  const result = agendaComposition(rows);
  assert.equal(result.unresolved, 2);
  assert.equal(result.completed + result.absent + result.postponed + result.unresolved, result.scheduled);
  assert.deepEqual(agendaComposition([]), {scheduled:0,completed:0,absent:0,postponed:0,completion:null,unresolved:0});
});

