import { EvaluationLayout } from "@/components/evaluations/EvaluationLayout";
import { SuggestionForm } from "@/components/evaluations/SuggestionForm";
import { evaluationPageContext } from "@/lib/evaluations/server";
import { submitSuggestion } from "@/app/avaliacoes/actions";

export default async function SuggestionsPage() {
  const { supabase, user } = await evaluationPageContext();
  const { data, error } = await supabase.from("program_members").select("id").eq("profile_id", user.id).eq("status", "ativo").limit(1);
  if (error) throw new Error("Não foi possível verificar sua participação.");
  return <EvaluationLayout title="Sugestões de melhoria" description="Conte o que pode melhorar e, se quiser, proponha uma solução. A coordenação publica os encaminhamentos no mural de melhorias.">
    {data?.length ? <SuggestionForm onSubmit={submitSuggestion} /> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm leading-6">O envio é destinado aos participantes com vínculo ativo em uma turma. Peça à coordenação para conferir seu vínculo.</p>}
  </EvaluationLayout>;
}
