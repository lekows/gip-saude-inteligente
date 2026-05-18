export type DataTrustBadge =
  | "publico_real"
  | "agregado"
  | "simulado"
  | "mvp_seed";

export type DataQualitySeverity = "info" | "warning" | "critical";

export interface DataFileQuality {
  fileName: string;
  source: string;
  trustBadges: DataTrustBadge[];
  records: number;
  lastModified: string;
  sizeKb: number;
  status: "ok" | "attention";
  notes: string;
}

export interface DataQualityIssue {
  severity: DataQualitySeverity;
  title: string;
  description: string;
}

export interface DataCoverageQuality {
  neighborhoodsWithGeo: number;
  neighborhoodsWithAPS: number;
  healthUnitsWithCoordinates: number;
  totalHealthUnits: number;
  apsRowsWithKnownUnit: number;
  totalAPSRows: number;
  simulatedMortalityRows: number;
}

export interface DataQualityReport {
  generatedAt: string;
  files: DataFileQuality[];
  issues: DataQualityIssue[];
  coverage: DataCoverageQuality;
  qualityScore: number;
  importManifest: ImportManifest;
}
import type { ImportManifest } from "./dataImport";
