import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  FileUp,
  LayoutDashboard,
  Map,
  MonitorCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataQualityReport } from "@/lib/dataLoaders/dataQualityService";

const modules = [
  {
    href: "/manager-dashboard",
    title: "Dashboard do gestor",
    description: "Metas, cobertura, alto risco, triagens, mutiroes e ranking prioritario.",
    icon: LayoutDashboard
  },
  {
    href: "/territorial-map",
    title: "Mapa territorial",
    description: "Mapa de Luziania com risco por bairro, unidades e planejamento IA.",
    icon: Map
  },
  {
    href: "/campaign-planner",
    title: "Mutirao com IA",
    description: "Plano georreferenciado com microareas, rotas, impacto e mapa detalhado.",
    icon: Sparkles
  },
  {
    href: "/municipal-report",
    title: "Relatorio municipal",
    description: "Consolidado de campanhas, impacto territorial, ranking e mapa temporal.",
    icon: MonitorCheck
  },
  {
    href: "/municipal-goals",
    title: "Metas municipais",
    description: "Pactuacao por bairro, unidade e condicao com plano corretivo IA.",
    icon: Target
  },
  {
    href: "/mobile",
    title: "Busca Ativa GIP",
    description: "App mobile de campo para missao do dia, mapa de risco e registro rapido.",
    icon: Smartphone
  },
  {
    href: "/data",
    title: "Dados SUS",
    description: "Hub de importacao, qualidade, governanca e uso de dados agregados.",
    icon: Database
  },
  {
    href: "/data-import",
    title: "Importar dados",
    description: "Validar CNES, SISAB e GeoJSON antes de publicar datasets.",
    icon: FileUp
  },
  {
    href: "/data-quality",
    title: "Qualidade dos dados",
    description: "Auditoria de fontes, selos, alertas, cobertura e limites do MVP.",
    icon: ClipboardCheck
  }
];

export default function HomePage() {
  const report = getDataQualityReport();

  return (
    <main className="bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1500px]">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-lg border border-stone-200 bg-white p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Central operacional
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight lg:text-5xl">
              Inteligencia territorial para gestao publica em saude.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
              Acesse os modulos do GIP Saude Inteligente para monitorar
              cobertura, auditar dados SUS, priorizar bairros e planejar
              mutiroes preventivos com dados agregados.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/manager-dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-folha px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#17623d]"
              >
                Abrir dashboard
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/territorial-map"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-5 text-sm font-semibold text-ink hover:border-folha"
              >
                Ver mapa territorial
              </Link>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Resumo do ambiente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-md bg-green-50 p-4 text-folha">
                <div>
                  <p className="text-sm font-semibold">Qualidade dos dados</p>
                  <p className="mt-1 text-4xl font-semibold">{report.qualityScore}%</p>
                </div>
                <ShieldCheck size={36} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MiniMetric label="Arquivos" value={report.files.length} />
                <MiniMetric label="Bairros" value={report.coverage.neighborhoodsWithGeo} />
                <MiniMetric label="Unidades" value={report.coverage.totalHealthUnits} />
                <MiniMetric label="Alertas" value={report.issues.length} />
              </div>
              <Link
                href="/data-quality"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:border-folha"
              >
                Ver governanca dos dados
                <ArrowRight size={15} />
              </Link>
            </CardContent>
          </Card>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="h-full transition hover:border-folha hover:shadow-md">
                  <CardContent className="p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-md bg-green-50 text-folha">
                      <Icon size={21} />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold">{module.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {module.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-folha">
                      Acessar
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
            <CardTitle>Acao rapida recomendada</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles size={18} className="text-folha" />
                Planejar proximo mutirao preventivo
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Use o mapa territorial para comparar bairros, unidades e locais
                candidatos com score simulado de impacto.
              </p>
            </div>
            <Link
              href="/campaign-planner"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
            >
              Abrir planejamento IA
              <ArrowRight size={15} />
            </Link>
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
