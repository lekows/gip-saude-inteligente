import { UnitProcessWorkspace } from "./pageContent";
export const dynamic = "force-dynamic";
export default async function ProcessesPage({params,searchParams}:{params:Promise<{cnes:string}>;searchParams:Promise<{atividade?:string;rodada?:string}>}){
  const {atividade,rodada}=await searchParams;
  return UnitProcessWorkspace({params,activity:atividade,round:rodada});
}
