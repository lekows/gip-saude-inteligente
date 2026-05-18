"use client";

import dynamic from "next/dynamic";
import type { HealthUnit, NeighborhoodRisk } from "@/types/territorial";

const LuzianiaHealthMap = dynamic(
  () => import("./LuzianiaHealthMap").then((mod) => mod.LuzianiaHealthMapView),
  {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[#f7f7f2] text-ink">
      Carregando mapa territorial...
    </div>
  )
  }
);

export default function LuzianiaHealthMapClient({
  neighborhoods,
  units
}: {
  neighborhoods?: NeighborhoodRisk[];
  units?: HealthUnit[];
}) {
  return <LuzianiaHealthMap neighborhoods={neighborhoods} units={units} />;
}
