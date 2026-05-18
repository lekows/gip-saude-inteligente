import LuzianiaHealthMapClient from "@/components/maps/LuzianiaHealthMapClient";
import { loadSusDataset } from "@/lib/dataLoaders/susFileRepository";
import { susToTerritorialData } from "@/lib/dataLoaders/susAdapters";

export default function TerritorialMapPage() {
  const susDataset = loadSusDataset();
  const territorialData = susToTerritorialData(susDataset);

  return (
    <LuzianiaHealthMapClient
      neighborhoods={territorialData.neighborhoods}
      units={territorialData.units}
    />
  );
}
