"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnonymityNotice,
  AnswersSummary,
  EvaluationReview,
  EvaluationStatus,
  RatingField,
  evaluationPanelClass,
  evaluationPrimaryClass,
  type EvaluationActionResult,
  type EvaluationFeedback,
} from "./EvaluationFields";

const questions = [
  { key: "organization", label: "Organização e comunicação das atividades" },
  { key: "content", label: "Conteúdos e materiais de aprendizagem" },
  { key: "mentoring", label: "Orientação e acompanhamento docente" },
  { key: "practice", label: "Atividades práticas e de campo" },
  { key: "infrastructure", label: "Infraestrutura e recursos disponíveis" },
  { key: "satisfaction", label: "Sua experiência geral com o GIP" },
];

export type ProgramEvaluationFormProps = {
  campaignId: string;
  onSubmit: (input: {
    campaignId: string;
    nonce: string;
    answers: Record<string, number | null>;
  }) => Promise<EvaluationActionResult>;
};

export function ProgramEvaluationForm({ campaignId, onSubmit }: ProgramEvaluationFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [reviewing, setReviewing] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationFeedback>(null);
  const [pending, startTransition] = useTransition();
  const nonce = useRef<string | null>(null);
  const busy = useRef(false);
  const editHeading = useRef<HTMLHeadingElement>(null);

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setFeedback(null);
    setReviewing(true);
  }

  function submit() {
    if (busy.current || sent) return;
    busy.current = true;
    setFeedback(null);
    startTransition(async () => {
      try {
        nonce.current ??= crypto.randomUUID();
        const result = await onSubmit({ campaignId, nonce: nonce.current, answers: { ...answers } });
        if (result.error || result.success !== true) {
          setFeedback({ kind: "error", text: result.error || "Não foi possível confirmar o envio. Suas respostas continuam nesta tela; tente novamente." });
          return;
        }
        setSent(true);
        setAnswers({});
        setReviewing(false);
        router.refresh();
      } catch {
        setFeedback({ kind: "error", text: "Não conseguimos confirmar o envio. Suas respostas continuam nesta tela. Verifique sua conexão e tente novamente." });
      } finally {
        busy.current = false;
      }
    });
  }

  if (sent) {
    return (
      <section className={`${evaluationPanelClass} text-center`} role="status">
        <CheckCircle2 size={36} className="mx-auto text-folha" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-ink">Avaliação recebida</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">Sua contribuição foi registrada para compor os resultados do programa. Ela não aparece no seu histórico pessoal.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5" aria-busy={pending}>
      <AnonymityNotice />
      {reviewing ? (
        <EvaluationReview title="Revise sua avaliação do GIP">
          <AnswersSummary questions={questions} answers={answers} />
          <p className="rounded-lg bg-[#f7f7f2] p-3 text-sm leading-6 text-stone-600">Depois de enviada, esta avaliação não poderá ser consultada ou editada na sua conta.</p>
          <EvaluationStatus feedback={feedback} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" disabled={pending} onClick={() => { setReviewing(false); setFeedback(null); requestAnimationFrame(() => editHeading.current?.focus()); }} className="h-11"><ArrowLeft size={17} aria-hidden="true" />Voltar e editar</Button>
            <Button type="button" disabled={pending} onClick={submit} className={evaluationPrimaryClass}>{pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}{pending ? "Registrando..." : "Confirmar envio"}</Button>
          </div>
        </EvaluationReview>
      ) : (
        <form onSubmit={review} className={`${evaluationPanelClass} space-y-6`}>
          <div>
            <h3 ref={editHeading} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">Como foi sua experiência?</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">Avalie cada aspecto de 1 (muito ruim) a 5 (muito bom). Marque N/A quando não se aplicar.</p>
          </div>
          {questions.map((question) => <RatingField key={question.key} name={question.key} label={question.label} value={answers[question.key]} onChange={(value) => { setAnswers((current) => ({ ...current, [question.key]: value })); setFeedback(null); }} disabled={pending} />)}
          <EvaluationStatus feedback={feedback} />
          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" disabled={pending} className={`${evaluationPrimaryClass} w-full sm:w-auto`}><ClipboardCheck size={18} aria-hidden="true" />Revisar e enviar</Button>
          </div>
        </form>
      )}
    </div>
  );
}
