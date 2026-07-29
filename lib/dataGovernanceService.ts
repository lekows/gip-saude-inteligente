import {
  dataFieldDictionary,
  dataSourceCatalog
} from "@/data/dataGovernanceCatalog";

export function getDataGovernanceSummary() {
  return {
    sources: dataSourceCatalog.length,
    fields: dataFieldDictionary.length,
    requiredFields: dataFieldDictionary.filter((field) => field.required).length,
    pendingSources: dataSourceCatalog.filter(
      (source) => source.status === "seed_pending_validation"
    ).length,
    simulatedSources: dataSourceCatalog.filter(
      (source) => source.status === "simulated_only"
    ).length,
    identifiableFields: dataFieldDictionary.filter(
      (field) => field.classification === "identificavel_proibido"
    ).length
  };
}

export function getSourceFieldCoverage() {
  return dataSourceCatalog.map((source) => ({
    sourceId: source.id,
    source: source.source,
    fields: dataFieldDictionary.filter((field) => field.sourceId === source.id).length,
    required: dataFieldDictionary.filter(
      (field) => field.sourceId === source.id && field.required
    ).length,
    status: source.status
  }));
}
