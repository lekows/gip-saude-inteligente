"use client";

import { CircleMarker, MapContainer, Polygon, Popup, TileLayer } from "react-leaflet";
import type { MobileMapMarker, MobileRiskArea } from "@/types/mobile";
import type { LatLngTuple } from "@/types/territorial";

const riskColors = {
  baixo: "#1f7a4d",
  medio: "#f3d37a",
  alto: "#c24a2c",
  critico: "#8f1d12"
};

export function SimpleRiskMap({
  center,
  areas,
  markers
}: {
  center: readonly [number, number];
  areas: MobileRiskArea[];
  markers: MobileMapMarker[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md">
      <MapContainer
        center={center as LatLngTuple}
        zoom={12}
        scrollWheelZoom={false}
        dragging
        className="h-[320px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {areas.map((area) => {
          const color = riskColors[area.level];
          return (
            <Polygon
              key={area.id}
              positions={area.polygon}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.26, weight: 2 }}
            >
              <Popup>
                <strong>{area.name}</strong>
                <br />
                Risco: {area.level}
              </Popup>
            </Polygon>
          );
        })}
        {markers.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={marker.position}
            radius={marker.type === "MUTIRAO" ? 10 : 8}
            pathOptions={{
              color: marker.type === "MUTIRAO" ? "#c24a2c" : "#17211b",
              fillColor: marker.type === "MUTIRAO" ? "#c24a2c" : "#ffffff",
              fillOpacity: 0.95,
              weight: 3
            }}
          >
            <Popup>
              <strong>{marker.label}</strong>
              <br />
              {marker.type}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-3 p-3 text-xs font-semibold">
        <Legend color="#1f7a4d" label="Baixo" />
        <Legend color="#f3d37a" label="Medio" />
        <Legend color="#c24a2c" label="Alto" />
        <Legend color="#17211b" label="UBS" />
        <Legend color="#c24a2c" label="Mutirao" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
