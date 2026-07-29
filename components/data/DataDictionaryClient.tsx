"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Search,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  DataFieldClassification,
  DataFieldDefinition,
  DataSourceCatalogItem
} from "@/types/dataGovernance";

type Summary = {
  sources: number;
  fields: number;
  requiredFields: number;
  pendingSources: number;
  simulatedSources: number;
  identifiableFields: number;
};

type Coverage = {
  sourceId: string;
  source: string;
  fields: number;
  required: number;
  status: DataSourceCatalogItem["status"];
};

export function DataDictionaryClient({
  sources,
  fields,
  summary,
  coverage
}: {
  sources: DataSourceCatalogItem[];
  fields: DataFieldDefinition[];
  summary: Summary;
  coverage: Coverage[];
}) {
  const [search, setSearch] = useState("");
  const [sourceId, setSourceId] = useState("all");
  const [classification, setClassification] = useState("all");

  const filteredFields = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return fields.filter((field) => {
      const matchesSource = sourceId === "all" || field.sourceId === sourceId;
      const matchesClassification =
        classification === "all" || field.classification === classification;
      const matchesSearch =
        !normalizedSearch ||
        [field.fieldName, field.label, field.description, field.qualityRule]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesSource && matchesClassification && matchesSearch;
    });
  }, [classification, fields, search, sourceId]);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={<Database size={18} />} label="Fontes catalogadas" value={summary.sources} />
        <Metric icon={<BookOpen size={18} />} label="Campos definidos" value={summary.fields} />
        <Metric icon={<CheckCircle2 size={18} />} label="Obrigatorios" value={summary.requiredFields} />
        <Metric icon={<AlertTriangle size={18} />} label="Aguardam homologacao" value={summary.pendingSources} warning />
        <Metric icon={<FileText size={18} />} label="Fontes simuladas" value={summary.simulatedSources} />
        <Metric icon={<ShieldCheck size={18} />} label="Identificaveis aceitos" value={summary.identifiableFields} success />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card>
          <CardHeader>
            <CardTitle>Cobertura do dicionario por fonte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {coverage.map((item) => (
                <div key={item.sourceId} className="border-b border-stone-200 pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.source}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
                    <span>{item.fields} campos</span>
                    <span>{item.required} obrigatorios</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full bg-folha"
                      style={{
                        width: `${Math.max(12, (item.fields / Math.max(...coverage.map((entry) => entry.fields))) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="border-l-4 border-amber-500 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle size={20} />
            <h2 className="font-semibold">Portao de homologacao</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-950/80">
            O catalogo documenta o contrato desejado, mas os seeds do MVP ainda
            nao equivalem a extracoes oficiais homologadas. Antes do uso real,
            cada fonte precisa de responsavel, competencia, metodo de extracao e
            aprovacao institucional.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Catalogo de fontes</h2>
            <p className="mt-1 text-sm text-stone-500">
              Origem conceitual, frequencia e situacao de uso no MVP.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <Card key={source.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{source.source}</p>
                    <p className="mt-1 font-mono text-xs text-stone-500">
                      {source.fileName}
                    </p>
                  </div>
                  <StatusBadge status={source.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-stone-500">Responsavel</dt>
                    <dd className="mt-1">{source.owner}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-stone-500">Escopo</dt>
                    <dd className="mt-1">{source.scope}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-stone-500">Periodicidade</dt>
                    <dd className="mt-1">{source.frequency}</dd>
                  </div>
                </dl>
                <p className="mt-4 border-t border-stone-200 pt-4 text-xs leading-5 text-stone-600">
                  {source.notes}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Dicionario minimo de campos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_250px]">
            <label className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-3 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar campo, descricao ou regra"
                className="h-10 w-full rounded-md border border-stone-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-folha focus:ring-2 focus:ring-folha/20"
              />
            </label>
            <Select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              <option value="all">Todas as fontes</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.source}
                </option>
              ))}
            </Select>
            <Select
              value={classification}
              onChange={(event) => setClassification(event.target.value)}
            >
              <option value="all">Todas as classificacoes</option>
              <option value="publico_agregado">Publico agregado</option>
              <option value="institucional_agregado">Institucional agregado</option>
              <option value="simulado">Simulado</option>
              <option value="identificavel_proibido">Identificavel proibido</option>
            </Select>
          </div>

          <p className="mt-4 text-sm text-stone-500">
            {filteredFields.length} de {fields.length} campos exibidos
          </p>

          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fonte / campo</TableHead>
                  <TableHead>Definicao</TableHead>
                  <TableHead>Classificacao</TableHead>
                  <TableHead>Regra de qualidade</TableHead>
                  <TableHead>Uso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="min-w-[190px] align-top">
                      <p className="font-semibold">{field.label}</p>
                      <p className="mt-1 font-mono text-xs text-stone-500">
                        {field.sourceId}.{field.fieldName}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <Badge className="border-stone-200 bg-stone-100 text-stone-700">
                          {field.type}
                        </Badge>
                        {field.required ? (
                          <Badge className="border-blue-200 bg-blue-50 text-blue-800">
                            obrigatorio
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[240px] align-top text-sm leading-6 text-stone-600">
                      {field.description}
                    </TableCell>
                    <TableCell className="min-w-[180px] align-top">
                      <ClassificationBadge classification={field.classification} />
                    </TableCell>
                    <TableCell className="min-w-[260px] align-top text-sm leading-6">
                      {field.qualityRule}
                    </TableCell>
                    <TableCell className="min-w-[180px] align-top">
                      <div className="flex flex-wrap gap-1">
                        {field.usedIn.map((use) => (
                          <Badge
                            key={use}
                            className="border-stone-200 bg-white text-stone-600"
                          >
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  warning,
  success
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  warning?: boolean;
  success?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-stone-200 bg-white p-4",
        warning && "border-amber-200 bg-amber-50",
        success && "border-green-200 bg-green-50"
      )}
    >
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DataSourceCatalogItem["status"] }) {
  const labels = {
    seed_pending_validation: "A homologar",
    simulated_only: "Simulado",
    authorized_public: "Autorizado"
  };

  return (
    <Badge
      className={cn(
        "shrink-0",
        status === "seed_pending_validation" && "border-amber-200 bg-amber-50 text-amber-900",
        status === "simulated_only" && "border-blue-200 bg-blue-50 text-blue-800",
        status === "authorized_public" && "border-green-200 bg-green-50 text-folha"
      )}
    >
      {labels[status]}
    </Badge>
  );
}

function ClassificationBadge({
  classification
}: {
  classification: DataFieldClassification;
}) {
  const labels: Record<DataFieldClassification, string> = {
    publico_agregado: "Publico agregado",
    institucional_agregado: "Institucional agregado",
    simulado: "Simulado",
    identificavel_proibido: "Identificavel proibido"
  };

  return (
    <Badge
      className={cn(
        classification === "publico_agregado" && "border-green-200 bg-green-50 text-folha",
        classification === "institucional_agregado" && "border-amber-200 bg-amber-50 text-amber-900",
        classification === "simulado" && "border-blue-200 bg-blue-50 text-blue-800",
        classification === "identificavel_proibido" && "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {labels[classification]}
    </Badge>
  );
}
