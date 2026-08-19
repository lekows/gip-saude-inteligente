import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ClipboardCheck,
  Database,
  FileUp,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Map,
  MapPinned,
  MonitorCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UsersRound
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDataQualityReport } from "@/lib/dataLoaders/dataQualityService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  const access = await getHomeAccess();

  if (!access.approved) {
    return <PublicHome authenticated={access.authenticated} />;
  }

  if (
    access.role === "academico_colaborador" ||
    access.role === "academico_participante"
  ) {
    redirect("/meu-gip");
  }

  return <OperationalHome />;
}

async function getHomeAccess() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { authenticated: false, approved: false, role: null as string | null };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { authenticated: false, approved: false, role: null as string | null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status, active, role")
      .eq("id", user.id)
      .single();

    return {
      authenticated: true,
      approved: profile?.account_status === "aprovado" && profile.active === true,
      role: profile?.role ?? null,
    };
  } catch {
    return { authenticated: false, approved: false, role: null as string | null };
  }
}

function PublicHome({ authenticated }: { authenticated: boolean }) {
  const primaryHref = authenticated ? "/aguardando-aprovacao" : "/entrar";
  const primaryLabel = authenticated ? "Ver status do acesso" : "Entrar no sistema";

  return (
    <main className="bg-white text-ink">
      <section className="relative h-[72svh] min-h-[520px] max-h-[720px] overflow-hidden">
        <Image
          src="/images/gip-territorial-overview.png"
          alt="Visão territorial ilustrativa de uma cidade com áreas de prioridade em saúde"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative mx-auto flex h-full max-w-[1500px] items-center px-5 py-12 lg:px-10">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="grid h-10 w-10 place-items-center bg-folha">
                <HeartPulse size={21} />
              </span>
              Programa de extensão em saúde pública
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              GIP Saúde Inteligente
            </h1>
            <p className="mt-4 max-w-xl text-lg font-medium leading-7 text-white/90">
              Gestão, prevenção e inteligência territorial para apoiar o cuidado
              em saúde pública em Luziânia.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex h-12 items-center justify-center gap-2 bg-folha px-5 text-sm font-semibold text-white hover:bg-[#17623d]"
              >
                <LogIn size={18} />
                {primaryLabel}
              </Link>
              <Link
                href="/comunidade"
                className="inline-flex h-12 items-center justify-center gap-2 border border-white/60 bg-black/20 px-5 text-sm font-semibold text-white hover:bg-black/35"
              >
                <UsersRound size={18} />
                Conhecer o programa
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-7 md:grid-cols-3 lg:px-8">
          <PublicSignal
            icon={<MapPinned size={20} />}
            title="Atuação territorial"
            text="Planejamento por bairros e unidades de saúde."
          />
          <PublicSignal
            icon={<LockKeyhole size={20} />}
            title="Privacidade"
            text="Sem pacientes, endereços ou trajetos individuais na área pública."
          />
          <PublicSignal
            icon={<ShieldCheck size={20} />}
            title="Ambiente demonstrativo"
            text="Indicadores agregados e dados simulados no MVP."
          />
        </div>
      </section>
    </main>
  );
}

function PublicSignal({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-folha">{icon}</span>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-stone-600">{text}</p>
      </div>
    </div>
  );
}

function OperationalHome() {
  const summary = getOperationalSummary();

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
                  <p className="mt-1 text-4xl font-semibold">
                    {summary.qualityScore === null ? "--" : `${summary.qualityScore}%`}
                  </p>
                </div>
                <ShieldCheck size={36} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <MiniMetric label="Arquivos" value={summary.files} />
                <MiniMetric label="Bairros" value={summary.neighborhoods} />
                <MiniMetric label="Unidades" value={summary.healthUnits} />
                <MiniMetric label="Alertas" value={summary.issues} />
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

function getOperationalSummary() {
  try {
    const report = getDataQualityReport();
    return {
      qualityScore: report.qualityScore as number | null,
      files: report.files.length as number | string,
      neighborhoods: report.coverage.neighborhoodsWithGeo as number | string,
      healthUnits: report.coverage.totalHealthUnits as number | string,
      issues: report.issues.length as number | string,
    };
  } catch {
    return {
      qualityScore: null,
      files: "--",
      neighborhoods: "--",
      healthUnits: "--",
      issues: "--",
    };
  }
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
