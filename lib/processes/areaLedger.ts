import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ledger, AreaEvent, Assignment } from "./areaValidation";

export async function readAreaLedger(db:SupabaseClient,mapId:string):Promise<Ledger> {
  const assignments:Assignment[]=[];
  const events:AreaEvent[]=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await db.from("process_area_assignments").select("macro_id,area,assignee,assignee_name,active,mandate")
      .eq("map_id",mapId).order("macro_id").order("area").range(offset,offset+499);
    if(error) throw error;
    assignments.push(...data);
    if(data.length<500) break;
  }
  let cursor=0;
  for(;;){
    const {data,error}=await db.from("process_area_events").select("id,item_id,kind,actor_name,area,mandate,note,details,created_at")
      .eq("map_id",mapId).gt("id",cursor).order("id").limit(500);
    if(error) throw error;
    events.push(...data);
    if(data.length<500) break;
    cursor=data[data.length-1].id;
  }
  return {assignments,events};
}

