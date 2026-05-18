"use client";

import { useMemo, useState } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip
} from "react-leaflet";
import L from "leaflet";
import {
  Activity,
  Brain,
  Building2,
  CalendarCheck,
  ClipboardList,
  Cross,
  HeartPulse,
  Landmark,
  MapPin,
  RotateCcw,
  School,
  Sparkles,
  Stethoscope,
  ThermometerSun,
  Users
} from "lucide-react";
import {
  campaignLocationCandidates,
  conditionLabels,
  luzianiaCenter,
  healthUnits as fallbackHealthUnits,
  neighborhoodRisks as fallbackNeighborhoodRisks
} from "@/data/territorialData";
import {
  calculateTerritorialRisk,
  createOperationalPlan,
  predictCampaignLocations,
  rankNeighborhoods,
  suggestNextCampaign
} from "@/lib/territorialRiskService";
import type {
  AiCampaignSuggestion,
  CampaignLocationCandidate,
  CampaignLocationPrediction,
  HealthCondition,
  HealthUnit,
  NeighborhoodRisk
} from "@/types/territorial";

type MapMode = "risk" | "planning";

type Selection =
  | { type: "neighborhood"; item: NeighborhoodRisk }
  | { type: "unit"; item: HealthUnit }
  | { type: "location"; item: CampaignLocationCandidate };

const conditionIcons: Record<HealthCondition, React.ReactNode> = {
  hipertensao: <HeartPulse size={16} />,
  diabetes: <ThermometerSun size={16} />,
  obesidade: <Activity size={16} />,
  respiratoria: <Stethoscope size={16} />,
  saudeMental: <Brain size={16} />,
  retornoPrecoce: <RotateCcw size={16} />
};

const unitColors: Record<HealthUnit["type"], string> = {
  UBS: "#1f7a4d",
  CAIS: "#1c5f9f",
  MUTIRAO: "#c24a2c"
};

const locationColors: Record<CampaignLocationCandidate["type"], string> = {
  UBS: "#1f7a4d",
  ESCOLA: "#3564a6",
  CRAS: "#8a5a18",
  GINASIO: "#7a3f8f",
  PRACA: "#2d8a78",
  PARCEIRO: "#8d3b42"
};

const riskColors = {
  baixo: "#9ccf7a",
  medio: "#f3d37a",
  alto: "#e28a45",
  critico: "#c24a2c"
};

const markerIcon = (unit: HealthUnit) =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${unitColors[unit.type]};color:white;border:3px solid white;box-shadow:0 8px 18px rgba(23,33,27,.28);font-size:12px;font-weight:800">${unit.type === "MUTIRAO" ? "M" : unit.type}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

const locationIcon = (location: CampaignLocationCandidate, score?: number) =>
  L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:8px;display:grid;place-items:center;background:${locationColors[location.type]};color:white;border:3px solid white;box-shadow:0 10px 22px rgba(23,33,27,.32);font-size:11px;font-weight:900">${score ?? location.type.slice(0, 2)}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

export default function LuzianiaHealthMap() {
  return <LuzianiaHealthMapView />;
}

