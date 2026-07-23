import type {
  ImportDatasetType,
  ImportPreview,
  ImportValidationResult
} from "@/types/dataImport";
import { findIdentifiablePatientColumns } from "@/lib/dataGovernance/privacyRules";

export const importDatasetLabels: Record<ImportDatasetType, string> = {
  cnes: "CNES - Unidades de saude",
  sisab: "SISAB - Indicadores APS",
  geojson: "IBGE/territorio - GeoJSON"
};

export const requiredColumns: Record<ImportDatasetType, string[]> = {
  cnes: [
    "cnes",
    "name",
    "type",
    "ibge_city_code",
    "neighborhood_id",
    "lat",
    "lng"
  ],
  sisab: [
    "period",
    "ibge_city_code",
    "neighborhood_id",
    "unit_cnes",
    "condition",
    "target_population",
    "registered_patients"
  ],
  geojson: ["type", "features"]
};

export function parseImportText(
  text: string,
  fileName: string,
  datasetType: ImportDatasetType
): ImportPreview {
  if (datasetType === "geojson") {
    return parseGeoJsonPreview(text, fileName);
  }

  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",").map((header) => header.trim()) ?? [];
  const rows = lines.slice(1, 7).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index] ?? "";
      return row;
    }, {});
  });

  return buildPreview({
    fileName,
    datasetType,
    rawText: text,
    headers,
    rows,
    recordCount: Math.max(lines.length - 1, 0),
    extraValidations: validateCsvRows(headers, rows, datasetType)
  });
}

export function buildSamplePreview(datasetType: ImportDatasetType): ImportPreview {
  return parseImportText(sampleFiles[datasetType], sampleFileNames[datasetType], datasetType);
}

