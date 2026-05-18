"use client";

import { X } from "lucide-react";
import type { ApproachOutcome } from "@/types/mobile";

const outcomes: Array<{ id: ApproachOutcome; label: string; description: string }> = [
  { id: "orientada", label: "Pessoa orientada", description: "Recebeu orientacao e segue acompanhada." },
  { id: "convidada", label: "Convidada para mutirao", description: "Aceitou convite para acao coletiva." },
  { id: "ausente", label: "Ausente", description: "Nao encontrada na abordagem." },
  { id: "recusou", label: "Recusou participar", description: "Registro agregado de recusa." },
  { id: "triagem", label: "Precisa de triagem", description: "Sinalizar para avaliacao rapida." }
];

export function ApproachModal({
  open,
  onClose,
  onSelect
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (outcome: ApproachOutcome) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end bg-black/40 p-3 sm:items-center sm:justify-center">
      <section className="w-full rounded-2xl bg-white p-4 shadow-xl sm:max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-folha">
              Registro rapido
            </p>
            <h2 className="mt-1 text-xl font-semibold">Como foi a abordagem?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-stone-100"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {outcomes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="w-full rounded-xl border border-stone-200 bg-white p-4 text-left active:bg-green-50"
            >
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-stone-500">{item.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
