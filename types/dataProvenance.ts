export type ProvenanceStatus =
  | "official_verified"
  | "institutional_pending_homologation"
  | "seed_pending_validation";

export interface DatasetApproval {
  required: boolean;
  status: "not_required" | "pending" | "approved";
  approverRole: string | null;
  approvedAt: string | null;
  evidence: string | null;
}

export interface DatasetProvenance {
  datasetId: string;
  fileName: string;
  status: ProvenanceStatus;
  sourceName: string;
  sourceUrl: string;
  extractedAt: string;
  referencePeriod: string;
  geographicScope: string;
  grain: string;
  records: number;
  sha256: string;
  rawSha256: string | null;
  allowedUses: string[];
  blockedUses: string[];
  validations: string[];
  limitations: string[];
  approval: DatasetApproval;
}

export interface SourceProvenanceManifest {
  generatedAt: string;
  municipality: {
    name: string;
    state: string;
    ibgeCode: string;
  };
  datasets: DatasetProvenance[];
}
