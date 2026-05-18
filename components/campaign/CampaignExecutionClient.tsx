"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Droplet,
  HeartPulse,
  MapPin,
  ShieldAlert,
  Stethoscope,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { statusColors, statusLabels } from "@/lib/campaignExecutionService";
import type {
  CampaignExecutionSnapshot,
  CampaignPlan,
  ExecutionStatus,
  MicroAreaExecution,
  SimulatedHouseholdCluster
} from "@/types/campaign";

const CampaignExecutionMap = dynamic(
  () => import("./CampaignExecutionMap").then((mod) => mod.CampaignExecutionMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[560px] place-items-center rounded-lg border border-stone-200 bg-white">
        Carregando mapa operacional...
      </div>
    )
  }
);

export function CampaignExecutionClient({
  plan,
  snapshot,
  totals,
  progress,
  microAreaRows,
  chartData
}: {
  plan: CampaignPlan;
  snapshot: CampaignExecutionSnapshot;
  totals: {
    householdsVisited: number;
    peopleScreened: number;
    bloodPressureChecks: number;
    glucoseChecks: number;
    referrals: number;
    highRiskFound: number;
    absenteesLocated: number;
  };
  progress: { households: number; screenings: number; highRisk: number };
  microAreaRows: Array<SimulatedHouseholdCluster & { execution?: MicroAreaExecution }>;
  chartData: {
    production: Array<{ name: string; triados: number; altoRisco: number; encaminhados: number }>;
    status: Array<{ name: string; value: number; color: string }>;
    timeline: Array<{ hour: string; triagens: number }>;
  };
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1600px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Execucao do mutirao
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">
              {plan.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Acompanhamento operacional simulado do dia de campo: equipes,
              microareas, triagens, alto risco, ocorrencias e encerramento agregado.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status={snapshot.status} />
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">
                Inicio {formatTime(snapshot.startedAt)}
              </Badge>
              <Badge className="border-green-200 bg-green-50 text-folha">
                Sem dados identificaveis
              </Badge>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Checklist pre-mutirao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Ponto de comando montado",
                "Equipes e rotas distribuidas",
                "Insumos de PA e glicemia conferidos",
                "Fluxo de encaminhamento pactuado"
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm font-semibold text-folha">
                  <CheckCircle2 size={17} />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <Kpi icon={<Users size={18} />} label="Pessoas triadas" value={totals.peopleScreened} />
          <Kpi icon={<HeartPulse size={18} />} label="PA aferida" value={totals.bloodPressureChecks} />
          <Kpi icon={<Droplet size={18} />} label="Glicemias" value={totals.glucoseChecks} />
          <Kpi icon={<ShieldAlert size={18} />} label="Alto risco" value={totals.highRiskFound} danger />
          <Kpi icon={<Stethoscope size={18} />} label="Encaminhamentos" value={totals.referrals} />
          <Kpi icon={<MapPin size={18} />} label="Faltosos localizados" value={totals.absenteesLocated} />
          <Kpi icon={<Activity size={18} />} label="Domicilios visitados" value={totals.householdsVisited} />
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Progresso operacional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <ProgressMetric label="Domicilios" value={progress.households} />
            <ProgressMetric label="Triagens" value={progress.screenings} />
            <ProgressMetric label="Alto risco localizado" value={progress.highRisk} />
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <CampaignExecutionMap plan={plan} snapshot={snapshot} />

          <Card>
            <CardHeader>
              <CardTitle>Equipes por rota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.teams.map((team) => (
                <div key={team.id} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{team.teamName}</p>
                      <p className="mt-1 text-xs text-stone-500">{team.members.join(" | ")}</p>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <ChartCard title="Produção por microarea">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.production}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="triados" fill="#1c5f9f" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="altoRisco" fill="#c24a2c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
          <ChartCard title="Status das microareas">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.status} dataKey="value" nameKey="name" outerRadius={92}>
                    {chartData.status.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
          <ChartCard title="Triagens ao longo do dia">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="triagens" stroke="#1f7a4d" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <Card>
            <CardHeader>
              <CardTitle>Status das microareas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {microAreaRows.map((area) => (
                <div key={area.id} className="rounded-md border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{area.label}</p>
                      <p className="mt-1 text-xs text-stone-500">{area.execution?.note}</p>
                    </div>
                    <StatusBadge status={area.execution?.status ?? "nao_iniciado"} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <MiniMetric label="Triados" value={area.execution?.peopleScreened ?? 0} />
                    <MiniMetric label="Alto risco" value={area.execution?.highRiskFound ?? 0} />
                    <MiniMetric label="Encam." value={area.execution?.referrals ?? 0} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ocorrencias do dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.occurrences.map((occurrence) => (
                <div key={occurrence.id} className={`rounded-md border p-3 text-sm ${occurrence.severity === "critico" ? "border-red-200 bg-red-50 text-alerta" : occurrence.severity === "alerta" ? "border-yellow-200 bg-[#fff9e8] text-[#8a5a18]" : "border-blue-200 bg-blue-50 text-blue-800"}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle size={16} />
                    {occurrence.time} | {occurrence.title}
                  </div>
                  <p className="mt-2 leading-6">{occurrence.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Resumo final agregado previsto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-stone-600">
              Ao encerrar o mutirão, o sistema consolida apenas indicadores por
              microarea e bairro: triagens, alto risco, encaminhamentos, faltosos
              localizados e pendencias para retorno. Nenhum endereço individual ou
              paciente real aparece no painel.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Kpi({ icon, label, value, danger }: { icon: React.ReactNode; label: string; value: number; danger?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <span className={danger ? "text-alerta" : "text-folha"}>{icon}</span>
        <p className="mt-3 text-xs text-stone-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value.toLocaleString("pt-BR")}</p>
      </CardContent>
    </Card>
  );
}

function ProgressMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm font-semibold">{value}%</p>
      </div>
      <Progress value={value} className="mt-3" />
    </div>
  );
}

function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <Badge className="border-transparent text-white" style={{ backgroundColor: statusColors[status] }}>
      {statusLabels[status]}
    </Badge>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">{children}</CardContent>
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

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-[#fbfbf7] p-2">
      <p className="text-stone-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
