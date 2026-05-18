import { getCampaignReportData } from "@/lib/campaignReportService";
import { PrintReportButton } from "@/components/campaign/PrintReportButton";

export default function CampaignReportPrintPage() {
  const data = getCampaignReportData();

  return (
    <main className="bg-white text-ink">
      <section className="mx-auto max-w-[920px] p-8 print:p-0">
        <div className="no-print mb-5 flex justify-end">
          <PrintReportButton />
        </div>

        <article className="print-report rounded-lg border border-stone-200 bg-white p-8 print:border-0">
          <header className="border-b border-stone-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
              GIP Saude Inteligente
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Relatorio pos-mutirao - {data.plan.targetNeighborhoodName}
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Relatorio gerencial com dados agregados, sem identificacao
              individual de pacientes. Acao simulada para demonstracao do MVP.
            </p>
          </header>

          <section className="mt-6 grid grid-cols-4 gap-3">
            <PrintKpi label="Triagens" value={data.realized.screenings} target={data.planned.screenings} />
            <PrintKpi label="Alto risco" value={data.realized.highRisk} target={data.planned.highRisk} />
            <PrintKpi label="Domicilios" value={data.realized.households} target={data.planned.households} />
            <PrintKpi label="Encaminhamentos" value={data.totals.referrals} target={data.realized.highRisk} />
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Planejado x realizado</h2>
            <table className="mt-3 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-stone-100 text-left">
                  <th className="border border-stone-200 p-2">Indicador</th>
                  <th className="border border-stone-200 p-2">Planejado</th>
                  <th className="border border-stone-200 p-2">Realizado</th>
                  <th className="border border-stone-200 p-2">Efetividade</th>
                </tr>
              </thead>
              <tbody>
                <PrintRow label="Domicilios" planned={data.planned.households} realized={data.realized.households} />
                <PrintRow label="Triagens" planned={data.planned.screenings} realized={data.realized.screenings} />
                <PrintRow label="Alto risco" planned={data.planned.highRisk} realized={data.realized.highRisk} />
              </tbody>
            </table>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold">Resultado por microarea</h2>
              <table className="mt-3 w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-stone-100 text-left">
                    <th className="border border-stone-200 p-2">Microarea</th>
                    <th className="border border-stone-200 p-2">Triados</th>
                    <th className="border border-stone-200 p-2">Alto risco</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chartData.production.map((item) => (
                    <tr key={item.name}>
                      <td className="border border-stone-200 p-2">{item.name}</td>
                      <td className="border border-stone-200 p-2">{item.triados}</td>
                      <td className="border border-stone-200 p-2">{item.altoRisco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-lg font-semibold">Analise de impacto</h2>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                A acao localizou {data.totals.highRiskFound} pessoas em alto
                risco agregado e {data.totals.absenteesLocated} faltosos,
                criando uma fila de retorno protegida para acompanhamento na APS.
              </p>
              <div className="mt-4 rounded-md border border-stone-200 p-3 text-sm">
                <p><strong>PA aferida:</strong> {data.totals.bloodPressureChecks}</p>
                <p><strong>Glicemias:</strong> {data.totals.glucoseChecks}</p>
                <p><strong>Encaminhamentos:</strong> {data.totals.referrals}</p>
              </div>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-6">
            <PrintList title="Recomendacoes da IA" items={data.recommendations} />
            <PrintList title="Pendencias para a semana" items={data.pendingActions} />
          </section>

          <section className="mt-8 rounded-md border border-stone-200 bg-stone-50 p-4">
            <h2 className="text-lg font-semibold">LGPD e governanca</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
              <li>Resultado consolidado apenas por bairro e microarea.</li>
              <li>Nenhum endereco individual ou paciente real exibido.</li>
              <li>Origem: dados agregados do MVP e execucao simulada.</li>
              <li>Responsavel pela acao: Gestao APS.</li>
            </ul>
          </section>

          <footer className="mt-8 border-t border-stone-200 pt-4 text-xs text-stone-500">
            Documento gerado pelo GIP Saude Inteligente. Use a funcao de
            impressao do navegador para salvar como PDF.
          </footer>
        </article>
      </section>
    </main>
  );
}

function PrintKpi({ label, value, target }: { label: string; value: number; target: number }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value.toLocaleString("pt-BR")}</p>
      <p className="mt-1 text-xs text-stone-500">Meta {target.toLocaleString("pt-BR")}</p>
    </div>
  );
}

function PrintRow({ label, planned, realized }: { label: string; planned: number; realized: number }) {
  const percent = planned ? Math.round((realized / planned) * 100) : 0;
  return (
    <tr>
      <td className="border border-stone-200 p-2">{label}</td>
      <td className="border border-stone-200 p-2">{planned.toLocaleString("pt-BR")}</td>
      <td className="border border-stone-200 p-2">{realized.toLocaleString("pt-BR")}</td>
      <td className="border border-stone-200 p-2">{percent}%</td>
    </tr>
  );
}

function PrintList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
