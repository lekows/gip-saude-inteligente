import Link from "next/link";
import { EvaluationLayout, evaluationDate } from "@/components/evaluations/EvaluationLayout";
import { CampaignForm, ManagementForm } from "@/components/evaluations/ManagementForm";
import { createEvaluationCampaign, reviewSuggestion } from "@/app/avaliacoes/actions";
import { evaluationPageContext } from "@/lib/evaluations/server";
import { SUGGESTION_STATUSES } from "@/lib/evaluations/rules";
import type { AnonymousSuggestion, EvaluationCampaign, SuggestionPublication } from "@/types/evaluations";

export default async function EvaluationManagementPage() {
  const { supabase, manager } = await evaluationPageContext("reviewer");
  const [campaignsResult, cyclesResult, classesResult, suggestionsResult, publicationsResult] = await Promise.all([
    supabase.from("evaluation_campaigns").select("*").order("created_at", { ascending: false }),
    manager ? supabase.from("program_cycles").select("id,name").neq("status", "cancelado").order("start_date", { ascending: false }) : { data: [], error: null },
    manager ? supabase.from("training_classes").select("id,cycle_id,title").neq("status", "cancelada").order("starts_at") : { data: [], error: null },
    manager ? supabase.from("anonymous_suggestions").select("id,category,message,proposal,submitted_month,status,resolution_summary,owner_label,due_date,published").order("submitted_month", { ascending: false }).limit(200) : { data: [], error: null },
    manager ? supabase.from("suggestion_publications").select("*").limit(200) : { data: [], error: null },
  ]);
  if ([campaignsResult, cyclesResult, classesResult, suggestionsResult, publicationsResult].some((result) => result.error)) throw new Error("Não foi possível carregar a gestão de avaliações.");
  const campaigns = (campaignsResult.data ?? []) as EvaluationCampaign[];
  const suggestions = (suggestionsResult.data ?? []) as (AnonymousSuggestion & { published: boolean })[];
  const publications = (publicationsResult.data ?? []) as SuggestionPublication[];
  const statusLabel = { draft: "Rascunho", open: "Aberta no período", closed: "Encerrada" };
  return <EvaluationLayout title="Gestão de avaliações" description="Organize os períodos de avaliação, acompanhe os envios identificados e registre devolutivas. As sugestões e os resultados anônimos ficam separados dos registros de aprendizagem.">
    {manager && <details className="rounded-lg border border-stone-200 bg-white p-5 sm:p-6" open={!campaigns.length}><summary className="cursor-pointer text-lg font-semibold">Criar avaliação para a turma</summary><div className="mt-5">{cyclesResult.data?.length ? <CampaignForm cycles={cyclesResult.data} classes={classesResult.data ?? []} action={createEvaluationCampaign} /> : <p className="text-sm text-stone-600">Cadastre o ciclo e as matrículas na <Link className="font-semibold text-folha underline" href="/gestao-academica">gestão acadêmica</Link> antes de criar uma avaliação.</p>}</div></details>}
    <section><h2 className="text-xl font-semibold">Avaliações da turma</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-lg border border-stone-200 bg-white p-5"><p className="text-xs font-semibold text-folha">{campaign.kind === "self" ? "APRENDIZAGEM IDENTIFICADA" : "OPINIÃO ANÔNIMA"} · {statusLabel[campaign.status]}</p><h3 className="mt-2 font-semibold">{campaign.title}</h3><p className="mt-2 text-xs text-stone-500">{evaluationDate(campaign.opens_at)} a {evaluationDate(campaign.closes_at)}</p><Link className="mt-4 inline-block text-sm font-semibold text-folha hover:underline" href={`/gestao-avaliacoes/${campaign.id}`}>{campaign.kind === "self" ? "Acompanhar envios e devolutivas" : "Consultar resultados agrupados"} →</Link></article>)}</div>{!campaigns.length && <p className="mt-4 text-sm text-stone-600">Nenhuma avaliação disponível para sua responsabilidade.</p>}</section>
    {manager && <section><h2 className="text-xl font-semibold">Caixa de sugestões</h2><p className="mt-2 text-sm leading-6 text-stone-600">Consulte as manifestações, defina um responsável e publique uma síntese revisada. Remova nomes, informações sobre pacientes e detalhes que possam identificar quem escreveu. O mural recebe apenas os campos revisados.</p>
      <div className="mt-4 space-y-4">{suggestions.map((suggestion) => {
        const publication = publications.find((item) => item.id === suggestion.id);
        return <details key={suggestion.id} className="rounded-lg border border-stone-200 bg-white p-5"><summary className="cursor-pointer font-semibold">{suggestion.category} · {SUGGESTION_STATUSES[suggestion.status]}{suggestion.published ? " · No mural" : ""}</summary>
          <div className="mt-5 grid gap-6 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-stone-500">Manifestação recebida</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{suggestion.message}</p>{suggestion.proposal && <><p className="mt-5 text-xs font-semibold uppercase text-stone-500">Solução proposta</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{suggestion.proposal}</p></>}</div>
            <ManagementForm action={reviewSuggestion.bind(null, suggestion.id)} label="Salvar encaminhamento">
              <label className="grid gap-2 text-sm font-semibold">Situação<select name="status" defaultValue={suggestion.status} className="rounded-md border border-stone-300 bg-white p-2 font-normal">{Object.entries(SUGGESTION_STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold">Síntese para o mural<textarea name="public_summary" maxLength={1000} rows={3} defaultValue={publication?.summary || ""} className="rounded-md border border-stone-300 p-3 font-normal" placeholder="Escreva uma síntese sem informações pessoais." /></label>
              <label className="grid gap-2 text-sm font-semibold">Encaminhamento ou justificativa<textarea name="resolution_summary" maxLength={1500} rows={3} defaultValue={suggestion.resolution_summary || ""} className="rounded-md border border-stone-300 p-3 font-normal" /></label>
              <label className="grid gap-2 text-sm font-semibold">Responsável pelo encaminhamento<input name="owner_label" maxLength={120} defaultValue={suggestion.owner_label || ""} className="rounded-md border border-stone-300 p-2 font-normal" placeholder="Ex.: Coordenação de capacitação" /></label>
              <label className="grid gap-2 text-sm font-semibold">Prazo<input type="date" name="due_date" defaultValue={suggestion.due_date || ""} className="rounded-md border border-stone-300 p-2 font-normal" /></label>
              <label className="flex items-start gap-3 text-sm leading-6"><input className="mt-1 h-4 w-4" type="checkbox" name="publish" defaultChecked={suggestion.published} />Revisei os textos e quero publicar o encaminhamento no mural. Desmarcar retira a publicação.</label>
            </ManagementForm>
          </div></details>;
      })}</div>{!suggestions.length && <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-6 text-sm text-stone-600">Nenhuma sugestão recebida.</p>}
      {suggestions.length >= 200 && <p className="mt-3 text-xs text-stone-500">Mostrando até 200 sugestões. A consulta completa permanece no banco restrito à coordenação.</p>}
    </section>}
  </EvaluationLayout>;
}
