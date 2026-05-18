import { NextResponse } from "next/server";
import { parseImportText } from "@/lib/dataLoaders/importValidation";
import {
  appendImportLoad,
  persistImportFile
} from "@/lib/dataLoaders/importManifestService";
import type { ImportDatasetType, ImportStatus } from "@/types/dataImport";

interface ImportRequestBody {
  datasetType: ImportDatasetType;
  fileName: string;
  content: string;
  action: "draft" | "publish";
  responsible?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ImportRequestBody;
  const status: Extract<ImportStatus, "rascunho" | "publicado"> =
    body.action === "publish" ? "publicado" : "rascunho";
  const preview = parseImportText(body.content, body.fileName, body.datasetType);
  const errors = preview.validations.filter((item) => item.severity === "error").length;
  const warnings = preview.validations.filter((item) => item.severity === "warning").length;

  if (status === "publicado" && errors > 0) {
    return NextResponse.json(
      {
        ok: false,
        message: "Dataset contem erros e nao pode ser publicado.",
        validations: preview.validations
      },
      { status: 422 }
    );
  }

  const persisted = persistImportFile({
    datasetType: body.datasetType,
    fileName: body.fileName,
    content: body.content,
    status
  });

  const load = {
    id: `load-${persisted.version}-${body.datasetType}`,
    datasetType: body.datasetType,
    fileName: body.fileName,
    source: sourceLabel(body.datasetType),
    recordsRead: preview.recordCount,
    validRecords: Math.max(preview.recordCount - errors, 0),
    warnings,
    errors,
    status,
    importedAt: new Date().toISOString(),
    storedPath: persisted.storedPath,
    version: persisted.version,
    active: status === "publicado",
    responsible: body.responsible ?? "Gestor MVP"
  };

  const manifest = appendImportLoad(load);

  return NextResponse.json({
    ok: true,
    load,
    manifest,
    message:
      status === "publicado"
        ? "Dataset publicado e manifesto atualizado."
        : "Rascunho salvo no repositório local."
  });
}

function sourceLabel(type: ImportDatasetType) {
  const labels: Record<ImportDatasetType, string> = {
    cnes: "CNES",
    sisab: "SISAB",
    geojson: "IBGE/GeoJSON"
  };
  return labels[type];
}
