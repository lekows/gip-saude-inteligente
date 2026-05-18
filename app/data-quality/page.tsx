import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  MapPinned,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { DataQualityCharts } from "@/components/dashboard/DataQualityCharts";
import { DataWorkspaceNav } from "@/components/data/DataWorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getDataQualityReport } from "@/lib/dataLoaders/dataQualityService";
import type { DataQualitySeverity, DataTrustBadge } from "@/types/dataQuality";

const badgeLabels: Record<DataTrustBadge, string> = {
  publico_real: "Dado publico real",
  agregado: "Agregado",
  simulado: "Simulado",
  mvp_seed: "Seed MVP"
};

const severityStyles: Record<DataQualitySeverity, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-yellow-200 bg-[#fff9e8] text-[#8a5a18]",
  critical: "border-red-200 bg-red-50 text-alerta"
};

export default function DataQualityPage() {
  const report = getDataQualityReport();
  const okFiles = report.files.filter((file) => file.status === "ok").length;
  const totalRecords = report.files.reduce((total, file) => total + file.records, 0);
  const publicFiles = report.files.filter((file) =>
    file.trustBadges.includes("publico_real")
  ).length;
  const simulatedFiles = report.files.filter((file) =>
    file.trustBadges.includes("simulado")
  ).length;
  const publishedLoads = report.importManifest.loads.filter(
    (load) => load.status === "publicado"
  );

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <DataWorkspaceNav />
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              GIP Saude Inteligente
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight lg:text-4xl">
              Qualidade, origem e governanca dos dados
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Um painel de confianca para validar fontes publicas do SUS,
              dados agregados, geometrias territoriais e limites do MVP antes
              de qualquer uso de dados identificaveis.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <TrustBadge badge="publico_real" />
              <TrustBadge badge="agregado" />
              <TrustBadge badge="simulado" />
              <TrustBadge badge="mvp_seed" />
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-[#fbfbf7] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Confianca do dataset
                </p>
                <p className="mt-2 text-5xl font-semibold">{report.qualityScore}%</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-md bg-green-50 text-folha">
                <ShieldCheck size={24} />
              </span>
            </div>
            <Progress value={report.qualityScore} className="mt-5" />
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Gerado em {formatDate(report.generatedAt)}. O score considera
              arquivos vazios, CNES ausente, geometria faltante e dados simulados.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] p-5 lg:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <QualityCard
            icon={<FileText size={19} />}
            label="Arquivos validos"
            value={`${okFiles}/${report.files.length}`}
            helper="CSV e GeoJSON carregados."
          />
          <QualityCard
            icon={<Database size={19} />}
            label="Registros agregados"
            value={totalRecords.toLocaleString("pt-BR")}
            helper="Nenhum paciente individual."
          />
          <QualityCard
            icon={<MapPinned size={19} />}
            label="Bairros mapeados"
            value={report.coverage.neighborhoodsWithGeo}
            helper="Geometrias territoriais."
          />
          <QualityCard
            icon={<Layers3 size={19} />}
            label="Fontes publicas"
            value={publicFiles}
            helper="Prontas para troca por extracao real."
          />
          <QualityCard
            icon={<Sparkles size={19} />}
            label="Bases simuladas"
            value={simulatedFiles}
            helper="Marcadas para governanca."
          />
        </section>

        <div className="mt-5">
          <DataQualityCharts report={report} />
        </div>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Cobertura tecnica dos dados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <CoverageMetric
              label="Unidades com coordenadas"
              value={report.coverage.healthUnitsWithCoordinates}
              total={report.coverage.totalHealthUnits}
            />
            <CoverageMetric
              label="SISAB com CNES conhecido"
              value={report.coverage.apsRowsWithKnownUnit}
              total={report.coverage.totalAPSRows}
            />
            <CoverageMetric
              label="Bairros com APS"
              value={report.coverage.neighborhoodsWithAPS}
              total={report.coverage.neighborhoodsWithGeo}
            />
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Camada /data/real</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Selos</TableHead>
                    <TableHead>Atualizacao</TableHead>
                    <TableHead>Observacao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.files.map((file) => (
                    <TableRow key={file.fileName}>
                      <TableCell>
                        <div className="font-semibold">{file.fileName}</div>
                        <div className="text-xs text-stone-500">{file.sizeKb} KB</div>
                      </TableCell>
                      <TableCell>{file.source}</TableCell>
                      <TableCell>{file.records.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {file.trustBadges.map((badge) => (
                            <TrustBadge key={badge} badge={badge} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(file.lastModified)}</TableCell>
                      <TableCell className="min-w-[280px] text-stone-600">
                        {file.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas e limites do MVP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.issues.map((issue) => (
                  <div
                    key={`${issue.title}-${issue.description}`}
                    className={`rounded-md border p-3 text-sm ${severityStyles[issue.severity]}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {issue.severity === "critical" ? (
                        <AlertTriangle size={17} />
                      ) : (
                        <CheckCircle2 size={17} />
                      )}
                      {issue.title}
                    </div>
                    <p className="mt-2 leading-6">{issue.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-md border border-stone-200 bg-[#fbfbf7] p-4 text-sm leading-6 text-stone-700">
                Proximo passo recomendado: substituir os seeds CNES, SISAB e
                GeoJSON por extracoes oficiais versionadas, mantendo o mesmo
                contrato dos loaders.
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Historico de importacoes e versoes publicadas</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versao</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Responsavel</TableHead>
                  <TableHead>Caminho</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.importManifest.loads.slice(0, 8).map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-semibold">{load.source}</TableCell>
                    <TableCell>{load.fileName}</TableCell>
                    <TableCell>
                      <Badge className={load.status === "publicado" ? "border-green-200 bg-green-50 text-folha" : "border-stone-200 bg-stone-100 text-stone-700"}>
                        {load.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{load.version ?? "-"}</TableCell>
                    <TableCell>{load.recordsRead.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{load.responsible ?? "-"}</TableCell>
                    <TableCell className="min-w-[240px] text-stone-600">
                      {load.storedPath ?? "-"}
                    </TableCell>
                    <TableCell>{formatDate(load.importedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!report.importManifest.loads.length ? (
              <div className="p-6 text-sm text-stone-500">
                Nenhuma carga persistida ainda. Use a pagina de importacao para
                salvar rascunhos ou publicar datasets.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Versoes ativas por dataset</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {(["cnes", "sisab", "geojson"] as const).map((datasetType) => (
              <div key={datasetType} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
                <p className="text-sm font-semibold uppercase">{datasetType}</p>
                <p className="mt-2 text-sm text-stone-600">
                  {report.importManifest.activeVersionByDataset[datasetType] ??
                    "Nenhuma versao publicada"}
                </p>
              </div>
            ))}
            <div className="rounded-md border border-green-200 bg-green-50 p-4 md:col-span-3">
              <p className="text-sm font-semibold text-folha">
                {publishedLoads.length} carga(s) publicada(s) no manifesto local.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function QualityCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-green-50 text-folha">
          {icon}
        </span>
        <p className="mt-4 text-xs font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs leading-5 text-stone-500">{helper}</p>
      </CardContent>
    </Card>
  );
}

function CoverageMetric({
  label,
  value,
  total
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        <span className="text-sm font-semibold">{percent}%</span>
      </div>
      <Progress value={percent} className="mt-3" />
      <p className="mt-2 text-xs text-stone-500">
        {value.toLocaleString("pt-BR")} de {total.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

function TrustBadge({ badge }: { badge: DataTrustBadge }) {
  const styles: Record<DataTrustBadge, string> = {
    publico_real: "border-green-200 bg-green-50 text-folha",
    agregado: "border-blue-200 bg-blue-50 text-blue-800",
    simulado: "border-yellow-200 bg-[#fff9e8] text-[#8a5a18]",
    mvp_seed: "border-stone-200 bg-stone-100 text-stone-700"
  };

  return <Badge className={styles[badge]}>{badgeLabels[badge]}</Badge>;
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
