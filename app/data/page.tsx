import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Database,
  FileUp,
  LayoutDashboard,
  Map,
  ShieldCheck
} from "lucide-react";
import { DataWorkspaceNav } from "@/components/data/DataWorkspaceNav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataQualityReport } from "@/lib/dataLoaders/dataQualityService";

const steps = [
  {
    href: "/data-dictionary",
    title: "1. Definir o contrato",
    description: "Consultar fontes, campos, classificacao e regras de qualidade.",
    icon: BookOpen
  },
  {
    href: "/data-import",
    title: "2. Importar dados",
    description: "Validar CNES, SISAB e GeoJSON antes de publicar no MVP.",
    icon: FileUp
  },
  {
    href: "/data-quality",
    title: "3. Auditar qualidade",
    description: "Conferir fontes, selos, cobertura, alertas e limites LGPD.",
    icon: ClipboardCheck
  },
  {
    href: "/manager-dashboard",
    title: "4. Usar no dashboard",
    description: "Transformar dados agregados em indicadores para o gestor.",
    icon: LayoutDashboard
  },
  {
    href: "/territorial-map",
    title: "5. Priorizar territorio",
    description: "Levar scores e unidades para o mapa de Luziania.",
    icon: Map
  }
];

export default function DataHubPage() {
  const report = getDataQualityReport();
  const totalRecords = report.files.reduce((total, file) => total + file.records, 0);

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <DataWorkspaceNav />

      <section className="mx-auto max-w-[1500px] p-5 lg:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Dados SUS e governanca
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight lg:text-4xl">
              Um fluxo unico para importar, validar e usar dados territoriais.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Esta area conecta as paginas que estavam soltas: importacao,
              qualidade, dashboard gerencial e mapa territorial. O objetivo e
              deixar claro o caminho operacional do dado ate a decisao.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-green-200 bg-green-50 text-folha">
                Dados publicos agregados
              </Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">
                CNES + SISAB + GeoJSON
              </Badge>
              <Badge className="border-stone-200 bg-stone-100 text-stone-700">
                Pacientes simulados no MVP
              </Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/data-dictionary"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
              >
                Abrir dicionario
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/data-import"
                className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-ink hover:border-folha"
              >
                Comecar importacao
              </Link>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Status atual do dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-md bg-green-50 p-4 text-folha">
                <div>
                  <p className="text-sm font-semibold">Score de qualidade</p>
                  <p className="mt-1 text-4xl font-semibold">{report.qualityScore}%</p>
                </div>
                <ShieldCheck size={36} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MiniMetric label="Arquivos" value={report.files.length} />
                <MiniMetric label="Registros" value={totalRecords.toLocaleString("pt-BR")} />
                <MiniMetric label="Bairros" value={report.coverage.neighborhoodsWithGeo} />
                <MiniMetric label="Unidades" value={report.coverage.totalHealthUnits} />
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link key={step.href} href={step.href}>
                <Card className="h-full transition hover:border-folha hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-green-50 text-folha">
                      <Icon size={21} />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {step.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-folha">
                      Abrir etapa
                      <ArrowRight size={15} />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Arquitetura do fluxo de dados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-6">
              {["Dicionario", "CSV/GeoJSON", "Loaders", "Qualidade", "Dashboard", "Mapa"].map(
                (item, index) => (
                  <div
                    key={item}
                    className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">{item}</span>
                    </div>
                  </div>
                )
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Nenhum dado identificavel de paciente entra nesse fluxo. O MVP usa
              dados publicos/agregados e simulacao para demonstrar busca ativa,
              risco territorial e sugestao de mutiroes.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
