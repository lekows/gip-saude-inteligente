export type ImportDatasetType = "cnes" | "sisab" | "geojson";

export type ImportStatus = "rascunho" | "validado" | "publicado";

export type ImportValidationSeverity = "ok" | "warning" | "error";

export interface ImportValidationResult {
  severity: ImportValidationSeverity;
  title: string;
  message: string;
}

export interface ImportPreview {
  fileName: string;
  datasetType: ImportDatasetType;
  rawText: string;
  headers: string[];
  rows: Record<string, string>[];
  recordCount: number;
  status: ImportStatus;
  validations: ImportValidationResult[];
}

export interface ImportHistoryItem {
  id: string;
  datasetType: ImportDatasetType;
  fileName: string;
  source: string;
  recordsRead: number;
  validRecords: number;
  warnings: number;
  errors: number;
  status: ImportStatus;
  importedAt: string;
  storedPath?: string;
  version?: string;
  active?: boolean;
  responsible?: string;
}

export interface ImportManifest {
  activeVersionByDataset: Partial<Record<ImportDatasetType, string>>;
  loads: ImportHistoryItem[];
}
