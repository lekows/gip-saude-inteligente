"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Loader2,
  Save,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveClassAttendance } from "@/app/gestao-academica/actions";
import type {
  AcademicAttendanceStatus,
  AttendanceRosterData,
} from "@/types/academic";

const statusOptions: Array<{
  value: AcademicAttendanceStatus;
  label: string;
  icon: typeof Check;
  activeClass: string;
}> = [
  {
    value: "presente",
    label: "Presente",
    icon: Check,
    activeClass: "border-green-600 bg-green-50 text-green-800",
  },
  {
    value: "ausente",
    label: "Ausente",
    icon: CircleSlash,
    activeClass: "border-red-500 bg-red-50 text-red-800",
  },
  {
    value: "justificado",
    label: "Justificado",
    icon: Clock3,
    activeClass: "border-amber-500 bg-amber-50 text-amber-900",
  },
];

export function AttendanceRoster({ data }: { data: AttendanceRosterData }) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, AcademicAttendanceStatus | null>>(
    Object.fromEntries(data.entries.map((entry) => [entry.enrollmentId, entry.status])),
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const totals = useMemo(() => {
    const values = Object.values(statuses);
    return {
      marked: values.filter(Boolean).length,
      present: values.filter((value) => value === "presente").length,
      absent: values.filter((value) => value === "ausente").length,
      justified: values.filter((value) => value === "justificado").length,
    };
  }, [statuses]);

  function markAll(status: AcademicAttendanceStatus) {
    setStatuses(Object.fromEntries(data.entries.map((entry) => [entry.enrollmentId, status])));
    setFeedback(null);
  }

  async function handleSave() {
    if (totals.marked !== data.entries.length) {
      setFeedback({ kind: "error", text: "Marque a situação de todos os acadêmicos antes de salvar." });
      return;
    }

    setSaving(true);
    setFeedback(null);
    const result = await saveClassAttendance(
      data.classInfo.id,
      data.entries.map((entry) => ({
        enrollmentId: entry.enrollmentId,
        status: statuses[entry.enrollmentId]!,
        notes: entry.notes || undefined,
      })),
    );
    setSaving(false);
    setFeedback({
      kind: result.error ? "error" : "success",
      text: result.error || result.message || "Chamada salva.",
    });
    if (!result.error) router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RosterMetric label="Marcados" value={`${totals.marked}/${data.entries.length}`} />
        <RosterMetric label="Presentes" value={totals.present} tone="green" />
        <RosterMetric label="Ausentes" value={totals.absent} tone="red" />
        <RosterMetric label="Justificados" value={totals.justified} tone="amber" />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => markAll("presente")}>
          <CheckCircle2 size={17} />
          Todos presentes
        </Button>
        <Button variant="outline" onClick={() => markAll("ausente")}>
          <CircleSlash size={17} />
          Todos ausentes
        </Button>
      </div>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <div className="divide-y divide-stone-200">
          {data.entries.map((entry, index) => (
            <div
              key={entry.enrollmentId}
              className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-center"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-400">{String(index + 1).padStart(2, "0")}</p>
                <p className="truncate font-semibold text-ink">{entry.fullName}</p>
                <p className="truncate text-xs text-stone-500">{entry.email || "E-mail não informado"}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const active = statuses[entry.enrollmentId] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setStatuses((current) => ({
                          ...current,
                          [entry.enrollmentId]: option.value,
                        }));
                        setFeedback(null);
                      }}
                      className={`inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold transition sm:px-3 ${
                        active
                          ? option.activeClass
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {data.entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Nenhum acadêmico está matriculado nesta capacitação.
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {feedback ? (
            <p
              className={`flex items-start gap-2 text-sm ${
                feedback.kind === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {feedback.kind === "success" ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
              ) : (
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
              )}
              {feedback.text}
            </p>
          ) : (
            <p className="text-sm text-stone-500">
              {totals.marked === data.entries.length
                ? "Chamada completa e pronta para salvar."
                : `Faltam ${data.entries.length - totals.marked} registros.`}
            </p>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || data.entries.length === 0}
          className="h-11 bg-folha hover:bg-[#17623d]"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Salvando..." : "Salvar chamada"}
        </Button>
      </div>
    </div>
  );
}

function RosterMetric({
  label,
  value,
  tone = "stone",
}: {
  label: string;
  value: string | number;
  tone?: "stone" | "green" | "red" | "amber";
}) {
  const toneClass = {
    stone: "text-ink",
    green: "text-green-700",
    red: "text-red-700",
    amber: "text-amber-800",
  }[tone];

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
