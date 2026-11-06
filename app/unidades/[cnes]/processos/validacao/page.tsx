import { UnitProcessWorkspace } from "../pageContent";
export const dynamic = "force-dynamic";
export default async function ValidationPage({params,searchParams}:{params:Promise<{cnes:string}>;searchParams:Promise<{atividade?:string}>}){
  return UnitProcessWorkspace({params,validation:true,activity:(await searchParams).atividade});
}

