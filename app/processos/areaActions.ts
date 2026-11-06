"use server";
import { revalidatePath } from "next/cache";
import { processContext } from "@/lib/processes/server";
import { processDatabaseError,safeProcessError } from "@/lib/processes/rules";
import type { Details } from "@/lib/processes/areaValidation";
import type { ProcessActionResult } from "@/types/processReview";
export async function assignArea(map:string,macro:string,area:string,person:string,active:boolean,expected:string|null):Promise<ProcessActionResult>{
  try{
    const {supabase}=await processContext();
    const {error}=await supabase.rpc("assign_process_area",{p_map:map,p_macro:macro,p_area:area,p_person:person,p_active:active,p_expected:expected});
    if(error) processDatabaseError(error);
    revalidatePath("/unidades","layout");
    return {success:"Representação atualizada."};
  }catch(e){return {error:safeProcessError(e)};}
}
export async function recordArea(map:string,item:string,kind:"revision"|"approved"|"correction",mandate:string|null,expected:number,note:string,details:Details|null):Promise<ProcessActionResult>{
  try{
    const {supabase}=await processContext();
    const {error}=await supabase.rpc("record_process_area",{p_map:map,p_item:item,p_kind:kind,p_mandate:mandate,p_expected:expected,p_note:note,p_details:details});
    if(error) processDatabaseError(error);
    revalidatePath("/unidades","layout");
    return {success:kind==="revision"?"Detalhes salvos para conferência.":kind==="approved"?"Validação da área registrada.":"Ajuste registrado para revisão."};
  }catch(e){return {error:safeProcessError(e)};}
}

