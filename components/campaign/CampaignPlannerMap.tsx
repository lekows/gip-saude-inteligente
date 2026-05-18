"use client";

import { Circle, CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { CampaignPlan, MicroAreaRisk } from "@/types/campaign";
import type { NeighborhoodRisk } from "@/types/territorial";

const riskColors: Record<MicroAreaRisk, string> = {
  baixo: "#1f7a4d",
  medio: "#c9912d",
  alto: "#c24a2c"
};

const commandIcon = L.divIcon({
  className: "",
  html: '<div style="width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#17211b;color:white;border:3px solid white;box-shadow:0 10px 24px rgba(23,33,27,.34);font-size:18px;font-weight:900">IA</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

export function CampaignPlannerMap({
  plan,
  neighborhoods
}: {
  plan: CampaignPlan;
  neighborhoods: NeighborhoodRisk[];
}) {
  const target = neighborhoods.find((item) => item.id === plan.targetNeighborhoodId);

  return (
    <div className="h-[620px] overflow-hidden rounded-lg border border-stone-200">
      <MapContainer
        center={plan.commandPoint}
        zoom={13}
        minZoom={12}
        maxZoom={16}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {target ? (
          <Polygon
            positions={target.polygon}
            pathOptions={{
              color: "#c24a2c",
              fillColor: "#c24a2c",
              fillOpacity: 0.22,
              opacity: 0.95,
              weight: 3
            }}
          >
            <Tooltip sticky>{target.name} | bairro alvo</Tooltip>
          </Polygon>
        ) : null}

        <Circle
          center={plan.commandPoint}
          radius={plan.coverageRadiusMeters}
          pathOptions={{
            color: "#1f7a4d",
            fillColor: "#1f7a4d",
            fillOpacity: 0.1,
            opacity: 0.52,
            weight: 2
          }}
        />

        {plan.routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{ color: "#1c5f9f", weight: 4, opacity: 0.72 }}
          >
            <Tooltip>
              {route.name} | {route.householdsCovered} domicilios sintéticos
            </Tooltip>
          </Polyline>
        ))}

        <Marker position={plan.commandPoint} icon={commandIcon}>
          <Popup>
            <strong>{plan.commandPointName}</strong>
            <br />
            Ponto de comando do mutirao.
          </Popup>
        </Marker>

        {plan.microAreas.map((area) => (
          <CircleMarker
            key={area.id}
            center={area.position}
            radius={Math.max(12, area.highRiskEstimate / 2)}
            pathOptions={{
              color: riskColors[area.risk],
              fillColor: riskColors[area.risk],
              fillOpacity: 0.72,
              opacity: 0.95,
              weight: 2
            }}
          >
            <Tooltip sticky>
              <strong>{area.label}</strong>
              <br />
              {area.households} casas sintéticas | {area.highRiskEstimate} alto risco
            </Tooltip>
            <Popup>
              <strong>{area.label}</strong>
              <br />
              Domicilios simulados: {area.households}
              <br />
              Pessoas estimadas: {area.estimatedPeople}
              <br />
              Janela: {area.visitWindow}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
