"use client";

import { CircleMarker, MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import type { MunicipalAreaImpact } from "@/lib/municipalReportService";
import type { HealthUnit, LatLngTuple } from "@/types/territorial";

const mapColors = {
  verde: "#1f7a4d",
  amarelo: "#f3d37a",
  vermelho: "#c24a2c"
};

export function MunicipalImpactMap({
  areas,
  units,
  center,
  selectedId,
  onSelectArea
}: {
  areas: MunicipalAreaImpact[];
  units: HealthUnit[];
  center: readonly [number, number];
  selectedId?: string;
  onSelectArea: (area: MunicipalAreaImpact) => void;
}) {
  return (
    <MapContainer
      center={center as LatLngTuple}
      zoom={12}
      scrollWheelZoom
      className="h-[560px] w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {areas.map((area) => {
        const color = mapColors[area.territorialRiskLevel];
        return (
          <Polygon
            key={area.id}
            positions={area.polygon}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: selectedId === area.id ? 0.48 : 0.28,
              weight: selectedId === area.id ? 4 : 2
            }}
            eventHandlers={{
              click: () => onSelectArea(area)
            }}
          >
            <Popup>
              <strong>{area.label}</strong>
              <br />
              Score atual: {area.afterScore}
              <br />
              Impacto: -{Math.max(area.scoreDelta, 0)} pontos
            </Popup>
          </Polygon>
        );
      })}

      {units.map((unit) => (
        <CircleMarker
          key={unit.id}
          center={unit.position}
          radius={8}
          pathOptions={{
            color: unit.type === "CAIS" ? "#1c5f9f" : "#17211b",
            fillColor: unit.type === "CAIS" ? "#1c5f9f" : "#ffffff",
            fillOpacity: 0.95,
            weight: 2
          }}
        >
          <Popup>
            <strong>{unit.name}</strong>
            <br />
            {unit.type} - {unit.activeTeams} equipes
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
