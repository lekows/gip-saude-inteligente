import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const realDir = path.join(root, "data", "real");
const provenance = JSON.parse(
  readFileSync(path.join(realDir, "source_provenance.json"), "utf8")
);

test("manifesto de proveniencia confere hashes e volumes", () => {
  for (const dataset of provenance.datasets) {
    const filePath = path.join(realDir, dataset.fileName);
    const content = readFileSync(filePath);
    const hash = createHash("sha256").update(content).digest("hex");
    const records = dataset.fileName.endsWith(".geojson")
      ? JSON.parse(content.toString("utf8")).features.length
      : parseCsv(content.toString("utf8")).length;

    assert.equal(hash, dataset.sha256, dataset.datasetId);
    assert.equal(records, dataset.records, dataset.datasetId);
  }
});

test("CNES oficial e minimizado para Luziania", () => {
  const rows = parseCsv(
    readFileSync(path.join(realDir, "health_units_cnes.csv"), "utf8")
  );
  const prohibited = ["cpf", "cns", "telefone", "email", "cnpj", "endereco"];

  assert.equal(rows.length, 58);
  assert.equal(new Set(rows.map((row) => row.cnes)).size, rows.length);
  assert.ok(rows.every((row) => /^\d{7}$/.test(row.cnes)));
  assert.ok(rows.every((row) => row.ibge_city_code === "5212501"));
  assert.ok(rows.every((row) => row.dataset_status === "official_verified"));
  assert.ok(rows.every((row) => Number.isFinite(Number(row.lat))));
  assert.ok(rows.every((row) => Number.isFinite(Number(row.lng))));
  assert.ok(prohibited.every((name) => !(name in rows[0])));
});

test("coordenadas CNES ficam dentro da malha municipal oficial", () => {
  const rows = parseCsv(
    readFileSync(path.join(realDir, "health_units_cnes.csv"), "utf8")
  );
  const boundary = JSON.parse(
    readFileSync(path.join(realDir, "luziania_municipality_ibge.geojson"), "utf8")
  ).features[0].geometry.coordinates[0];

  assert.ok(
    rows.every((row) =>
      pointInPolygon(Number(row.lng), Number(row.lat), boundary)
    )
  );
});

test("setores censitarios oficiais fecham com a populacao municipal agregada", () => {
  const collection = JSON.parse(
    readFileSync(
      path.join(realDir, "luziania_census_sectors_ibge.geojson"),
      "utf8"
    )
  );
  const features = collection.features;
  const codes = features.map((feature) => feature.properties.sector_code);

  assert.equal(features.length, 348);
  assert.equal(new Set(codes).size, features.length);
  assert.ok(codes.every((code) => /^5212501\d{8}$/.test(code)));
  assert.equal(
    features.reduce(
      (total, feature) => total + feature.properties.population_2022,
      0
    ),
    209129
  );
  assert.equal(
    features.filter((feature) => feature.properties.situation === "Urbana").length,
    315
  );
  assert.equal(
    features.filter((feature) => feature.properties.situation === "Rural").length,
    33
  );
  assert.ok(
    features.every((feature) =>
      ["Polygon", "MultiPolygon"].includes(feature.geometry.type)
    )
  );
});

test("score setorial derivado permanece explicito e sem dados pessoais", () => {
  const features = JSON.parse(
    readFileSync(
      path.join(realDir, "luziania_census_sectors_ibge.geojson"),
      "utf8"
    )
  ).features;
  const prohibited = ["cpf", "cns", "address", "endereco", "patient", "paciente"];

  for (const feature of features) {
    const properties = feature.properties;
    assert.equal(properties.score_model, "demonstrative_access_v1");
    assert.equal(
      properties.dataset_status,
      "official_geography_demonstrative_score"
    );
    assert.ok(properties.coverage_priority_score >= 0);
    assert.ok(properties.coverage_priority_score <= 100);
    assert.ok(/^\d{7}$/.test(properties.nearest_primary_care_cnes));
    assert.ok(
      prohibited.every((name) =>
        Object.keys(properties).every((key) => !key.toLowerCase().includes(name))
      )
    );
  }
});

