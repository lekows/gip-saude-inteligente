"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  ArrowRight,
  ClipboardCheck,
  Download,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { getMunicipalReportData, MunicipalAreaImpact } from "@/lib/municipalReportService";
import type { HealthCondition } from "@/types/territorial";

const MunicipalImpactMap = dynamic(
  () => import("./MunicipalImpactMap").then((mod) => mod.MunicipalImpactMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[560px] place-items-center rounded-lg border border-stone-200 bg-white text-sm text-stone-500">
        Carregando mapa municipal...
      </div>
    )
  }
);

type MunicipalReportData = ReturnType<typeof getMunicipalReportData>;
type FilterValue = "todos";

const conditionLabels: Record<HealthCondition, string> = {
  hipertensao: "Hipertensao",
  diabetes: "Diabetes",
  obesidade: "Obesidade",
  respiratoria: "Respiratoria",
  saudeMental: "Saude mental",
  retornoPrecoce: "Retorno precoce"
};

const pieColors = ["#1f7a4d", "#1c5f9f", "#c24a2c", "#f3d37a", "#7c3aed", "#78716c"];

export function MunicipalReportClient({ data }: { data: MunicipalReportData }) {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("jan-jun");
  const [condition, setCondition] = useState<HealthCondition | FilterValue>("todos");
  const [status, setStatus] = useState("todos");
  const [selectedArea, setSelectedArea] = useState<MunicipalAreaImpact>(data.areas[0]);

  const filteredCampaigns = useMemo(
    () =>
      data.campaigns.filter((campaign) => {
        const byCondition = condition === "todos" || campaign.condition === condition;
        const byStatus = status === "todos" || campaign.status === status;
        return byCondition && byStatus;
      }),
    [condition, data.campaigns, status]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1600px]">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-stone-200 bg-white p-6 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Relatorio consolidado municipal
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight lg:text-5xl">
              Impacto territorial dos mutiroes em {data.city}.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
              Visao executiva para comparar campanhas, medir reducao de risco,
              acompanhar cobertura e priorizar a proxima acao preventiva com IA.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-green-200 bg-green-50 text-folha">IBGE {data.ibgeCode}</Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">Dados agregados</Badge>
              <Badge className="border-stone-200 bg-stone-100 text-stone-700">{data.periodLabel}</Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo executivo IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-folha">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Sparkles size={17} />
                  Proxima decisao recomendada
                </div>
                {data.aiSummary}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <MiniMetric label="Campanhas" value={data.kpis.totalCampaigns} />
                <MiniMetric label="Bairros" value={data.kpis.neighborhoodsImpacted} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => window.print()}>
                  <Printer size={16} />
                  Imprimir
                </Button>
                <Link
                  href="/campaign-report/print"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold hover:border-folha"
                >
                  <Download size={16} />
                  PDF mutirao
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-5 no-print">
          <CardContent className="grid gap-3 p-4 md:grid-cols-4">
            <Filter label="Periodo" value={period} onChange={setPeriod}>
              <option value="jan-jun">Jan-Jun 2026</option>
              <option value="trim-2">2o trimestre</option>
              <option value="jun">Junho 2026</option>
            </Filter>
            <Filter label="Condicao" value={condition} onChange={(value) => setCondition(value as HealthCondition | FilterValue)}>
              <option value="todos">Todas</option>
              {Object.entries(conditionLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Filter>
            <Filter label="Status" value={status} onChange={setStatus}>
              <option value="todos">Todos</option>
              <option value="concluido">Concluido</option>
              <option value="em_andamento">Em andamento</option>
              <option value="planejado">Planejado</option>
            </Filter>
            <Filter label="Bairro foco" value={selectedArea.id} onChange={(value) => {
              const next = data.areas.find((area) => area.id === value);
              if (next) setSelectedArea(next);
            }}>
              {data.areas.map((area) => (
                <option key={area.id} value={area.id}>{area.label}</option>
              ))}
            </Filter>
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Triagens consolidadas" value={data.kpis.screenings} helper={`${data.kpis.averageEffectiveness}% de efetividade`} />
          <Kpi label="Alto risco localizado" value={data.kpis.highRiskFound} helper="Fila protegida APS" tone="danger" />
          <Kpi label="Faltosos localizados" value={data.kpis.absenteesLocated} helper="Busca ativa agregada" />
          <Kpi label="Cobertura municipal" value={`${data.kpis.coverage}%`} helper={`${data.kpis.missingPatients.toLocaleString("pt-BR")} faltantes`} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Mapa temporal de risco territorial</CardTitle>
            </CardHeader>
            <CardContent>
              <MunicipalImpactMap
                areas={data.areas}
                units={data.units}
                center={data.center}
                selectedId={selectedArea.id}
                onSelectArea={setSelectedArea}
              />
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Painel do bairro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">{selectedArea.label}</h2>
                    <RiskBadge score={selectedArea.afterScore} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{selectedArea.unitName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MiniMetric label="Antes" value={selectedArea.beforeScore} />
                  <MiniMetric label="Depois" value={selectedArea.afterScore} />
                  <MiniMetric label="Faltantes" value={selectedArea.missing.toLocaleString("pt-BR")} />
                  <MiniMetric label="Alto risco" value={selectedArea.highRiskPatients.toLocaleString("pt-BR")} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Reducao de score</span>
                    <span>-{Math.max(selectedArea.scoreDelta, 0)} pts</span>
                  </div>
                  <Progress value={Math.min(selectedArea.scoreDelta * 5, 100)} className="mt-2" />
                </div>
                <p className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3 text-sm leading-6 text-stone-600">
                  {selectedArea.suggestedAction}
                </p>
                <Link
                  href="/campaign-planner"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
                >
                  Planejar nova acao
                  <ArrowRight size={15} />
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas gerenciais</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-6 text-stone-600">
                  {data.alerts.map((alert) => (
                    <li key={alert} className="flex gap-2">
                      <ShieldCheck size={17} className="mt-1 shrink-0 text-folha" />
                      {alert}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <ChartCard title="Evolucao municipal">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="triagens" stroke="#1c5f9f" fill="#dbeafe" strokeWidth={2} />
                  <Area dataKey="altoRisco" stroke="#c24a2c" fill="#fee2e2" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Impacto por campanha">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.impactRanking}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impacto" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Condicoes priorizadas">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.charts.conditionDistribution} dataKey="value" nameKey="name" outerRadius={92}>
                    {data.charts.conditionDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas municipais</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                    <th className="p-3">Campanha</th>
                    <th className="p-3">Bairro</th>
                    <th className="p-3">Condicao</th>
                    <th className="p-3">Triagens</th>
                    <th className="p-3">Alto risco</th>
                    <th className="p-3">Score antes/depois</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-stone-100">
                      <td className="p-3 font-semibold">{campaign.title}</td>
                      <td className="p-3">{campaign.neighborhoodName}</td>
                      <td className="p-3">{conditionLabels[campaign.condition]}</td>
                      <td className="p-3">{campaign.realizedScreenings}/{campaign.plannedScreenings}</td>
                      <td className="p-3">{campaign.highRiskFound}</td>
                      <td className="p-3">{campaign.beforeScore} {"->"} {campaign.afterScore}</td>
                      <td className="p-3"><StatusBadge status={campaign.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de bairros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.areas
                .slice()
                .sort((a, b) => b.afterScore - a.afterScore)
                .map((area, index) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-left hover:border-folha"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-stone-100 text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{area.label}</p>
                        <p className="text-xs text-stone-500">Impacto -{Math.max(area.scoreDelta, 0)} pts</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">{area.afterScore}</span>
                  </button>
                ))}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}

function Filter({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm font-normal outline-none focus:border-folha"
      >
        {children}
      </select>
    </label>
  );
}

function Kpi({
  label,
  value,
  helper,
  tone = "default"
}: {
  label: string;
  value: string | number;
  helper: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-stone-500">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${tone === "danger" ? "text-alerta" : "text-ink"}`}>
          {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
        </p>
        <p className="mt-2 text-xs text-stone-500">{helper}</p>
      </CardContent>
    </Card>
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[310px]">{children}</CardContent>
    </Card>
  );
}

function ChartLoading() {
  return (
    <div className="grid h-full place-items-center rounded-md bg-stone-50 text-sm text-stone-500">
      Carregando grafico...
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  const config =
    score >= 70
      ? { label: "Vermelho", className: "border-red-200 bg-red-50 text-alerta" }
      : score >= 35
        ? { label: "Amarelo", className: "border-yellow-200 bg-yellow-50 text-yellow-800" }
        : { label: "Verde", className: "border-green-200 bg-green-50 text-folha" };

  return <Badge className={config.className}>{config.label} {score}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    concluido: "border-green-200 bg-green-50 text-folha",
    em_andamento: "border-blue-200 bg-blue-50 text-blue-800",
    planejado: "border-stone-200 bg-stone-100 text-stone-700"
  };

  return <Badge className={config[status]}>{status.replace("_", " ")}</Badge>;
}
