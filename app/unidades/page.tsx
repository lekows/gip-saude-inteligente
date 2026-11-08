import Link from "next/link";
import { Hospital, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { processContext } from "@/lib/processes/server";
import { latestUnitMaps } from "@/lib/units/access";

export const dynamic = "force-dynamic";

export default async function ParticipatingUnitsPage() {
  const context = await processContext().catch(() => null);
  if (!context) redirect("/entrar?next=/unidades");
  const maps: { id: string; health_unit_id: string; version: number }[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await context.supabase.from("process_maps").select("id,health_unit_id,version")
      .order("id").range(offset, offset + 499);
    if (result.error) return <Unavailable />;
    maps.push(...result.data);
    if (result.data.length < 500) break;
  }
  const ids = latestUnitMaps(maps).map(map => map.health_unit_id);
  const units: { id: string; name: string; cnes: string | null }[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const result = await context.supabase.from("health_units").select("id,name,cnes")
      .in("id", ids.slice(offset, offset + 100)).eq("active", true);
    if (result.error) return <Unavailable />;
    units.push(...result.data);
  }
  units.sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));
  return <main className="mx-auto max-w-6xl px-5 py-9 text-ink">
    <Link href="/" className="text-sm text-folha">← Início do GIP</Link>
    <p className="mb-2 mt-7 text-xs font-semibold uppercase tracking-widest text-folha">Atuação nas unidades</p>
    <h1 className="text-3xl font-semibold">Unidades participantes</h1>
    <p className="mb-7 mt-3 max-w-2xl text-sm leading-6 text-stone-600">Escolha a unidade para acompanhar o painel, os projetos de ação e os processos disponíveis para sua conta.</p>
    {!units.length ? <div className="rounded-xl border bg-white p-6"><h2 className="font-semibold">Aguardando acesso a uma unidade</h2>
      <p className="mt-2 text-sm text-stone-600">A coordenação pode conferir seu vínculo com os trabalhos do hospital ou da unidade de saúde.</p></div> :
      <div className="grid gap-5 md:grid-cols-2">{units.map(unit => <article key={unit.id} className="rounded-2xl border border-stone-200 bg-white p-6">
        <Hospital className="mb-5 text-folha" size={30} aria-hidden />
        <h2 className="text-xl font-semibold">{unit.name}</h2><p className="mt-2 text-sm text-stone-500">Painel da unidade · Ações e projetos · Processos</p>
        {unit.cnes && /^\d{7}$/.test(unit.cnes) ? <Link href={`/unidades/${unit.cnes}`} className="mt-6 inline-flex items-center gap-3 rounded-lg bg-folha px-4 py-3 text-sm font-semibold text-white">Entrar na unidade <ArrowRight size={16}/></Link> :
          <p className="mt-5 text-sm text-amber-800">O cadastro CNES precisa ser conferido pela coordenação.</p>}
      </article>)}</div>}
  </main>;
}
function Unavailable() {
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-semibold">Unidades participantes</h1>
    <p className="my-4" role="alert">Não foi possível carregar as unidades. Tente novamente mais tarde.</p><Link href="/">Voltar ao início</Link></main>;
}

