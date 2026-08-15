import type {
  ImportDatasetType,
  ImportPreview,
  ImportValidationResult
} from "@/types/dataImport";
import { findIdentifiablePatientColumns } from "@/lib/dataGovernance/privacyRules";
import { parseCsv } from "./csv";

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

  const allRows = parseCsv(text);
  const headers = Object.keys(allRows[0] ?? {});
  const rows = allRows.slice(0, 6);

  return buildPreview({
    fileName,
    datasetType,
    rawText: text,
    headers,
    rows,
    recordCount: allRows.length,
    extraValidations: validateCsvRows(headers, allRows, datasetType)
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

    const invalidCnes = rows.filter(
      (row) => !/^\d{7}$/.test(row.cnes ?? "")
    );
    validations.push({
      severity: invalidCnes.length ? "error" : "ok",
      title: "Codigo CNES oficial",
      message: invalidCnes.length
        ? `${invalidCnes.length} linha(s) nao possuem CNES numerico com sete digitos.`
        : "Todos os estabelecimentos possuem CNES numerico com sete digitos."
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

    const invalidPeriods = rows.filter(
      (row) => !/^\d{4}-(0[1-9]|1[0-2])$/.test(row.period ?? "")
    );
    const invalidCounts = rows.filter((row) =>
      [
        row.target_population,
        row.registered_patients,
        row.screenings,
        row.high_risk_patients,
        row.early_returns
      ]
        .filter((value) => value !== undefined && value !== "")
        .some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)
    );
    const inconsistentCounts = rows.filter(
      (row) =>
        Number(row.registered_patients) > Number(row.target_population) ||
        Number(row.high_risk_patients) > Number(row.registered_patients)
    );

    validations.push({
      severity: invalidPeriods.length ? "error" : "ok",
      title: "Competencias validas",
      message: invalidPeriods.length
        ? `${invalidPeriods.length} linha(s) nao usam o formato AAAA-MM.`
        : "Todas as competencias usam o formato AAAA-MM."
    });
    validations.push({
      severity: invalidCounts.length || inconsistentCounts.length ? "error" : "ok",
      title: "Consistencia das contagens",
      message:
        invalidCounts.length || inconsistentCounts.length
          ? `${invalidCounts.length} linha(s) possuem valores invalidos e ${inconsistentCounts.length} possuem numeradores acima do denominador.`
          : "Contagens nao negativas e numeradores dentro dos denominadores informados."
    });
    validations.push({
      severity: "warning",
      title: "Homologacao institucional obrigatoria",
      message:
        "A validacao tecnica nao publica o SISAB territorial. A carga deve ser aprovada pela APS municipal com evidencia registrada."
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
    "cnes,name,type,ibge_city_code,city,state,neighborhood_id,neighborhood,lat,lng,teams\n2340208,CAIS I,CAIS,5212501,Luziania,GO,setor-fumal,Setor Fumal,-16.265807,-47.955301,0\n0218650,PSF Jardim do Inga,UBS,5212501,Luziania,GO,jardim-do-inga,Jardim do Inga,-16.144773,-47.950516,4",
  sisab:
    "period,ibge_city_code,neighborhood_id,unit_cnes,condition,target_population,registered_patients,screenings,high_risk_patients,early_returns\n2026-06,5212501,jardim-inga,CNES-LUZ-003,hipertensao,7200,5140,2980,910,790\n2026-06,5212501,pedregal,CNES-LUZ-004,diabetes,6100,4260,2450,840,650",
  geojson:
    '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"id":"centro","name":"Centro","ibge_city_code":"5212501"},"geometry":{"type":"Polygon","coordinates":[[[-47.966,-16.238],[-47.94,-16.236],[-47.931,-16.254],[-47.966,-16.238]]]}}]}'
};
