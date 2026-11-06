"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignArea,recordArea } from "@/app/processos/areaActions";
import { activityState,macroSignal,detailFields,signalLabel } from "@/lib/processes/areaValidation";
import type {Activity,Details,Ledger,Signal} from "@/lib/processes/areaValidation";
import type {ProcessActionResult,ProcessFeedback,ProcessMap,ProcessPerson} from "@/types/processReview";
import s from "./AreaValidationPanel.module.css";

export type ValidationData={ledger:Ledger; macros:{id:string;title:string}[]; activities:Activity[]};
type Props=ValidationData & {focusItem?:string;map:ProcessMap; cnes:string; manager:boolean; userId:string; canContribute:boolean; people:ProcessPerson[]; feedback:ProcessFeedback[];
  suggest:(id:string,kind:"understood"|"change"|"new_step")=>void; review:(id:string)=>void; manage:()=>void};
const symbols={pending:"◐",approved:"✓",correction:"!"};
function Badge({value}:{value:Signal}){return <span className={s.badge} data-state={value}><b aria-hidden>{symbols[value]}</b>{signalLabel[value]}</span>;}
function useAreaAction(){
  const router=useRouter(),[pending,start]=useTransition(),[notice,setNotice]=useState("");
  function run(call:()=>Promise<ProcessActionResult>){
    start(async()=>{try{const result=await call();setNotice(result.error||result.success||"Operação concluída.");if(!result.error) router.refresh();}
    catch{setNotice("Falha de conexão. Tente novamente.");}});
  }
  return {pending,run,notice};
}
function Representatives({p,macro}:{p:Props;macro:string}){
  const {pending,run,notice}=useAreaAction();
  const rows=p.ledger.assignments.filter(a=>a.macro_id===macro);
  return <details className={s.assign}><summary>Representantes das áreas</summary>
    {rows.filter(r=>r.active).map(r=><p key={r.area}>{r.area} · {r.assignee_name} <button disabled={pending} onClick={()=>run(()=>assignArea(p.map.id,macro,r.area,r.assignee,false,r.mandate))}>Retirar indicação</button></p>)}
    {p.people.length ? <form onSubmit={ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget),area=String(f.get("area")).trim();run(()=>assignArea(p.map.id,macro,area,String(f.get("person")),true,rows.find(r=>r.area===area)?.mandate??null));}}>
      <label>Área representada<input name="area" required minLength={2} maxLength={90} placeholder="Ex. Regulação"/></label>
      <label>Participante autorizado<select name="person" required defaultValue=""><option value="">Selecione a pessoa</option>{p.people.map(person=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select></label>
      <button disabled={pending}>Salvar indicação</button></form>:<button onClick={p.manage}>Autorizar participantes para contribuição</button>}
    <p role="status">{notice}</p></details>;
}
function DetailForm({item,state,p,mandate}:{item:Activity;state:ReturnType<typeof activityState>;p:Props;mandate:string|null}){
  const {run,pending,notice}=useAreaAction();
  const initial=state.revision?.details ?? {routine:item.account,owner:"",records:item.records,handoff:"",rules:""};
  return <details className={s.form}><summary>{state.revision?"Revisar detalhes da rotina":"Completar detalhes da rotina"}</summary>
    <form onSubmit={ev=>{ev.preventDefault();const data=new FormData(ev.currentTarget);
      const details=Object.fromEntries(Object.keys(detailFields).map(key=>[key,String(data.get(key)).trim()])) as Details;
      run(()=>recordArea(p.map.id,item.id,"revision",mandate,state.lastId,String(data.get("note")),details));}}>
      <p>Descreva a rotina e as funções envolvidas. Preserve a identidade dos pacientes.</p>
      {Object.entries(detailFields).map(([key,label])=><label key={key}>{label}<textarea name={key} required minLength={3} maxLength={1800} defaultValue={initial[key as keyof Details]}/></label>)}
      <label>Motivo desta revisão<input name="note" required minLength={5} maxLength={2000}/></label>
      <button disabled={pending}>Salvar detalhes para conferência</button>
    </form><p role="status">{notice}</p></details>;
}
function Item({p,item}:{p:Props;item:Activity}){
  const state=activityState(item,p.ledger), mine=state.areas.filter(a=>a.assignee===p.userId);
  const {run,pending,notice}=useAreaAction();
  const feedback=p.feedback.filter(f=>f.item_id===item.id);
  const editable=p.map.status==="open" && p.canContribute;
  return <details className={s.item} open={item.id===p.focusItem || undefined}><summary><span>{item.title}</span><Badge value={state.signal}/></summary>
    <div className={s.body}><p>{state.revision?.details?.routine||item.account}</p>
    {state.revision?.details && <dl>{Object.entries(detailFields).slice(1).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{state.revision?.details?.[key as keyof Details]}</dd></div>)}</dl>}
    <p><b>Próximo passo</b> · {state.next}</p>
    {item.question && <p><b>Pergunta do levantamento</b> · {item.question}</p>}
    <div className={s.controls}><Link href={`/unidades/${p.cnes}/processos?atividade=${encodeURIComponent(item.id)}`}>Abrir na teia</Link>
    {editable && <><button onClick={()=>p.suggest(item.id,"understood")}>Está de acordo com a rotina</button><button onClick={()=>p.suggest(item.id,"change")}>Precisa corrigir</button><button onClick={()=>p.suggest(item.id,"new_step")}>Falta uma informação</button></>}
    {!!feedback.length && <button onClick={()=>p.review(item.id)}>Ver contribuições ({feedback.length})</button>}</div>
    {editable && (p.manager||mine.length>0) && <><DetailForm key={state.lastId} item={item} state={state} p={p} mandate={mine[0]?.mandate??null}/>
      <details className={s.form}><summary>Registrar ajuste necessário</summary><form onSubmit={ev=>{ev.preventDefault();const note=String(new FormData(ev.currentTarget).get("note"));run(()=>recordArea(p.map.id,item.id,"correction",mine[0]?.mandate??null,state.lastId,note,null));}}>
        <label>Qual descrição precisa mudar?<textarea name="note" required minLength={5} maxLength={2000}/></label><button disabled={pending}>Registrar ajuste</button></form></details></>}
    {editable && state.revision && !state.correction && state.missing.filter(a=>a.assignee===p.userId).map(a=><form className={s.sign} key={a.mandate+state.lastId} onSubmit={ev=>{ev.preventDefault();run(()=>recordArea(p.map.id,item.id,"approved",a.mandate,state.lastId,"Rotina, responsáveis, registros, passagens e exceções conferidos pela área.",null));}}>
      <label><input required type="checkbox"/> Conferi a rotina, os responsáveis, os registros, as passagens e as exceções por {a.area}.</label>
      <button disabled={pending}>Validar pela minha área</button></form>)}
    <p role="status">{notice}</p>
    {!!state.history.length && <details><summary>Histórico da atividade ({state.history.length})</summary><ol>{state.history.map(e=><li key={e.id}><strong>{{revision:"Detalhes revisados",correction:"Ajuste necessário",approved:"Validação da área",reopen:"Conferência reaberta"}[e.kind]}</strong> · {e.actor_name}{e.area?" · "+e.area:""} · {new Date(e.created_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"})}<p>{e.note}</p>{e.details&&<dl>{Object.entries(detailFields).map(([k,v])=><div key={k}><dt>{v}</dt><dd>{e.details?.[k as keyof Details]}</dd></div>)}</dl>}</li>)}</ol></details>}</div>
  </details>;
}
export function AreaValidationPanel(p:Props){
  const [filter,setFilter]=useState(""),[area,setArea]=useState(""),[scope,setScope]=useState(p.activities.find(a=>a.id===p.focusItem)?.macro || "");
  const rows=p.macros.map(m=>{
    const items=p.activities.filter(a=>a.macro===m.id),states=items.map(a=>activityState(a,p.ledger));
    const reps=p.ledger.assignments.filter(r=>r.active&&r.macro_id===m.id);
    const signal=macroSignal(states.map(a=>a.signal));
    const next=(states.find(a=>a.signal==="correction")||states.find(a=>a.signal==="pending"))?.next||"Conferência concluída";
    return {...m,items,states,reps,signal,next,done:states.filter(a=>a.signal==="approved").length};
  });
  const visible=rows.filter(r=>(!scope||r.id===scope)&&(!filter||filter===r.signal)&&(!area||r.reps.some(a=>a.area===area)));
  return <section className={s.panel} aria-label="Validação dos processos"><header className={s.intro}><div><h2>Validação dos processos</h2><p>Abra um processo para conferir a rotina com a equipe.</p></div><button onClick={()=>window.print()}>Imprimir resumo</button></header>
    <div className={s.stats}>{(["pending","correction","approved"] as Signal[]).map(key=><button key={key} aria-pressed={filter===key} onClick={()=>setFilter(filter===key?"":key)}><Badge value={key}/><strong>{rows.filter(r=>r.signal===key).length}</strong></button>)}</div>
    <div className={s.filters}><label>Processo<select value={scope} onChange={e=>setScope(e.target.value)}><option value="">Todos os processos</option>{rows.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
    <label>Área<select value={area} onChange={e=>setArea(e.target.value)}><option value="">Todas as áreas</option>{[...new Set(rows.flatMap(r=>r.reps.map(a=>a.area)))].sort().map(a=><option key={a}>{a}</option>)}</select></label>
    {(scope||area||filter)&&<button onClick={()=>{setScope("");setArea("");setFilter("");}}>Limpar filtros</button>}</div>
    {visible.length===0 && <p role="status">Nenhum processo corresponde aos filtros.</p>}
    {visible.map(row=><article key={row.id} className={s.card}><div className={s.heading}><h3>{row.title}</h3><Badge value={row.signal}/></div>
      <p><b>{row.done} de {row.items.length}</b> atividades validadas · {row.next}</p>
      {!!row.reps.length&&<p>{row.reps.map(r=>r.area+" · "+r.assignee_name).join(" / ")}</p>}
      <details className={s.activities} open={row.items.some(a=>a.id===p.focusItem) || undefined}><summary>Conferir atividades ({row.items.length})</summary>{row.items.map(item=><Item key={item.id} item={item} p={p}/>)}</details>
      {p.manager && p.map.status==="open" && <Representatives p={p} macro={row.id}/>}</article>)}</section>;
}

