"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  AlertTriangle,
  ClipboardCheck,
  Mail,
  MapPinned,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ManagerTerritorialMapClient } from "@/components/dashboard/ManagerTerritorialMapClient";
import { conditionLabels } from "@/data/territorialData";
import {
  createManagerAlerts,
  enrichAreas,
  getManagerKpis,
  getPriorityRanking,
  getRiskDistribution,
  suggestManagerCampaign
} from "@/lib/managerDashboardService";
import type { EnrichedManagerArea, ManagerRiskLevel } from "@/types/managerDashboard";
import type { ManagerDashboardData } from "@/types/managerDashboard";
import type { HealthCondition } from "@/types/territorial";

const riskColors: Record<ManagerRiskLevel, string> = {
  verde: "#1f7a4d",
  amarelo: "#f3d37a",
  vermelho: "#c24a2c"
};

export function ManagerDashboardClient({ data }: { data: ManagerDashboardData }) {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState("2026-1-semestre");
  const [unit, setUnit] = useState("todas");
  const [neighborhood, setNeighborhood] = useState("todos");
  const [condition, setCondition] = useState<HealthCondition>("hipertensao");
  const [risk, setRisk] = useState<ManagerRiskLevel | "todos">("todos");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const enrichedAreas = useMemo(
    () => enrichAreas(data.areas, data.neighborhoods),
    [data]
  );

  const filteredAreas = useMemo(
    () =>
      enrichedAreas.filter((area) => {
        const unitMatch = unit === "todas" || area.unitName === unit;
        const neighborhoodMatch = neighborhood === "todos" || area.neighborhoodId === neighborhood;
        const riskMatch = risk === "todos" || area.territorialRiskLevel === risk;
        return unitMatch && neighborhoodMatch && riskMatch;
      }),
    [enrichedAreas, neighborhood, risk, unit]
  );

  const kpis = useMemo(() => getManagerKpis(filteredAreas), [filteredAreas]);
  const riskDistribution = useMemo(
    () => getRiskDistribution(filteredAreas),
    [filteredAreas]
  );
  const priorityRanking = useMemo(
    () => getPriorityRanking(filteredAreas),
    [filteredAreas]
  );
  const alerts = useMemo(
    () => createManagerAlerts(filteredAreas.length ? filteredAreas : enrichedAreas, condition),
    [condition, enrichedAreas, filteredAreas]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleSuggestCampaign() {
    setAiSuggestion(
      suggestManagerCampaign(filteredAreas.length ? filteredAreas : enrichedAreas, condition)
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              GIP Saude Inteligente
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Dashboard gerencial de cobertura e risco
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Visao executiva com metas, cadastros, triagens, risco territorial,
              mutiroes e priorizacao por dados mockados e agregados.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/convidar-alunos">
              <Button variant="outline">
                <Mail size={17} />
                Convidar alunos
              </Button>
            </Link>
            <Link href="/gerenciar-usuarios">
              <Button variant="outline">
                <Users size={17} />
                Gerenciar usuarios
              </Button>
            </Link>
            <Button onClick={handleSuggestCampaign}>
              <Sparkles size={17} />
              Sugerir proximo mutirao com IA
            </Button>
          </div>
        </div>

        <Card className="mt-6">
          <CardContent className="grid gap-3 pt-5 md:grid-cols-2 xl:grid-cols-5">
            <FilterField label="Periodo">
              <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="2026-1-semestre">1o semestre 2026</option>
                <option value="2026-q2">2o trimestre 2026</option>
                <option value="2026-maio">Maio 2026</option>
              </Select>
            </FilterField>
            <FilterField label="Unidade">
              <Select value={unit} onChange={(event) => setUnit(event.target.value)}>
                <option value="todas">Todas</option>
                {[...new Set(enrichedAreas.map((area) => area.unitName))].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Bairro">
              <Select
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              >
                <option value="todos">Todos</option>
                {data.neighborhoods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Condicao">
              <Select
                value={condition}
                onChange={(event) => setCondition(event.target.value as HealthCondition)}
              >
                {(Object.keys(conditionLabels) as HealthCondition[]).map((key) => (
                  <option key={key} value={key}>
                    {conditionLabels[key]}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Nivel de risco">
              <Select
                value={risk}
                onChange={(event) =>
                  setRisk(event.target.value as ManagerRiskLevel | "todos")
                }
              >
                <option value="todos">Todos</option>
                <option value="verde">Verde</option>
                <option value="amarelo">Amarelo</option>
                <option value="vermelho">Vermelho</option>
              </Select>
            </FilterField>
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          <KpiCard icon={<Target size={18} />} label="Meta de pacientes" value={kpis.targetPatients} />
          <KpiCard icon={<UserCheck size={18} />} label="Pacientes cadastrados" value={kpis.registeredPatients} />
          <KpiCard icon={<UserMinus size={18} />} label="Pacientes faltantes" value={kpis.missingPatients} tone="alert" />
          <KpiCard icon={<TrendingUp size={18} />} label="Cobertura atual" value={`${kpis.coverage}%`} />
          <KpiCard icon={<ClipboardCheck size={18} />} label="Triagens realizadas" value={kpis.screenings} />
          <KpiCard icon={<AlertTriangle size={18} />} label="Pacientes de alto risco" value={kpis.highRiskPatients} tone="danger" />
          <KpiCard icon={<MapPinned size={18} />} label="Mutiroes realizados" value={kpis.campaignsDone} />
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Meta x cadastrados x faltantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[1fr_220px] md:items-center">
              <div>
                <Progress value={kpis.coverage} />
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-stone-600">
                  <span>Meta: {formatNumber(kpis.targetPatients)}</span>
                  <span>Cadastrados: {formatNumber(kpis.registeredPatients)}</span>
                  <span>Faltantes: {formatNumber(kpis.missingPatients)}</span>
                </div>
              </div>
              <div className="text-right text-2xl font-semibold">{kpis.coverage}%</div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_460px]">
          <Card>
            <CardHeader>
              <CardTitle>Distribuicao de risco</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100}>
                      {riskDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartLoading />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolucao mensal de cadastros e triagens</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cadastros" stroke="#1f7a4d" strokeWidth={3} />
                    <Line type="monotone" dataKey="triagens" stroke="#1c5f9f" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartLoading />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ranking de bairros/unidades prioritarias</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityRanking} layout="vertical" margin={{ left: 26 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={118} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#c24a2c" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartLoading />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <PriorityTable areas={filteredAreas} />
          <ManagerAlerts alerts={alerts} suggestion={aiSuggestion} />
        </section>

        <div className="mt-5">
          <ManagerTerritorialMapClient areas={filteredAreas.length ? filteredAreas : enrichedAreas} />
        </div>
      </section>
    </main>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "alert" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-md ${
              tone === "danger"
                ? "bg-red-50 text-alerta"
                : tone === "alert"
                  ? "bg-yellow-50 text-[#8a5a18]"
                  : "bg-green-50 text-folha"
            }`}
          >
            {icon}
          </span>
        </div>
        <p className="mt-4 text-xs font-medium text-stone-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      </CardContent>
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

function PriorityTable({ areas }: { areas: EnrichedManagerArea[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Areas prioritarias</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bairro/unidade</TableHead>
              <TableHead>Meta</TableHead>
              <TableHead>Cadastrados</TableHead>
              <TableHead>Faltantes</TableHead>
              <TableHead>Cobertura</TableHead>
              <TableHead>Alto risco</TableHead>
              <TableHead>Score territorial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acao sugerida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((area) => (
              <TableRow key={area.id}>
                <TableCell>
                  <div className="font-semibold">{area.label}</div>
                  <div className="text-xs text-stone-500">{area.unitName}</div>
                </TableCell>
                <TableCell>{formatNumber(area.meta)}</TableCell>
                <TableCell>{formatNumber(area.registered)}</TableCell>
                <TableCell>{formatNumber(area.missing)}</TableCell>
                <TableCell>{area.coverage}%</TableCell>
                <TableCell>{formatNumber(area.highRiskPatients)}</TableCell>
                <TableCell>{area.territorialScore}</TableCell>
                <TableCell>
                  <RiskBadge level={area.territorialRiskLevel} />
                </TableCell>
                <TableCell className="min-w-[240px]">{area.suggestedAction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ManagerAlerts({
  alerts,
  suggestion
}: {
  alerts: string[];
  suggestion: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas gerenciais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert}
              className="rounded-md border border-yellow-200 bg-[#fff9e8] p-3 text-sm leading-6 text-stone-700"
            >
              {alert}
            </div>
          ))}
        </div>
        {suggestion ? (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-stone-700">
            <div className="mb-2 flex items-center gap-2 font-semibold text-folha">
              <Sparkles size={17} />
              Sugestao IA
            </div>
            {suggestion}
          </div>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-stone-500">
          Dados demonstrativos, agregados por territorio. Nenhum paciente real ou
          endereco individual e exibido.
        </p>
      </CardContent>
    </Card>
  );
}

function RiskBadge({ level }: { level: ManagerRiskLevel }) {
  const labels = {
    verde: "Verde",
    amarelo: "Amarelo",
    vermelho: "Vermelho"
  };

  return (
    <Badge
      className="border-transparent text-white"
      style={{ backgroundColor: riskColors[level] }}
    >
      {labels[level]}
    </Badge>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}
