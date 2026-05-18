"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  CheckCircle2,
  Download,
  FileText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { getCampaignReportData } from "@/lib/campaignReportService";

const CampaignExecutionMap = dynamic(
  () => import("./CampaignExecutionMap").then((mod) => mod.CampaignExecutionMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[500px] place-items-center rounded-lg border border-stone-200 bg-white">
        Carregando mapa final...
      </div>
    )
  }
);

type ReportData = ReturnType<typeof getCampaignReportData>;

export function CampaignReportClient({ data }: { data: ReportData }) {
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1600px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Relatorio pos-mutirao
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">
              Resultado agregado - {data.plan.targetNeighborhoodName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Fechamento gerencial da acao, comparando planejado x realizado,
              impacto territorial, pendencias e recomendacoes para continuidade.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-green-200 bg-green-50 text-folha">
                Dados agregados
              </Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">
                Sem identificacao individual
              </Badge>
              <Badge className="border-stone-200 bg-stone-100 text-stone-700">
                Responsavel: Gestao APS
              </Badge>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Acoes do relatorio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/campaign-report/print"
                target="_blank"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
              >
                <Download size={16} />
                Abrir versao imprimivel
              </Link>
              <Button variant="outline" className="w-full" onClick={() => setMessage("Resumo enviado de forma simulada para a gestao.")}>
                <Send size={16} />
                Enviar resumo para gestao
              </Button>
              {message ? (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-folha">
                  {message}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Triagens realizadas" value={data.realized.screenings} target={data.planned.screenings} />
          <Kpi label="Alto risco localizado" value={data.realized.highRisk} target={data.planned.highRisk} danger />
          <Kpi label="Domicilios visitados" value={data.realized.households} target={data.planned.households} />
          <Kpi label="Encaminhamentos" value={data.totals.referrals} target={data.realized.highRisk} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Mapa final da cobertura</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignExecutionMap plan={data.plan} snapshot={data.snapshot} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impacto e efetividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Effectiveness label="Domicilios" value={data.effectiveness.households} />
              <Effectiveness label="Triagens" value={data.effectiveness.screenings} />
              <Effectiveness label="Alto risco" value={data.effectiveness.highRisk} />
              <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-folha">
                <div className="flex items-center gap-2 font-semibold">
                  <TrendingUp size={17} />
                  Analise de impacto
                </div>
                <p className="mt-2">
                  A acao localizou {data.totals.highRiskFound} pessoas em alto
                  risco agregado e {data.totals.absenteesLocated} faltosos,
                  criando fila de retorno protegida para a APS.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <ChartCard title="Planejado x realizado">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.comparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="planejado" fill="#78716c" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="realizado" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Producao por microarea">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData.production}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="triados" fill="#1c5f9f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>

          <ChartCard title="Status final das microareas">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.chartData.status} dataKey="value" nameKey="name" outerRadius={92}>
                    {data.chartData.status.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <ChartLoading />}
          </ChartCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <InsightCard
            icon={<Sparkles size={18} />}
            title="Recomendacoes da IA"
            items={data.recommendations}
          />
          <InsightCard
            icon={<FileText size={18} />}
            title="Pendencias para a semana"
            items={data.pendingActions}
          />
          <Card>
            <CardHeader>
              <CardTitle>LGPD e governanca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-stone-600">
              <div className="flex gap-2">
                <ShieldCheck size={18} className="mt-1 shrink-0 text-folha" />
                Resultado consolidado apenas por bairro e microarea.
              </div>
              <div className="flex gap-2">
                <CheckCircle2 size={18} className="mt-1 shrink-0 text-folha" />
                Nenhum endereco individual ou paciente real exibido.
              </div>
              <div className="flex gap-2">
                <CheckCircle2 size={18} className="mt-1 shrink-0 text-folha" />
                Origem: dados agregados do MVP e execucao simulada.
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}

function Kpi({ label, value, target, danger }: { label: string; value: number; target: number; danger?: boolean }) {
  const percent = target ? Math.round((value / target) * 100) : 0;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-stone-500">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${danger ? "text-alerta" : "text-ink"}`}>
          {value.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 text-xs text-stone-500">Meta {target.toLocaleString("pt-BR")}</p>
        <Progress value={percent} className="mt-3" />
      </CardContent>
    </Card>
  );
}

function Effectiveness({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm font-semibold">{value}%</p>
      </div>
      <Progress value={value} className="mt-2" />
    </div>
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

function InsightCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 text-folha">{icon}</div>
        <ul className="space-y-3 text-sm leading-6 text-stone-600">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-folha" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
