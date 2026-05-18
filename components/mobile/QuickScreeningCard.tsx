"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classifyQuickScreening } from "@/lib/mobileMvpService";
import type { ScreeningRisk } from "@/types/mobile";

const riskStyles: Record<ScreeningRisk, string> = {
  verde: "border-green-200 bg-green-50 text-folha",
  amarelo: "border-yellow-200 bg-yellow-50 text-yellow-800",
  vermelho: "border-red-200 bg-red-50 text-alerta"
};

export function QuickScreeningCard() {
  const [bloodPressure, setBloodPressure] = useState("");
  const [glucose, setGlucose] = useState("");
  const [complaint, setComplaint] = useState("");
  const [needsReferral, setNeedsReferral] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const classification = useMemo(
    () => classifyQuickScreening({ bloodPressure, glucose, complaint, needsReferral }),
    [bloodPressure, glucose, complaint, needsReferral]
  );

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope size={18} className="text-folha" />
          Triagem rapida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Pressao arterial">
          <input
            value={bloodPressure}
            onChange={(event) => setBloodPressure(event.target.value)}
            placeholder="Ex: 140/90"
            className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
          />
        </Field>
        <Field label="Glicemia, se disponivel">
          <input
            value={glucose}
            onChange={(event) => setGlucose(event.target.value)}
            placeholder="Ex: 185"
            inputMode="numeric"
            className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
          />
        </Field>
        <Field label="Queixa curta">
          <input
            value={complaint}
            onChange={(event) => setComplaint(event.target.value)}
            placeholder="Ex: tontura, falta de ar"
            className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
          />
        </Field>

        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 bg-[#fbfbf7] p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={needsReferral}
            onChange={(event) => setNeedsReferral(event.target.checked)}
            className="h-5 w-5 accent-folha"
          />
          Encaminhamento necessario
        </label>

        <Button className="h-12 w-full text-base" onClick={() => setSubmitted(true)}>
          Classificar triagem
        </Button>

        {submitted ? (
          <div className={`rounded-xl border p-4 text-sm leading-6 ${riskStyles[classification.risk]}`}>
            <div className="mb-1 flex items-center gap-2 font-semibold">
              {classification.risk === "verde" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {classification.label}
            </div>
            {classification.guidance}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}
