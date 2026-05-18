"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  MapPinned,
  Navigation,
  Radio,
  Send,
  Stethoscope
} from "lucide-react";
import { ApproachModal } from "@/components/mobile/ApproachModal";
import { MainActionButton } from "@/components/mobile/MainActionButton";
import { MobileMissionCard } from "@/components/mobile/MobileMissionCard";
import { OfflineSyncPanel } from "@/components/mobile/OfflineSyncPanel";
import { QuickScreeningCard } from "@/components/mobile/QuickScreeningCard";
import { Button } from "@/components/ui/button";
import {
  applyApproachOutcome,
  createOfflineApproachRecord,
  getMobileMvpData,
  markRecordsAsSynced,
  summarizeOfflineQueue
} from "@/lib/mobileMvpService";
import type { ApproachOutcome, OfflineApproachRecord } from "@/types/mobile";

const SimpleRiskMap = dynamic(
  () => import("@/components/mobile/SimpleRiskMap").then((mod) => mod.SimpleRiskMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[320px] place-items-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
        Carregando mapa de campo...
      </div>
    )
  }
);

const { mission } = getMobileMvpData();
const queueStorageKey = "gip-mobile-offline-queue";

export default function MobilePage() {
  const [stats, setStats] = useState(mission.stats);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("Pronto para registrar a proxima abordagem.");
  const [isOnline, setIsOnline] = useState(mission.online);
  const [offlineRecords, setOfflineRecords] = useState<OfflineApproachRecord[]>([]);
  const queueSummary = useMemo(() => summarizeOfflineQueue(offlineRecords), [offlineRecords]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const stored = window.localStorage.getItem(queueStorageKey);
    if (stored) {
      setOfflineRecords(JSON.parse(stored) as OfflineApproachRecord[]);
    }

    function handleOnline() {
      setIsOnline(true);
      setFeedback("Conexao voltou. Voce pode sincronizar a fila local.");
    }

    function handleOffline() {
      setIsOnline(false);
      setFeedback("Sem internet. Os registros serao guardados neste aparelho.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(queueStorageKey, JSON.stringify(offlineRecords));
  }, [offlineRecords]);

  function handleOutcome(outcome: ApproachOutcome) {
    const record = createOfflineApproachRecord({
      outcome,
      missionTitle: mission.title,
      neighborhood: mission.neighborhood
    });

    setStats((current) => applyApproachOutcome(current, outcome));
    setOfflineRecords((current) => [record, ...current]);
    setModalOpen(false);
    setFeedback(`${getOutcomeMessage(outcome)} Registro salvo na fila local.`);
  }

  function handleSyncQueue() {
    setOfflineRecords((current) => markRecordsAsSynced(current));
    setFeedback("Sincronizacao simulada concluida. Registros enviados de forma agregada.");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <section className="mx-auto max-w-md px-4 pb-28 pt-4">
        <header className="rounded-2xl bg-ink p-4 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">GIP Saude Inteligente</p>
              <h1 className="mt-1 text-3xl font-semibold leading-tight">Busca Ativa</h1>
              <p className="mt-1 text-sm text-white/75">{mission.neighborhood}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <Radio size={13} className={isOnline ? "text-green-300" : "text-trigo"} />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </header>

        <div className="mt-4">
          <MobileMissionCard
            theme={mission.conditionTheme}
            neighborhood={mission.neighborhood}
            stats={stats}
          />
        </div>

        <section className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-folha">
                Territorio
              </p>
              <h2 className="text-xl font-semibold">Mapa de risco</h2>
            </div>
            <MapPinned size={24} className="text-folha" />
          </div>
          <SimpleRiskMap center={mission.center} areas={mission.riskAreas} markers={mission.markers} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button className="h-12" variant="outline" onClick={() => setFeedback("Mapa aberto para consulta da area prioritaria.")}>
              <ArrowUpRight size={17} />
              Ver no mapa
            </Button>
            <Button className="h-12" variant="outline" onClick={() => setFeedback("Rota simulada ate o ponto de mutirao.")}>
              <Navigation size={17} />
              Como chegar
            </Button>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-folha">
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <CheckCircle2 size={18} />
            Status da equipe
          </div>
          {feedback}
        </section>

        <div className="mt-4">
          <OfflineSyncPanel
            isOnline={isOnline}
            records={offlineRecords}
            pendingCount={queueSummary.pending}
            onSync={handleSyncQueue}
          />
        </div>

        <section className="mt-4 grid grid-cols-1 gap-3">
          <Button className="h-13 min-h-12 text-base" variant="outline" onClick={() => handleOutcome("convidada")}>
            <Send size={18} />
            Convidar para mutirao
          </Button>
          <Button className="h-13 min-h-12 text-base" variant="outline" onClick={() => setFeedback("Use a triagem rapida abaixo para classificar o alerta.")}>
            <Stethoscope size={18} />
            Triagem rapida
          </Button>
          <Button className="h-13 min-h-12 text-base" variant="outline" onClick={() => setFeedback("Encaminhamento agregado sinalizado para a UBS.")}>
            <MapPinned size={18} />
            Encaminhar para UBS
          </Button>
        </section>

        <div className="mt-4">
          <QuickScreeningCard />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[1200] bg-gradient-to-t from-[#f7f7f2] via-[#f7f7f2] to-transparent px-4 pb-4 pt-8">
        <div className="mx-auto max-w-md">
          <MainActionButton onClick={() => setModalOpen(true)} />
        </div>
      </div>

      <ApproachModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleOutcome} />
    </main>
  );
}

function getOutcomeMessage(outcome: ApproachOutcome) {
  const messages: Record<ApproachOutcome, string> = {
    orientada: "Abordagem registrada: pessoa orientada.",
    convidada: "Convite registrado para o proximo mutirao.",
    ausente: "Ausencia registrada de forma agregada.",
    recusou: "Recusa registrada sem identificacao individual.",
    triagem: "Triagem sinalizada; confira classificacao rapida."
  };

  return messages[outcome];
}
