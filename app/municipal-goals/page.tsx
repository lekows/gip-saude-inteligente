import { MunicipalGoalsClient } from "@/components/municipal/MunicipalGoalsClient";
import { getMunicipalGoalsData } from "@/lib/municipalGoalsService";

export default function MunicipalGoalsPage() {
  const data = getMunicipalGoalsData();

  return <MunicipalGoalsClient data={data} />;
}
