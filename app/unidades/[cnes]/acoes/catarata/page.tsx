import { notFound } from "next/navigation";
import { unitWorkspace } from "@/lib/units/server";
import { HospitalDemoDashboard } from "@/components/processes/HospitalDemoDashboard";
export const dynamic = "force-dynamic";
export default async function CataractAction({ params }: { params: Promise<{ cnes: string }> }) {
  const { cnes } = await params;
  const unit = await unitWorkspace(cnes, `/unidades/${cnes}/acoes/catarata`);
  if (cnes !== "5882451") notFound();
  return <HospitalDemoDashboard unitName={unit.name} cnes={cnes} initialView="catarata"/>;
}

