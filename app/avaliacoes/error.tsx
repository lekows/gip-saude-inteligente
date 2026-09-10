"use client";
export default function EvaluationError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-5 py-12"><h1 className="text-2xl font-semibold">Não foi possível carregar as avaliações</h1><p className="mt-4 text-sm leading-6 text-stone-600">O serviço pode estar temporariamente indisponível. Seus envios já confirmados continuam registrados.</p><button onClick={reset} className="mt-5 rounded-md bg-folha px-5 py-3 font-semibold text-white">Tentar novamente</button></main>;
}
