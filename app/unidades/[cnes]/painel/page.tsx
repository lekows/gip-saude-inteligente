import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { processContext } from "@/lib/processes/server";
import { HospitalDemoDashboard } from "@/components/processes/HospitalDemoDashboard";

export const dynamic = "force-dynamic";

export default async function HospitalPanel({ params }: { params: Promise<{ cnes: string }> }) {
  const { cnes } = await params;
  if (!/^\d{7}$/.test(cnes)) notFound();
  const context = await processContext().catch(() => null);
  if (!context) redirect(`/entrar?next=${encodeURIComponent(`/unidades/${cnes}/painel`)}`);
  const unit = await context.supabase.from("health_units").select("id,name").eq("cnes", cnes).eq("active", true).maybeSingle();
  if (unit.error) return <Unavailable />;
  if (!unit.data) notFound();
  const map = await context.supabase.from("process_maps").select("id").eq("health_unit_id", unit.data.id)
    .order("version", { ascending: false }).limit(1).maybeSingle();
  if (map.error) return <Unavailable />;
  if (!map.data) return <Unavailable text="Solicite à coordenação acesso aos processos desta unidade para consultar a demonstração." />;
  return <HospitalDemoDashboard unitName={unit.data.name} cnes={cnes} />;
}
function Unavailable({ text = "Não foi possível consultar o painel. Tente novamente mais tarde." }) {
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-semibold">Painel do hospital</h1>
    <p className="my-5" role="status">{text}</p><Link href="/processos" className="underline">Voltar às unidades</Link></main>;
}

