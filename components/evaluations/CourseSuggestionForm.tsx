"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { EvaluationStatus, EvaluationTextField, evaluationPanelClass, evaluationPrimaryClass, type EvaluationFeedback } from "./EvaluationFields";
import type { SuggestionFormProps } from "./SuggestionForm";

// Intentionally accepts no course, response, student or enrollment identifier.
export function CourseSuggestionForm({ onSubmit }: SuggestionFormProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationFeedback>(null);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  const [attempted, setAttempted] = useState(false);
  // Freeze the nonce and payload for safe retries after an uncertain network result.
  const submission = useRef<Parameters<SuggestionFormProps["onSubmit"]>[0] | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || sent) return;
    if (message.trim().length < 10) {
      setFeedback({ kind: "error", text: "Escreva pelo menos 10 caracteres, sem contar espaços no início e no fim." });
      return;
    }
    busy.current = true;
    setFeedback(null);
    startTransition(async () => {
      try {
        submission.current ??= { nonce: crypto.randomUUID(), category: "aulas", message: message.trim(), proposal: "" };
        setAttempted(true);
        const result = await onSubmit(submission.current);
        if (result.success !== true || result.error) {
          setFeedback({ kind: "error", text: result.error || "Não foi possível confirmar o envio. Tente novamente nesta tela." });
          return;
        }
        setSent(true);
        setMessage("");
        submission.current = null;
      } catch {
        setFeedback({ kind: "error", text: "Não conseguimos confirmar o envio. Seu texto está preservado. Tente novamente nesta tela para evitar um envio duplicado." });
      } finally {
        busy.current = false;
      }
    });
  }

  if (sent) return <section className={`${evaluationPanelClass} space-y-4`}>
    <EvaluationStatus feedback={{ kind: "success", text: "Obrigado por falar com sinceridade! Sua contribuição foi recebida e vai ajudar a melhorar o curso." }} />
    <p className="text-sm leading-6 text-stone-600">A sugestão não aparece no seu histórico pessoal. Os encaminhamentos revisados pela coordenação poderão ser publicados no mural de melhorias.</p>
    <Link href="/avaliacoes" className="inline-block font-semibold text-folha hover:underline">Concluir</Link>
  </section>;

  return <div className="max-w-3xl space-y-5" aria-busy={pending}>
    <p className="text-sm font-semibold text-folha">Etapa 2 de 2 · Sua opinião para melhorar</p>
    <aside className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-950">
      <h2 className="text-lg font-semibold">Pode falar com sinceridade</h2>
      <p>Esta é nossa primeira avaliação e queremos melhorar com você. Fique à vontade para dizer o que não funcionou, sugerir mudanças ou fazer uma crítica. Sua opinião é bem-vinda e será lida com respeito.</p>
      <p><strong>Seu nome não acompanha esta mensagem.</strong> Ela é guardada separadamente da avaliação do curso, sem vínculo com seu cadastro, e lida somente pela coordenação e administração.</p>
      <details><summary className="cursor-pointer font-semibold">Como protegemos seu anonimato</summary>
        <p className="mt-2">Sua conta é usada apenas para verificar se você pode participar. A sugestão não guarda autor, turma, avaliação ou horário exato. Não escreva seu nome nem detalhes que identifiquem você ou outras pessoas. Podem existir registros técnicos de acesso na infraestrutura; por isso, não é possível garantir anonimato absoluto.</p>
      </details>
    </aside>
    <form onSubmit={submit} className={`${evaluationPanelClass} space-y-5`}>
      <fieldset disabled={pending || attempted}>
        <EvaluationTextField name="message" label="O que podemos melhorar?" value={message} onChange={value => { setMessage(value); setFeedback(null); }} required minLength={10} maxLength={3000} hint="Escreva uma sugestão ou crítica com pelo menos 10 caracteres. Evite nomes e detalhes que identifiquem pessoas." />
      </fieldset>
      <EvaluationStatus feedback={feedback} />
      {attempted && <p className="text-xs leading-5 text-stone-500">Mantemos o mesmo texto ao tentar novamente para evitar duplicidade.</p>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!attempted && <Link href="/avaliacoes" className="text-sm text-stone-600 hover:underline">Concluir sem sugestão</Link>}
        <Button type="submit" disabled={pending} className={evaluationPrimaryClass}>{pending ? "Enviando..." : attempted ? "Tentar novamente" : "Enviar sugestão anônima"}</Button>
      </div>
    </form>
  </div>;
}
