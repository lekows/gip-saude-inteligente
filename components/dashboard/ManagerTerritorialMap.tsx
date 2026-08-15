"use client";

import { useEffect, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { luzianiaCenter } from "@/data/territorialData";
import type {
  EnrichedManagerArea,
  ManagerOfficialEvidence,
  ManagerRiskLevel
} from "@/types/managerDashboard";
import type { HealthUnit } from "@/types/territorial";
import type {
  CensusSectorFeature,
  CensusSectorFeatureCollection,
  CensusSectorProperties
} from "@/types/sus";
import type { Feature, FeatureCollection, Geometry } from "geojson";

const riskColors: Record<ManagerRiskLevel, string> = {
  verde: "#1f7a4d",
  amarelo: "#f3d37a",
  vermelho: "#c24a2c"
};

type OfficialMetric = "coverage" | "vulnerability";

const markerIcon = (unit: HealthUnit) =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${unit.type === "CAIS" ? "#1c5f9f" : "#1f7a4d"};color:white;border:3px solid white;box-shadow:0 8px 18px rgba(23,33,27,.28);font-size:12px;font-weight:800">${unit.type}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

export function ManagerTerritorialMap({
  areas,
  units,
  officialEvidence
}: {
  areas: EnrichedManagerArea[];
  units: HealthUnit[];
  officialEvidence: ManagerOfficialEvidence;
}) {
  const [mode, setMode] = useState<"official" | "mvp">("official");
  const [officialMetric, setOfficialMetric] = useState<OfficialMetric>("coverage");
  const [selectedArea, setSelectedArea] = useState<EnrichedManagerArea>(areas[0]);
  const [sectorData, setSectorData] = useState<CensusSectorFeatureCollection | null>(null);
  const [selectedSector, setSelectedSector] = useState<CensusSectorFeature | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/territorial-evidence")
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao carregar setores");
        return response.json() as Promise<CensusSectorFeatureCollection>;
      })
      .then((data) => {
        if (!active) return;
        setSectorData(data);
        const topSectorCode = officialEvidence.census.topPrioritySectors[0]?.sectorCode;
        setSelectedSector(
          data.features.find((feature) => feature.id === topSectorCode) ?? data.features[0]
        );
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, [officialEvidence.census.topPrioritySectors]);

  useEffect(() => {
    if (!sectorData) return;
    const topSectorCode =
      officialMetric === "coverage"
        ? officialEvidence.census.topPrioritySectors[0]?.sectorCode
        : officialEvidence.census.topVulnerabilitySectors[0]?.sectorCode;
    setSelectedSector(
      sectorData.features.find((feature) => feature.id === topSectorCode) ??
        sectorData.features[0]
    );
  }, [
    officialEvidence.census.topPrioritySectors,
    officialEvidence.census.topVulnerabilitySectors,
    officialMetric,
    sectorData
  ]);

  useEffect(() => {
    if (!areas.some((area) => area.id === selectedArea?.id)) {
      setSelectedArea(areas[0]);
    }
  }, [areas, selectedArea?.id]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-stone-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Onde agir primeiro?</CardTitle>
            <p className="mt-1 text-sm text-stone-500">
              Compare a evidencia territorial oficial com os cenarios operacionais do MVP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setMode("official")}
              className={`min-h-10 px-3 text-sm font-semibold ${
                mode === "official" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Setores oficiais
            </button>
            <button
              type="button"
              onClick={() => setMode("mvp")}
              className={`min-h-10 px-3 text-sm font-semibold ${
                mode === "mvp" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
              }`}
            >
              Territorios MVP
            </button>
          </div>
        </div>
        {mode === "official" ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Colorir por
            </span>
            <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setOfficialMetric("coverage")}
                className={`min-h-9 px-3 text-sm font-semibold ${
                  officialMetric === "coverage"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600"
                }`}
              >
                Pressao de cobertura
              </button>
              <button
                type="button"
                onClick={() => setOfficialMetric("vulnerability")}
                className={`min-h-9 px-3 text-sm font-semibold ${
                  officialMetric === "vulnerability"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600"
                }`}
              >
                Vulnerabilidade
              </button>
            </div>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4 p-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[560px] overflow-hidden border-r border-stone-200">
          <MapContainer
            center={[luzianiaCenter[0], luzianiaCenter[1]]}
            zoom={11}
            minZoom={9}
            maxZoom={15}
            className="h-[560px] w-full"
            scrollWheelZoom
          >
            <MapModeViewport mode={mode} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mode === "official" && sectorData ? (
              <GeoJSON
                key={`official-${officialMetric}-${selectedSector?.id ?? "none"}`}
                data={sectorData as unknown as FeatureCollection}
                style={(feature) => {
                  const properties = feature?.properties as CensusSectorProperties | undefined;
                  const level =
                    officialMetric === "coverage"
                      ? properties?.coverage_priority_level
                      : properties?.vulnerability_context_level;
                  const isSelected = properties?.sector_code === selectedSector?.id;
                  return {
                    color: isSelected ? "#17211b" : "#ffffff",
                    fillColor: level ? riskColors[level] : "#a8a29e",
                    fillOpacity: isSelected ? 0.78 : 0.58,
                    opacity: isSelected ? 1 : 0.72,
                    weight: isSelected ? 3 : 0.8
                  };
                }}
                onEachFeature={(feature, layer) => {
                  const sector = feature as Feature<Geometry, CensusSectorProperties>;
                  const props = sector.properties;
                  const score =
                    officialMetric === "coverage"
                      ? props.coverage_priority_score
                      : props.vulnerability_context_score;
                  layer.bindTooltip(
                    `<strong>Setor ...${props.sector_code.slice(-6)}</strong><br/>${props.population_2022.toLocaleString("pt-BR")} pessoas | ${score === null ? "score indisponivel" : `score ${score}`}`,
                    { sticky: true }
                  );
                  layer.on("click", () => {
                    setSelectedSector(sector as unknown as CensusSectorFeature);
                  });
                }}
              />
            ) : null}
            {mode === "mvp" ? areas.map((area) => (
              <Polygon
                key={area.id}
                positions={area.polygon}
                pathOptions={{
                  color: riskColors[area.territorialRiskLevel],
                  fillColor: riskColors[area.territorialRiskLevel],
                  fillOpacity: 0.42,
                  opacity: 0.95,
                  weight: selectedArea.id === area.id ? 4 : 2
                }}
                eventHandlers={{
                  click: () => setSelectedArea(area)
                }}
              >
                <Tooltip sticky>
                  <strong>{area.label}</strong>
                  <br />
                  Score {area.territorialScore} | {area.territorialRiskLevel}
                </Tooltip>
                <Popup>
                  <strong>{area.label}</strong>
                  <br />
                  Cobertura {area.coverage}% | Alto risco {area.highRiskPatients}
                </Popup>
              </Polygon>
            )) : null}
            {units.map((unit) => (
              <Marker key={unit.id} position={unit.position} icon={markerIcon(unit)}>
                <Tooltip>
                  {unit.name} | {unit.type}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
          <div className="pointer-events-none absolute bottom-4 left-4 z-[500] border border-stone-200 bg-white/95 p-3 text-xs shadow-sm backdrop-blur">
            <p className="font-semibold text-stone-800">
              {mode === "official"
                ? officialMetric === "coverage"
                  ? "Pressao de cobertura"
                  : "Contexto de vulnerabilidade"
                : "Risco territorial simulado"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-stone-600">
              <LegendItem color={riskColors.verde} label="Menor" />
              <LegendItem color={riskColors.amarelo} label="Moderada" />
              <LegendItem color={riskColors.vermelho} label="Maior" />
              {mode === "official" && officialMetric === "vulnerability" ? (
                <LegendItem color="#a8a29e" label="Sem score" />
              ) : null}
            </div>
          </div>
        </div>

        <aside className="bg-[#fbfbf7] p-5">
          {mode === "official" ? (
            <OfficialSectorPanel
              sector={selectedSector}
              metric={officialMetric}
              loading={!sectorData && !loadError}
              loadError={loadError}
            />
          ) : (
            <MvpAreaPanel area={selectedArea} />
          )}
        </aside>
      </CardContent>
    </Card>
  );
}

function OfficialSectorPanel({
  sector,
  metric,
  loading,
  loadError
}: {
  sector: CensusSectorFeature | null;
  metric: OfficialMetric;
  loading: boolean;
  loadError: boolean;
}) {
  if (loading) {
    return <p className="text-sm text-stone-500">Carregando a malha oficial do IBGE...</p>;
  }

  if (loadError || !sector) {
    return (
      <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        Nao foi possivel carregar a malha oficial nesta sessao.
      </p>
    );
  }

  const props = sector.properties;
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-folha">
        Setor censitario oficial
      </p>
      <h3 className="mt-2 text-xl font-semibold">Setor ...{props.sector_code.slice(-6)}</h3>
      <p className="mt-1 text-xs text-stone-500">
        Codigo completo {props.sector_code} | {props.situation}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <LocalMetric label="Populacao 2022" value={props.population_2022} />
        <LocalMetric label="Domicilios ocupados" value={props.occupied_households_2022} />
        <LocalMetric label="Densidade / km2" value={Math.round(props.population_density_km2)} />
        <LocalMetric label="Distancia da APS" value={`${props.centroid_distance_km.toLocaleString("pt-BR")} km`} />
      </div>

      {metric === "coverage" ? (
        <CoverageScorePanel properties={props} />
      ) : (
        <VulnerabilityScorePanel properties={props} />
      )}

      <div className="mt-4 border-l-4 border-[#1c5f9f] bg-blue-50 p-3 text-sm leading-6 text-stone-700">
        <p className="font-semibold">Unidade primaria mais proxima</p>
        <p className="mt-1">{props.nearest_primary_care_name}</p>
        <p className="text-xs text-stone-500">CNES {props.nearest_primary_care_cnes}</p>
      </div>

      <p className="mt-4 text-xs leading-5 text-stone-500">
        Geografia, demografia e domicilios: IBGE Censo 2022. Unidades: CNES.
        Scores: calculos demonstrativos do GIP, sem dados de pacientes e sem valor clinico.
      </p>
    </>
  );
}

function CoverageScorePanel({ properties }: { properties: CensusSectorProperties }) {
  return (
    <div className="mt-4 border border-stone-200 bg-white p-4">
      <ScoreHeader
        label="Pressao de cobertura"
        level={properties.coverage_priority_level}
        score={properties.coverage_priority_score}
      />
      <div className="mt-4 space-y-3">
        <ScoreFactor label="Carga populacional" value={properties.score_population_load} max={40} />
        <ScoreFactor label="Densidade" value={properties.score_density_pressure} max={30} />
        <ScoreFactor label="Distancia da APS" value={properties.score_access_distance} max={30} />
      </div>
    </div>
  );
}

function VulnerabilityScorePanel({ properties }: { properties: CensusSectorProperties }) {
  const scoreAvailable =
    properties.vulnerability_context_score !== null &&
    properties.vulnerability_context_level !== null;

  return (
    <div className="mt-4 border border-stone-200 bg-white p-4">
      {scoreAvailable ? (
        <ScoreHeader
          label="Contexto de vulnerabilidade"
          level={properties.vulnerability_context_level ?? "verde"}
          score={properties.vulnerability_context_score ?? 0}
        />
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Contexto de vulnerabilidade
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-700">Score indisponivel</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <LocalMetric label="Criancas 0-9" value={formatPercent(properties.children_0_9_percent)} />
        <LocalMetric label="Pessoas 70+" value={formatPercent(properties.older_people_70_plus_percent)} />
        <LocalMetric label="Fora da rede de agua" value={formatPercent(properties.households_non_network_water_min_percent)} />
        <LocalMetric label="Esgoto inadequado" value={formatPercent(properties.households_inadequate_sewage_min_percent)} />
        <LocalMetric label="Lixo sem coleta" value={formatPercent(properties.households_uncollected_waste_min_percent)} />
      </div>

      {scoreAvailable ? (
        <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
          <ScoreFactor label="Criancas 0-9" value={properties.score_children_share ?? 0} max={20} />
          <ScoreFactor label="Pessoas 70+" value={properties.score_older_people_share ?? 0} max={20} />
          <ScoreFactor label="Agua" value={properties.score_water_gap ?? 0} max={20} />
          <ScoreFactor label="Esgoto" value={properties.score_sewage_gap ?? 0} max={25} />
          <ScoreFactor label="Lixo" value={properties.score_waste_gap ?? 0} max={15} />
        </div>
      ) : null}

      <p
        className={`mt-4 border p-3 text-xs leading-5 ${
          properties.vulnerability_data_status === "complete"
            ? "border-green-200 bg-green-50 text-green-900"
            : properties.vulnerability_data_status === "published_lower_bound"
              ? "border-yellow-200 bg-yellow-50 text-yellow-900"
              : "border-stone-200 bg-stone-50 text-stone-700"
        }`}
      >
        {properties.vulnerability_data_status === "complete"
          ? "Variaveis selecionadas publicadas sem supressao neste setor."
          : properties.vulnerability_data_status === "published_lower_bound"
            ? `${properties.suppressed_values_count} valor(es) pequeno(s) protegido(s) pelo IBGE. As lacunas exibidas sao minimos publicados.`
            : "O IBGE protegeu denominadores ou faixas etarias necessarias; o GIP nao estimou os valores ausentes."}
      </p>
    </div>
  );
}

function ScoreHeader({
  label,
  level,
  score
}: {
  label: string;
  level: ManagerRiskLevel;
  score: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
        <p className="mt-1 text-sm font-semibold capitalize">{level}</p>
      </div>
      <span
        className="grid h-12 w-12 place-items-center text-lg font-semibold text-white"
        style={{ backgroundColor: riskColors[level] }}
      >
        {score}
      </span>
    </div>
  );
}

function formatPercent(value: number | null) {
  return value === null ? "Protegido" : `${value.toLocaleString("pt-BR")}%`;
}

function MvpAreaPanel({ area }: { area: EnrichedManagerArea }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a5a18]">
        Cenario operacional simulado
      </p>
      <h3 className="mt-2 text-xl font-semibold">{area.label}</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <LocalMetric label="Meta" value={area.meta} />
        <LocalMetric label="Cadastrados" value={area.registered} />
        <LocalMetric label="Faltantes" value={area.missing} />
        <LocalMetric label="Cobertura" value={`${area.coverage}%`} />
        <LocalMetric label="Alto risco" value={area.highRiskPatients} />
        <LocalMetric label="Score" value={area.territorialScore} />
      </div>
      <p className="mt-4 border border-yellow-200 bg-[#fff9e8] p-3 text-sm leading-6 text-stone-700">
        {area.suggestedAction}
      </p>
      <p className="mt-4 text-xs leading-5 text-stone-500">
        Os valores deste modo sao agregados simulados do MVP e aguardam homologacao municipal.
      </p>
    </>
  );
}

function ScoreFactor({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between gap-3 text-xs text-stone-600">
        <span>{label}</span>
        <span>{value.toLocaleString("pt-BR")} / {max}</span>
      </div>
      <div className="mt-1 h-1.5 bg-stone-100">
        <div className="h-full bg-[#1c5f9f]" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function MapModeViewport({ mode }: { mode: "official" | "mvp" }) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [luzianiaCenter[0], luzianiaCenter[1]],
      mode === "official" ? 11 : 12,
      { animate: true }
    );
  }, [map, mode]);

  return null;
}

function LocalMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}
