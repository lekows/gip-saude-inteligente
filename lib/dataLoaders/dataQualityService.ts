import "server-only";
import { readFileSync, statSync } from "fs";
import path from "path";
import { dataSourceCatalog } from "@/data/dataGovernanceCatalog";
import { parseCsv } from "./csv";
import { readImportManifest } from "./importManifestService";
import { loadSusDataset } from "./susFileRepository";
import { verifySourceProvenance } from "./sourceProvenanceService";
import type {
  DataFileQuality,
  DataQualityIssue,
  DataQualityReport
} from "@/types/dataQuality";

const DATA_DIR = path.join(process.cwd(), "data", "real");

export function getDataQualityReport(): DataQualityReport {
  const dataset = loadSusDataset();
  const importManifest = readImportManifest();
  const provenance = verifySourceProvenance();
  const files = dataSourceCatalog.map(readFileQuality);
  const structuralIssues = buildStructuralIssues(dataset);
  const governanceIssues = buildGovernanceIssues(provenance);
  const issues = [...structuralIssues, ...governanceIssues];
  const coverage = {
    neighborhoodsWithGeo: dataset.riskMapAreas.filter((area) => area.polygon.length > 0).length,
    neighborhoodsWithAPS: new Set(dataset.apsIndicators.map((item) => item.neighborhoodId)).size,
    healthUnitsWithCoordinates: dataset.healthUnits.filter(
      (unit) => unit.position[0] !== 0 && unit.position[1] !== 0
    ).length,
    totalHealthUnits: dataset.healthUnits.length,
    apsRowsWithKnownUnit: dataset.apsIndicators.filter((indicator) =>
      dataset.healthUnits.some((unit) => unit.cnes === indicator.unitCnes)
    ).length,
    totalAPSRows: dataset.apsIndicators.length,
    simulatedMortalityRows: dataset.mortalityRecords.filter((record) => record.simulated).length
  };

  const structuralPenalty = structuralIssues.reduce((total, issue) => {
    if (issue.severity === "critical") return total + 24;
    if (issue.severity === "warning") return total + 10;
    return total + 2;
  }, 0);
  const governancePenalty = governanceIssues.reduce((total, issue) => {
    if (issue.severity === "critical") return total + 24;
    if (issue.severity === "warning") return total + 10;
    return total;
  }, 0);
  const officialSourceCount = dataSourceCatalog.filter(
    (source) => source.status === "official_verified"
  ).length;
  const pendingHomologationCount = dataSourceCatalog.filter(
    (source) =>
      source.status === "institutional_pending_homologation" ||
      source.status === "seed_pending_validation"
  ).length;

  return {
    generatedAt: new Date().toISOString(),
    files,
    issues,
    coverage,
    qualityScore: Math.max(
      0,
      Math.min(100, 100 - structuralPenalty - governancePenalty)
    ),
    structuralScore: Math.max(0, Math.min(100, 100 - structuralPenalty)),
    officialSourceCount,
    pendingHomologationCount,
    importManifest
  };
}

function readFileQuality(
  item: (typeof dataSourceCatalog)[number]
): DataFileQuality {
  const filePath = path.join(DATA_DIR, item.fileName);
  const stat = statSync(filePath);
  const content = readFileSync(filePath, "utf8");
  const records = item.fileName.endsWith(".geojson")
    ? countGeoJsonFeatures(content)
    : parseCsv(content).length;

  return {
    fileName: item.fileName,
    source: item.source,
    trustBadges: item.trustBadges,
    records,
    lastModified: stat.mtime.toISOString(),
    sizeKb: Math.max(1, Math.round(stat.size / 1024)),
    status: records > 0 ? "ok" : "attention",
    notes: item.notes
  };
}

