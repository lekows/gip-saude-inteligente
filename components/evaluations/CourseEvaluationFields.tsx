"use client";

import { useId } from "react";
import { Star } from "lucide-react";
import { EvaluationTextField } from "./EvaluationFields";
import type { EvaluationAnswers } from "@/types/evaluations";

export function CourseEvaluationFields({ answers, onChange, disabled = false }: {
  answers: EvaluationAnswers;
  onChange: (key: string, value: number | string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const rating = typeof answers.course_rating === "number" ? answers.course_rating : 0;

  return <fieldset disabled={disabled} className="min-w-0 space-y-6">
    <legend className="sr-only">Sua avaliação do curso</legend>
    <fieldset className="space-y-3" aria-describedby={`${id}-hint`}>
      <legend className="text-base font-semibold text-ink">Como você classifica o curso?</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => <label key={value} className="relative cursor-pointer">
          <input
            type="radio" name={`${id}-course-rating`} value={value}
            checked={rating === value} onChange={() => onChange("course_rating", value)}
            required aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
            className="peer sr-only"
          />
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-stone-200 bg-white transition hover:border-amber-400 peer-checked:border-amber-500 peer-checked:bg-amber-50 peer-focus-visible:ring-2 peer-focus-visible:ring-folha peer-focus-visible:ring-offset-2 peer-disabled:cursor-default">
            <Star size={30} aria-hidden="true" className={value <= rating ? "fill-amber-400 text-amber-500" : "text-stone-400"} />
          </span>
        </label>)}
      </div>
      <p id={`${id}-hint`} className="text-sm text-stone-600" aria-live="polite">
        {rating ? `${rating} ${rating === 1 ? "estrela selecionada" : "estrelas selecionadas"}.` : "Selecione de 1 a 5 estrelas."} 1 = muito ruim; 5 = excelente.
      </p>
    </fieldset>
    <EvaluationTextField
      name="course_review" label="O que você achou do curso?"
      value={typeof answers.course_review === "string" ? answers.course_review : ""}
      onChange={(value) => onChange("course_review", value)}
      hint="Conte o que foi bom e o que pode melhorar. Não inclua dados pessoais de outras pessoas."
    />
  </fieldset>;
}
