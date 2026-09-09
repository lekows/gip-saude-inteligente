import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

export function EvaluationLayout({ title, description, children, back = "/avaliacoes", backLabel = "Avaliações e sugestões" }: {
  title: string; description: string; children: React.ReactNode; back?: string; backLabel?: string;
}) {
  return <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
    <div className="mx-auto max-w-6xl">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-folha hover:underline" href={back}><ArrowLeft size={16} />{backLabel}</Link>
      <header className="mt-5 border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-folha"><ClipboardCheck size={18} />Formação e participação</div>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
      </header>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  </main>;
}

export const evaluationDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value));
