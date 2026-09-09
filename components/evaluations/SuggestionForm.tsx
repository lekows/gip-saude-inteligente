"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, MessageSquarePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnonymityNotice,
  AnswersSummary,
  EvaluationReview,
  EvaluationStatus,
  EvaluationTextField,
  PrivacyReminder,
  evaluationInputClass,
  evaluationPanelClass,
  evaluationPrimaryClass,
  type EvaluationActionResult,
  type EvaluationFeedback,
} from "./EvaluationFields";

const categories = [
  { value: "aulas", label: "Aulas" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "organizacao", label: "Organização" },
  { value: "materiais", label: "Materiais" },
  { value: "campo", label: "Atividades de campo" },
  { value: "site", label: "Site" },
  { value: "outro", label: "Outro assunto" },
];

export type SuggestionFormProps = {
  onSubmit: (input: {
    nonce: string;
    category: string;
    message: string;
    proposal: string;
  }) => Promise<EvaluationActionResult>;
};

export function SuggestionForm({ onSubmit }: SuggestionFormProps) {
  const router = useRouter();
  const categoryId = useId();
  const [category, setCategory] = useState("outro");
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState("");
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
    if (message.trim().length < 10) {
      setFeedback({ kind: "error", text: "Descreva sua sugestão com pelo menos 10 caracteres, sem contar espaços no início e no fim." });
      event.currentTarget.querySelector<HTMLTextAreaElement>("textarea[name='message']")?.focus();
      return;
    }
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
        const result = await onSubmit({ nonce: nonce.current, category, message: message.trim(), proposal: proposal.trim() });
        if (result.error || result.success !== true) {
          setFeedback({ kind: "error", text: result.error || "Não foi possível confirmar o envio. Seu texto continua nesta tela; tente novamente." });
          return;
        }
        setSent(true);
        setMessage("");
        setProposal("");
        setCategory("outro");
        setReviewing(false);
        router.refresh();
      } catch {
        setFeedback({ kind: "error", text: "Não conseguimos confirmar o envio. Seu texto continua nesta tela. Verifique sua conexão e tente novamente." });
      } finally {
        busy.current = false;
      }
    });
  }

  if (sent) {
    return (
      <section className={`${evaluationPanelClass} text-center`}>
        <div role="status">
          <CheckCircle2 size={36} className="mx-auto text-folha" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-ink">Sugestão recebida</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-600">Sua contribuição foi registrada para análise da equipe responsável. Acompanhe os encaminhamentos no mural de melhorias. O texto não entra no seu histórico pessoal.</p>
        </div>
        <Button type="button" variant="outline" className="mt-5 h-11" onClick={() => { nonce.current = null; setSent(false); setFeedback(null); requestAnimationFrame(() => editHeading.current?.focus()); }}><MessageSquarePlus size={18} aria-hidden="true" />Enviar outra sugestão</Button>
      </section>
    );
  }

  return (
    <div className="space-y-5" aria-busy={pending}>
      <AnonymityNotice suggestions />
      {reviewing ? (
        <EvaluationReview title="Revise sua sugestão">
          <AnswersSummary questions={[{ key: "category", label: "Assunto" }, { key: "message", label: "O que poderia melhorar?" }, { key: "proposal", label: "Como você sugere resolver?" }]} answers={{ category: categories.find((item) => item.value === category)?.label || "Outro assunto", message, proposal }} />
          <PrivacyReminder />
          <p className="text-sm leading-6 text-stone-600">Depois do envio, você não poderá consultar ou editar este texto pela sua conta. Confira se ele não contém informações que identifiquem alguém.</p>
          <EvaluationStatus feedback={feedback} />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" disabled={pending} onClick={() => { setReviewing(false); setFeedback(null); requestAnimationFrame(() => editHeading.current?.focus()); }} className="h-11"><ArrowLeft size={17} aria-hidden="true" />Voltar e editar</Button>
            <Button type="button" disabled={pending} onClick={submit} className={evaluationPrimaryClass}>{pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}{pending ? "Registrando..." : "Confirmar envio"}</Button>
          </div>
        </EvaluationReview>
      ) : (
        <form onSubmit={review} className={`${evaluationPanelClass} space-y-5`}>
          <div>
            <h3 ref={editHeading} tabIndex={-1} className="text-lg font-semibold text-ink outline-none">O GIP também se constrói com você</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">Conte o que pode melhorar e, se quiser, proponha uma solução.</p>
          </div>
          <PrivacyReminder />
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <legend className="sr-only">Sua sugestão de melhoria</legend>
            <div className="space-y-2">
              <label htmlFor={categoryId} className="block text-sm font-semibold text-ink">Assunto <span className="font-normal text-stone-500">(opcional)</span></label>
              <select id={categoryId} name="category" value={category} onChange={(event) => { setCategory(event.target.value); setFeedback(null); }} className={evaluationInputClass}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </div>
            <EvaluationTextField name="message" label="O que poderia melhorar?" value={message} onChange={(value) => { setMessage(value); setFeedback(null); }} required minLength={10} maxLength={3000} hint="Descreva a situação de forma objetiva, sem identificar pessoas." />
            <EvaluationTextField name="proposal" label="Como você sugere resolver?" value={proposal} onChange={(value) => { setProposal(value); setFeedback(null); }} />
          </fieldset>
          <EvaluationStatus feedback={feedback} />
          <div className="flex justify-end border-t border-stone-100 pt-5">
            <Button type="submit" disabled={pending} className={`${evaluationPrimaryClass} w-full sm:w-auto`}><ClipboardCheck size={18} aria-hidden="true" />Revisar sugestão</Button>
          </div>
        </form>
      )}
    </div>
  );
}
