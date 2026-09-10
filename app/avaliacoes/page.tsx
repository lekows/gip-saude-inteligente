import Link from "next/link";
import { ArrowRight, LockKeyhole, MessageSquareText } from "lucide-react";
import { EvaluationLayout, evaluationDate } from "@/components/evaluations/EvaluationLayout";
import { getMyEvaluations } from "@/lib/evaluations/server";
import { canReviewEvaluations, isCampaignOpen, SUGGESTION_STATUSES } from "@/lib/evaluations/rules";

export default async function EvaluationsPage() {
  const data = await getMyEvaluations();
  const self = data.campaigns.filter((campaign) => campaign.kind === "self" && campaign.status !== "draft");
  const programs = data.campaigns.filter((campaign) => campaign.kind === "program" && campaign.status !== "draft");
  const sent = data.responses.filter((response) => response.status === "submitted");
  const pending = self.filter((campaign) => isCampaignOpen(campaign) && !sent.some((response) => response.campaign_id === campaign.id));
  return <EvaluationLayout title="Avaliações e sugestões" description="Acompanhe seu aprendizado e participe da melhoria do GIP. Cada formulário informa quem pode acessar suas respostas." back="/meu-gip" backLabel="Meu GIP">
    {canReviewEvaluations(data.profile.role) && <Link className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white" href="/gestao-avaliacoes">Gerenciar avaliações e devolutivas <ArrowRight size={16} /></Link>}
    <section className="grid gap-4 sm:grid-cols-3" aria-label="Meu acompanhamento">
      {[{ label: "Avaliações disponíveis", value: pending.length }, { label: "Autoavaliações enviadas", value: sent.length }, { label: "Devolutivas recebidas", value: data.feedback.length }].map((item) => <div className="rounded-lg border border-stone-200 bg-white p-5" key={item.label}><p className="text-sm text-stone-600">{item.label}</p><p className="mt-2 text-3xl font-semibold text-folha">{item.value}</p></div>)}
    </section>
    {!data.hasMembership && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6">Seu histórico continua disponível. Para responder a novas avaliações e enviar sugestões, é necessário um vínculo ativo com uma turma. A coordenação pode conferir seu cadastro.</p>}
    <section aria-labelledby="self-title">
      <h2 id="self-title" className="text-xl font-semibold">Minhas autoavaliações</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">Respostas identificadas, acessíveis a você e aos responsáveis autorizados. Os rascunhos são privados. Use as avaliações para refletir sobre o aprendizado; elas não geram nota ou carga horária.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {self.map((campaign) => {
          const response = data.responses.find((item) => item.campaign_id === campaign.id);
          const open = isCampaignOpen(campaign);
          const label = response?.status === "submitted" ? "Enviada" : response ? "Rascunho" : open ? "Pendente" : "Fora do período";
          return <article className="rounded-lg border border-stone-200 bg-white p-5" key={campaign.id}>
            <div className="flex items-start justify-between gap-4"><h3 className="font-semibold">{campaign.title}</h3><span className="shrink-0 rounded bg-stone-100 px-2 py-1 text-xs">{label}</span></div>
            <p className="mt-2 text-xs text-stone-500">{evaluationDate(campaign.opens_at)} a {evaluationDate(campaign.closes_at)} · formulário v{campaign.version}</p>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-folha hover:underline" href={`/avaliacoes/${campaign.id}`}>{response?.status === "submitted" ? "Ver respostas e devolutivas" : open ? "Abrir avaliação" : "Consultar avaliação"}<ArrowRight size={16} /></Link>
          </article>;
        })}
      </div>
      {!self.length && <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-6 text-sm text-stone-600">Quando a coordenação disponibilizar uma avaliação para sua turma, ela aparecerá aqui.</p>}
    </section>
    <section className="rounded-lg border border-green-200 bg-green-50 p-5 sm:p-6" aria-labelledby="program-title">
      <h2 id="program-title" className="flex items-center gap-2 text-xl font-semibold"><LockKeyhole size={22} />Avaliar o GIP</h2>
      <p className="mt-2 text-sm leading-6 text-stone-700">Opine sobre as atividades sem associar a resposta ao seu histórico pessoal. Os resultados são agrupados após o encerramento, com no mínimo cinco respostas. Não mostramos quem respondeu.</p>
      <div className="mt-4 flex flex-wrap gap-3">{programs.filter((campaign) => isCampaignOpen(campaign)).map((campaign) => <Link key={campaign.id} className="inline-flex items-center gap-2 rounded-md border border-green-300 bg-white px-4 py-3 text-sm font-semibold text-folha" href={`/avaliacoes/${campaign.id}`}>{campaign.title}<ArrowRight size={16} /></Link>)}</div>
      {!programs.some((campaign) => isCampaignOpen(campaign)) && <p className="mt-3 text-sm text-stone-600">Não há avaliação do programa aberta neste momento.</p>}
    </section>
    <section className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><MessageSquareText size={21} />Sua ideia pode melhorar o GIP</h2><p className="mt-2 text-sm text-stone-600">A caixa de sugestões fica disponível durante sua participação ativa.</p></div>
      <Link className="shrink-0 rounded-md bg-folha px-5 py-3 text-center text-sm font-semibold text-white" href="/avaliacoes/sugestoes">Enviar sugestão anônima</Link>
    </section>
    <section id="mural" aria-labelledby="mural-title">
      <h2 id="mural-title" className="text-xl font-semibold">Vocês sugeriram, o GIP respondeu</h2>
      <p className="mt-2 text-sm text-stone-600">Sínteses revisadas pela coordenação e seus encaminhamentos.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{data.publications.map((item) => <article key={item.id} className="rounded-lg border border-stone-200 bg-white p-5">
        <span className="text-xs font-semibold text-folha">{SUGGESTION_STATUSES[item.status]}</span><h3 className="mt-2 whitespace-pre-wrap break-words font-semibold">{item.summary}</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">{item.resolution_summary}</p>
        {item.owner_label && <p className="mt-3 text-xs text-stone-500">Responsável: {item.owner_label}</p>}{item.due_date && <p className="mt-1 text-xs text-stone-500">Prazo: {evaluationDate(`${item.due_date}T12:00:00-03:00`)}</p>}
      </article>)}</div>
      {!data.publications.length && <p className="mt-4 rounded-lg border border-dashed border-stone-300 p-6 text-sm text-stone-600">Os primeiros encaminhamentos aparecerão aqui após a análise da coordenação.</p>}
    </section>
  </EvaluationLayout>;
}
