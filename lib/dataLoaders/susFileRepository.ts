import "server-only";
import { readFileSync } from "fs";
import path from "path";
import {
  buildRiskMapAreas,
  normalizeAPSIndicators,
  normalizeHealthUnits,
  normalizeHospitalMorbidity,
  normalizeImmunization,
  normalizeMortality,
  normalizeNotifiableDiseases,
  normalizeNutritionalStatus,
  normalizeOutpatientProduction
} from "./susNormalizers";
import type { SusDataset } from "@/types/sus";

const DATA_DIR = path.join(process.cwd(), "data", "real");

export function loadSusDataset(): SusDataset {
  const partialDataset = {
    healthUnits: normalizeHealthUnits(readDataFile("health_units_cnes.csv")),
    apsIndicators: normalizeAPSIndicators(readDataFile("aps_indicators_sisab.csv")),
    outpatientProduction: normalizeOutpatientProduction(
      readDataFile("outpatient_production_sia.csv")
    ),
    hospitalMorbidity: normalizeHospitalMorbidity(readDataFile("hospital_morbidity_sih.csv")),
    mortalityRecords: normalizeMortality(readDataFile("mortality_sim.csv")),
    notifiableDiseases: normalizeNotifiableDiseases(
      readDataFile("notifiable_diseases_sinan.csv")
    ),
    nutritionalStatus: normalizeNutritionalStatus(
      readDataFile("nutritional_status_sisvan.csv")
    ),
    immunization: normalizeImmunization(readDataFile("immunization_pni.csv"))
  };

  return {
    ...partialDataset,
    riskMapAreas: buildRiskMapAreas(
      readDataFile("luziania_neighborhoods.geojson"),
      partialDataset
    )
  };
}

function readDataFile(fileName: string) {
  return readFileSync(path.join(DATA_DIR, fileName), "utf8");
}