export function LuzianiaHealthMapView({
  neighborhoods = fallbackNeighborhoodRisks,
  units = fallbackHealthUnits
}: {
  neighborhoods?: NeighborhoodRisk[];
  units?: HealthUnit[];
}) {
  const [mode, setMode] = useState<MapMode>("risk");
  const [condition, setCondition] = useState<HealthCondition>("hipertensao");
  const [selection, setSelection] = useState<Selection>({
    type: "neighborhood",
    item: neighborhoods[1] ?? neighborhoods[0]
  });
  const [suggestion, setSuggestion] = useState<AiCampaignSuggestion | null>(null);
  const [operationalPlanId, setOperationalPlanId] = useState<string | null>(null);

  const ranking = useMemo(
    () => rankNeighborhoods(neighborhoods, condition),
    [condition, neighborhoods]
  );
  const predictions = useMemo(
    () =>
      predictCampaignLocations(
        neighborhoods,
        campaignLocationCandidates,
        condition
      ),
    [condition, neighborhoods]
  );

  const selectedNeighborhood =
    selection.type === "neighborhood"
      ? selection.item
      : neighborhoods.find((item) => item.id === selection.item.neighborhoodId);

  const selectedRisk = selectedNeighborhood
    ? calculateTerritorialRisk(selectedNeighborhood, condition)
    : null;

  const selectedPrediction =
    selection.type === "location"
      ? predictions.find((item) => item.location.id === selection.item.id)
      : predictions[0];

  const operationalPlan = selectedPrediction
    ? createOperationalPlan(selectedPrediction)
    : null;

  function handleSuggestCampaign() {
    const nextSuggestion = suggestNextCampaign(
      neighborhoods,
      units,
      condition
    );
    setSuggestion(nextSuggestion);
    setMode("risk");
    const neighborhood = neighborhoods.find(
      (item) => item.id === nextSuggestion.targetNeighborhoodId
    );
    if (neighborhood) {
      setSelection({ type: "neighborhood", item: neighborhood });
    }
  }

  function handleGeneratePlan(prediction: CampaignLocationPrediction) {
    setOperationalPlanId(prediction.location.id);
    setSelection({ type: "location", item: prediction.location });
    setMode("planning");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f7f7f2] text-ink lg:grid-cols-[380px_minmax(0,1fr)_400px]">
      <aside className="border-b border-stone-200 bg-white p-5 lg:border-b-0 lg:border-r">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
            Luziania-GO | IBGE 5212501
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight">
            Inteligencia territorial e planejamento de mutiroes
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Dados simulados e agregados por bairro para demonstrar busca ativa,
            priorizacao preventiva e predicao operacional sem expor pacientes.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => setMode("risk")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              mode === "risk" ? "bg-white shadow-sm" : "text-stone-600"
            }`}
          >
            Risco territorial
          </button>
          <button
            type="button"
            onClick={() => setMode("planning")}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              mode === "planning" ? "bg-white shadow-sm" : "text-stone-600"
            }`}
          >
            Planejamento IA
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold">Filtro por condicao</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(Object.keys(conditionLabels) as HealthCondition[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCondition(key)}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                  condition === key
                    ? "border-folha bg-folha text-white shadow-sm"
                    : "border-stone-200 bg-white text-stone-700 hover:border-folha"
                }`}
                aria-pressed={condition === key}
              >
                {conditionIcons[key]}
                <span>{conditionLabels[key]}</span>
              </button>
            ))}
          </div>
        </div>

        {mode === "risk" ? (
          <RiskRanking
            ranking={ranking}
            onSelect={(neighborhood) =>
              setSelection({ type: "neighborhood", item: neighborhood })
            }
          />
        ) : (
          <PlanningRanking
            predictions={predictions}
            onSelect={(prediction) =>
              setSelection({ type: "location", item: prediction.location })
            }
            onPlan={handleGeneratePlan}
          />
        )}

        <button
          type="button"
          onClick={handleSuggestCampaign}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#28352d]"
        >
          <Sparkles size={17} />
          Sugerir proximo mutirao com IA
        </button>
      </aside>

      <main className="relative min-h-[680px]">
        <MapContainer
          center={[luzianiaCenter[0], luzianiaCenter[1]]}
          zoom={12}
          minZoom={11}
          maxZoom={15}
          className="h-full min-h-[680px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {ranking.map(({ neighborhood, risk }) => (
            <Polygon
              key={neighborhood.id}
              positions={neighborhood.polygon}
              pathOptions={{
                color: riskColors[risk.level],
                fillColor: riskColors[risk.level],
                fillOpacity: mode === "planning" ? 0.24 : 0.44,
                opacity: 0.95,
                weight:
                  selection.type === "neighborhood" &&
                  selection.item.id === neighborhood.id
                    ? 4
                    : 2
              }}
              eventHandlers={{
                click: () => setSelection({ type: "neighborhood", item: neighborhood })
              }}
            >
              <Tooltip sticky>
                <strong>{neighborhood.name}</strong>
                <br />
                Risco {risk.level} | Score {risk.score}
              </Tooltip>
              <Popup className="territory-popup">
                <strong>{neighborhood.name}</strong>
                <br />
                {conditionLabels[condition]}:{" "}
                {neighborhood.conditions[condition].toLocaleString("pt-BR")} registros
                agregados
              </Popup>
            </Polygon>
          ))}

          {ranking.map(({ neighborhood, risk }) => (
            <CircleMarker
              key={`${neighborhood.id}-heat`}
              center={neighborhood.centroid}
              radius={Math.max(14, risk.score / 2.4)}
              pathOptions={{
                color: riskColors[risk.level],
                fillColor: riskColors[risk.level],
                fillOpacity: mode === "planning" ? 0.14 : 0.22,
                opacity: 0.35,
                weight: 1
              }}
            />
          ))}

          {units.map((unit) => (
            <Marker
              key={unit.id}
              position={unit.position}
              icon={markerIcon(unit)}
              eventHandlers={{
                click: () => setSelection({ type: "unit", item: unit })
              }}
            >
              <Tooltip>
                {unit.name} | {unit.type}
              </Tooltip>
              <Popup className="territory-popup">
                <strong>{unit.name}</strong>
                <br />
                {unit.type} com {unit.activeTeams} equipes ativas
              </Popup>
            </Marker>
          ))}

          {mode === "planning"
            ? predictions.map((prediction) => (
                <Circle
                  key={`${prediction.location.id}-coverage`}
                  center={prediction.location.position}
                  radius={prediction.coverageRadiusMeters}
                  pathOptions={{
                    color: locationColors[prediction.location.type],
                    fillColor: locationColors[prediction.location.type],
                    fillOpacity:
                      selection.type === "location" &&
                      selection.item.id === prediction.location.id
                        ? 0.16
                        : 0.08,
                    opacity: 0.42,
                    weight:
                      selection.type === "location" &&
                      selection.item.id === prediction.location.id
                        ? 3
                        : 1
                  }}
                />
              ))
            : null}

          {mode === "planning"
            ? predictions.map((prediction) => (
                <Marker
                  key={prediction.location.id}
                  position={prediction.location.position}
                  icon={locationIcon(prediction.location, prediction.score)}
                  eventHandlers={{
                    click: () =>
                      setSelection({
                        type: "location",
                        item: prediction.location
                      })
                  }}
                >
                  <Tooltip>
                    {prediction.location.name} | Score {prediction.score}
                  </Tooltip>
                  <Popup className="territory-popup">
                    <strong>{prediction.location.name}</strong>
                    <br />
                    Alcance predito:{" "}
                    {prediction.expectedReach.toLocaleString("pt-BR")} pessoas
                  </Popup>
                </Marker>
              ))
            : null}
        </MapContainer>

        <MapLegend mode={mode} />
      </main>

      <aside className="border-t border-stone-200 bg-white p-5 lg:border-l lg:border-t-0">
        {mode === "planning" && selectedPrediction ? (
          <PlanningPanel
            prediction={selectedPrediction}
            plan={operationalPlanId ? operationalPlan : null}
            onGeneratePlan={() => handleGeneratePlan(selectedPrediction)}
          />
        ) : (
          <RiskPanel
            selection={selection}
            selectedNeighborhood={selectedNeighborhood}
            selectedRisk={selectedRisk}
            condition={condition}
            suggestion={suggestion}
          />
        )}
      </aside>
    </div>
  );
}

function RiskRanking({
  ranking,
  onSelect
}: {
  ranking: ReturnType<typeof rankNeighborhoods>;
  onSelect: (neighborhood: NeighborhoodRisk) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Bairros prioritarios</h2>
        <span className="text-xs text-stone-500">score IA local</span>
      </div>
      <div className="mt-3 space-y-2">
        {ranking.map(({ neighborhood, risk }, index) => (
          <button
            key={neighborhood.id}
            type="button"
            onClick={() => onSelect(neighborhood)}
            className="flex w-full items-center gap-3 rounded-md border border-stone-200 bg-[#fbfbf7] p-3 text-left hover:border-folha"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-stone-900 text-sm font-bold text-white">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {neighborhood.name}
              </span>
              <span className="mt-1 block h-2 rounded-full bg-stone-200">
                <span
                  className="block h-2 rounded-full"
                  style={{
                    width: `${risk.score}%`,
                    backgroundColor: riskColors[risk.level]
                  }}
                />
              </span>
            </span>
            <span className="text-lg font-semibold">{risk.score}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlanningRanking({
  predictions,
  onSelect,
  onPlan
}: {
  predictions: CampaignLocationPrediction[];
  onSelect: (prediction: CampaignLocationPrediction) => void;
  onPlan: (prediction: CampaignLocationPrediction) => void;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Locais candidatos</h2>
        <span className="text-xs text-stone-500">impacto predito</span>
      </div>
      <div className="mt-3 space-y-2">
        {predictions.slice(0, 5).map((prediction, index) => (
          <div
            key={prediction.location.id}
            className="rounded-md border border-stone-200 bg-[#fbfbf7] p-3"
          >
            <button
              type="button"
              onClick={() => onSelect(prediction)}
              className="flex w-full items-center gap-3 text-left"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-sm font-bold text-white"
                style={{ backgroundColor: locationColors[prediction.location.type] }}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {prediction.location.name}
                </span>
                <span className="block text-xs text-stone-500">
                  {prediction.location.type} | {prediction.targetNeighborhood.name}
                </span>
              </span>
              <span className="text-lg font-semibold">{prediction.score}</span>
            </button>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-stone-600">
              <span>{prediction.expectedReach.toLocaleString("pt-BR")} pessoas</span>
              <button
                type="button"
                onClick={() => onPlan(prediction)}
                className="rounded-md bg-folha px-3 py-1.5 font-semibold text-white"
              >
                Gerar plano
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskPanel({
  selection,
  selectedNeighborhood,
  selectedRisk,
  condition,
  suggestion
}: {
  selection: Selection;
  selectedNeighborhood?: NeighborhoodRisk;
  selectedRisk: ReturnType<typeof calculateTerritorialRisk> | null;
  condition: HealthCondition;
  suggestion: AiCampaignSuggestion | null;
}) {
  if (!selectedNeighborhood || !selectedRisk) return null;

  return (
    <>
      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Painel de indicadores
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {selection.type === "unit" ? selection.item.name : selectedNeighborhood.name}
            </h2>
          </div>
          <span
            className="rounded-md px-3 py-2 text-sm font-bold text-white"
            style={{ backgroundColor: riskColors[selectedRisk.level] }}
          >
            {selectedRisk.score}
          </span>
        </div>

        {selection.type === "unit" ? (
          <div className="mt-5 rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
            <div className="flex items-center gap-2 font-semibold">
              {selection.item.type === "MUTIRAO" ? <MapPin size={18} /> : <Cross size={18} />}
              {selection.item.type}
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {selection.item.notes}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Equipes" value={selection.item.activeTeams} />
              <Metric label="Capacidade/turno" value={selection.item.capacityPerShift} />
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric
            label="Populacao estimada"
            value={selectedNeighborhood.population.toLocaleString("pt-BR")}
          />
          <Metric
            label="Pacientes agregados"
            value={selectedNeighborhood.aggregatedPatients.toLocaleString("pt-BR")}
          />
          <Metric
            label={conditionLabels[condition]}
            value={selectedNeighborhood.conditions[condition].toLocaleString("pt-BR")}
          />
          <Metric label="Nivel de risco" value={selectedRisk.level} />
        </div>

        <div className="mt-5 rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
          <h3 className="text-sm font-semibold">Fatores do score</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {selectedRisk.drivers.map((driver) => (
              <li key={driver} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-folha" />
                {driver}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-md bg-white p-3 text-sm font-medium text-stone-800">
            {selectedRisk.suggestedAction}
          </p>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-semibold">Distribuicao agregada</h3>
          <div className="mt-3 space-y-3">
            {(Object.keys(conditionLabels) as HealthCondition[]).map((key) => {
              const value = selectedNeighborhood.conditions[key];
              const max = Math.max(...Object.values(selectedNeighborhood.conditions));
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs text-stone-600">
                    <span>{conditionLabels[key]}</span>
                    <span>{value.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-stone-200">
                    <div
                      className="h-2 rounded-full bg-folha"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {suggestion ? (
        <section className="mt-6 rounded-md border border-trigo bg-[#fff9e8] p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={17} />
            Sugestao local simulada
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Priorizar <strong>{suggestion.targetNeighborhoodName}</strong> para{" "}
            <strong>{conditionLabels[suggestion.condition]}</strong>, com alcance
            esperado de {suggestion.expectedReach.toLocaleString("pt-BR")} pessoas em
            registros agregados.
          </p>
          <p className="mt-3 text-xs leading-5 text-stone-600">
            {suggestion.rationale}
          </p>
        </section>
      ) : null}

      <PrivacyNote />
    </>
  );
}

function PlanningPanel({
  prediction,
  plan,
  onGeneratePlan
}: {
  prediction: CampaignLocationPrediction;
  plan: ReturnType<typeof createOperationalPlan> | null;
  onGeneratePlan: () => void;
}) {
  return (
    <>
      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              Predicao de local
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {prediction.location.name}
            </h2>
          </div>
          <span className="rounded-md bg-ink px-3 py-2 text-sm font-bold text-white">
            {prediction.score}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric
            label="Alcance predito"
            value={prediction.expectedReach.toLocaleString("pt-BR")}
          />
          <Metric
            label="Raio de cobertura"
            value={`${prediction.coverageRadiusMeters} m`}
          />
          <Metric label="Equipes sugeridas" value={prediction.teamRecommendation} />
          <Metric label="Bairro alvo" value={prediction.targetNeighborhood.name} />
        </div>

        <div className="mt-5 rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
          <div className="flex items-center gap-2 font-semibold">
            {locationTypeIcon(prediction.location.type)}
            {prediction.location.type}
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            {prediction.location.notes}
          </p>
          <p className="mt-3 rounded-md bg-white p-3 text-sm text-stone-700">
            {prediction.rationale}
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <InsightList title="Pontos fortes" items={prediction.strengths} />
          <InsightList title="Riscos operacionais" items={prediction.risks} />
        </div>

        <button
          type="button"
          onClick={onGeneratePlan}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-folha px-4 py-3 text-sm font-semibold text-white"
        >
          <ClipboardList size={17} />
          Gerar plano operacional do mutirao
        </button>
      </section>

      {plan ? (
        <section className="mt-6 rounded-md border border-trigo bg-[#fff9e8] p-4">
          <div className="flex items-center gap-2 font-semibold">
            <CalendarCheck size={17} />
            {plan.title}
          </div>
          <p className="mt-3 text-sm text-stone-700">
            Local: <strong>{plan.locationName}</strong> | Alcance estimado:{" "}
            <strong>{plan.expectedReach.toLocaleString("pt-BR")}</strong>
          </p>
          <PlanBlock title="Turnos" items={plan.shifts} />
          <PlanBlock title="Equipe" items={plan.teamMix} />
          <PlanBlock title="Acoes" items={plan.actions} />
          <PlanBlock title="Governanca de dados" items={plan.dataGovernance} />
        </section>
      ) : null}

      <PrivacyNote />
    </>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-stone-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-folha" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
        {title}
      </h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MapLegend({ mode }: { mode: MapMode }) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 grid gap-2 rounded-md bg-white/95 p-3 text-xs shadow-lg ring-1 ring-stone-200">
      {mode === "risk"
        ? Object.entries(riskColors).map(([level, color]) => (
            <span key={level} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {level}
            </span>
          ))
        : Object.entries(locationColors).map(([type, color]) => (
            <span key={type} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {type}
            </span>
          ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}

function PrivacyNote() {
  return (
    <p className="mt-6 text-xs leading-5 text-stone-500">
      Privacidade: esta demonstracao usa dados mockados e agregados por bairro.
      Qualquer integracao real com SUS deve passar por autorizacao, minimizacao,
      controle de acesso, auditoria e desenho LGPD.
    </p>
  );
}

function locationTypeIcon(type: CampaignLocationCandidate["type"]) {
  const icons = {
    UBS: <Cross size={18} />,
    ESCOLA: <School size={18} />,
    CRAS: <Users size={18} />,
    GINASIO: <Building2 size={18} />,
    PRACA: <Landmark size={18} />,
    PARCEIRO: <MapPin size={18} />
  };

  return icons[type];
}
