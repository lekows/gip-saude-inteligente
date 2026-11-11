import {editorialLabel,latestEditorial,type EditorialRevision} from "@/lib/processes/editorial";
export function EditorialFeedback({rows}:{rows:EditorialRevision[]}){
 const latest=latestEditorial(rows).at(-1);
 if(!latest)return null;
 return <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm">
   <p className="font-semibold">Consolidação editorial assistida</p>
   <p className="mt-1 whitespace-pre-wrap">{latest.note}</p>
   <p className="mt-2 text-xs text-stone-600">Contribuição de {latest.source_author_name} · {new Date(latest.created_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}. A validação pelas áreas é registrada separadamente.</p>
   {rows.length>1&&<details className="mt-2"><summary>Histórico editorial ({rows.length})</summary>{[...rows].sort((a,b)=>a.id-b.id).map(r=><p className="mt-2" key={r.id}>{editorialLabel[r.decision]} · {r.note}</p>)}</details>}
 </div>;
}
