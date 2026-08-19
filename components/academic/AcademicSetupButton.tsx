"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setupPilotAcademicCycle } from "@/app/gestao-academica/actions";

export function AcademicSetupButton({ configured = false }: { configured?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSetup() {
    const confirmation = configured
      ? "Sincronizar os acadêmicos aprovados com a turma e as quatro capacitações?"
      : "Configurar a turma piloto, as quatro capacitações e vincular os acadêmicos aprovados?";
    if (!confirm(confirmation)) {
      return;
    }

    setLoading(true);
    setFeedback(null);
    const result = await setupPilotAcademicCycle();
    setFeedback({
      kind: result.error ? "error" : "success",
      text: result.error || result.message || "Configuração concluída.",
    });
    setLoading(false);
    if (!result.error) router.refresh();
  }

  return (
    <div>
      <Button onClick={handleSetup} disabled={loading} className="h-11 bg-folha hover:bg-[#17623d]">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading
          ? "Atualizando turma..."
          : configured
            ? "Sincronizar aprovados"
            : "Configurar turma piloto"}
      </Button>
      {feedback ? (
        <div
          className={`mt-3 flex max-w-xl items-start gap-2 rounded-md border p-3 text-sm ${
            feedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          ) : (
            <TriangleAlert size={17} className="mt-0.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      ) : null}
    </div>
  );
}
