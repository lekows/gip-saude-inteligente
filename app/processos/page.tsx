import Link from "next/link";
import { redirect } from "next/navigation";
import { processContext } from "@/lib/processes/server";
export const dynamic = "force-dynamic";
export default async function ProcessListPage() {
  const context = await processContext().catch(() => null);
  if (!context) redirect("/entrar?next=/processos");
  const { supabase, manager } = context;
  const [maps, units] = await Promise.all([
    supabase.from("process_maps").select("id,health_unit_id,title,version,status").order("created_at", { ascending: false }).limit(100),
    supabase.from("health_units").select("id,name,cnes").eq("active", true),
  ]);
  return <main className="mx-auto max-w-6xl px-4 py-8 text-ink"><p className="text-sm font-semibold text-folha">GIP · Processos das unidades</p><h1 className="mt-2 text-3xl font-semibold">Teias para validação colaborativa</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Percorra as atividades, registre dúvidas e proponha mudanças. As contribuições são identificadas e permanecem separadas da versão do levantamento.</p><div className="my-5 flex flex-wrap gap-3"><Link className="rounded-md border px-4 py-2 text-sm" href="/meu-gip">Meu GIP</Link>{manager && <Link className="rounded-md border px-4 py-2 text-sm" href="/territorial-map">Mapa da rede</Link>}</div>
    {maps.error || units.error ? <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-5">O módulo de processos está temporariamente indisponível. Tente novamente mais tarde.</p> : !maps.data?.length ? <div className="rounded-lg border bg-white p-6"><h2 className="font-semibold">Nenhuma rodada disponível para sua conta</h2><p className="mt-2 text-sm text-stone-600">A coordenação precisa autorizar sua participação. Depois disso, abra novamente o link compartilhado.</p></div> : <div className="grid gap-4 md:grid-cols-2">{maps.data.map(map => { const unit = units.data?.find(u => u.id === map.health_unit_id); return <article key={map.id} className="rounded-xl border bg-white p-5"><p className="text-xs font-semibold uppercase text-folha">{unit?.name || "Unidade de saúde"}</p><h2 className="mt-2 text-xl font-semibold">{map.title}</h2><p className="mt-2 text-sm text-stone-600">Versão {map.version} · {map.status === "open" ? "Recebendo contribuições" : "Rodada encerrada"}</p>{unit?.cnes ? <Link className="mt-4 inline-block rounded-md bg-folha px-4 py-2 text-sm font-semibold text-white" href={`/unidades/${unit.cnes}/processos`}>Abrir teia{manager ? " e gerenciar acesso" : ""}</Link> : <p className="mt-4 text-sm text-amber-800">Cadastro da unidade precisa de conferência do CNES.</p>}</article>; })}</div>}
  </main>;
}
