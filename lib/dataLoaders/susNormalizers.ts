import { booleanValue, numberValue, parseCsv } from "./csv";
import type {
  APSIndicator,
  HealthUnit,
  HospitalMorbidity,
  ImmunizationRecord,
  MortalityRecord,
  NotifiableDiseaseRecord,
  NutritionalStatusRecord,
  OutpatientProduction,
  RiskMapArea,
  SusDataset,
  SusRiskLevel,
  TerritorialIndicator
} from "@/types/sus";
import type { HealthCondition, LatLngTuple } from "@/types/territorial";

interface GeoJsonFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    ibge_city_code: string;
    population: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

interface NeighborhoodGeoJson {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export function normalizeHealthUnits(csv: string): HealthUnit[] {
  return parseCsv(csv).map((row) => ({
    cnes: row.cnes,
    name: row.name,
    type: normalizeUnitType(row.type),
    ibgeCityCode: row.ibge_city_code,
    city: row.city,
    state: row.state,
    neighborhoodId: row.neighborhood_id,
    neighborhood: row.neighborhood,
    position: [numberValue(row.lat), numberValue(row.lng)],
    teams: numberValue(row.teams),
    source: row.source
  }));
}

export function normalizeAPSIndicators(csv: string): APSIndicator[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    unitCnes: row.unit_cnes,
    condition: row.condition as HealthCondition,
    targetPopulation: numberValue(row.target_population),
    registeredPatients: numberValue(row.registered_patients),
    screenings: numberValue(row.screenings),
    highRiskPatients: numberValue(row.high_risk_patients),
    earlyReturns: numberValue(row.early_returns),
    coveragePercent: numberValue(row.coverage_percent),
    source: row.source
  }));
}

export function normalizeOutpatientProduction(csv: string): OutpatientProduction[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    unitCnes: row.unit_cnes,
    neighborhoodId: row.neighborhood_id,
    procedureGroup: row.procedure_group,
    quantity: numberValue(row.quantity),
    source: row.source
  }));
}

export function normalizeHospitalMorbidity(csv: string): HospitalMorbidity[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    cidGroup: row.cid_group,
    admissions: numberValue(row.admissions),
    averageStayDays: numberValue(row.avg_stay_days),
    source: row.source
  }));
}

export function normalizeMortality(csv: string): MortalityRecord[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    causeGroup: row.cause_group,
    deaths: numberValue(row.deaths),
    simulated: booleanValue(row.simulated),
    source: row.source
  }));
}

export function normalizeNotifiableDiseases(csv: string): NotifiableDiseaseRecord[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    disease: row.disease,
    cases: numberValue(row.cases),
    source: row.source
  }));
}

export function normalizeNutritionalStatus(csv: string): NutritionalStatusRecord[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    ageGroup: row.age_group,
    overweightCount: numberValue(row.overweight_count),
    obesityCount: numberValue(row.obesity_count),
    assessedCount: numberValue(row.assessed_count),
    source: row.source
  }));
}

export function normalizeImmunization(csv: string): ImmunizationRecord[] {
  return parseCsv(csv).map((row) => ({
    period: row.period,
    ibgeCityCode: row.ibge_city_code,
    neighborhoodId: row.neighborhood_id,
    vaccine: row.vaccine,
    coveragePercent: numberValue(row.coverage_percent),
    dosesApplied: numberValue(row.doses_applied),
    source: row.source
  }));
}

export function buildRiskMapAreas(
  geojsonText: string,
  partialDataset: Omit<SusDataset, "riskMapAreas">
): RiskMapArea[] {
  const geojson = JSON.parse(geojsonText) as NeighborhoodGeoJson;
  const indicators = buildTerritorialIndicators(geojson, partialDataset);

  return indicators.map((indicator) => {
    const feature = geojson.features.find(
      (item) => item.properties.id === indicator.neighborhoodId
    );
    const polygon = feature ? geoPolygonToLatLng(feature) : [];
    const territorialScore = calculateSusTerritorialScore(indicator);

    return {
      ...indicator,
      polygon,
      centroid: calculateCentroid(polygon),
      territorialScore,
      riskLevel: classifySusTerritorialRisk(territorialScore),
      suggestedAction: buildSuggestedAction(indicator, territorialScore)
    };
  });
}

