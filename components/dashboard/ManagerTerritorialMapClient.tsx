"use client";

import dynamic from "next/dynamic";
import type {
  EnrichedManagerArea,
  ManagerOfficialEvidence
} from "@/types/managerDashboard";
import type { HealthUnit } from "@/types/territorial";

const ManagerTerritorialMap = dynamic(
  () => import("./ManagerTerritorialMap").then((mod) => mod.ManagerTerritorialMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[520px] place-items-center rounded-lg border border-stone-200 bg-white">
        Carregando mapa gerencial...
      </div>
    )
  }
);

export function ManagerTerritorialMapClient({
  areas,
  units,
  officialEvidence
}: {
  areas: EnrichedManagerArea[];
  units: HealthUnit[];
  officialEvidence: ManagerOfficialEvidence;
}) {
  return (
    <ManagerTerritorialMap
      areas={areas}
      units={units}
      officialEvidence={officialEvidence}
    />
  );
}
