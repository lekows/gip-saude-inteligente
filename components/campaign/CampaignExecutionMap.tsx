"use client";

import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip
} from "react-leaflet";
import L from "leaflet";
import { statusColors, statusLabels } from "@/lib/campaignExecutionService";
import type { CampaignExecutionSnapshot, CampaignPlan } from "@/types/campaign";

const commandIcon = L.divIcon({
  className: "",
  html: '<div style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#17211b;color:white;border:3px solid white;box-shadow:0 10px 24px rgba(23,33,27,.34);font-size:13px;font-weight:900">CMD</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

export function CampaignExecutionMap({
  plan,
  snapshot
}: {
  plan: CampaignPlan;
  snapshot: CampaignExecutionSnapshot;
}) {
  return (
    <div className="h-[560px] overflow-hidden rounded-lg border border-stone-200">
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

        {plan.routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{ color: "#1c5f9f", weight: 4, opacity: 0.68 }}
          >
            <Tooltip>{route.name}</Tooltip>
          </Polyline>
        ))}

        <Marker position={plan.commandPoint} icon={commandIcon}>
          <Popup>
            <strong>{plan.commandPointName}</strong>
            <br />
            Ponto de comando operacional.
          </Popup>
        </Marker>

        {plan.microAreas.map((area) => {
          const execution = snapshot.microAreas.find((item) => item.microAreaId === area.id);
          const status = execution?.status ?? "nao_iniciado";

          return (
            <CircleMarker
              key={area.id}
              center={area.position}
              radius={Math.max(12, (execution?.peopleScreened ?? 12) / 5)}
              pathOptions={{
                color: statusColors[status],
                fillColor: statusColors[status],
                fillOpacity: 0.76,
                opacity: 0.95,
                weight: 2
              }}
            >
              <Tooltip sticky>
                <strong>{area.label}</strong>
                <br />
                {statusLabels[status]} | {execution?.peopleScreened ?? 0} triados
              </Tooltip>
              <Popup>
                <strong>{area.label}</strong>
                <br />
                Status: {statusLabels[status]}
                <br />
                Domicilios visitados: {execution?.householdsVisited ?? 0}
                <br />
                Alto risco encontrado: {execution?.highRiskFound ?? 0}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
