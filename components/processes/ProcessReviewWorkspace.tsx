"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UnitNavigation } from "@/components/units/UnitNavigation";
import { Hospital } from "lucide-react";
import styles from "./ProcessReviewWorkspace.module.css";
import { changeProcessRound, reviewProcessFeedback, sendProcessFeedback, setProcessMember } from "@/app/processos/actions";
import { FEEDBACK_KINDS, REVIEW_DECISIONS } from "@/lib/processes/rules";
import type { ProcessActionResult, ProcessFeedback, ProcessFeedbackReview, ProcessMap, ProcessMember, ProcessPerson } from "@/types/processReview";
import { AreaValidationPanel, type ValidationData } from "./AreaValidationPanel";
import {useProcessNavigation} from "./useProcessNavigation";
import {normalizeProcessHash,processHref} from "@/lib/processes/navigation";
type Props = { validation:ValidationData|null; activityId?:string; map: ProcessMap; unitName: string; cnes: string; userId: string; manager: boolean; canContribute: boolean; items: { id: string; title: string }[]; feedback: ProcessFeedback[]; reviews: ProcessFeedbackReview[]; members: ProcessMember[]; people: ProcessPerson[] };
const button = "rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium hover:border-folha disabled:opacity-50";
const input = "mt-1 w-full rounded-md border border-stone-300 bg-white p-2 text-sm";
export function ProcessReviewWorkspace(p: Props) {
  const router = useRouter(), frame = useRef<HTMLIFrameElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const navigation=useProcessNavigation({cnes:p.cnes,validation:!!p.validation,activityId:p.activityId,items:p.items,frame});
  const [feedbackItem,setFeedbackItem]=useState<string|null>(null);
  const [panel, setPanel] = useState<"suggest" | "feedback" | "members" | null>(null), [pending, start] = useTransition();
  const [itemId, setItemId] = useState("__map__"), [kind, setKind] = useState<keyof typeof FEEDBACK_KINDS>("question");
  const [message, setMessage] = useState(""), [proposal, setProposal] = useState(""), [nonce, setNonce] = useState("");
  const [notice, setNotice] = useState(""), [noticeError, setNoticeError] = useState(false), [search, setSearch] = useState("");
  const [reviewTarget, setReviewTarget] = useState<string | null>(null), [decision, setDecision] = useState<keyof typeof REVIEW_DECISIONS>("needs_information"), [reviewMessage, setReviewMessage] = useState("");
  useEffect(() => { setNonce(crypto.randomUUID()); }, []);
  useEffect(() => { if (panel && !dialog.current?.open) dialog.current?.showModal(); if (!panel && dialog.current?.open) dialog.current?.close(); }, [panel]);
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== "gip-process-feedback" && event.data?.type !== "gip-process-validation") return;
      if (typeof event.data.itemId !== "string" || !p.items.some(i => i.id === event.data.itemId)) return;
      if (event.data.type === "gip-process-validation") {
        const q=new URLSearchParams(window.location.hash.slice(1));q.set("n",event.data.itemId);
        router.push(processHref(p.cnes,true,normalizeProcessHash("#"+q.toString(),p.items.map(i=>i.id))));
        return;
      }
      setItemId(event.data.itemId);
      if (typeof event.data.kind === "string" && Object.hasOwn(FEEDBACK_KINDS, event.data.kind)) setKind(event.data.kind as keyof typeof FEEDBACK_KINDS);
      setPanel("suggest");
    };
    window.addEventListener("message", handler); return () => window.removeEventListener("message", handler);
  }, [p.items,p.cnes,router]);
  const run = (action: () => Promise<ProcessActionResult>, onSuccess?: () => void) => start(async () => {
    try { const result = await action(); setNoticeError(Boolean(result.error)); setNotice(result.error || result.success || "Operação concluída."); if (!result.error) { onSuccess?.(); router.refresh(); } }
    catch { setNoticeError(true); setNotice("Falha de conexão. Seu texto foi mantido; tente novamente."); }
  });
  const label = (id: string) => p.items.find(i => i.id === id)?.title || id;
  const person = (id: string) => id === p.userId ? "Você" : p.people.find(x => x.id === id)?.full_name || "Participante autorizado";
  const formatDate = (s: string) => new Date(s).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const latest = (id: string) => p.reviews.filter(r => r.feedback_id === id).sort((a, b) => b.revision - a.revision)[0];
  const open = (which: typeof panel) => { setNotice(""); setPanel(which); };
  async function copyLink() { try { await navigator.clipboard.writeText(window.location.origin+processHref(p.cnes,!!p.validation,navigation.hash)); setNoticeError(false); setNotice("Link deste ponto copiado. O acesso continua restrito às contas autorizadas."); } catch { setNoticeError(true); setNotice("Copie o endereço desta página pela barra do navegador."); } }
  function exportFeedback() {
    const cell = (s: string) => '"' + (/^\s*[=+@-]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"';
    const rows = [["Etapa", "Tipo", "Contribuição", "Proposta", "Participante", "Data", "Análise", "Devolutiva"], ...p.feedback.map(f => [f.item_id, FEEDBACK_KINDS[f.kind], f.message, f.proposal, person(f.author_id), formatDate(f.created_at), latest(f.id) ? REVIEW_DECISIONS[latest(f.id).decision] : "Aguardando análise", latest(f.id)?.message || ""])];
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `Contribuicoes_Processos_${p.cnes}_v${p.map.version}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <main className={styles.workspace}>
    <header className={styles.header}>
      <div className={styles.identity}>
        <span className={styles.symbol} aria-hidden="true"><Hospital /></span>
        <div>
          <Link href="/unidades" className={styles.back}>← Unidades participantes</Link>
          <div className={styles.eyebrow}>Luziânia · GIP Saúde Inteligente</div>
          <h1>{p.unitName}</h1>
          <p className={styles.subtitle}>Mapa dos processos <span className={styles.round}>{p.map.status === "open" ? "Em revisão com a equipe" : "Revisão encerrada"}</span></p>
        </div>
      </div>
      <nav className={styles.actions} aria-label="Revisão dos processos">
        <button className={styles.primary} onClick={() => {setItemId(navigation.selectedId);open("suggest");}}>Dar opinião</button>
        <button className={styles.secondary} onClick={() => { setFeedbackItem(null); open("feedback"); }}>{p.manager ? "Sugestões" : "Minhas sugestões"}<span className={styles.count}>{p.feedback.length}</span></button>
        <details className={styles.manage} onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.removeAttribute("open"); event.stopPropagation(); } }}>
          <summary className={styles.secondary}>{p.manager ? "Gerenciar" : "Compartilhar"}<span aria-hidden="true">⌄</span></summary>
          <div className={styles.manageMenu}>
            {p.manager && <button onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); open("members"); }}>Participantes desta revisão</button>}
            <button onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); void copyLink(); }}>Copiar link para compartilhar</button>
          </div>
        </details>
      </nav>
    </header>
    <UnitNavigation cnes={p.cnes} current="processos"/>
    <nav className={styles.processModes} aria-label="Visualização dos processos">
      <Link href={processHref(p.cnes,false,navigation.hash)} aria-current={!p.validation?"page":undefined}>Teia de processos</Link>
      <Link href={processHref(p.cnes,true,navigation.hash)} aria-current={p.validation?"page":undefined}>Validação pelas áreas</Link>
    </nav>

    {!panel && notice && <p className={`border-b px-4 py-2 text-sm ${noticeError ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-900"}`} role="status">{notice}</p>}
    {p.validation ? <AreaValidationPanel focusItem={p.activityId} onActivityOpen={navigation.selectActivity} navigationHash={navigation.hash} {...p.validation} map={p.map} cnes={p.cnes} manager={p.manager} canContribute={p.canContribute} userId={p.userId}
      people={p.people.filter(person=>p.members.some(m=>m.active && m.participation==="reviewer" && m.profile_id===person.id))}
      feedback={p.feedback} suggest={(id,k)=>{setItemId(id);setKind(k);open("suggest");}} review={id=>{setFeedbackItem(id);open("feedback");}} manage={()=>open("members")}/>
      : <section className={styles.graphRegion} aria-label="Exploração dos processos">
        {navigation.status!=="ready" && <div className={styles.frameNotice} role="status">{navigation.status==="error"?<><p>O diagrama não respondeu. Tente recarregar ou confira seu acesso.</p><button className={styles.secondary} onClick={navigation.retry}>Recarregar diagrama</button><Link href={processHref(p.cnes,true,navigation.hash)}>Abrir lista de validação</Link></>:"Carregando processos…"}</div>}
        <iframe key={navigation.attempt} ref={frame} onLoad={navigation.onFrameLoad} src={`/api/processos/${p.map.id}/grafo`} title={`Teia de processos · ${p.unitName}`} className={styles.graph} sandbox="allow-scripts allow-same-origin" referrerPolicy="same-origin" />
      </section>}
    <dialog ref={dialog} onCancel={() => setPanel(null)} onClose={() => setPanel(null)} className="fixed inset-0 m-auto max-h-[92dvh] w-[min(960px,96vw)] overflow-auto rounded-xl border border-stone-300 bg-[#fcfcfb] p-0 text-ink shadow-2xl backdrop:bg-black/40">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-5 py-3"><h2 className="font-semibold">{panel === "suggest" ? "Sua opinião sobre este processo" : panel === "feedback" ? p.manager ? "Sugestões da equipe" : "Minhas sugestões e respostas" : "Participantes desta revisão"}</h2><button className={button} onClick={() => setPanel(null)}>Fechar ×</button></div>
      <div className="p-5">{notice && <p role="status" className={`mb-4 rounded-md border p-3 text-sm ${noticeError ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"}`}>{notice}</p>}
      {panel === "suggest" && (!p.canContribute || p.map.status !== "open" ? <p className="rounded-md border p-4">{p.map.status !== "open" ? "A rodada foi encerrada. Você pode consultar o histórico." : "Seu acesso é de consulta. Solicite à coordenação autorização para contribuir."}</p> : <form onSubmit={event => { event.preventDefault(); run(() => sendProcessFeedback({ mapId: p.map.id, version: p.map.version, nonce, itemId, kind, message, proposal }), () => { setMessage(""); setProposal(""); setNonce(crypto.randomUUID()); }); }}>
        <p className="mb-4 text-sm leading-6 text-stone-600">Sua contribuição será identificada e analisada pela coordenação. Descreva somente processos e responsabilidades, sem nomes, telefones, SUS ou informações clínicas de pacientes. Entender uma etapa não equivale a aprovar a rotina do hospital.</p>
        <label className="block text-sm font-semibold">Sobre qual atividade?<select className={input} value={itemId} onChange={e => setItemId(e.target.value)}>{p.items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold">Tipo de contribuição<select className={input} value={kind} onChange={e => setKind(e.target.value as keyof typeof FEEDBACK_KINDS)}>{Object.entries(FEEDBACK_KINDS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold">{kind === "understood" ? "O que você compreendeu ou conseguiu conferir?" : "O que precisa ser esclarecido ou alterado?"}<textarea className={`${input} min-h-28`} required minLength={10} maxLength={3000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Explique qual etapa, informação ou passagem entre setores está em discussão." /></label>
        <label className="mt-4 block text-sm font-semibold">Sua proposta {kind === "change" || kind === "new_step" ? "(obrigatória)" : "(opcional)"}<textarea className={`${input} min-h-24`} required={kind === "change" || kind === "new_step"} minLength={kind === "change" || kind === "new_step" ? 10 : undefined} maxLength={2000} value={proposal} onChange={e => setProposal(e.target.value)} placeholder="Como ficaria a atividade ou ligação? O que confirmar na próxima visita?" /></label>
        <button className="mt-5 rounded-md bg-folha px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={pending || !nonce}>{pending ? "Registrando…" : "Enviar contribuição"}</button>
      </form>)}
      {panel === "feedback" && <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-600">{p.manager ? "Sugestões acolhidas seguem para uma próxima revisão; a teia desta rodada permanece preservada." : "Suas contribuições e as respostas da coordenação aparecem aqui. Outros alunos não acessam seus textos."}</p><button className={button} onClick={exportFeedback}>Exportar CSV</button></div>{!p.feedback.length ? <p className="rounded-md border p-5">Ainda não há contribuições disponíveis.</p> : p.feedback.filter(f=>!feedbackItem || f.item_id===feedbackItem).map(f => <article key={f.id} className="mb-4 rounded-lg border bg-white p-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500"><span>{person(f.author_id)} · {formatDate(f.created_at)} · v{f.map_version}</span><span>{latest(f.id) ? REVIEW_DECISIONS[latest(f.id).decision] : "Aguardando análise"}</span></div><h3 className="mt-2 font-semibold">{f.item_id === "__map__" ? "Geral" : f.item_id} · {label(f.item_id)}</h3><p className="mt-1 text-xs font-semibold text-folha">{FEEDBACK_KINDS[f.kind]}</p><p className="mt-3 whitespace-pre-wrap text-sm">{f.message}</p>{f.proposal && <div className="mt-3 border-l-2 border-blue-400 pl-3 text-sm"><b>Proposta</b><p className="whitespace-pre-wrap">{f.proposal}</p></div>}{p.reviews.filter(r => r.feedback_id === f.id).sort((a, b) => a.revision - b.revision).map(r => <div key={r.id} className="mt-3 rounded-md bg-stone-50 p-3 text-sm"><b>{REVIEW_DECISIONS[r.decision]}</b><p className="mt-1 whitespace-pre-wrap">{r.message}</p><p className="mt-2 text-xs text-stone-500">Análise {r.revision} · {formatDate(r.created_at)}</p></div>)}{p.manager && (reviewTarget !== f.id ? <button className={`${button} mt-3`} onClick={() => { setReviewTarget(f.id); setReviewMessage(""); }}>Registrar análise</button> : <form className="mt-4 border-t pt-3" onSubmit={e => { e.preventDefault(); run(() => reviewProcessFeedback(f.id, latest(f.id)?.revision || 0, decision, reviewMessage), () => setReviewTarget(null)); }}><label className="block text-sm font-semibold">Encaminhamento<select className={input} value={decision} onChange={e => setDecision(e.target.value as keyof typeof REVIEW_DECISIONS)}>{Object.entries(REVIEW_DECISIONS).map(([v, t]) => <option value={v} key={v}>{t}</option>)}</select></label><label className="mt-3 block text-sm font-semibold">Justificativa / devolutiva<textarea className={`${input} min-h-20`} required minLength={5} maxLength={2000} value={reviewMessage} onChange={e => setReviewMessage(e.target.value)} /></label><button disabled={pending} className={`${button} mt-3`}>{pending ? "Salvando…" : "Registrar análise"}</button></form>)}</article>)}</>}
      {panel === "members" && p.manager && <><p className="text-sm leading-6 text-stone-600">Selecione as contas que participarão desta rodada. O link não concede acesso por si só. Nenhum aluno é incluído automaticamente; revogar o acesso preserva o histórico.</p><div className="my-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">{p.members.filter(m => m.active).length} participantes autorizados · {new Set(p.feedback.map(f => f.author_id)).size} autores com contribuições</div><label className="block text-sm font-semibold">Buscar conta aprovada<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome do participante" /></label><div className="mt-4 max-h-[45dvh] overflow-auto">{p.people.filter(x => x.id !== p.userId && x.full_name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).map(person => { const membership = p.members.find(m => m.profile_id === person.id); return <div key={person.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3"><div><b className="text-sm">{person.full_name}</b><p className="text-xs text-stone-500">{person.role.replaceAll("_", " ")} · {membership?.active ? membership.participation === "reviewer" ? "Pode contribuir" : "Somente consulta" : "Sem acesso a esta teia"}</p></div><div className="flex gap-2"><button className={button} disabled={pending} onClick={() => run(() => setProcessMember(p.map.id, person.id, "reviewer", true))}>Autorizar contribuição</button>{membership?.active && <button className={button} disabled={pending} onClick={() => run(() => setProcessMember(p.map.id, person.id, membership.participation, false))}>Revogar</button>}</div></div>; })}</div><div className="mt-5 flex flex-wrap gap-3 border-t pt-4"><button className={button} onClick={copyLink}>Copiar link desta teia</button><button disabled={pending} className={button} onClick={() => run(() => changeProcessRound(p.map.id, p.map.status === "open" ? "closed" : "open"))}>{p.map.status === "open" ? "Encerrar recebimento de contribuições" : "Reabrir rodada"}</button></div></>}
      </div>
    </dialog>
  </main>;
}
