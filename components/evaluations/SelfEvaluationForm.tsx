"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnswersSummary,
  EvaluationReview,
  EvaluationStatus,
  EvaluationTextField,
  PrivacyReminder,
  RatingField,
  evaluationPanelClass,
  evaluationPrimaryClass,
  type EvaluationActionResult,
  type EvaluationFeedback,
} from "./EvaluationFields";

const ratingQuestions = [
  { key: "comprehension", label: "Compreendo os conteúdos trabalhados." },
  { key: "confidence", label: "Tenho segurança para realizar as atividades propostas." },
  { key: "participation", label: "Participo das atividades e colaboro com a equipe." },
  { key: "communication", label: "Comunico-me com clareza e mantenho uma postura ética." },
  { key: "application", label: "Consigo aplicar o aprendizado na prática." },
];
const textQuestions = [
  { key: "learning", label: "Quais foram seus principais aprendizados?" },
  { key: "difficulties", label: "Quais dificuldades você encontrou?" },
  { key: "support", label: "Que apoio ajudaria no seu desenvolvimento?" },
  { key: "next_step", label: "Qual é seu objetivo para a próxima etapa?" },
];

export type SelfEvaluationFormProps = {
  campaignId: string;
  initialAnswers?: Record<string, number | string | null>;
  submitted?: boolean;
  onSave: (input: {
    campaignId: string;
    answers: Record<string, number | string | null>;
    submit: boolean;
  }) => Promise<EvaluationActionResult>;
};

export function SelfEvaluationForm({ campaignId, initialAnswers = {}, submitted = false, onSave }: SelfEvaluationFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number | string | null>>(initialAnswers);
  const [reviewing, setReviewing] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationFeedback>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const editHeading = useRef<HTMLHeadingElement>(null);
  const isSubmitted = submitted || sent;
  const answeredCount = ratingQuestions.filter(({ key }) => Object.hasOwn(answers, key)).length;

  function updateAnswer(key: string, value: number | string | null) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function save(submit: boolean) {
    if (busy.current || isSubmitted) return;
    busy.current = true;
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await onSave({ campaignId, answers: { ...answers }, submit });
        if (result.error || result.success !== true) {
          setFeedback({ kind: "error", text: result.error || "Não foi possível confirmar a gravação. Suas respostas continuam nesta tela; tente novamente." });
          return;
        }
        setFeedback({ kind: "success", text: result.message || (submit ? "Autoavaliação enviada e registrada." : "Rascunho salvo. Você pode continuar depois.") });
        if (submit) {
          setSent(true);
          setReviewing(false);
        }
        router.refresh();
      } catch {
        setFeedback({ kind: "error", text: "Não conseguimos confirmar a gravação. Suas respostas continuam nesta tela. Verifique sua conexão e tente novamente." });
      } finally {
        busy.current = false;
      }
    });
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setFeedback(null);
    setReviewing(true);
  }

  function edit() {
    setReviewing(false);
    setFeedback(null);
    requestAnimationFrame(() => editHeading.current?.focus());
  }

  if (isSubmitted) {
    return (
      <div className="space-y-5">
        <EvaluationStatus feedback={feedback || { kind: "success", text: "Autoavaliação registrada. Você pode consultar suas respostas abaixo." }} />
        <section className={evaluationPanelClass}>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-ink"><CheckCircle2 size={21} className="text-folha" aria-hidden="true" />Suas respostas</h3>
          <p className="mb-5 mt-2 text-sm leading-6 text-stone-600">Este registro está vinculado à sua conta e disponível para você e os responsáveis autorizados. Para uma correção, procure a coordenação.</p>
          <AnswersSummary questions={[...ratingQuestions, ...textQuestions]} answers={answers} />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-busy={pending}>
      <aside className="flex gap-3 rounded-xl border border-stone-200 bg-[#f7f7f2] p-4 text-sm leading-6 text-stone-700">
        <ClipboardCheck size={21} className="mt-0.5 shrink-0 text-folha" aria-hidden="true" />
        <p><strong className="text-ink">Sua evolução fica registrada.</strong> Esta autoavaliação é identificada e pode ser consultada por você e pelos responsáveis autorizados. Ela ajuda a orientar seu aprendizado e o apoio pedagógico.</p>
      </aside>

      {reviewing ? (
        <EvaluationReview title="Revise sua autoavaliação">
          <AnswersSummary questions={[...ratingQuestions, ...textQuestions]} answers={answers} />
          <p className="rounded-lg bg-[#f7f7f2] p-3 text-sm leading-6 text-stone-600">Ao confirmar, suas respostas serão registradas como avaliação final. Depois do envio, correções precisam ser solicitadas à coordenação.</p>
          <EvaluationStatus feedback={feedback} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={edit} disabled={pending} className="h-11"><ArrowLeft size={17} aria-hidden="true" />Voltar e editar</Button>
            <Button type="button" onClick={() => save(true)} disabled={pending} className={evaluationPrimaryClass}>{pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}{pending ? "Registrando..." : "Confirmar envio"}</Button>
          </div>
        </EvaluationReview>
      ) : (
        <form onSubmit={review} className="space-y-5">
          <section className={evaluationPanelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 ref={editHeading} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">Como está seu aprendizado?</h3>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{answeredCount} de 5 respondidas</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-stone-600">Marque uma opção em cada afirmação: 1 = discordo totalmente; 5 = concordo totalmente. Use N/A quando não se aplicar.</p>
            <div className="mt-6 space-y-6">
              {ratingQuestions.map((question) => <RatingField key={question.key} name={question.key} label={question.label} value={typeof answers[question.key] === "number" || answers[question.key] === null ? answers[question.key] as number | null : undefined} onChange={(value) => updateAnswer(question.key, value)} disabled={pending} />)}
            </div>
          </section>
          <fieldset disabled={pending} className={`${evaluationPanelClass} min-w-0 space-y-5`}>
            <legend className="sr-only">Reflexões sobre seu aprendizado</legend>
            <h3 className="text-lg font-semibold text-ink">Espaço para refletir</h3>
            <PrivacyReminder />
            {textQuestions.map((question) => <EvaluationTextField key={question.key} name={question.key} label={question.label} value={typeof answers[question.key] === "string" ? answers[question.key] as string : ""} onChange={(value) => updateAnswer(question.key, value)} />)}
          </fieldset>
          <EvaluationStatus feedback={feedback} />
          <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={() => save(false)} disabled={pending} className="h-11">{pending ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}Salvar rascunho</Button>
            <Button type="submit" disabled={pending} className={evaluationPrimaryClass}><ClipboardCheck size={18} aria-hidden="true" />Revisar e enviar</Button>
          </div>
        </form>
      )}
    </div>
  );
}
