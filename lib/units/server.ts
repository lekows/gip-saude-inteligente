import "server-only";
import { notFound, redirect } from "next/navigation";
import { processContext } from "@/lib/processes/server";

export async function unitWorkspace(cnes: string, destination: string) {
  if (!/^\d{7}$/.test(cnes)) notFound();
  const context = await processContext().catch(() => null);
  if (!context) redirect(`/entrar?next=${encodeURIComponent(destination)}`);
  const { data: unit, error } = await context.supabase.from("health_units")
    .select("id,name,cnes").eq("cnes", cnes).eq("active", true).maybeSingle();
  if (error) throw new Error("Não foi possível consultar a unidade.");
  if (!unit) notFound();
  const maps = await context.supabase.from("process_maps").select("id")
    .eq("health_unit_id", unit.id).order("version", { ascending: false }).limit(1).maybeSingle();
  if (maps.error) throw new Error("Não foi possível consultar os trabalhos da unidade.");
  if (!maps.data) notFound();
  return unit;
}

