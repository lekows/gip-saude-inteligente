import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {EditorialRevision} from "./editorial";

export async function readEditorialLedger(db:SupabaseClient,mapId:string):Promise<EditorialRevision[]> {
  const rows:EditorialRevision[]=[];
  let cursor=0;
  for(;;){
    const {data,error}=await db.from("process_editorial_revisions")
      .select("id,map_version,item_id,source_feedback_id,source_author_name,decision,details,pending_question,proposed_improvement,note,request_reference,created_at,diagram")
      .eq("map_id",mapId).gt("id",cursor).order("id").limit(500);
    if(error)throw error;
    rows.push(...data as EditorialRevision[]);
    if(data.length<500)return rows;
    cursor=data[data.length-1].id;
  }
}
