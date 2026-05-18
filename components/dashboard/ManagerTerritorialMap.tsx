"use client";

import { useState } from "react";
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { healthUnits, luzianiaCenter } from "@/data/territorialData";
import type { EnrichedManagerArea, ManagerRiskLevel } from "@/types/managerDashboard";
import type { HealthUnit } from "@/types/territorial";

const riskColors: Record<ManagerRiskLevel, string> = {
  verde: "#1f7a4d",
  amarelo: "#f3d37a",
  vermelho: "#c24a2c"
};

const markerIcon = (unit: HealthUnit) =>
  L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:${unit.type === "CAIS" ? "#1c5f9f" : "#1f7a4d"};color:white;border:3px solid white;box-shadow:0 8px 18px rgba(23,33,27,.28);font-size:12px;font-weight:800">${unit.type}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

export function ManagerTerritorialMap({ areas }: { areas: EnrichedManagerArea[] }) {
  const [selectedArea, setSelectedArea] = useState<EnrichedManagerArea>(areas[0]);
  const units = healthUnits.filter((unit) => unit.type === "UBS" || unit.type === "CAIS");

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Mapa territorial com semaforo de risco</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-h-[440px] overflow-hidden rounded-md border border-stone-200">
          <MapContainer
            center={[luzianiaCenter[0], luzianiaCenter[1]]}
            zoom={12}
            minZoom={11}
            maxZoom={15}
            className="h-[440px] w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {areas.map((area) => (
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
            ))}
            {units.map((unit) => (
              <Marker key={unit.id} position={unit.position} icon={markerIcon(unit)}>
                <Tooltip>
                  {unit.name} | {unit.type}
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <aside className="rounded-md border border-stone-200 bg-[#fbfbf7] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-folha">
            Painel local
          </p>
          <h3 className="mt-2 text-xl font-semibold">{selectedArea.label}</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <LocalMetric label="Meta" value={selectedArea.meta} />
            <LocalMetric label="Cadastrados" value={selectedArea.registered} />
            <LocalMetric label="Faltantes" value={selectedArea.missing} />
            <LocalMetric label="Cobertura" value={`${selectedArea.coverage}%`} />
            <LocalMetric label="Alto risco" value={selectedArea.highRiskPatients} />
            <LocalMetric label="Score" value={selectedArea.territorialScore} />
          </div>
          <p className="mt-4 rounded-md bg-white p-3 text-sm leading-6 text-stone-700">
            {selectedArea.suggestedAction}
          </p>
        </aside>
      </CardContent>
    </Card>
  );
}

function LocalMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 font-semibold">{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}
