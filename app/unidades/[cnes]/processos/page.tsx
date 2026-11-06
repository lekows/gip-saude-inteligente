import { UnitProcessWorkspace } from "./pageContent";
export const dynamic = "force-dynamic";
export default async function ProcessesPage({params,searchParams}:{params:Promise<{cnes:string}>;searchParams:Promise<{atividade?:string}>}){
  return UnitProcessWorkspace({params,activity:(await searchParams).atividade});
}