export function calculateSusTerritorialScore(indicator: TerritorialIndicator) {
  const lowCoverage = indicator.coveragePercent < 70 ? 20 : indicator.coveragePercent < 85 ? 10 : 0;
  const highRiskPercent = indicator.registeredPatients
    ? Math.min(25, (indicator.highRiskPatients / indicator.registeredPatients) * 160)
    : 0;
  const missingPatients = indicator.targetPopulation
    ? Math.min(15, (indicator.missingPatients / indicator.targetPopulation) * 60)
    : 0;
  const earlyReturns = indicator.registeredPatients
    ? Math.min(10, (indicator.earlyReturns / indicator.registeredPatients) * 70)
    : 0;
  const waitingTime = Math.min(10, indicator.hospitalAdmissions / 5);
  const hasDmLoad = Math.min(10, indicator.highRiskPatients / 95);
  const interviews360 = Math.min(10, indicator.notifiableCases / 10);

  return Math.round(
    lowCoverage +
      highRiskPercent +
      missingPatients +
      earlyReturns +
      waitingTime +
      hasDmLoad +
      interviews360
  );
}

export function classifySusTerritorialRisk(score: number): SusRiskLevel {
  if (score >= 70) return "vermelho";
  if (score >= 35) return "amarelo";
  return "verde";
}

function buildTerritorialIndicators(
  geojson: NeighborhoodGeoJson,
  dataset: Omit<SusDataset, "riskMapAreas">
): TerritorialIndicator[] {
  return geojson.features.map((feature) => {
    const id = feature.properties.id;
    const aps = dataset.apsIndicators.filter((item) => item.neighborhoodId === id);
    const targetPopulation = sum(aps, "targetPopulation");
    const registeredPatients = sum(aps, "registeredPatients");
    const screenings = sum(aps, "screenings");
    const highRiskPatients = sum(aps, "highRiskPatients");
    const earlyReturns = sum(aps, "earlyReturns");

    return {
      neighborhoodId: id,
      neighborhoodName: feature.properties.name,
      ibgeCityCode: feature.properties.ibge_city_code,
      population: feature.properties.population,
      targetPopulation,
      registeredPatients,
      missingPatients: Math.max(targetPopulation - registeredPatients, 0),
      coveragePercent: targetPopulation ? Math.round((registeredPatients / targetPopulation) * 100) : 0,
      screenings,
      highRiskPatients,
      earlyReturns,
      outpatientProduction: sum(
        dataset.outpatientProduction.filter((item) => item.neighborhoodId === id),
        "quantity"
      ),
      hospitalAdmissions: sum(
        dataset.hospitalMorbidity.filter((item) => item.neighborhoodId === id),
        "admissions"
      ),
      notifiableCases: sum(
        dataset.notifiableDiseases.filter((item) => item.neighborhoodId === id),
        "cases"
      ),
      obesityCount: sum(
        dataset.nutritionalStatus.filter((item) => item.neighborhoodId === id),
        "obesityCount"
      ),
      immunizationCoverage: average(
        dataset.immunization
          .filter((item) => item.neighborhoodId === id)
          .map((item) => item.coveragePercent)
      ),
      mortalityCount: sum(
        dataset.mortalityRecords.filter((item) => item.neighborhoodId === id),
        "deaths"
      )
    };
  });
}

function geoPolygonToLatLng(feature: GeoJsonFeature): LatLngTuple[] {
  return feature.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
}

function calculateCentroid(polygon: LatLngTuple[]): LatLngTuple {
  if (!polygon.length) return [-16.253, -47.95];
  const total = polygon.reduce(
    (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 }
  );
  return [total.lat / polygon.length, total.lng / polygon.length];
}

function buildSuggestedAction(indicator: TerritorialIndicator, score: number) {
  if (score >= 70) {
    return `Mutirao prioritario, busca ativa de ${indicator.missingPatients} faltantes e triagem de alto risco.`;
  }
  if (score >= 35) {
    return "Agenda ampliada, revisao de faltantes e monitoramento de retornos precoces.";
  }
  return "Manter rotina de vigilancia territorial e acompanhamento preventivo.";
}

function normalizeUnitType(type: string): HealthUnit["type"] {
  if (type === "UBS" || type === "CAIS" || type === "HOSPITAL") return type;
  return "OUTRO";
}

function sum<T extends object>(items: T[], key: keyof T) {
  return items.reduce((total, item) => {
    const value = item[key];
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}
