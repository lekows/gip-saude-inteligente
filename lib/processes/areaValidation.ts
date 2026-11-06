export type Signal = "pending" | "approved" | "correction";
export const signalLabel: Record<Signal,string> = {
  pending: "Em validação", approved: "Validado pela área", correction: "Ajuste necessário",
};
export const detailFields = {
  routine: "Como a atividade começa, acontece e termina",
  owner: "Equipe ou função responsável",
  records: "Sistemas e documentos utilizados",
  handoff: "Quem entrega, quem recebe e como confirma",
  rules: "Prazos, exceções e dúvidas esclarecidas",
};
export type Details = Record<keyof typeof detailFields,string>;
export type Assignment = {macro_id:string; area:string; assignee:string; assignee_name:string; active:boolean; mandate:string};
export type AreaEvent = {id:number; item_id:string; kind:"revision"|"reopen"|"approved"|"correction"; actor_name:string; area:string|null; mandate:string|null; note:string; details:Details|null; created_at:string};
export type Ledger = {assignments:Assignment[]; events:AreaEvent[]};
export type Activity = {id:string; macro:string; title:string; account:string; question:string; owner:string; records:string; area:string};
export function activityState(item: Pick<Activity,"id"|"macro">, ledger:Ledger) {
  const history=ledger.events.filter(e=>e.item_id===item.id).sort((a,b)=>b.id-a.id);
  const revision=history.find(e=>e.kind==="revision");
  const barrier=history.find(e=>e.kind==="revision" || e.kind==="reopen")?.id ?? 0;
  const correction=history.find(e=>e.kind==="correction" && e.id>(revision?.id ?? 0));
  const areas=ledger.assignments.filter(r=>r.active && r.macro_id===item.macro);
  const missing=areas.filter(r=>!history.some(e=>e.kind==="approved" && e.id>barrier && e.mandate===r.mandate));
  const signal:Signal=correction?"correction":revision && areas.length && !missing.length?"approved":"pending";
  const next=correction?.note || (!areas.length?"Indicar representante da área":!revision?"Completar os detalhes da rotina":missing.length?"Conferir com "+missing.map(r=>r.area).join(", "):"Conferência concluída");
  return {history,revision,correction,areas,missing,signal,next,lastId:history[0]?.id ?? 0};
}
export function macroSignal(signals:Signal[]):Signal {
  if(signals.includes("correction")) return "correction";
  return signals.length && signals.every(s=>s==="approved")?"approved":"pending";
}

