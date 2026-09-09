"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CheckCircle2, Info, ShieldCheck, TriangleAlert } from "lucide-react";

export type EvaluationActionResult = {
  success?: boolean;
  message?: string;
  error?: string;
};

export type EvaluationFeedback = { kind: "success" | "error"; text: string } | null;
export type EvaluationQuestion = { key: string; label: string };

export const evaluationPanelClass = "rounded-2xl border border-stone-200 bg-white p-5 sm:p-6";
export const evaluationPrimaryClass = "h-11 bg-folha hover:bg-[#17623d] focus-visible:ring-offset-2";
export const evaluationInputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-base text-ink placeholder:text-stone-400 focus:border-folha focus:outline-none focus:ring-2 focus:ring-folha/25 disabled:bg-stone-50";

export function RatingField({
  name,
  label,
  value,
  onChange,
  disabled = false,
}: {
  name: string;
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const options: Array<{ value: number | null; label: string; accessibleLabel: string }> = [
    ...[1, 2, 3, 4, 5].map((rating) => ({ value: rating, label: String(rating), accessibleLabel: `${rating} de 5` })),
    { value: null, label: "N/A", accessibleLabel: "Não se aplica" },
  ];

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="text-sm font-semibold leading-6 text-ink">{label}</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {options.map((option) => (
          <label key={option.label} className="relative cursor-pointer">
            <input
              type="radio"
              name={`${id}-${name}`}
              value={option.value ?? "na"}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              required
              aria-label={option.accessibleLabel}
              className="peer sr-only"
            />
            <span className="flex min-h-12 items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-600 transition peer-checked:border-folha peer-checked:bg-green-50 peer-checked:text-green-900 peer-focus-visible:ring-2 peer-focus-visible:ring-folha peer-focus-visible:ring-offset-2 peer-disabled:cursor-default">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function EvaluationTextField({
  name,
  label,
  value,
  onChange,
  maxLength = 1500,
  minLength,
  required = false,
  hint,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minLength?: number;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label} {!required ? <span className="font-normal text-stone-500">(opcional)</span> : null}
      </label>
      {hint ? <p id={`${id}-hint`} className="text-sm leading-6 text-stone-600">{hint}</p> : null}
      <textarea
        id={id}
        name={name}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        minLength={minLength}
        required={required}
        aria-describedby={`${hint ? `${id}-hint ` : ""}${id}-count`}
        className={evaluationInputClass}
      />
      <p id={`${id}-count`} className="text-right text-xs text-stone-500">
        {value.length} de {maxLength} caracteres
      </p>
    </div>
  );
}

export function EvaluationStatus({ feedback }: { feedback: EvaluationFeedback }) {
  if (!feedback) return null;
  const success = feedback.kind === "success";
  const Icon = success ? CheckCircle2 : TriangleAlert;
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${success ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}
    >
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{feedback.text}</p>
    </div>
  );
}

export function AnonymityNotice({ suggestions = false }: { suggestions?: boolean }) {
  return (
    <aside className="flex gap-3 rounded-xl border border-green-200 bg-green-50/70 p-4 text-sm leading-6 text-green-950">
      <ShieldCheck size={21} className="mt-0.5 shrink-0 text-folha" aria-hidden="true" />
      <div className="space-y-2">
        <p className="font-semibold">{suggestions ? "Sua sugestão, sem identificação do autor" : "Avaliação sem identificação do autor"}</p>
        <p>Sua conta é usada para verificar se você pode participar. O conteúdo enviado não registra a identidade do autor e não entra no seu histórico pessoal.</p>
        <p>{suggestions ? "A equipe responsável lê o texto para analisar melhorias." : "Os resultados são apresentados em grupos com pelo menos cinco respostas."} Operadores da infraestrutura podem ter registros técnicos de acesso. Isso limita a garantia de anonimato.</p>
      </div>
    </aside>
  );
}

export function PrivacyReminder() {
  return (
    <p className="flex gap-2 rounded-lg bg-[#f7f7f2] p-3 text-sm leading-6 text-stone-600">
      <Info size={18} className="mt-1 shrink-0" aria-hidden="true" />
      Não inclua nomes de pacientes, colegas ou outras pessoas, documentos, contatos ou detalhes que permitam identificá-las.
    </p>
  );
}

export function EvaluationReview({ title, children }: { title: string; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return (
    <section className={evaluationPanelClass}>
      <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-folha">{title}</h3>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function AnswersSummary({
  questions,
  answers,
}: {
  questions: EvaluationQuestion[];
  answers: Record<string, number | string | null>;
}) {
  return (
    <dl className="divide-y divide-stone-100">
      {questions.map((question) => {
        const value = answers[question.key];
        const display = value === null ? "Não se aplica" : typeof value === "number" ? `${value} de 5` : value?.trim() || "Não preenchido";
        return (
          <div key={question.key} className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-5">
            <dt className="text-sm font-medium text-stone-600">{question.label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm leading-6 text-ink">{display}</dd>
          </div>
        );
      })}
    </dl>
  );
}
