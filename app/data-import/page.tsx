import { DataImportClient } from "@/components/dashboard/DataImportClient";
import { readImportManifest } from "@/lib/dataLoaders/importManifestService";

export default function DataImportPage() {
  const manifest = readImportManifest();

  return <DataImportClient initialHistory={manifest.loads} />;
}
