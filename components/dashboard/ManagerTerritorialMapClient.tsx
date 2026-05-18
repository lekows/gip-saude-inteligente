"use client";

import dynamic from "next/dynamic";
import type { EnrichedManagerArea } from "@/types/managerDashboard";

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
  areas
}: {
  areas: EnrichedManagerArea[];
}) {
  return <ManagerTerritorialMap areas={areas} />;
}
