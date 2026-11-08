"use client";

import { useId, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, CheckCheck, CircleAlert, Clock3, Stethoscope } from "lucide-react";
import { agendaComposition, agendaSignal, demoDays, stageNames, summarize } from "@/lib/processes/hospitalDemo";
import type { DemoRow, Stage } from "@/lib/processes/hospitalDemo";
import s from "./ExecutiveVisuals.module.css";

const number = (n: number) => n.toLocaleString("pt-BR");
const percent = (n: number | null) => n === null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const stageColors: Record<Stage, string> = { consultas: "#3676e0", retornos: "#8256d7", cirurgias: "#079c94", revisoes: "#8256d7" };

export function ExecutiveVisuals({ rows, allRows, stages, day, onDayChange, cataract, cnes }: {
  rows: DemoRow[]; allRows: DemoRow[]; stages: Stage[]; day: string;
  onDayChange: (day: string) => void; cataract: boolean; cnes: string;
}) {
  const [detail, setDetail] = useState<Stage | null>(null);
  const uid = useId().replace(/:/g, "");
  const total = agendaComposition(rows);
  const surgery = summarize(rows.filter(row => row.stage === "cirurgias"));
  const signal = agendaSignal(total.completion);
  const daily = demoDays.map(value => ({ day: value, ...summarize(allRows.filter(row => row.day === value)) }));
  const ceiling = Math.max(10, Math.ceil(Math.max(...daily.map(row => row.scheduled)) / 20) * 20);
  const x = (i: number) => 45 + i * 115;
  const y = (n: number) => 170 - n / ceiling * 140;
  const line = (key: "scheduled" | "completed") => daily.map((row, i) => `${x(i)},${y(row[key])}`).join(" ");
  const outcomes = [
    { label: "Realizados", value: total.completed, color: "#0b9d8a" },
    { label: "Faltas", value: total.absent, color: "#e75e75" },
    { label: "Adiamentos", value: total.postponed, color: "#e4a426" },
    { label: "A esclarecer", value: total.unresolved, color: "#9baabd" },
  ];
  let offset = 0;
  const focused = detail && stages.includes(detail) ? { stage: detail, ...agendaComposition(rows.filter(row => row.stage === detail)) } : null;
  const count = cataract ? surgery.completed : total.completed;
  return <div className={s.visuals}>
    <div className={s.kpis}>
      <article className={s.kpi} data-tone="teal"><span className={s.metricIcon}><Stethoscope size={20}/></span><span>{cataract ? "Cirurgias realizadas" : "Atendimentos realizados"}</span><strong data-testid="main-total">{number(count)}</strong><small>{cataract ? "Exemplo em procedimentos / olhos" : "Registros no período selecionado"}</small></article>
      <article className={s.kpi} data-tone="blue"><span className={s.metricIcon}><CheckCheck size={20}/></span><span>Conclusão da agenda</span><strong>{percent(total.completion)}</strong><small>Realizados ÷ agendados · mesmas etapas</small></article>
      <article className={s.kpi} data-tone="rose"><span className={s.metricIcon}><CircleAlert size={20}/></span><span>Faltas registradas</span><strong>{number(total.absent)}</strong><small>Ocorrências por etapa do atendimento</small></article>
      <article className={s.kpi} data-tone="amber"><span className={s.metricIcon}><Clock3 size={20}/></span><span>Adiamentos</span><strong>{number(total.postponed)}</strong><small>Motivos a detalhar pela equipe</small></article>
    </div>

    <div className={s.chartGrid}>
      <section className={s.card} aria-labelledby={`${uid}-trend`}>
        <div className={s.heading}><div><span className={s.caption}>Ritmo de atendimento</span><h3 id={`${uid}-trend`}>Agenda e execução na semana</h3></div><span className={s.chartIcon}><Activity size={20}/></span></div>
        <div className={s.legend}><span><i style={{background:"#4380e4"}}/>Realizados</span><span><i style={{background:"#a4b5c9"}}/>Agendados</span><small>Semana completa de exemplo</small></div>
        <svg className={s.trend} viewBox="0 0 540 202" role="img" aria-labelledby={`${uid}-trend-title ${uid}-trend-desc`}>
          <title id={`${uid}-trend-title`}>Agenda e execução por dia</title>
          <desc id={`${uid}-trend-desc`}>{daily.map(row => `${row.day}: ${row.scheduled} agendados, ${row.completed} realizados`).join(". ")}. São registros por etapa, não pessoas distintas.</desc>
          <defs><linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4380e4" stopOpacity=".24"/><stop offset="100%" stopColor="#4380e4" stopOpacity=".01"/></linearGradient></defs>
          {[0, .25, .5, .75, 1].map(part => <g key={part}><line x1="40" x2="520" y1={y(ceiling*part)} y2={y(ceiling*part)} stroke="#e5ecf4" strokeDasharray="3 5"/><text x="30" y={y(ceiling*part)+4} textAnchor="end" fill="#708298" fontSize="10">{number(ceiling*part)}</text></g>)}
          <polygon points={`45,170 ${line("completed")} 505,170`} fill={`url(#${uid}-area)`}/>
          <polyline points={line("scheduled")} fill="none" stroke="#a4b5c9" strokeWidth="2" strokeDasharray="5 5"/>
          <polyline points={line("completed")} fill="none" stroke="#4380e4" strokeWidth="3" strokeLinejoin="round"/>
          {daily.map((row,i) => <g key={row.day}><circle cx={x(i)} cy={y(row.completed)} r={day===row.day?7:4} fill="#4380e4" stroke="white" strokeWidth="2"/><text x={x(i)} y="195" textAnchor="middle" fill="#708298" fontSize="11">{row.day.slice(0,3)}</text></g>)}
        </svg>
        <div className={s.dayButtons} aria-label="Selecionar dia no gráfico">{daily.map(row => <button key={row.day} aria-label={`${row.day}: ${row.completed} realizados de ${row.scheduled} agendados`} aria-pressed={day===row.day} onClick={() => onDayChange(day===row.day?"":row.day)}>{row.day.slice(0,3)}<b>{number(row.completed)}</b></button>)}</div>
        <p className={s.footnote}>Selecione um dia para atualizar os indicadores. A curva mantém a semana como contexto.</p>
      </section>

      <section className={s.card} aria-labelledby={`${uid}-composition`}>
        <div className={s.heading}><div><span className={s.caption}>Resultado dos registros</span><h3 id={`${uid}-composition`}>O que aconteceu com a agenda</h3></div><CalendarDays size={20} className={s.softIcon}/></div>
        <div className={s.donutLayout}>
          <div className={s.donut}>
            <svg viewBox="0 0 180 180" role="img" aria-labelledby={`${uid}-donut-title`} data-testid="composition-chart">
              <title id={`${uid}-donut-title`}>{number(total.scheduled)} agendados. {outcomes.map(row=>`${row.label}: ${row.value}`).join(". ")}</title>
              <circle cx="90" cy="90" r="69" fill="none" stroke="#edf2f7" strokeWidth="19"/>
              {outcomes.map(row => {const length=total.scheduled?row.value/total.scheduled*433.54:0;const start=offset;offset+=length;return <circle key={row.label} cx="90" cy="90" r="69" fill="none" stroke={row.color} strokeWidth="19" strokeDasharray={`${length} ${433.54-length}`} strokeDashoffset={-start} transform="rotate(-90 90 90)"/>;})}
            </svg>
            <div className={s.donutCenter}><strong>{number(total.scheduled)}</strong><span>agendados</span></div>
          </div>
          <div className={s.outcomes}>{outcomes.map(row => <div key={row.label}><span><i style={{background:row.color}}/>{row.label}</span><strong>{number(row.value)}</strong></div>)}</div>
        </div>
        <div className={s.summarySignal} data-tone={signal.tone}><span className={s.signalDot}/><span>{signal.label}<small>{total.completion===null?"Nenhum agendamento no período":`${percent(total.completion)} de execução · referência ilustrativa`}</small></span></div>
        <p className={s.footnote}>Uma pessoa pode aparecer em mais de uma etapa. As contagens não representam pessoas distintas.</p>
      </section>
    </div>

    <section className={s.card} aria-labelledby={`${uid}-signals`}>
      <div className={s.heading}><div><span className={s.caption}>Leitura rápida para a direção</span><h3 id={`${uid}-signals`}>Semáforo da execução por etapa</h3></div><span className={s.reference}>Critérios de demonstração</span></div>
      <div className={s.stageGrid}>{stages.map(stage => {
        const sum=agendaComposition(rows.filter(row=>row.stage===stage));const state=agendaSignal(sum.completion);
        return <button key={stage} className={s.stageCard} data-tone={state.tone} aria-expanded={focused?.stage===stage} aria-controls={`${uid}-detail`} onClick={()=>setDetail(detail===stage?null:stage)}>
          <span className={s.stageName}><span className={s.stageMark} style={{background:stageColors[stage]}}/>{stageNames[stage]}<ArrowUpRight size={16}/></span>
          <strong>{percent(sum.completion)}</strong><span className={s.stageTrack}><span style={{width:`${sum.completion??0}%`,background:stageColors[stage]}}/></span>
          <span className={s.stageNumbers}>{number(sum.completed)} realizados <span>/ {number(sum.scheduled)} agendados</span></span>
          <span className={s.stageStatus}><i className={s.signalDot}/>{state.label}</span>
        </button>;
      })}</div>
      <div id={`${uid}-detail`} hidden={!focused} className={s.detail} role="region" aria-label="Detalhamento da etapa">
        {focused && <><div><h4>{stageNames[focused.stage]} · {day||"semana de exemplo"}</h4><p>{number(focused.absent)} faltas · {number(focused.postponed)} adiamentos · {number(focused.unresolved)} a esclarecer.</p><p>Conferir a origem dos registros e os motivos com a equipe antes de decidir uma ação.</p></div><a href={`/unidades/${cnes}/processos/validacao?atividade=${focused.stage==="cirurgias"?"M04.A01":"M03.A01"}`}>Conferir o processo <ArrowUpRight size={15}/></a><button onClick={()=>setDetail(null)}>Fechar detalhe</button></>}
      </div>
      <details className={s.criteria}><summary>Como ler os semáforos <ArrowDownRight size={14}/></summary><p>Verde: execução de 90% ou mais. Amarelo: de 75% a menos de 90%. Vermelho: abaixo de 75%. Cinza: sem agenda. Fórmula: realizados ÷ agendados da mesma etapa e período. Referências apenas para a demonstração; as metas oficiais serão definidas com o hospital. Estes sinais não indicam qualidade clínica nem validação do processo.</p></details>
    </section>
  </div>;
}
