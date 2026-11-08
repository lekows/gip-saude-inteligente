import { unitWorkspace } from "@/lib/units/server";
import { HospitalDemoDashboard } from "@/components/processes/HospitalDemoDashboard";
export const dynamic = "force-dynamic";
export default async function UnitHome({ params }: { params: Promise<{ cnes: string }> }) {
  const { cnes } = await params;
  const unit = await unitWorkspace(cnes, `/unidades/${cnes}`);
  return <HospitalDemoDashboard unitName={unit.name} cnes={cnes}/>;
}

