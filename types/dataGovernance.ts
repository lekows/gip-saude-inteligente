import type { DataTrustBadge } from "./dataQuality";

export type DataSourceStatus =
  | "seed_pending_validation"
  | "simulated_only"
  | "authorized_public";

export type DataFieldClassification =
  | "publico_agregado"
  | "institucional_agregado"
  | "simulado"
  | "identificavel_proibido";

export type DataFieldType =
  | "texto"
  | "inteiro"
  | "decimal"
  | "data"
  | "booleano"
  | "geometria";

export interface DataSourceCatalogItem {
  id: string;
  fileName: string;
  source: string;
  owner: string;
  scope: string;
  frequency: string;
  status: DataSourceStatus;
  trustBadges: DataTrustBadge[];
  notes: string;
}

export interface DataFieldDefinition {
  id: string;
  sourceId: string;
  fieldName: string;
  label: string;
  type: DataFieldType;
  required: boolean;
  classification: DataFieldClassification;
  description: string;
  qualityRule: string;
  usedIn: string[];
}
