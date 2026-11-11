import type {ProcessContent} from "../../types/processReview";
import type {Details,Ledger} from "./areaValidation";

export type EditorialRevision = {
  id:number; map_version:number; item_id:string; source_feedback_id:string;
  source_author_name:string; decision:"accepted"|"needs_information"; details:Details|null;
  pending_question:string; proposed_improvement:string; note:string;
  request_reference:string; created_at:string; diagram:Record<string,unknown>|null;
};
export const editorialLabel = {
  accepted:"Acolhida na consolidação editorial",
  needs_information:"Esclarecimento pendente",
};
export function latestEditorial(rows:EditorialRevision[]):EditorialRevision[] {
  const latest=new Map<string,EditorialRevision>();
  for(const row of rows)if(row.id>(latest.get(row.item_id)?.id??0))latest.set(row.item_id,row);
  return [...latest.values()].sort((a,b)=>a.id-b.id);
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
function validDiagram(value:Record<string,unknown>,ids:Set<string>,activities:string[]):boolean {
  if(!object(value.base))return false;
  return Object.entries(value).every(([key,flow])=>{
    if(!["base","decisions"].includes(key)||!object(flow)||!Array.isArray(flow.nodeIds)||!Array.isArray(flow.edges)||!object(flow.positions)||!Array.isArray(flow.labels))return false;
    const nodes=flow.nodeIds;
    const positions=flow.positions;
    return activities.every(id=>nodes.includes(id))&&nodes.every(id=>typeof id==="string"&&ids.has(id)&&object(positions[id]))&&
      new Set(flow.edges.map(e=>object(e)?e.id:null)).size===flow.edges.length&&
      flow.edges.every(e=>object(e)&&nodes.includes(e.from)&&nodes.includes(e.to)&&
        ["id","label","kind","basis","source"].every(k=>typeof e[k]==="string")&&typeof e.inferred==="boolean")&&
      Object.entries(flow.positions).every(([id,p])=>nodes.includes(id)&&object(p)&&typeof p.x==="number"&&Number.isFinite(p.x)&&typeof p.y==="number"&&Number.isFinite(p.y))&&
      flow.labels.every(l=>object(l)&&typeof l.text==="string"&&typeof l.x==="number"&&Number.isFinite(l.x)&&typeof l.y==="number"&&Number.isFinite(l.y));
  });
}
/** Editorial text is not an area signature. Apply formal area revisions afterwards. */
export function applyEditorialContent(content:ProcessContent,rows:EditorialRevision[],version:number,ledger?:Ledger):ProcessContent {
  const candidates=rows.filter(r=>r.map_version===version&&content.activities.some(a=>a.id===r.item_id));
  if(!candidates.length)return content;
  const revisions=(ledger?.events??[]).filter(e=>e.kind==="revision");
  const cutoff=(item:string)=>Math.max(0,...revisions.filter(e=>e.item_id===item).map(e=>Date.parse(e.created_at)));
  const applicable=latestEditorial(candidates.filter(r=>!cutoff(r.item_id)||Date.parse(r.created_at)<=cutoff(r.item_id)));
  const byId=new Map(applicable.map(r=>[r.item_id,r]));
  const scoped={...(object(content.flows.scoped)?content.flows.scoped:{})};
  // Keep the diagram the area could actually inspect when it first revised this macro.
  const diagramCandidates=candidates.filter(r=>{
    const macro=content.activities.find(a=>a.id===r.item_id)?.macro;
    const macroRevisions=revisions.filter(e=>content.activities.some(a=>a.id===e.item_id&&a.macro===macro)).map(e=>Date.parse(e.created_at));
    return !macroRevisions.length||Date.parse(r.created_at)<=Math.min(...macroRevisions);
  });
  for(const r of latestEditorial(diagramCandidates)){
    const macro=content.activities.find(a=>a.id===r.item_id)?.macro;
    if(!macro||r.decision!=="accepted"||!r.diagram)continue;
    const ids=new Set([...content.activities,...content.decisionNodes??[]].filter(a=>a.macro===macro).map(a=>a.id));
    content.macros.forEach(m=>ids.add(m.id));
    if(validDiagram(r.diagram,ids,content.activities.filter(a=>a.macro===macro).map(a=>a.id)))
      scoped[macro]={...r.diagram,decisions:r.diagram.decisions??r.diagram.base};
  }
  return {...content,flows:{...content.flows,scoped},activities:content.activities.map(a=>{
    const r=byId.get(a.id);
    if(!r)return a;
    const text=r.decision==="accepted"&&r.details?{
      account:r.details.routine,owner:r.details.owner,records:r.details.records,
      editorialDetails:r.details,
    }:{};
    return {...a,...text,question:r.pending_question||a.question,
      proposal:r.proposed_improvement||a.proposal,
      editorial:{decision:r.decision,source_author_name:r.source_author_name,note:r.note,created_at:r.created_at}};
  })};
}
