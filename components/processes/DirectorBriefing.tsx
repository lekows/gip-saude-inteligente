"use client";

import { useState } from "react";
import { ArrowUpRight, Printer } from "lucide-react";
import type { DirectorBrief } from "@/lib/units/directorBrief";
import s from "./DirectorBriefing.module.css";

const measures = [
  ["Contato confirmado", "Convocações com recebimento confirmado ÷ convocações com tentativa de contato, na semana.", "Fonte proposta: registro de tentativas da marcação."],
  ["Telefone atualizado e visível", "Atualizações da UBS conferidas e visíveis no hospital ÷ atualizações conferidas no piloto.", "Fonte proposta: conferência entre UBS e marcação."],
  ["Espera pelo registro", "Mediana de dias entre a entrega do pedido na origem e a primeira visualização pela marcação.", "Fonte proposta: datas pareadas da Secretaria e do hospital. Contar à parte os pedidos ainda invisíveis."],
];

export function DirectorBriefing({ brief, cnes }: { brief: DirectorBrief; cnes: string }) {
  const [selected, setSelected] = useState(brief.macros.find(m => m.id === "M02")?.id ?? brief.macros[0]?.id);
  const macro = brief.macros.find(m => m.id === selected);
  const max = Math.max(1, ...brief.macros.map(m => m.activities.length));
  const count = macro?.activities.length ?? 0;
  const angle = -90 + 180 * count / Math.max(1, brief.activities);
  const base = `/unidades/${cnes}/processos`;

  return <section className={s.brief} aria-label="Diagnóstico dos processos">
    <header className={s.lead}><div><p className={s.kicker}>Diagnóstico de campo · Teia v{brief.version}</p>
      <h2>O percurso do paciente</h2><p>Explore onde o encaminhamento muda de mãos e o que cada setor precisa confirmar.</p></div>
      <button className={s.print} onClick={() => window.print()}><Printer size={16}/>Imprimir painel</button>
    </header>
    <div className={s.stats}>{[[brief.macros.length,"Macroprocessos"],[brief.activities,"Atividades mapeadas"],[brief.questions,"Perguntas registradas"]].map(([n,label]) =>
      <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
    <div className={s.board}><section className={s.chart}><h3>Atividades por macroprocesso</h3><p>Selecione uma barra para ler o relato da equipe.</p>
      <div className={s.bars}>{brief.macros.map(m => <button key={m.id} aria-pressed={m.id === selected} onClick={() => setSelected(m.id)}>
        <span>{m.title}</span><i aria-hidden="true"><b style={{width: 100*m.activities.length/max+"%"}}/></i><strong>{m.activities.length}</strong>
      </button>)}</div></section>
      {macro && <section className={s.detail} aria-live="polite"><p className={s.kicker}>Leitura da equipe · {macro.id}</p><h3>{macro.title}</h3>
        <div className={s.instrument}><div className={s.dial} aria-hidden="true"><i style={{transform:`rotate(${angle}deg)`}}/></div>
        <div><strong>{count} de {brief.activities}</strong><small>atividades do mapa</small></div></div>
        <p>{macro.account || "Relato a completar pela área."}</p>
        {macro.activities.map(a => <details key={a.id} className={s.activity}><summary>{a.title}</summary><dl>
          {([["Risco a conferir",a.risk],["Melhoria proposta",a.proposal],["Pergunta à área",a.question]]).filter(([,v])=>v).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl><a href={base+"/validacao?atividade="+encodeURIComponent(a.id)}>Abrir ficha de validação <ArrowUpRight size={13}/></a></details>)}
      </section>}</div>
    <section className={s.pilot}><div><p className={s.kicker}>Proposta para deliberação</p><h3>Piloto de atualização de contatos</h3>
      <p>Escolher uma UBS e a marcação cirúrgica. Confirmar o telefone na base autorizada, registrar se a marcação consegue vê-lo e verificar se o paciente recebeu a orientação.</p>
      <p><strong>Decisão da direção</strong> · Indicar quem pode atualizar a base, quem acompanha os casos sem resposta e quando os setores revisarão os resultados.</p></div>
      <a href={base+"/validacao"}>Validar com as áreas <ArrowUpRight size={16}/></a></section>
    <section className={s.measure}><h3>Indicadores para o piloto</h3><p>Linha de base a levantar. A equipe pode começar com uma apuração semanal.</p>
      <div>{measures.map(([title,formula,source])=><details key={title}><summary>{title}</summary><p>{formula}</p><small>{source}</small></details>)}</div></section>
    <details className={s.sources}><summary>Fontes desta versão ({brief.sources.length})</summary><ul>{brief.sources.map(title=><li key={title}>{title}</li>)}</ul><a href={base}>Abrir a teia completa ↗</a></details>
  </section>;
}
