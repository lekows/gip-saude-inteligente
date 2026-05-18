"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  DatabaseZap,
  FileSearch,
  FileUp,
  PlayCircle,
  ShieldCheck,
  UploadCloud,
  XCircle
} from "lucide-react";
import { DataWorkspaceNav } from "@/components/data/DataWorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  buildSamplePreview,
  importDatasetLabels,
  parseImportText,
  requiredColumns
} from "@/lib/dataLoaders/importValidation";
import type {
  ImportDatasetType,
  ImportHistoryItem,
  ImportPreview,
  ImportStatus,
  ImportValidationSeverity
} from "@/types/dataImport";

export function DataImportClient({
  initialHistory
}: {
  initialHistory: ImportHistoryItem[];
}) {
  const [datasetType, setDatasetType] = useState<ImportDatasetType>("cnes");
  const [preview, setPreview] = useState<ImportPreview>(() => buildSamplePreview("cnes"));
  const [history, setHistory] = useState<ImportHistoryItem[]>(initialHistory);
  const [publishedMessage, setPublishedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validationSummary = useMemo(() => {
    const errors = preview.validations.filter((item) => item.severity === "error").length;
    const warnings = preview.validations.filter((item) => item.severity === "warning").length;
    const ok = preview.validations.filter((item) => item.severity === "ok").length;
    return { errors, warnings, ok };
  }, [preview]);

  function handleDatasetChange(nextType: ImportDatasetType) {
    setDatasetType(nextType);
    setPreview(buildSamplePreview(nextType));
    setPublishedMessage(null);
  }

  async function handleFileChange(file?: File) {
    if (!file) return;
    const text = await file.text();
    setPreview(parseImportText(text, file.name, datasetType));
    setPublishedMessage(null);
  }

  function handleValidate() {
    setPreview((current) => ({
      ...current,
      status: validationSummary.errors ? "rascunho" : "validado"
    }));
    setPublishedMessage(null);
  }

  async function persistImport(action: "draft" | "publish") {
    if (action === "publish" && validationSummary.errors) return;
    setSaving(true);
    setPublishedMessage(null);

    try {
      const response = await fetch("/api/data-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetType,
          fileName: preview.fileName,
          content: preview.rawText,
          action,
          responsible: "Gestor MVP"
        })
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        load?: ImportHistoryItem;
      };

      if (!response.ok || !result.ok || !result.load) {
        setPublishedMessage(result.message ?? "Nao foi possivel persistir a carga.");
        return;
      }

      setPreview((current) => ({
        ...current,
        status: action === "publish" ? "publicado" : "rascunho"
      }));
      setHistory((current) => [result.load as ImportHistoryItem, ...current]);
      setPublishedMessage(result.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <DataWorkspaceNav />
      <section className="mx-auto max-w-[1500px] p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              GIP Saude Inteligente
            </p>
            <h1 className="mt-2 text-3xl font-semibold lg:text-4xl">
              Importacao segura de dados SUS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Fluxo demonstrativo para validar CNES, SISAB e GeoJSON antes de
              publicar dados no dashboard, mapa territorial e score de risco.
            </p>
          </div>
          <StatusBadge status={preview.status} />
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>1. Selecionar fonte</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="grid gap-2 text-sm font-semibold">
                Tipo de dataset
                <Select
                  value={datasetType}
                  onChange={(event) =>
                    handleDatasetChange(event.target.value as ImportDatasetType)
                  }
                >
                  <option value="cnes">CNES - Unidades</option>
                  <option value="sisab">SISAB - APS</option>
                  <option value="geojson">GeoJSON - Bairros</option>
                </Select>
              </label>

              <div className="mt-5 rounded-md border border-dashed border-stone-300 bg-[#fbfbf7] p-5 text-center">
                <UploadCloud className="mx-auto text-folha" size={32} />
                <p className="mt-3 text-sm font-semibold">Enviar arquivo para preview</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  CSV para CNES/SISAB ou GeoJSON para bairros. O MVP nao grava
                  automaticamente no disco.
                </p>
                <label className="mt-4 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]">
                  <FileUp size={16} />
                  Escolher arquivo
                  <input
                    type="file"
                    accept={datasetType === "geojson" ? ".geojson,.json" : ".csv"}
                    className="hidden"
                    onChange={(event) => handleFileChange(event.target.files?.[0])}
                  />
                </label>
              </div>

              <div className="mt-5 rounded-md border border-stone-200 bg-white p-4">
                <p className="text-sm font-semibold">Campos obrigatorios</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiredColumns[datasetType].map((column) => (
                    <Badge key={column} className="border-stone-200 bg-stone-100 text-stone-700">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Validar e publicar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard icon={<DatabaseZap size={18} />} label="Registros lidos" value={preview.recordCount} />
                <MetricCard icon={<CheckCircle2 size={18} />} label="Validações OK" value={validationSummary.ok} />
                <MetricCard icon={<XCircle size={18} />} label="Erros" value={validationSummary.errors} danger />
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {preview.validations.map((validation) => (
                  <ValidationCard key={`${validation.title}-${validation.message}`} validation={validation} />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleValidate}>
                  <FileSearch size={16} />
                  Validar dataset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => persistImport("draft")}
                  disabled={saving}
                >
                  <FileUp size={16} />
                  Salvar rascunho
                </Button>
                <Button
                  onClick={() => persistImport("publish")}
                  disabled={validationSummary.errors > 0 || saving}
                >
                  <PlayCircle size={16} />
                  Validar e publicar dataset
                </Button>
              </div>

              {publishedMessage ? (
                <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm leading-6 text-folha">
                  {publishedMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Preview: {preview.fileName}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {preview.headers.slice(0, 8).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((row, index) => (
                    <TableRow key={`${preview.fileName}-${index}`}>
                      {preview.headers.slice(0, 8).map((header) => (
                        <TableCell key={header}>{row[header] ?? "-"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!preview.rows.length ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  Nenhuma linha disponivel para preview.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo de cargas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{item.fileName}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {sourceLabel(item.datasetType)} | {formatDate(item.importedAt)}
                        </p>
                        {item.storedPath ? (
                          <p className="mt-1 text-xs text-stone-500">
                            {item.storedPath}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge status={item.status} compact />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <SmallMetric label="Lidos" value={item.recordsRead} />
                      <SmallMetric label="Avisos" value={item.warnings} />
                      <SmallMetric label="Erros" value={item.errors} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  danger
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
      <span className={danger ? "text-alerta" : "text-folha"}>{icon}</span>
      <p className="mt-3 text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function ValidationCard({
  validation
}: {
  validation: { severity: ImportValidationSeverity; title: string; message: string };
}) {
  const styles = {
    ok: "border-green-200 bg-green-50 text-folha",
    warning: "border-yellow-200 bg-[#fff9e8] text-[#8a5a18]",
    error: "border-red-200 bg-red-50 text-alerta"
  };

  return (
    <div className={`rounded-md border p-3 text-sm ${styles[validation.severity]}`}>
      <div className="flex items-center gap-2 font-semibold">
        {validation.severity === "error" ? <XCircle size={16} /> : <ShieldCheck size={16} />}
        {validation.title}
      </div>
      <p className="mt-2 leading-6">{validation.message}</p>
    </div>
  );
}

function StatusBadge({ status, compact }: { status: ImportStatus; compact?: boolean }) {
  const styles: Record<ImportStatus, string> = {
    rascunho: "border-stone-200 bg-stone-100 text-stone-700",
    validado: "border-blue-200 bg-blue-50 text-blue-800",
    publicado: "border-green-200 bg-green-50 text-folha"
  };

  return (
    <Badge className={styles[status]}>
      {compact ? status : `Status: ${status}`}
    </Badge>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white p-2">
      <p className="text-stone-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function sourceLabel(type: ImportDatasetType) {
  return importDatasetLabels[type];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
