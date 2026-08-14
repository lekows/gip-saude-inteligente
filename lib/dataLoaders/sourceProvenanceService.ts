import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import type {
  DatasetProvenance,
  SourceProvenanceManifest
} from "@/types/dataProvenance";
import { parseCsv } from "./csv";

const DATA_DIR = path.join(process.cwd(), "data", "real");
const MANIFEST_PATH = path.join(DATA_DIR, "source_provenance.json");

export interface ProvenanceVerification {
  dataset: DatasetProvenance;
  fileExists: boolean;
  hashMatches: boolean;
  recordsMatch: boolean;
  actualRecords: number;
  actualSha256: string;
}

export function readSourceProvenance(): SourceProvenanceManifest {
  return JSON.parse(
    readFileSync(MANIFEST_PATH, "utf8")
  ) as SourceProvenanceManifest;
}

export function verifySourceProvenance(): ProvenanceVerification[] {
  return readSourceProvenance().datasets.map((dataset) => {
    const filePath = path.join(DATA_DIR, dataset.fileName);
    if (!existsSync(filePath)) {
      return {
        dataset,
        fileExists: false,
        hashMatches: false,
        recordsMatch: false,
        actualRecords: 0,
        actualSha256: ""
      };
    }

    const content = readFileSync(filePath);
    const text = content.toString("utf8");
    const actualRecords = dataset.fileName.endsWith(".geojson")
      ? countGeoJsonFeatures(text)
      : parseCsv(text).length;
    const actualSha256 = createHash("sha256").update(content).digest("hex");

    return {
      dataset,
      fileExists: true,
      hashMatches: actualSha256 === dataset.sha256,
      recordsMatch: actualRecords === dataset.records,
      actualRecords,
      actualSha256
    };
  });
}

function countGeoJsonFeatures(content: string) {
  const parsed = JSON.parse(content) as { features?: unknown[] };
  return parsed.features?.length ?? 0;
}
