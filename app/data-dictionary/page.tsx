import { DataDictionaryClient } from "@/components/data/DataDictionaryClient";
import { DataWorkspaceNav } from "@/components/data/DataWorkspaceNav";
import {
  dataFieldDictionary,
  dataSourceCatalog
} from "@/data/dataGovernanceCatalog";
import {
  getDataGovernanceSummary,
  getSourceFieldCoverage
} from "@/lib/dataGovernanceService";

export default function DataDictionaryPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] text-ink">
      <DataWorkspaceNav />
      <section className="mx-auto max-w-[1500px] p-5 lg:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-folha">
            Governanca de dados
          </p>
          <h1 className="mt-2 text-3xl font-semibold lg:text-4xl">
            Dicionario e fontes autorizadas
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-600">
            Contrato minimo para entender de onde cada indicador vem, como deve
            ser validado e onde pode ser usado. Neste momento, os arquivos sao
            seeds demonstrativos ou simulados e ainda aguardam homologacao
            institucional para operacao real.
          </p>
        </div>

        <DataDictionaryClient
          sources={dataSourceCatalog}
          fields={dataFieldDictionary}
          summary={getDataGovernanceSummary()}
          coverage={getSourceFieldCoverage()}
        />
      </section>
    </main>
  );
}
