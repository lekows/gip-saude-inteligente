import Link from "next/link";
import { unitWorkspace } from "@/lib/units/server";
import { UnitNavigation } from "@/components/units/UnitNavigation";
export const dynamic = "force-dynamic";
export default async function UnitActions({ params }: { params: Promise<{ cnes: string }> }) {
  const { cnes } = await params;
  const unit = await unitWorkspace(cnes, `/unidades/${cnes}/acoes`);
  return <main className="min-h-screen bg-[#f4f8f7] text-ink">
    <header className="mx-auto max-w-6xl px-5 py-6">
      <Link href="/unidades" className="text-xs text-folha">← Unidades participantes</Link>
      <p className="mb-1 mt-4 text-xs uppercase tracking-widest text-stone-500">GIP · Unidade participante</p>
      <h1 className="text-3xl font-semibold">{unit.name}</h1>
    </header>
    <UnitNavigation cnes={cnes} current="acoes"/>
    <section className="mx-auto max-w-6xl px-5 py-8">
      <h2 className="text-2xl font-semibold">Ações e projetos</h2>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-stone-600">Acompanhe as iniciativas discutidas com a unidade e a preparação para registrar os resultados.</p>
      {cnes === "5882451" ? <article className="max-w-2xl rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold text-amber-800">Proposta de acompanhamento · dados de demonstração</p>
        <h3 className="mt-3 text-xl font-semibold">Ação de cirurgia de catarata</h3>
        <p className="mt-3 text-sm leading-6 text-stone-600">Consultas, cirurgias e revisões pós-operatórias. Calendário, metas e responsáveis aguardam confirmação com a direção.</p>
        <Link href={`/unidades/${cnes}/acoes/catarata`} className="mt-6 inline-block rounded-lg bg-folha px-4 py-3 text-sm font-semibold text-white">Abrir ação de catarata →</Link>
      </article> : <p className="rounded-xl border bg-white p-5 text-sm">Os projetos desta unidade serão apresentados após a definição com seus responsáveis.</p>}
    </section>
  </main>;
}