function buildStructuralIssues(
  dataset: ReturnType<typeof loadSusDataset>
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const geoNeighborhoods = new Set(dataset.riskMapAreas.map((area) => area.neighborhoodId));
  const unitCnes = new Set(dataset.healthUnits.map((unit) => unit.cnes));
  const apsWithoutKnownUnit = dataset.apsIndicators.filter(
    (indicator) => !unitCnes.has(indicator.unitCnes)
  );
  const apsWithoutGeo = dataset.apsIndicators.filter(
    (indicator) => !geoNeighborhoods.has(indicator.neighborhoodId)
  );
  const unitsWithoutCoordinates = dataset.healthUnits.filter(
    (unit) => unit.position[0] === 0 || unit.position[1] === 0
  );

  if (apsWithoutKnownUnit.length) {
    issues.push({
      severity: "critical",
      title: "Seed territorial SISAB ainda usa CNES ficticio",
      description: `${apsWithoutKnownUnit.length} linhas demonstrativas nao correspondem ao recorte CNES oficial e nao podem ser apresentadas como dado real.`
    });
  }

  if (apsWithoutGeo.length) {
    issues.push({
      severity: "critical",
      title: "Indicadores APS sem bairro no GeoJSON",
      description: `${apsWithoutGeo.length} linhas SISAB possuem bairro sem geometria territorial.`
    });
  }

  if (unitsWithoutCoordinates.length) {
    issues.push({
      severity: "warning",
      title: "Unidades sem coordenadas validas",
      description: `${unitsWithoutCoordinates.length} unidades nao podem aparecer corretamente no mapa.`
    });
  }

  if (dataset.mortalityRecords.some((record) => record.simulated)) {
    issues.push({
      severity: "info",
      title: "SIM esta em modo simulado no MVP",
      description: "A mortalidade foi mantida como agregada e simulada para evitar risco de identificacao."
    });
  }

  issues.push({
    severity: "info",
    title: "Pacientes do MVP nao sao reais",
    description: "Busca ativa e alto risco usam dados agregados ou simulados, sem endereco individual."
  });

  if (
    dataset.healthUnits.some(
      (unit) => !/^\d{7}$/.test(unit.cnes) || unit.ibgeCityCode !== "5212501"
    )
  ) {
    issues.push({
      severity: "critical",
      title: "CNES oficial fora do contrato",
      description: "Ha unidade sem codigo CNES de sete digitos ou fora de Luziania-GO."
    });
  }

  if (
    dataset.sisabPerformanceIndicators.some(
      (indicator) =>
        indicator.ibgeCityCode !== "5212501" ||
        indicator.teamView !== "homologadas" ||
        indicator.numerator < 0 ||
        indicator.denominator < 0
    )
  ) {
    issues.push({
      severity: "critical",
      title: "SISAB oficial fora do recorte homologado",
      description: "O arquivo municipal oficial falhou na validacao de municipio, visao ou contagens."
    });
  }

  return issues;
}

function buildGovernanceIssues(
  provenance: ReturnType<typeof verifySourceProvenance>
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const invalidEvidence = provenance.filter(
    (item) => !item.fileExists || !item.hashMatches || !item.recordsMatch
  );

  if (invalidEvidence.length) {
    issues.push({
      severity: "critical",
      title: "Proveniencia ou integridade divergente",
      description: `${invalidEvidence.length} arquivo(s) nao conferem com o hash ou volume registrado no manifesto.`
    });
  }

  const pending = provenance.filter(
    (item) => item.dataset.status === "institutional_pending_homologation"
  );
  if (pending.length) {
    issues.push({
      severity: "warning",
      title: "Camadas territoriais aguardam homologacao municipal",
      description: `${pending.length} camada(s) continuam restritas a demonstracao: SISAB por bairro e limites operacionais de bairros.`
    });
  }

  issues.push({
    severity: "info",
    title: "CNES, IBGE e SISAB municipal com origem verificada",
    description: "Os arquivos oficiais possuem URL, periodo, granularidade, hash e usos permitidos registrados no manifesto."
  });

  return issues;
}

function countGeoJsonFeatures(content: string) {
  const parsed = JSON.parse(content) as { features?: unknown[] };
  return parsed.features?.length ?? 0;
}