test("contexto de vulnerabilidade preserva supressoes do IBGE", () => {
  const collection = JSON.parse(
    readFileSync(
      path.join(realDir, "luziania_census_sectors_ibge.geojson"),
      "utf8"
    )
  );
  const features = collection.features;
  const scored = features.filter(
    (feature) => feature.properties.vulnerability_context_score !== null
  );

  assert.equal(scored.length, 317);
  assert.equal(
    features.filter(
      (feature) => feature.properties.vulnerability_context_score === null
    ).length,
    31
  );
  assert.equal(
    features.filter((feature) => feature.properties.suppressed_values_count > 0)
      .length,
    251
  );
  assert.deepEqual(
    Object.fromEntries(
      ["verde", "amarelo", "vermelho"].map((level) => [
        level,
        scored.filter(
          (feature) => feature.properties.vulnerability_context_level === level
        ).length
      ])
    ),
    { verde: 150, amarelo: 139, vermelho: 28 }
  );
  assert.ok(
    scored.every(
      (feature) =>
        feature.properties.vulnerability_context_score >= 0 &&
        feature.properties.vulnerability_context_score <= 100
    )
  );
  assert.ok(
    features.every((feature) =>
      ["complete", "published_lower_bound", "insufficient"].includes(
        feature.properties.vulnerability_data_status
      )
    )
  );
  assert.match(collection.metadata.suppression_notice, /nao recebem score/);
});

test("recorte auditavel do Censo continua agregado e territorial", () => {
  const rows = parseCsv(
    readFileSync(
      path.join(realDir, "census_sector_vulnerability_ibge.csv"),
      "utf8"
    )
  );
  const prohibited = ["cpf", "cns", "address", "endereco", "patient", "paciente"];

  assert.equal(rows.length, 348);
  assert.ok(rows.every((row) => /^5212501\d{8}$/.test(row.sector_code)));
  assert.ok(rows.every((row) => row.source_status === "official_aggregate"));
  assert.ok(rows.every((row) => row.derived_score_status === "demonstrative"));
  assert.ok(
    prohibited.every((name) =>
      Object.keys(rows[0]).every((key) => !key.toLowerCase().includes(name))
    )
  );
});

test("SISAB oficial permanece municipal, agregado e sem identificadores", () => {
  const rows = parseCsv(
    readFileSync(
      path.join(realDir, "aps_indicators_sisab_official.csv"),
      "utf8"
    )
  );
  const prohibited = [
    "name",
    "cpf",
    "cns",
    "phone",
    "address",
    "neighborhood_id",
    "unit_cnes"
  ];

  assert.equal(rows.length, 6);
  assert.ok(rows.every((row) => row.ibge_city_code === "5212501"));
  assert.ok(rows.every((row) => row.team_view === "homologadas"));
  assert.ok(rows.every((row) => Number(row.numerator) >= 0));
  assert.ok(rows.every((row) => Number(row.denominator) >= Number(row.numerator)));
  assert.ok(prohibited.every((name) => !(name in rows[0])));
});

test("dicionario historico do SISAB preserva codigos e temas oficiais", () => {
  const rows = parseCsv(
    readFileSync(
      path.join(realDir, "aps_indicators_sisab_official.csv"),
      "utf8"
    )
  );
  const indicators = Object.fromEntries(
    rows.map((row) => [row.indicator_code, row.indicator_name])
  );

  assert.deepEqual(Object.keys(indicators).sort(), ["10", "20", "30", "40", "50", "70"]);
  assert.match(indicators["50"], /Vacinacao infantil/);
  assert.match(indicators["70"], /Diabetes/);
  assert.ok(!Object.values(indicators).some((name) => /Hipertensao/.test(name)));
});

test("camadas territoriais demonstrativas nao recebem selo oficial", () => {
  for (const datasetId of [
    "sisab-territorial-operational",
    "territory-neighborhoods-mvp"
  ]) {
    const dataset = provenance.datasets.find(
      (item) => item.datasetId === datasetId
    );
    assert.equal(dataset.status, "institutional_pending_homologation");
    assert.equal(dataset.approval.status, "pending");
    assert.equal(dataset.approval.approvedAt, null);
  }
});

function parseCsv(input) {
  const lines = input.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ""])
    );
  });
}

function splitLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}
