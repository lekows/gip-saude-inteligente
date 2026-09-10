"use client";
import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EvaluationActionResult } from "@/types/evaluations";

export function ManagementForm({ action, label, children, resetOnSuccess = false }: { action: (form: FormData) => Promise<EvaluationActionResult>; label: string; children: React.ReactNode; resetOnSuccess?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<EvaluationActionResult>({});
  const busy = useRef(false), router = useRouter(), messageId = useId();
  return <form aria-describedby={messageId} className="space-y-4" onSubmit={(event) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const form = event.currentTarget, data = new FormData(form);
    startTransition(async () => {
      try {
        const response = await action(data); setResult(response);
        if (response.success) { if (resetOnSuccess) form.reset(); router.refresh(); }
      } catch { setResult({ error: "Não foi possível concluir. Confira sua conexão e tente novamente." }); }
      finally { busy.current = false; }
    });
  }}>
    <fieldset disabled={pending} className="space-y-4">{children}</fieldset>
    <div id={messageId} aria-live="polite" role={result.error ? "alert" : "status"} className={`text-sm ${result.error ? "text-red-800" : "text-green-800"}`}>{result.error || result.message}</div>
    <button disabled={pending} className="rounded-md bg-folha px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">{pending ? "Salvando…" : label}</button>
  </form>;
}

export function CampaignForm({ cycles, classes, action }: {
  cycles: { id: string; name: string }[];
  classes: { id: string; cycle_id: string; title: string | null }[];
  action: (form: FormData) => Promise<EvaluationActionResult>;
}) {
  const [cycle, setCycle] = useState(cycles[0]?.id || "");
  const [kind, setKind] = useState("self");
  const prefix = useId();
  return <ManagementForm action={action} label="Criar avaliação" resetOnSuccess>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-title`}>Título<input id={`${prefix}-title`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="title" required minLength={5} maxLength={160} placeholder="Ex.: Autoavaliação após a capacitação" /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-kind`}>Tipo<select id={`${prefix}-kind`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="kind" value={kind} onChange={(event) => setKind(event.target.value)}><option value="self">Autoavaliação identificada</option><option value="program">Avaliação anônima do GIP</option></select></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-cycle`}>Ciclo<select id={`${prefix}-cycle`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="cycle_id" required value={cycle} onChange={(event) => setCycle(event.target.value)}>{cycles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-class`}>Público<select key={cycle} id={`${prefix}-class`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="class_id"><option value="">Participantes ativos do ciclo</option>{classes.filter((item) => item.cycle_id === cycle).map((item) => <option key={item.id} value={item.id}>{item.title || "Capacitação"}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-stage`}>Etapa<select id={`${prefix}-stage`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="stage"><option value="initial">Inicial</option><option value="module">Após módulo (selecione a capacitação)</option><option value="final">Encerramento do ciclo</option></select></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-status`}>Disponibilidade<select id={`${prefix}-status`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" name="status"><option value="draft">Preparar rascunho</option><option value="open">Abrir durante o período informado</option></select></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-start`}>Abertura (Brasília)<input id={`${prefix}-start`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" type="date" name="opens_at" required /></label>
      <label className="grid gap-2 text-sm font-semibold" htmlFor={`${prefix}-end`}>Encerramento (Brasília)<input id={`${prefix}-end`} className="rounded-md border border-stone-300 bg-white px-3 py-2 font-normal" type="date" name="closes_at" required /></label>
    </div>
    <p className="text-xs leading-5 text-stone-500">Abertura às 00h e encerramento às 23h59 no horário de Brasília. {kind === "program" ? "Depois de encerrada, a avaliação anônima não pode ser reaberta; crie outra para um novo período." : "Respostas identificadas ficam acessíveis somente aos responsáveis autorizados. Rascunhos são privados do aluno."}</p>
  </ManagementForm>;
}
