"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Save, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classifyQuickScreening } from "@/lib/mobileMvpService";
import type { ScreeningRisk } from "@/types/mobile";

const riskStyles: Record<ScreeningRisk, string> = {
  verde: "border-green-200 bg-green-50 text-folha",
  amarelo: "border-yellow-200 bg-yellow-50 text-yellow-800",
  vermelho: "border-red-200 bg-red-50 text-alerta"
};

type QuickScreeningCardProps = {
  onSave?: (data: {
    patientName?: string;
    age?: number;
    sex?: string;
    neighborhood?: string;
    hasHypertension?: boolean;
    hasDiabetes?: boolean;
    bpSystolic?: number;
    bpDiastolic?: number;
    bloodGlucose?: number;
    bmi?: number;
    notes?: string;
  }) => void | Promise<void>;
};

export function QuickScreeningCard({ onSave }: QuickScreeningCardProps = {}) {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [glucose, setGlucose] = useState("");
  const [complaint, setComplaint] = useState("");
  const [needsReferral, setNeedsReferral] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const classification = useMemo(
    () => classifyQuickScreening({ bloodPressure, glucose, complaint, needsReferral }),
    [bloodPressure, glucose, complaint, needsReferral]
  );

  // Parse blood pressure "140/90" into systolic/diastolic
  const parsedBP = useMemo(() => {
    const match = bloodPressure.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { systolic: parseInt(match[1], 10), diastolic: parseInt(match[2], 10) };
    }
    return null;
  }, [bloodPressure]);

  const hasHypertension = parsedBP !== null && (parsedBP.systolic >= 140 || parsedBP.diastolic >= 90);
  const hasDiabetes = glucose !== "" && parseInt(glucose, 10) >= 126;

  async function handleSave() {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave({
        patientName: patientName || undefined,
        age: age ? parseInt(age, 10) : undefined,
        sex: sex || undefined,
        neighborhood: neighborhood || undefined,
        hasHypertension,
        hasDiabetes,
        bpSystolic: parsedBP?.systolic,
        bpDiastolic: parsedBP?.diastolic,
        bloodGlucose: glucose ? parseInt(glucose, 10) : undefined,
        notes: [complaint, needsReferral ? "Encaminhamento necessario" : ""].filter(Boolean).join(". ") || undefined,
      });
      setSubmitted(false);
      setPatientName("");
      setAge("");
      setSex("");
      setNeighborhood("");
      setBloodPressure("");
      setGlucose("");
      setComplaint("");
      setNeedsReferral(false);
    } catch (err) {
      console.error("Erro ao salvar triagem:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope size={18} className="text-folha" />
          Triagem rapida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Nome do paciente (opcional)">
          <input
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder="Ex: Maria Silva"
            className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade">
            <input
              value={age}
              onChange={(event) => setAge(event.target.value)}
              placeholder="Ex: 58"
              inputMode="numeric"
              className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
            />
          </Field>
          <Field label="Sexo">
            <select
              value={sex}
              onChange={(event) => setSex(event.target.value)}
              className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
            >
              <option value="">Selecione</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </select>
          </Field>
        </div>

        <Field label="Bairro">
          <input
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            placeholder="Ex: Jardim das Oliveiras"
            className="h-12 w-full rounded-lg border border-stone-300 px-3 text-base outline-none focus:border-folha"
          />
        </Field>

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

        {onSave && (
          <Button
            className="h-12 w-full text-base"
            variant="outline"
            onClick={handleSave}
            disabled={saving || (!bloodPressure && !glucose && !complaint)}
          >
            <Save size={17} className="mr-2" />
            {saving ? "Salvando..." : "Salvar triagem no sistema"}
          </Button>
        )}
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
