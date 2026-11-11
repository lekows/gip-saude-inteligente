import {activityState,type Ledger} from "./areaValidation.ts";
import type {ProcessContent} from "../../types/processReview";

/** Human area revisions take priority over editorial drafts; only the area ledger sets the signal. */
export function applyAreaContent(content:ProcessContent,ledger:Ledger) {
 const areaStatus:Record<string,{status:string}>={};
 const activities=content.activities.map(a=>{
  const state=activityState({id:a.id,macro:a.macro||""},ledger);
  areaStatus[a.id]={status:{pending:"pendente",correction:"correcao",approved:"conferido"}[state.signal]};
  const details=state.revision?.details;
  return details?{...a,account:details.routine,owner:details.owner,records:details.records,areaDetails:details}:a;
 });
 return {...content,activities,areaStatus};
}
