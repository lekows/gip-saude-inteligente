import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { processContext } from "@/lib/processes/server";
import { ProcessReviewWorkspace } from "@/components/processes/ProcessReviewWorkspace";
import type { ProcessContent, ProcessFeedback, ProcessFeedbackReview, ProcessMap, ProcessMember, ProcessPerson } from "@/types/processReview";
import { readAreaLedger } from "@/lib/processes/areaLedger";
import type { Activity } from "@/lib/processes/areaValidation";
export async function UnitProcessWorkspace({ params, validation=false, activity }: { params: Promise<{ cnes: string }>; validation?:boolean; activity?:string }) {
  const { cnes } = await params;
  if (!/^\d{7}$/.test(cnes)) notFound();
  const context = await processContext().catch(() => null);
  if (!context) redirect(`/entrar?next=${encodeURIComponent(`/unidades/${cnes}/processos${validation ? "/validacao" : ""}`)}`);
  const { supabase, user, manager } = context;
  const { data: unit, error: unitError } = await supabase.from("health_units").select("id,name,cnes").eq("cnes", cnes).eq("active", true).maybeSingle();
  if (unitError) return <Unavailable />;
  if (!unit) return <Unavailable text="Esta unidade ainda não possui cadastro de processos disponível. A coordenação pode conferir o vínculo com o CNES." />;
  const { data: rawMap, error: mapError } = await supabase.from("process_maps").select("*").eq("health_unit_id", unit.id).order("version", { ascending: false }).limit(1).maybeSingle();
  if (mapError) return <Unavailable />;
  if (!rawMap) return <Unavailable text="Não há rodada disponível para sua conta nesta unidade. Solicite acesso à coordenação ou aguarde o início do levantamento." />;
  const map = rawMap as ProcessMap & { content: ProcessContent };
  const [feedback, members, people] = await Promise.all([
    supabase.from("process_feedback").select("id,map_id,map_version,author_id,item_id,kind,message,proposal,created_at").eq("map_id", map.id).order("created_at", { ascending: false }).limit(500),
    supabase.from("process_review_members").select("profile_id,participation,active").eq("map_id", map.id),
    manager ? supabase.from("profiles").select("id,full_name,role").eq("active", true).eq("account_status", "aprovado").order("full_name").limit(1500) : Promise.resolve({ data: [], error: null }),
  ]);
  if (feedback.error || members.error || people.error) return <Unavailable />;
  const ids = (feedback.data || []).map(x => x.id);
  const reviews = ids.length ? await supabase.from("process_feedback_reviews").select("id,feedback_id,revision,decision,message,reviewer_id,created_at").in("feedback_id", ids).order("revision", { ascending: false }).limit(1500) : { data: [], error: null };
  if (reviews.error) return <Unavailable />;
  const content = map.content;
  const items = [{ id: "__map__", title: "Visão geral da teia" }, ...content.macros, ...content.activities, ...content.questions, ...content.systems, ...content.sources, ...(content.decisionNodes || []), ...content.activities.flatMap(a => [{ id: `R.${a.id}`, title: `Risco potencial · ${a.title}` }, { id: `P.${a.id}`, title: `Melhoria proposta · ${a.title}` }])].map(x => ({ id: x.id, title: x.title }));
  const { content: _content, ...metadata } = map;
  const ledger = validation ? await readAreaLedger(supabase,map.id).catch(()=>null) : null;
  if (validation && !ledger) return <Unavailable text="Não foi possível carregar as validações. Tente novamente." />;
  const activityId = content.activities.find(a=>a.id===activity)?.id;
  const validationData = ledger ? {
    ledger, macros:content.macros.map(({id,title})=>({id,title})),
    activities:content.activities.map(a=>({id:a.id,title:a.title,macro:String(a.macro||""),account:String(a.account||""),area:String(a.area||""),records:String(a.records||""),owner:String(a.owner||""),question:String(a.question||"")} satisfies Activity)),
  } : null;
  return <ProcessReviewWorkspace activityId={activityId} validation={validationData} map={metadata} unitName={unit.name} cnes={cnes} userId={user.id} manager={manager} canContribute={manager || members.data?.some(m => m.profile_id === user.id && m.active && m.participation === "reviewer") === true} items={items} feedback={(feedback.data || []) as ProcessFeedback[]} reviews={(reviews.data || []) as ProcessFeedbackReview[]} members={(members.data || []) as ProcessMember[]} people={(people.data || []) as ProcessPerson[]} />;
}
function Unavailable({ text = "O módulo está temporariamente indisponível. Tente novamente mais tarde." }: { text?: string }) { return <main className="mx-auto max-w-3xl px-5 py-12"><h1 className="text-2xl font-semibold">Processos da unidade</h1><p className="mt-4 rounded-lg border bg-white p-5" role="status">{text}</p><Link href="/processos" className="mt-5 inline-block text-folha underline">Voltar aos processos disponíveis</Link></main>; }
