import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { latestUnitMaps } from "../lib/units/access.ts";
import { safeReturnPath } from "../lib/auth/returnPath.ts";

test("unit selection deduplicates rounds while retaining the newest available version", () => {
  const list = latestUnitMaps([
    { health_unit_id: "one", version: 1, id: "old" },
    { health_unit_id: "two", version: 2, id: "other" },
    { health_unit_id: "one", version: 3, id: "new" },
  ]);
  assert.deepEqual(list.map(m => m.id), ["new", "other"]);
  assert.deepEqual(latestUnitMaps([]), []);
});
test("all unit destinations survive login and reject foreign or malformed destinations", () => {
  for (const path of ["/unidades", "/unidades/5882451", "/unidades/5882451/acoes", "/unidades/5882451/acoes/catarata", "/unidades/5882451/painel", "/unidades/5882451/processos", "/unidades/5882451/processos/validacao"]) assert.equal(safeReturnPath(path), path);
  for (const path of ["/unidades/5882451/acoes/unknown", "/unidades/1", "/unidades//5882451", "/unidades/5882451?next=//external.invalid", "//external.invalid/unidades"]) assert.equal(safeReturnPath(path), null);
});
test("the homepage, personal journey and territorial map all expose the unit entry", () => {
  const source = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
  for (const page of ["app/page.tsx", "app/meu-gip/page.tsx"]) assert(source(page).includes('href="/unidades"'));
  assert(source("components/maps/ProcessUnitMarkers.tsx").includes("href={`/unidades/${cnes}`}"));
  assert(source("app/processos/page.tsx").includes('redirect("/unidades")'));
});

