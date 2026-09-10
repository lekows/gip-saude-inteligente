import { notFound } from "next/navigation";
import { EvaluationLayout, evaluationDate } from "@/components/evaluations/EvaluationLayout";
import { AnswerSummary } from "@/components/evaluations/AnswerSummary";
import { SelfEvaluationForm } from "@/components/evaluations/SelfEvaluationForm";
import { ProgramEvaluationForm } from "@/components/evaluations/ProgramEvaluationForm";
import { saveSelfEvaluation, submitProgramEvaluation } from "@/app/avaliacoes/actions";
import { evaluationPageContext } from "@/lib/evaluations/server";
import { isCampaignOpen, isUuid } from "@/lib/evaluations/rules";
import type { EvaluationCampaign, EvaluationFeedback, EvaluationResponse, EvaluationVersion } from "@/types/evaluations";

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { supabase, user } = await evaluationPageContext();
  const { data, error } = await supabase.from("evaluation_campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a avaliação.");
  if (!data) notFound();
  const campaign = data as EvaluationCampaign;
  const open = isCampaignOpen(campaign);
  const { data: responseData, error: responseError } = await supabase.from("evaluation_responses").select("*").eq("campaign_id", id).eq("profile_id", user.id).maybeSingle();
  if (responseError) throw new Error("Não foi possível carregar suas respostas.");
  const response = responseData as EvaluationResponse | null;
  const [feedbackResult, versionsResult] = response ? await Promise.all([
    supabase.from("evaluation_feedback").select("*").eq("response_id", response.id).order("created_at"),
    supabase.from("evaluation_response_versions").select("*").eq("response_id", response.id).order("revision", { ascending: false }),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (feedbackResult.error || versionsResult.error) throw new Error("Não foi possível carregar o histórico.");
  const feedback = (feedbackResult.data ?? []) as EvaluationFeedback[];
  const versions = (versionsResult.data ?? []) as EvaluationVersion[];
  return <EvaluationLayout title={campaign.title} description={`${campaign.kind === "self" ? "Autoavaliação identificada de aprendizagem" : "Avaliação anônima das atividades do GIP"}. Período: ${evaluationDate(campaign.opens_at)} a ${evaluationDate(campaign.closes_at)} (horário de Brasília). Formulário versão ${campaign.version}.`}>
    {campaign.kind === "program" ? open ? <ProgramEvaluationForm campaignId={id} onSubmit={submitProgramEvaluation} /> : <p className="rounded-lg border border-stone-200 bg-white p-6">Esta avaliação não está recebendo respostas. Os envios anônimos não ficam no histórico pessoal.</p> : <>
      {response?.status === "submitted" || !open ? <section className="rounded-lg border border-stone-200 bg-white p-6"><h2 className="mb-5 text-xl font-semibold">{response?.status === "submitted" ? "Avaliação registrada" : "Período de envio encerrado ou ainda não iniciado"}</h2>{response ? <AnswerSummary answers={response.answers} /> : <p className="text-sm text-stone-600">Você ainda não enviou uma resposta a esta avaliação.</p>}{response?.submitted_at && <p className="mt-5 text-xs text-stone-500">Enviada em {evaluationDate(response.submitted_at)}</p>}</section> : <SelfEvaluationForm campaignId={id} initialAnswers={response?.answers} onSave={saveSelfEvaluation.bind(null, response?.revision ?? 0)} />}
      <section className="rounded-lg border border-stone-200 bg-white p-6"><h2 className="text-xl font-semibold">Devolutivas dos responsáveis</h2>{!feedback.length && <p className="mt-3 text-sm text-stone-600">As orientações aparecerão aqui após a análise da sua avaliação.</p>}{feedback.map((item) => <article key={item.id} className="mt-4 border-l-4 border-folha pl-4"><p className="whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p><p className="mt-2 text-xs text-stone-500">{evaluationDate(item.created_at)}</p></article>)}</section>
      {versions.length > 0 && <section><h2 className="text-xl font-semibold">Histórico de envios</h2><p className="mt-2 text-sm text-stone-600">As versões anteriores permanecem registradas quando a coordenação autoriza uma correção.</p>{versions.map((version) => <details key={version.id} className="mt-3 rounded-lg border border-stone-200 bg-white p-5"><summary className="cursor-pointer text-sm font-semibold">Envio {version.revision} · {evaluationDate(version.submitted_at)}</summary><div className="mt-5"><AnswerSummary answers={version.answers} /></div></details>)}</section>}
    </>}
  </EvaluationLayout>;
}
