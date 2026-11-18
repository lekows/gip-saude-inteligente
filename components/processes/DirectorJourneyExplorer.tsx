"use client";

import { useState } from "react";
import { Archive, ArrowRight, ArrowUpRight, ClipboardCheck, PhoneCall, TriangleAlert, Workflow } from "lucide-react";
import type { DirectorBrief } from "@/lib/units/directorBrief";
import { journeys, opportunities } from "./directorJourneys";
import s from "./DirectorJourneyExplorer.module.css";

const icons = { contato: PhoneCall, cirurgias: Workflow, arquivo: Archive, assistencia: ClipboardCheck };

export function DirectorJourneyExplorer({ brief, base }: { brief: DirectorBrief; base: string }) {
  const activities = new Map(brief.macros.flatMap(m => m.activities.map(a => [a.id, a] as const)));
  const available = journeys
    .map(journey => ({ ...journey, stages: journey.stages.filter(stage => activities.has(stage.activity)) }))
    .filter(journey => journey.stages.length > 0);
  const [selection, setSelection] = useState({ journey: "contato", activity: "M02.A01" });
  const journey = available.find(item => item.id === selection.journey) ?? available[0];
  if (!journey) return null;
  const stage = journey.stages.find(item => item.activity === selection.activity) ?? journey.stages[0];
  const activity = activities.get(stage.activity)!;
  const Icon = icons[journey.id as keyof typeof icons];

  function openJourney(id: string) {
    const next = available.find(item => item.id === id);
    if (!next) return;
    const point = next.stages.find(item => item.attention) ?? next.stages[0];
    setSelection({ journey: next.id, activity: point.activity });
  }

  return <>
    <section id="percursos" className={s.explorer} aria-labelledby="percursos-titulo" data-tone={journey.id}>
      <header className={s.sectionHead}>
        <div><h3 id="percursos-titulo">Como o trabalho passa de uma equipe para outra</h3>
          <p>Escolha um fluxo e selecione uma etapa para ver o comentário e a melhoria discutida.</p></div>
        <a href={base}>Teia completa <ArrowUpRight size={15}/></a>
      </header>
      <div className={s.filters} role="group" aria-label="Percursos do hospital">
        {available.map(item => {
          const ItemIcon = icons[item.id as keyof typeof icons];
          return <button key={item.id} type="button" data-tone={item.id} aria-pressed={item.id === journey.id} onClick={() => openJourney(item.id)}>
            <ItemIcon size={17} aria-hidden="true"/>{item.label}
          </button>;
        })}
      </div>
      <div className={s.canvas}>
        <div className={s.canvasHeading}><Icon size={20} aria-hidden="true"/><h4>{journey.label}</h4></div>
        <p>{journey.description}</p>
        <ol className={s.track} aria-label={journey.label}>
          {journey.stages.map((item, index) => <li key={item.activity}>
            {index > 0 && journey.id !== "assistencia" && <ArrowRight className={s.connector} size={18} aria-hidden="true"/>}
            <button type="button" className={s.node} aria-pressed={item.activity === stage.activity}
              onClick={() => setSelection({ journey: journey.id, activity: item.activity })}>
              <span className={s.nodeTop}><span>{item.role}</span>{item.attention && <TriangleAlert size={15} aria-label="Ponto de atenção"/>}</span>
              <strong>{item.label}</strong>
            </button>
          </li>)}
        </ol>
        <div className={s.comment} aria-live="polite">
          <div>
            <small>{stage.attention ? "Ponto de atenção" : "Pergunta para validação"}</small>
            <h4>{stage.attention || stage.label}</h4>
            <p>{stage.attention ? activity.risk || activity.question : activity.question}</p>
            {activity.account && <details key={activity.id}><summary>Relato da equipe</summary><p>{activity.account}</p></details>}
          </div>
          <div>
            <small>Melhoria proposta</small>
            <p>{stage.improvement || activity.proposal || "Conferir com a área e registrar o próximo passo."}</p>
            <a href={base + "/validacao?atividade=" + encodeURIComponent(activity.id)}>Validar etapa <ArrowUpRight size={14}/></a>
          </div>
        </div>
      </div>
    </section>
    <section className={s.opportunities} aria-labelledby="oportunidades-titulo">
      <h3 id="oportunidades-titulo">Oportunidades para discutir com a direção</h3>
      <div className={s.cards}>
        {opportunities.filter(item => available.some(route => route.id === item.journey)).map(item => {
          const ItemIcon = icons[item.journey as keyof typeof icons];
          return <article key={item.journey} data-tone={item.journey}>
            <div><ItemIcon size={19} aria-hidden="true"/><small>{item.label}</small></div>
            <h4>{item.title}</h4><p>{item.summary}</p>
            <a href="#percursos" onClick={() => openJourney(item.journey)}>Ver no fluxo <ArrowRight size={15}/></a>
          </article>;
        })}
      </div>
    </section>
  </>;
}
