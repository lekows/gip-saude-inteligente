"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
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
  CalendarCheck,
  Crosshair,
  Home,
  MapPin,
  Route,
  ShieldAlert,
  Sparkles,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { conditionLabels } from "@/data/territorialData";
import type { CampaignPlan, CampaignRouteSegment, SimulatedHouseholdCluster } from "@/types/campaign";
import type { CampaignLocationPrediction, HealthCondition } from "@/types/territorial";
import type { LatLngTuple, NeighborhoodRisk, TerritorialScore } from "@/types/territorial";

const CampaignPlannerMap = dynamic(
  () => import("./CampaignPlannerMap").then((mod) => mod.CampaignPlannerMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[620px] place-items-center rounded-lg border border-stone-200 bg-white">
        Carregando mapa georreferenciado...
      </div>
    )
  }
);

type CampaignStrategy = "buscaAtiva" | "triagemClinica" | "vacinacao" | "educacao" | "retorno";

const strategyLabels: Record<CampaignStrategy, string> = {
  buscaAtiva: "Busca ativa",
  triagemClinica: "Triagem clinica",
  vacinacao: "Vacinacao",
  educacao: "Educacao em saude",
  retorno: "Retorno precoce"
};

export function CampaignPlannerClient({
  plan,
  predictions,
  neighborhoods,
  territorialRisk,
  microAreaTotals,
  chartData
}: {
  plan: CampaignPlan;
  predictions: CampaignLocationPrediction[];
  neighborhoods: NeighborhoodRisk[];
  territorialRisk: TerritorialScore | null;
  microAreaTotals: { households: number; people: number; highRisk: number };
  chartData: {
    microAreas: Array<{ name: string; domicilios: number; altoRisco: number }>;
    timeline: Array<{ etapa: string; intensidade: number }>;
    conditionMix: Array<{ name: string; value: number; color: string }>;
  };
}) {
  const [mounted, setMounted] = useState(false);
  const [condition, setCondition] = useState<HealthCondition>(plan.condition);
  const [neighborhoodId, setNeighborhoodId] = useState(plan.targetNeighborhoodId);
  const [locationId, setLocationId] = useState(predictions[0]?.location.id ?? "");
  const [teams, setTeams] = useState(plan.requiredTeams);
  const [radius, setRadius] = useState(plan.coverageRadiusMeters);
  const [duration, setDuration] = useState(plan.estimatedDurationHours);
  const [strategy, setStrategy] = useState<CampaignStrategy>("buscaAtiva");
  const [operationalized, setOperationalized] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedNeighborhood =
    neighborhoods.find((item) => item.id === neighborhoodId) ?? neighborhoods[0];
  const compatiblePredictions = useMemo(
    () =>
      predictions.filter(
        (item) =>
          item.location.neighborhoodId === neighborhoodId ||
          item.location.coveredNeighborhoodIds.includes(neighborhoodId)
      ),
    [neighborhoodId, predictions]
  );
  const availablePredictions = compatiblePredictions.length
    ? compatiblePredictions
    : predictions;
  const selectedLocation =
    availablePredictions.find((item) => item.location.id === locationId)?.location ??
    availablePredictions[0]?.location;

  useEffect(() => {
    if (!availablePredictions.some((item) => item.location.id === locationId)) {
      setLocationId(availablePredictions[0]?.location.id ?? "");
    }
  }, [availablePredictions, locationId]);

  const scenario = useMemo(() => {
    const baseRisk = selectedNeighborhood
      ? Math.round(selectedNeighborhood.vulnerabilityIndex * 100)
      : 60;
    const conditionLoad = selectedNeighborhood?.conditions[condition] ?? 0;
    const strategyFactor: Record<CampaignStrategy, number> = {
      buscaAtiva: 1.12,
      triagemClinica: 1.04,
      vacinacao: 0.92,
      educacao: 0.82,
      retorno: 1.16
    };
    const capacity = Math.round(teams * duration * 9 * strategyFactor[strategy]);
    const radiusFactor = Math.min(1.35, radius / 1500);
    const expectedReach = Math.round(Math.min(conditionLoad * 0.42, capacity * radiusFactor));
    const expectedScreenings = Math.round(expectedReach * (strategy === "educacao" ? 0.46 : 0.72));
    const expectedHighRiskFound = Math.round(
      expectedScreenings * (0.18 + baseRisk / 420)
    );
    const score = Math.min(
      100,
      Math.round(baseRisk * 0.42 + teams * 4.2 + radius / 70 + duration * 2.1)
    );
    const estimatedCost = Math.round(teams * duration * 420 + radius * 0.18);

    return {
      score,
      expectedReach,
      expectedScreenings,
      expectedHighRiskFound,
      estimatedCost
    };
  }, [condition, duration, radius, selectedNeighborhood, strategy, teams]);

  const scenarioPlan = useMemo(
    () =>
      buildScenarioPlan({
        basePlan: plan,
        condition,
        neighborhood: selectedNeighborhood,
        location: selectedLocation,
        teams,
        radius,
        duration,
        scenario
      }),
    [condition, duration, plan, radius, scenario, selectedLocation, selectedNeighborhood, teams]
  );

  const scenarioRanking = useMemo(
    () =>
      availablePredictions
        .slice(0, 5)
        .map((prediction) => {
          const localAccessibility = prediction.location.accessibilityScore * 20;
          const capacityScore = Math.min(22, prediction.location.capacityPerShift / 10);
          const score = Math.round(
            scenario.score * 0.55 + localAccessibility + capacityScore
          );
          return {
            name: prediction.location.name,
            score: Math.min(100, score),
            reach: Math.round(scenario.expectedReach * (prediction.location.capacityPerShift / 220))
          };
        })
        .sort((a, b) => b.score - a.score),
    [availablePredictions, scenario.expectedReach, scenario.score]
  );

  return (
    <main className="bg-[#f7f7f2] p-5 text-ink lg:p-6">
      <section className="mx-auto max-w-[1600px]">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Modulo IA de acao territorial
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight lg:text-4xl">
              Simulador de cenarios para mutirao
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Ajuste condicao, bairro, local, equipes, raio e estrategia. O mapa recalcula
              cobertura, microareas sintéticas, rotas e impacto esperado em tempo real.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge className="border-red-200 bg-red-50 text-alerta">
                Score do cenario {scenario.score}
              </Badge>
              <Badge className="border-green-200 bg-green-50 text-folha">
                {scenario.expectedReach} pessoas alcancadas
              </Badge>
              <Badge className="border-blue-200 bg-blue-50 text-blue-800">
                Casas sinteticas, sem endereco real
              </Badge>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Decisao recomendada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-ink p-4 text-white">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles size={18} />
                  {operationalized ? "Cenario transformado em plano" : "Melhor cenario atual"}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/80">
                  {scenarioPlan.commandPointName} em {scenarioPlan.targetNeighborhoodName},
                  com foco em {conditionLabels[condition]} e estrategia {strategyLabels[strategy]}.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric icon={<Users size={17} />} label="Equipes" value={teams} />
                <Metric icon={<CalendarCheck size={17} />} label="Horas" value={`${duration}h`} />
                <Metric icon={<Home size={17} />} label="Domicilios" value={microAreaTotals.households} />
                <Metric icon={<ShieldAlert size={17} />} label="Alto risco" value={scenario.expectedHighRiskFound} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Simular cenario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
            <Control label="Condicao">
              <Select value={condition} onChange={(event) => setCondition(event.target.value as HealthCondition)}>
                {(Object.keys(conditionLabels) as HealthCondition[]).map((key) => (
                  <option key={key} value={key}>{conditionLabels[key]}</option>
                ))}
              </Select>
            </Control>
            <Control label="Bairro alvo">
              <Select value={neighborhoodId} onChange={(event) => setNeighborhoodId(event.target.value)}>
                {neighborhoods.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </Control>
            <Control label="Local">
              <Select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                {availablePredictions.map((item) => (
                  <option key={item.location.id} value={item.location.id}>{item.location.name}</option>
                ))}
              </Select>
            </Control>
            <Control label="Equipes">
              <Select value={teams} onChange={(event) => setTeams(Number(event.target.value))}>
                {[3, 4, 5, 6, 7, 8, 9].map((value) => <option key={value} value={value}>{value}</option>)}
              </Select>
            </Control>
            <Control label="Raio">
              <Select value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
                {[900, 1200, 1500, 1800, 2200].map((value) => <option key={value} value={value}>{value} m</option>)}
              </Select>
            </Control>
            <Control label="Duracao">
              <Select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                {[4, 6, 8, 10].map((value) => <option key={value} value={value}>{value}h</option>)}
              </Select>
            </Control>
            <Control label="Estrategia">
              <Select value={strategy} onChange={(event) => setStrategy(event.target.value as CampaignStrategy)}>
                {(Object.keys(strategyLabels) as CampaignStrategy[]).map((key) => (
                  <option key={key} value={key}>{strategyLabels[key]}</option>
                ))}
              </Select>
            </Control>
          </CardContent>
        </Card>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <CampaignPlannerMap plan={scenarioPlan} neighborhoods={neighborhoods} />

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Comparar melhores cenarios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenarioRanking.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {item.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.reach} alcance esperado
                        </p>
                      </div>
                      <span className="text-2xl font-semibold">{item.score}</span>
                    </div>
                  </div>
                ))}
                <Button className="w-full" onClick={() => setOperationalized(true)}>
                  <Sparkles size={16} />
                  Transformar cenario em plano operacional
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plano de campo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenarioPlan.actionSteps.map((step) => (
                  <div key={`${step.time}-${step.title}`} className="rounded-md border border-stone-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{step.time} | {step.title}</p>
                      <Badge className="border-stone-200 bg-stone-100 text-stone-700">
                        {step.owner}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{step.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <ChartCard title="Domicilios e alto risco por microarea">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.microAreas}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="domicilios" fill="#1f7a4d" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="altoRisco" fill="#c24a2c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartLoading />
            )}
          </ChartCard>

          <ChartCard title="Intensidade operacional por horario">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="etapa" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="intensidade" stroke="#1c5f9f" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartLoading />
            )}
          </ChartCard>

          <ChartCard title="Mix de condicoes priorizadas">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.conditionMix} dataKey="value" nameKey="name" outerRadius={92}>
                    {chartData.conditionMix.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartLoading />
            )}
          </ChartCard>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader>
              <CardTitle>Resultado do cenario</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <Metric icon={<Crosshair size={17} />} label="Score final" value={scenario.score} />
              <Metric icon={<Users size={17} />} label="Alcance" value={scenario.expectedReach} />
              <Metric icon={<ShieldAlert size={17} />} label="Alto risco" value={scenario.expectedHighRiskFound} />
              <Metric icon={<MapPin size={17} />} label="Custo estimado" value={`R$ ${scenario.estimatedCost.toLocaleString("pt-BR")}`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Privacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-stone-600">
                Os pontos de casas representam agrupamentos sintéticos de domicílios
                e servem apenas para simular cobertura territorial. Nenhum endereço
                real ou paciente identificável é exibido.
              </p>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Rotas e cobertura de campo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {scenarioPlan.routes.map((route) => (
              <div key={route.id} className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <Route size={18} className="text-folha" />
                  {route.name}
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  {route.agentTeam} | {route.householdsCovered} domicilios sintéticos cobertos
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ChartLoading() {
  return (
    <div className="grid h-full place-items-center rounded-md bg-stone-50 text-sm text-stone-500">
      Carregando grafico...
    </div>
  );
}

function Metric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3">
      <span className="text-folha">{icon}</span>
      <p className="mt-2 text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
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

function buildScenarioPlan({
  basePlan,
  condition,
  neighborhood,
  location,
  teams,
  radius,
  duration,
  scenario
}: {
  basePlan: CampaignPlan;
  condition: HealthCondition;
  neighborhood?: NeighborhoodRisk;
  location?: CampaignLocationPrediction["location"];
  teams: number;
  radius: number;
  duration: number;
  scenario: {
    expectedReach: number;
    expectedScreenings: number;
    expectedHighRiskFound: number;
  };
}): CampaignPlan {
  const polygon = neighborhood?.polygon ?? [];
  const centroid = polygon.length ? calculateCentroid(polygon) : basePlan.commandPoint;
  const rawCommandPoint = location?.position ?? centroid;
  const commandPoint =
    polygon.length && !isPointInsidePolygon(rawCommandPoint, polygon)
      ? centroid
      : rawCommandPoint;
  const commandPointName =
    polygon.length && location && !isPointInsidePolygon(location.position, polygon)
      ? `${location.name} - apoio ajustado ao bairro`
      : location?.name ?? basePlan.commandPointName;
  const generatedMicroAreas = buildMicroAreasInsideNeighborhood({
    basePlan,
    neighborhood,
    centroid,
    teams
  });
  const generatedRoutes = buildRoutesInsideNeighborhood({
    commandPoint,
    microAreas: generatedMicroAreas,
    radius,
    basePlan
  });

  return {
    ...basePlan,
    title: `Cenario ${neighborhood?.name ?? basePlan.targetNeighborhoodName}`,
    condition,
    targetNeighborhoodId: neighborhood?.id ?? basePlan.targetNeighborhoodId,
    targetNeighborhoodName: neighborhood?.name ?? basePlan.targetNeighborhoodName,
    commandPoint,
    commandPointName,
    coverageRadiusMeters: radius,
    expectedReach: scenario.expectedReach,
    expectedScreenings: scenario.expectedScreenings,
    expectedHighRiskFound: scenario.expectedHighRiskFound,
    requiredTeams: teams,
    estimatedDurationHours: duration,
    microAreas: generatedMicroAreas,
    routes: generatedRoutes,
    actionSteps: basePlan.actionSteps.map((step) =>
      step.title.includes("Triagem")
        ? {
            ...step,
            title: `Triagem ${conditionLabels[condition]}`,
            description: `Atendimento orientado ao cenario simulado para ${conditionLabels[condition]}, com ${teams} equipes em ${duration}h.`
          }
        : step
    )
  };
}

function buildMicroAreasInsideNeighborhood({
  basePlan,
  neighborhood,
  centroid,
  teams
}: {
  basePlan: CampaignPlan;
  neighborhood?: NeighborhoodRisk;
  centroid: LatLngTuple;
  teams: number;
}): SimulatedHouseholdCluster[] {
  const polygon = neighborhood?.polygon ?? [];
  const vertices = polygon.length > 1 ? polygon.slice(0, -1) : [];
  const fallbackOffsets: LatLngTuple[] = [
    [0.009, -0.004],
    [0.004, 0.009],
    [-0.006, 0.006],
    [-0.008, -0.007],
    [0.001, -0.011]
  ];

  return basePlan.microAreas.map((area, index): SimulatedHouseholdCluster => {
    const vertex = vertices[index % Math.max(vertices.length, 1)];
    const pull = 0.34 + (index % 3) * 0.12;
    const candidate = vertex
      ? interpolatePoint(centroid, vertex, pull)
      : ([centroid[0] + fallbackOffsets[index % fallbackOffsets.length][0], centroid[1] + fallbackOffsets[index % fallbackOffsets.length][1]] as LatLngTuple);
    const position =
      polygon.length && !isPointInsidePolygon(candidate, polygon)
        ? interpolatePoint(centroid, candidate, 0.5)
        : candidate;

    return {
      ...area,
      id: `${area.id}-${neighborhood?.id ?? "cenario"}`,
      label: `${neighborhood?.name ?? "Area"} ${index + 1}`,
      neighborhoodId: neighborhood?.id ?? area.neighborhoodId,
      position,
      highRiskEstimate: Math.max(
        8,
        Math.round(area.highRiskEstimate * (teams / basePlan.requiredTeams))
      )
    };
  });
}

function buildRoutesInsideNeighborhood({
  commandPoint,
  microAreas,
  radius,
  basePlan
}: {
  commandPoint: LatLngTuple;
  microAreas: SimulatedHouseholdCluster[];
  radius: number;
  basePlan: CampaignPlan;
}): CampaignRouteSegment[] {
  const firstRouteAreas = microAreas.filter((_, index) => index % 2 === 0);
  const secondRouteAreas = microAreas.filter((_, index) => index % 2 === 1);
  const radiusMultiplier = radius / basePlan.coverageRadiusMeters;

  return [
    {
      id: "route-scenario-1",
      name: "Rota ACS 1 - microareas pares",
      points: [commandPoint, ...firstRouteAreas.map((area) => area.position)],
      householdsCovered: Math.round(
        firstRouteAreas.reduce((total, area) => total + area.households, 0) *
          radiusMultiplier
      ),
      agentTeam: "ACS + Enfermagem"
    },
    {
      id: "route-scenario-2",
      name: "Rota ACS 2 - microareas impares",
      points: [commandPoint, ...secondRouteAreas.map((area) => area.position)],
      householdsCovered: Math.round(
        secondRouteAreas.reduce((total, area) => total + area.households, 0) *
          radiusMultiplier
      ),
      agentTeam: "ACS + Educacao em saude"
    }
  ].filter((route) => route.points.length > 1);
}

function calculateCentroid(polygon: LatLngTuple[]): LatLngTuple {
  const total = polygon.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 }
  );
  return [total.lat / polygon.length, total.lng / polygon.length];
}

function interpolatePoint(from: LatLngTuple, to: LatLngTuple, amount: number): LatLngTuple {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount
  ];
}

function isPointInsidePolygon(point: LatLngTuple, polygon: LatLngTuple[]) {
  const [lat, lng] = point;
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [latI, lngI] = polygon[index];
    const [latJ, lngJ] = polygon[previous];
    const intersects =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI || Number.EPSILON) + latI;
    if (intersects) inside = !inside;
  }

  return inside;
}
