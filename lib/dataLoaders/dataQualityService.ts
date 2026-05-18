import "server-only";
import { readFileSync, statSync } from "fs";
import path from "path";
import { parseCsv } from "./csv";
import { readImportManifest } from "./importManifestService";
import { loadSusDataset } from "./susFileRepository";
import type {
  DataFileQuality,
  DataQualityIssue,
  DataQualityReport,
  DataTrustBadge
} from "@/types/dataQuality";

const DATA_DIR = path.join(process.cwd(), "data", "real");

const sourceCatalog: Array<{
  fileName: string;
  source: string;
  badges: DataTrustBadge[];
  notes: string;
}> = [
  {
    fileName: "health_units_cnes.csv",
    source: "CNES",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Cadastro público de estabelecimentos; seed pronto para troca por extração CNES real."
  },
  {
    fileName: "aps_indicators_sisab.csv",
    source: "SISAB",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Indicadores agregados da APS por bairro/unidade para metas e cobertura."
  },
  {
    fileName: "outpatient_production_sia.csv",
    source: "SIA/SUS",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Produção ambulatorial agregada, sem procedimento individual identificado."
  },
  {
    fileName: "hospital_morbidity_sih.csv",
    source: "SIH/SUS",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Morbidade hospitalar agregada por grupo e território."
  },
  {
    fileName: "mortality_sim.csv",
    source: "SIM",
    badges: ["agregado", "simulado"],
    notes: "Registro demonstrativo simulado para evitar exposição indevida no MVP."
  },
  {
    fileName: "notifiable_diseases_sinan.csv",
    source: "SINAN",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Notificações agregadas para sinalizar queixas e eventos territoriais."
  },
  {
    fileName: "nutritional_status_sisvan.csv",
    source: "SISVAN",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Estado nutricional agregado para carga de obesidade."
  },
  {
    fileName: "immunization_pni.csv",
    source: "PNI",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Cobertura vacinal agregada por território."
  },
  {
    fileName: "luziania_neighborhoods.geojson",
    source: "IBGE/território municipal",
    badges: ["publico_real", "agregado", "mvp_seed"],
    notes: "Geometrias territoriais do MVP; substituir por base oficial quando disponível."
  }
];

export function getDataQualityReport(): DataQualityReport {
  const dataset = loadSusDataset();
  const importManifest = readImportManifest();
  const files = sourceCatalog.map(readFileQuality);
  const issues = buildIssues(dataset);
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

  const penalty = issues.reduce((total, issue) => {
    if (issue.severity === "critical") return total + 24;
    if (issue.severity === "warning") return total + 10;
    return total + 2;
  }, 0);

  return {
    generatedAt: new Date().toISOString(),
    files,
    issues,
    coverage,
    qualityScore: Math.max(0, Math.min(100, 100 - penalty)),
    importManifest
  };
}

function readFileQuality(item: (typeof sourceCatalog)[number]): DataFileQuality {
  const filePath = path.join(DATA_DIR, item.fileName);
  const stat = statSync(filePath);
  const content = readFileSync(filePath, "utf8");
  const records = item.fileName.endsWith(".geojson")
    ? countGeoJsonFeatures(content)
    : parseCsv(content).length;
  const status = records > 0 ? "ok" : "attention";

  return {
    fileName: item.fileName,
    source: item.source,
    trustBadges: item.badges,
    records,
    lastModified: stat.mtime.toISOString(),
    sizeKb: Math.max(1, Math.round(stat.size / 1024)),
    status,
    notes: item.notes
  };
}

function buildIssues(dataset: ReturnType<typeof loadSusDataset>): DataQualityIssue[] {
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
      title: "Indicadores APS sem unidade CNES correspondente",
      description: `${apsWithoutKnownUnit.length} linhas SISAB referenciam CNES ausente na camada de unidades.`
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
      title: "Unidades sem coordenadas válidas",
      description: `${unitsWithoutCoordinates.length} unidades não podem aparecer corretamente no mapa.`
    });
  }

  if (dataset.mortalityRecords.some((record) => record.simulated)) {
    issues.push({
      severity: "info",
      title: "SIM está em modo simulado no MVP",
      description: "A mortalidade foi mantida como agregada/simulada para evitar risco de identificação."
    });
  }

  issues.push({
    severity: "info",
    title: "Pacientes do MVP não são reais",
    description: "Busca ativa e alto risco usam dados agregados ou simulados, sem endereço individual."
  });

  return issues;
}

function countGeoJsonFeatures(content: string) {
  const parsed = JSON.parse(content) as { features?: unknown[] };
  return parsed.features?.length ?? 0;
}
