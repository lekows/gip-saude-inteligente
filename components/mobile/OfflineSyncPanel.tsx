"use client";

import { Cloud, CloudOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfflineApproachRecord } from "@/types/mobile";

export function OfflineSyncPanel({
  isOnline,
  records,
  pendingCount,
  onSync
}: {
  isOnline: boolean;
  records: OfflineApproachRecord[];
  pendingCount: number;
  onSync: () => void;
}) {
  const latest = records.slice(0, 3);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-folha">
            Modo offline
          </p>
          <h2 className="mt-1 text-xl font-semibold">Fila local de registros</h2>
          <p className="mt-1 text-sm text-stone-500">
            {pendingCount > 0
              ? `${pendingCount} abordagem(ns) aguardando sincronizacao.`
              : "Tudo sincronizado neste aparelho."}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isOnline ? "bg-green-50 text-folha" : "bg-yellow-50 text-yellow-800"
          }`}
        >
          {isOnline ? <Cloud size={14} /> : <CloudOff size={14} />}
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <Mini label="Total" value={records.length} />
        <Mini label="Pendentes" value={pendingCount} />
        <Mini label="Enviados" value={records.length - pendingCount} />
      </div>

      {latest.length > 0 ? (
        <div className="mt-4 space-y-2">
          {latest.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-[#fbfbf7] p-3 text-sm"
            >
              <div>
                <p className="font-semibold">{formatOutcome(record.outcome)}</p>
                <p className="text-xs text-stone-500">{formatTime(record.createdAt)}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  record.syncStatus === "pendente"
                    ? "bg-yellow-50 text-yellow-800"
                    : "bg-green-50 text-folha"
                }`}
              >
                {record.syncStatus}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <Button
        className="mt-4 h-12 w-full text-base"
        variant={pendingCount > 0 ? "default" : "outline"}
        onClick={onSync}
        disabled={pendingCount === 0}
      >
        <RotateCw size={17} />
        Sincronizar agora
      </Button>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-[#fbfbf7] p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatOutcome(outcome: OfflineApproachRecord["outcome"]) {
  const labels: Record<OfflineApproachRecord["outcome"], string> = {
    orientada: "Orientada",
    convidada: "Convidada",
    ausente: "Ausente",
    recusou: "Recusou",
    triagem: "Precisa de triagem"
  };

  return labels[outcome];
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