function parseGeoJsonPreview(text: string, fileName: string): ImportPreview {
  try {
    const parsed = JSON.parse(text) as {
      type?: string;
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const features = parsed.features ?? [];
    const rows = features.slice(0, 6).map((feature) =>
      Object.fromEntries(
        Object.entries(feature.properties ?? {}).map(([key, value]) => [key, String(value)])
      )
    );
    const headers = ["type", "features", ...Object.keys(rows[0] ?? {})];

    return buildPreview({
      fileName,
      datasetType: "geojson",
      rawText: text,
      headers,
      rows,
      recordCount: features.length,
      extraValidations: [
        parsed.type === "FeatureCollection"
          ? {
              severity: "ok",
              title: "GeoJSON valido",
              message: "Arquivo reconhecido como FeatureCollection."
            }
          : {
              severity: "error",
              title: "GeoJSON invalido",
              message: "O campo type deve ser FeatureCollection."
            }
      ]
    });
  } catch {
    return buildPreview({
      fileName,
      datasetType: "geojson",
      rawText: text,
      headers: [],
      rows: [],
      recordCount: 0,
      extraValidations: [
        {
          severity: "error",
          title: "JSON invalido",
          message: "Nao foi possivel interpretar o arquivo GeoJSON."
        }
      ]
    });
  }
}

function buildPreview({
  fileName,
  datasetType,
  rawText,
  headers,
  rows,
  recordCount,
  extraValidations
}: {
  fileName: string;
  datasetType: ImportDatasetType;
  rawText: string;
  headers: string[];
  rows: Record<string, string>[];
  recordCount: number;
  extraValidations: ImportValidationResult[];
}): ImportPreview {
  const validations = [
    ...validateRequiredColumns(datasetType, headers),
    ...validateMunicipality(rows),
    ...validatePrivacyColumns(datasetType, headers),
    ...extraValidations
  ];
  const hasError = validations.some((item) => item.severity === "error");

  return {
    fileName,
    datasetType,
    rawText,
    headers,
    rows,
    recordCount,
    status: hasError ? "rascunho" : "validado",
    validations
  };
}

function validatePrivacyColumns(
  datasetType: ImportDatasetType,
  headers: string[]
): ImportValidationResult[] {
  if (datasetType !== "sisab") return [];

  const identifiableColumns = findIdentifiablePatientColumns(headers);
  if (!identifiableColumns.length) {
    return [
      {
        severity: "ok",
        title: "Privacidade da carga",
        message: "Nenhuma coluna de identificacao individual foi encontrada."
      }
    ];
  }

  return [
    {
      severity: "error",
      title: "Dados identificaveis bloqueados",
      message: `Remova as colunas individuais: ${identifiableColumns.join(", ")}. O GIP aceita apenas indicadores agregados.`
    }
  ];
}

function validateRequiredColumns(
  datasetType: ImportDatasetType,
  headers: string[]
): ImportValidationResult[] {
  const missing = requiredColumns[datasetType].filter((column) => !headers.includes(column));

  if (!missing.length) {
    return [
      {
        severity: "ok",
        title: "Contrato de colunas atendido",
        message: "Todas as colunas obrigatorias foram encontradas."
      }
    ];
  }

  return [
    {
      severity: "error",
      title: "Colunas obrigatorias ausentes",
      message: `Campos faltantes: ${missing.join(", ")}.`
    }
  ];
}

function validateMunicipality(rows: Record<string, string>[]): ImportValidationResult[] {
  const rowsWithCity = rows.filter((row) => row.ibge_city_code);
  if (!rowsWithCity.length) return [];

  const invalid = rowsWithCity.filter((row) => row.ibge_city_code !== "5212501");
  if (!invalid.length) {
    return [
      {
        severity: "ok",
        title: "Municipio validado",
        message: "Todas as linhas de preview usam IBGE 5212501."
      }
    ];
  }

  return [
    {
      severity: "error",
      title: "Municipio fora do escopo",
      message: `${invalid.length} linhas do preview nao pertencem a Luziania-GO.`
    }
  ];
}

function validateCsvRows(
  headers: string[],
  rows: Record<string, string>[],
  datasetType: ImportDatasetType
): ImportValidationResult[] {
  const validations: ImportValidationResult[] = [];

  if (datasetType === "cnes" && headers.includes("lat") && headers.includes("lng")) {
    const missingCoordinates = rows.filter((row) => !row.lat || !row.lng);
    validations.push({
      severity: missingCoordinates.length ? "warning" : "ok",
      title: "Coordenadas para mapa",
      message: missingCoordinates.length
        ? `${missingCoordinates.length} linhas do preview estao sem coordenadas.`
        : "Todas as unidades do preview possuem latitude e longitude."
    });
  }

  if (datasetType === "sisab") {
    const hasAggregates = headers.includes("target_population") && headers.includes("registered_patients");
    validations.push({
      severity: hasAggregates ? "ok" : "warning",
      title: "Dados agregados",
      message: hasAggregates
        ? "Arquivo usa indicadores agregados, sem identificacao de paciente."
        : "Confira se o arquivo nao contem dados individualizados."
    });
  }

  return validations;
}

const sampleFileNames: Record<ImportDatasetType, string> = {
  cnes: "health_units_cnes.csv",
  sisab: "aps_indicators_sisab.csv",
  geojson: "luziania_neighborhoods.geojson"
};

const sampleFiles: Record<ImportDatasetType, string> = {
  cnes:
    "cnes,name,type,ibge_city_code,city,state,neighborhood_id,neighborhood,lat,lng,teams\nCNES-LUZ-001,UBS Centro Integrado,UBS,5212501,Luziania,GO,centro,Centro,-16.251,-47.951,4\nCNES-LUZ-003,UBS Jardim Inga,UBS,5212501,Luziania,GO,jardim-inga,Jardim Inga,-16.184,-47.949,5",
  sisab:
    "period,ibge_city_code,neighborhood_id,unit_cnes,condition,target_population,registered_patients,screenings,high_risk_patients,early_returns\n2026-06,5212501,jardim-inga,CNES-LUZ-003,hipertensao,7200,5140,2980,910,790\n2026-06,5212501,pedregal,CNES-LUZ-004,diabetes,6100,4260,2450,840,650",
  geojson:
    '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"id":"centro","name":"Centro","ibge_city_code":"5212501"},"geometry":{"type":"Polygon","coordinates":[[[-47.966,-16.238],[-47.94,-16.236],[-47.931,-16.254],[-47.966,-16.238]]]}}]}'
};
