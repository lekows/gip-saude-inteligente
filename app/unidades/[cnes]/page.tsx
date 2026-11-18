import { unitWorkspace } from "@/lib/units/server";
import { HospitalDemoDashboard } from "@/components/processes/HospitalDemoDashboard";
import { directorBrief } from "@/lib/units/directorBrief";
import { readEditorialLedger } from "@/lib/processes/editorialLedger";
import { applyEditorialContent } from "@/lib/processes/editorial";
import { readAreaLedger } from "@/lib/processes/areaLedger";
import type { ProcessContent } from "@/types/processReview";

export const dynamic = "force-dynamic";

export default async function UnitHome({ params }: { params: Promise<{ cnes: string }> }) {
  const { cnes } = await params;
  const unit = await unitWorkspace(cnes, `/unidades/${cnes}`);
  if (cnes !== "5882451") return <HospitalDemoDashboard unitName={unit.name} cnes={cnes} />;

  const { supabase, mapId } = unit;
  const [snapshot, editorial, ledger] = await Promise.all([
    supabase.from("process_maps").select("content,version").eq("id", mapId).single(),
    readEditorialLedger(supabase, mapId),
    readAreaLedger(supabase, mapId),
  ]);
  if (snapshot.error) throw new Error("Não foi possível carregar o diagnóstico da unidade.");
  const { content, version } = snapshot.data;
  const brief = directorBrief(applyEditorialContent(content as ProcessContent, editorial, version, ledger), version);
  return <HospitalDemoDashboard unitName={unit.name} cnes={cnes} brief={brief} />;
}
