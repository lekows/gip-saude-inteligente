import { SELF_RATINGS, SELF_TEXTS } from "@/lib/evaluations/rules";
import type { EvaluationAnswers } from "@/types/evaluations";

export function AnswerSummary({ answers }: { answers: EvaluationAnswers }) {
  return <dl className="grid gap-4 sm:grid-cols-2">
    {Object.entries({ ...SELF_RATINGS, ...SELF_TEXTS }).map(([key, label]) => <div className="min-w-0" key={key}>
      <dt className="text-xs font-semibold text-stone-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{answers[key] === null ? "Não se aplica" : typeof answers[key] === "number" ? `${answers[key]} / 5` : answers[key] || "Não informado"}</dd>
    </div>)}
  </dl>;
}
