"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getGoalConditionLabel,
  getGoalMetricLabel,
  type EnrichedMunicipalGoal,
  type getMunicipalGoalsData,
  type GoalStatus
} from "@/lib/municipalGoalsService";

type MunicipalGoalsData = ReturnType<typeof getMunicipalGoalsData>;

export function MunicipalGoalsClient({ data }: { data: MunicipalGoalsData }) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<GoalStatus | "todos">("todos");
  const [selectedGoal, setSelectedGoal] = useState<EnrichedMunicipalGoal>(data.goals[0]);

  const filteredGoals = useMemo(
    () => data.goals.filter((goal) => status === "todos" || goal.status === status),
    [data.goals, status]
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
              Metas e pactuacao municipal
            </p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight lg:text-5xl">
              Da meta pactuada para a acao territorial.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-stone-600">
              Acompanhe metas por bairro, unidade e condicao, identifique risco
              de nao cumprimento e gere um plano corretivo com IA simulada.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-green-200 bg-green-50 text-folha">{data.city}</Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">IBGE {data.ibgeCode}</Badge>
              <Badge className="border-stone-200 bg-stone-100 text-stone-700">{data.periodLabel}</Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plano corretivo IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-folha">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Sparkles size={17} />
                  Proxima pactuacao recomendada
                </div>
                <ul className="space-y-2">
                  {data.aiPlan.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <Link
                href="/campaign-planner"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
              >
                Converter em mutirao
                <ArrowRight size={15} />
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi icon={<Target size={20} />} label="Metas pactuadas" value={data.kpis.totalGoals} helper={`${data.kpis.averageProgress}% progresso medio`} />
          <Kpi icon={<Gauge size={20} />} label="Gap total" value={data.kpis.totalGap.toLocaleString("pt-BR")} helper="Soma das entregas faltantes" />
          <Kpi icon={<CalendarClock size={20} />} label="Metas criticas" value={data.kpis.urgentGoals} helper="Risco alto de atraso" danger />
          <Kpi icon={<CheckCircle2 size={20} />} label="No prazo" value={data.kpis.stableGoals} helper="Metas em faixa verde" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Matriz de metas territoriais</CardTitle>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as GoalStatus | "todos")}
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-folha"
              >
                <option value="todos">Todos os status</option>
                <option value="verde">Verde</option>
                <option value="amarelo">Amarelo</option>
                <option value="vermelho">Vermelho</option>
              </select>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className="w-full rounded-md border border-stone-200 bg-white p-4 text-left transition hover:border-folha"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold">{goal.neighborhoodName}</h2>
                        <StatusBadge status={goal.status} />
                      </div>
                      <p className="mt-1 text-sm text-stone-500">
                        {goal.unitName} - {getGoalMetricLabel(goal.metric)} - {getGoalConditionLabel(goal.condition)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold">
                      {goal.current.toLocaleString("pt-BR")} / {goal.target.toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-stone-500">
                      <span>Progresso</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} indicatorClassName={progressColor(goal.status)} className="mt-2" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <aside className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Detalhe da meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold">{selectedGoal.neighborhoodName}</h2>
                    <StatusBadge status={selectedGoal.status} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{selectedGoal.owner}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MiniMetric label="Meta" value={selectedGoal.target.toLocaleString("pt-BR")} />
                  <MiniMetric label="Atual" value={selectedGoal.current.toLocaleString("pt-BR")} />
                  <MiniMetric label="Gap" value={selectedGoal.gap.toLocaleString("pt-BR")} />
                  <MiniMetric label="Prazo" value={selectedGoal.deadline} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Risco de nao cumprir</span>
                    <span>{selectedGoal.riskOfDelay}%</span>
                  </div>
                  <Progress value={selectedGoal.riskOfDelay} indicatorClassName={progressColor(selectedGoal.status)} className="mt-2" />
                </div>
                <p className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3 text-sm leading-6 text-stone-600">
                  {selectedGoal.action}
                </p>
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm leading-6 text-folha">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <Sparkles size={16} />
                    Sugestao IA
                  </div>
                  {selectedGoal.aiRecommendation}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas de pactuacao</CardTitle>
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
          <ChartCard title="Progresso x risco">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.progressByNeighborhood}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progresso" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="risco" fill="#c24a2c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Distribuicao semaforica">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.charts.statusDistribution} dataKey="value" nameKey="name" outerRadius={92}>
                    {data.charts.statusDistribution.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Ranking de gaps">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.gapRanking}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="faltante" fill="#1c5f9f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Fluxo de governanca</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <FlowStep icon={<ClipboardList size={18} />} title="Pactuar" text="Meta por bairro, unidade e condicao." />
            <FlowStep icon={<TrendingUp size={18} />} title="Monitorar" text="Progresso, gap e risco semanal." />
            <FlowStep icon={<Sparkles size={18} />} title="Corrigir" text="IA sugere mutirao, ACS ou agenda." />
            <FlowStep icon={<ShieldCheck size={18} />} title="Prestar contas" text="Resultado agregado no relatorio." />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Kpi({
  icon,
  label,
  value,
  helper,
  danger
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper: string;
  danger?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={danger ? "text-alerta" : "text-folha"}>{icon}</div>
        <p className="mt-3 text-xs text-stone-500">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${danger ? "text-alerta" : "text-ink"}`}>{value}</p>
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

function StatusBadge({ status }: { status: GoalStatus }) {
  const config = {
    verde: "border-green-200 bg-green-50 text-folha",
    amarelo: "border-yellow-200 bg-yellow-50 text-yellow-800",
    vermelho: "border-red-200 bg-red-50 text-alerta"
  };

  return <Badge className={config[status]}>{status}</Badge>;
}

function progressColor(status: GoalStatus) {
  if (status === "vermelho") return "bg-alerta";
  if (status === "amarelo") return "bg-[#d9a529]";
  return "bg-folha";
}

function FlowStep({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
      <div className="text-folha">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{text}</p>
    </div>
  );
}
