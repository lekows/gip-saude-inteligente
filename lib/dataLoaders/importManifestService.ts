import "server-only";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type {
  ImportDatasetType,
  ImportHistoryItem,
  ImportManifest,
  ImportStatus
} from "@/types/dataImport";

const IMPORT_ROOT = path.join(process.cwd(), "data", "imports");
const MANIFEST_PATH = path.join(IMPORT_ROOT, "manifest.json");

export function readImportManifest(): ImportManifest {
  ensureImportStructure();
  if (!existsSync(MANIFEST_PATH)) {
    const emptyManifest: ImportManifest = { activeVersionByDataset: {}, loads: [] };
    writeManifest(emptyManifest);
    return emptyManifest;
  }

  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ImportManifest;
}

export function appendImportLoad(load: ImportHistoryItem): ImportManifest {
  const manifest = readImportManifest();
  const nextManifest: ImportManifest = {
    activeVersionByDataset:
      load.status === "publicado"
        ? {
            ...manifest.activeVersionByDataset,
            [load.datasetType]: load.version
          }
        : manifest.activeVersionByDataset,
    loads: [load, ...manifest.loads]
  };
  writeManifest(nextManifest);
  return nextManifest;
}

export function persistImportFile({
  datasetType,
  fileName,
  content,
  status
}: {
  datasetType: ImportDatasetType;
  fileName: string;
  content: string;
  status: Extract<ImportStatus, "rascunho" | "publicado">;
}) {
  ensureImportStructure();
  const version = createVersion();
  const safeFileName = sanitizeFileName(fileName);
  const folder = status === "publicado" ? "published" : "drafts";
  const storedFileName = `${version}-${datasetType}-${safeFileName}`;
  const absolutePath = path.join(IMPORT_ROOT, folder, storedFileName);
  writeFileSync(absolutePath, content, "utf8");

  return {
    version,
    storedPath: path.join("data", "imports", folder, storedFileName)
  };
}

export function ensureImportStructure() {
  mkdirSync(path.join(IMPORT_ROOT, "drafts"), { recursive: true });
  mkdirSync(path.join(IMPORT_ROOT, "published"), { recursive: true });
  mkdirSync(path.join(IMPORT_ROOT, "archive"), { recursive: true });
}

function writeManifest(manifest: ImportManifest) {
  ensureImportStructure();
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function createVersion() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}
