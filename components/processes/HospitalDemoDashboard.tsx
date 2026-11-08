"use client";

import { UnitNavigation } from "@/components/units/UnitNavigation";
import { useRef, useState } from "react";
import { demoDays, initialDemo, rowError, stageNames, summarize } from "@/lib/processes/hospitalDemo";
import type { DemoRow, Stage } from "@/lib/processes/hospitalDemo";
import s from "./HospitalDemoDashboard.module.css";

type View = "hospital" | "catarata" | "alimentacao";
const quantityNames = { scheduled: "Agendados", completed: "Realizados", absent: "Faltas", postponed: "Adiamentos" };
const integer = (n: number) => n.toLocaleString("pt-BR");
const percentage = (n: number | null) => n === null ? "Sem agenda" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";

function downloadOwners() {
  const rows = [
    ["nome_completo", "email_conta_google", "area", "processo", "perfil_solicitado"],
    ["", "", "", "M01 - Comunicação com pacientes", "contribuir e validar pela área"],
    ["", "", "", "M02 - Cadastro e contatos", "contribuir e validar pela área"],
    ["", "", "", "M03 - Consultas e retornos", "contribuir e validar pela área"],
    ["", "", "", "M04 - Marcação e acompanhamento de cirurgias", "contribuir e validar pela área"],
    ["", "", "", "M05 - Prontuários e arquivo", "contribuir e validar pela área"],
  ];
  const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map(row => row.join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Responsaveis_Processos_Hospital.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadTemplate() {
  const columns = "acao;data;etapa;procedimento;unidade_origem;agendados;realizados;faltas;adiamentos;fonte;responsavel_conferencia\r\n";
  const url = URL.createObjectURL(new Blob(["\ufeff" + columns], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Modelo_Consolidacao_Agregada_Hospital.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function HospitalDemoDashboard({ unitName, cnes, initialView = "hospital" }: { unitName: string; cnes: string; initialView?: "hospital" | "catarata" }) {
  const [view, setView] = useState<View>(initialView);
  const [day, setDay] = useState("");
  const [hospital, setHospital] = useState(() => initialDemo(false));
  const [cataract, setCataract] = useState(() => initialDemo(true));
  const [editRow, setEditRow] = useState<DemoRow | null>(null);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const isCataract = view === "catarata";
  const allRows = isCataract ? cataract : hospital;
  const rows = allRows.filter(row => !day || row.day === day);
  const stages = [...new Set(allRows.map(row => row.stage))];
  const total = summarize(rows);
  const operations = summarize(rows.filter(row => row.stage === "cirurgias"));
  const postponed = total.postponed;
  const dateLabel = day || "Semana de exemplo";

  function switchView(next: View) {
    setView(next);
    setDay("");
    setMessage("");
  }
  function reset() {
    if (isCataract) setCataract(initialDemo(true));
    else setHospital(initialDemo(false));
    setMessage("Os valores de exemplo foram restaurados.");
  }
  function edit() {
    setMessage("");
    setEditRow({ ...(allRows.find(row => row.day === (day || demoDays[0]) && row.stage === stages[0])!) });
    dialog.current?.showModal();
  }
  function chooseRow(nextDay: string, nextStage: Stage) {
    setMessage("");
    setEditRow({ ...allRows.find(row => row.day === nextDay && row.stage === nextStage)! });
  }
  function save() {
    if (!editRow) return;
    const error = rowError(editRow);
    if (error) return setMessage(error);
    const replace = (previous: DemoRow[]) => previous.map(row => row.day === editRow.day && row.stage === editRow.stage ? { ...editRow } : row);
    if (isCataract) setCataract(replace);
    else setHospital(replace);
    dialog.current?.close();
    setMessage("Simulação atualizada. Os valores valem enquanto esta página estiver aberta.");
  }

  return <main className={s.page}>
    <header className={s.header}>
      <div><a href="/unidades" className={s.back}>← Unidades participantes</a>
        <p className={s.eyebrow}>GIP · Gestão hospitalar</p><h1>{unitName}</h1>
        <p>Uma proposta para acompanhar o atendimento, começando pelas informações disponíveis.</p></div>
    </header>
    <UnitNavigation cnes={cnes} current={initialView === "catarata" ? "acoes" : "painel"}/>
    {initialView === "catarata" && <a href={`/unidades/${cnes}/acoes`} className={s.back + " " + s.actionBack}>← Ações e projetos da unidade</a>}
    <div className={s.demo}><span className={s.dot} /><strong>Demonstração com dados fictícios</strong>
      <span>Fontes previstas: planilhas conferidas e lançamento manual.</span></div>
    {initialView === "hospital" && <nav className={s.tabs} aria-label="Visões do painel">
      {([["hospital", "Painel"], ["alimentacao", "Como atualizar"]] as const).map(([value, title]) =>
        <button key={value} aria-pressed={view === value} onClick={() => switchView(value)}>{title}</button>)}
    </nav>}

    {view === "alimentacao" ? <section className={s.start}>
      <div className={s.sectionTitle}><div><p className={s.eyebrow}>Próximo passo</p><h2>Começar pela rotina que o hospital já registra</h2></div><button className={s.button} onClick={downloadTemplate}>Baixar modelo de planilha</button></div>
      <div className={s.startGrid}>
        <article className={s.card}><h3>Uma consolidação simples</h3><p>O responsável reúne os totais por dia, etapa e procedimento, confere com a planilha da área e informa a data de atualização.</p><ul><li>Agendados e realizados</li><li>Faltas e adiamentos</li><li>Fonte e responsável pela conferência</li></ul></article>
        <article className={s.card}><h3>O que precisamos combinar</h3><p>Quem consolida, com qual frequência, o que cada quantidade significa e quais registros permitem conferir o resultado.</p><p>Para a catarata, confirmar o calendário de consultas, cirurgias e revisões e se a contagem se refere a pessoas, olhos ou procedimentos.</p></article>
        <article className={s.card}><h3>Detalhar antes de validar</h3><p>Cada área completa a rotina, os responsáveis, os registros, as passagens e as exceções no painel de processos.</p><p>A coordenação indica os representantes entre as contas autorizadas. Reúna nome, área e o e-mail da conta Google de cada pessoa.</p><button className={s.quiet} onClick={downloadOwners}>Baixar lista de responsáveis</button><a href={`/unidades/${cnes}/processos/validacao`}>Abrir validação dos processos →</a></article>
      </div>
      <div className={s.note}><h3>Uma informação ainda desconhecida pode aparecer assim</h3><div className={s.unknownGrid}><p>Tempo médio de espera<strong>A levantar na fonte</strong></p><p>Pessoas distintas atendidas<strong>A confirmar pelo hospital</strong></p><p>Situação no sistema estadual<strong>Acesso e atualização a confirmar</strong></p></div></div>
      <p className={s.muted}>O modelo contém somente colunas para totais agregados. Os registros individuais permanecem sob os acessos autorizados do hospital.</p>
    </section> : <>
      <section className={s.toolbar}><div><p className={s.eyebrow}>{isCataract ? "Mutirão · proposta de acompanhamento" : "Rotina · proposta de acompanhamento"}</p>
        <h2>{isCataract ? "Do agendamento à revisão da catarata" : "O que aconteceu e o que pede atenção"}</h2>
        <p>{isCataract ? "Calendário e metas da ação aguardam confirmação. Todos os totais abaixo são exemplos." : "Exemplo de produção registrada em três etapas da rotina."}</p></div>
        <div className={s.tools}><label>Período<select aria-label="Período" value={day} onChange={ev => { setDay(ev.target.value); setMessage(""); }}><option value="">Semana de exemplo</option>{demoDays.map(value => <option key={value}>{value}</option>)}</select></label>
          <button className={s.button} onClick={edit}>Simular atualização</button><button className={s.quiet} onClick={() => window.print()}>Imprimir visão</button></div>
      </section>
      <div className={s.kpis}>
        <article className={s.kpi}><span>{isCataract ? "Cirurgias realizadas" : "Atendimentos realizados"}</span><strong data-testid="main-total">{integer(isCataract ? operations.completed : total.completed)}</strong><small>{isCataract ? "Exemplo em procedimentos / olhos" : "Registros de atendimento no período"}</small></article>
        <article className={s.kpi}><span>Conclusão da agenda</span><strong>{percentage(total.completion)}</strong><small>Realizados ÷ agendados · mesmas etapas</small></article>
        <article className={s.kpi}><span>Faltas registradas</span><strong>{integer(total.absent)}</strong><small>Ocorrências por etapa do atendimento</small></article>
        <article className={s.kpi} data-tone="amber"><span>Adiamentos</span><strong>{integer(postponed)}</strong><small>Motivos a detalhar pela equipe</small></article>
      </div>
      <div className={s.charts}>
        <section className={s.card}><div className={s.sectionTitle}><h3>Agenda e execução</h3><span className={s.muted}>{dateLabel}</span></div>
          <div className={s.legend}><span><i className={s.pale}/>Agendados</span><span><i/>Realizados</span></div>
          {stages.map(stage => {
            const sum = summarize(rows.filter(row => row.stage === stage));
            const max = Math.max(1, ...stages.map(value => summarize(rows.filter(row => row.stage === value)).scheduled));
            return <div className={s.barGroup} key={stage}><div><b>{stageNames[stage]}</b><span>{integer(sum.completed)} de {integer(sum.scheduled)}</span></div>
              <div className={s.track}><span style={{ width: sum.scheduled / max * 100 + "%" }} className={s.scheduled}/><span style={{ width: sum.completed / max * 100 + "%" }} className={s.completed}/></div></div>;
          })}<p className={s.muted}>Contagens por etapa. Uma pessoa pode participar de mais de uma etapa.</p>
        </section>
        <section className={s.card}><div className={s.sectionTitle}><h3>{isCataract ? "Revisão após a cirurgia" : "Foco da próxima conversa"}</h3><span className={s.sample}>Exemplo</span></div>
          {isCataract ? <><div className={s.bigStat}>{integer(summarize(rows.filter(row => row.stage === "revisoes")).completed)}<span>revisões realizadas</span></div><p>A equipe pode acompanhar quem precisa retornar e consolidar as revisões devidas e realizadas.</p><div className={s.callout}>A cobertura do acompanhamento exige confirmar quais revisões já eram devidas no período.</div><p className={s.muted}>A proporção de revisão pós-operatória será definida com o hospital.</p></> :
            <><div className={s.bigStat}>{integer(operations.completed)}<span>cirurgias realizadas no exemplo</span></div><p>Conferir os motivos de adiamento e a passagem entre regulação, preparo e programação.</p><a className={s.textLink} href={`/unidades/${cnes}/processos/validacao?atividade=M04.A01`}>Conferir o processo de cirurgias →</a></>}
        </section>
      </div>
      {!isCataract && <section className={s.card + " " + s.gaps}><div className={s.sectionTitle}><div><h3>Pendências ao longo do atendimento</h3><p className={s.muted}>Informações a levantar com os setores para a primeira versão real.</p></div></div>
        <div className={s.gapGrid}>{[
          ["Pedidos aguardando inclusão", "Conferir com a Secretaria e a regulação", "M04.A02"],
          ["Preparo cirúrgico pendente", "Conferir exames e avaliações", "M04.A04"],
          ["Contatos a atualizar", "Definir a base e quem pode corrigir", "M02.A01"],
          ["Prontuários a localizar", "Conferir demandas e locais de guarda", "M05.A04"],
        ].map(([title, note, item]) => <a key={item} href={`/unidades/${cnes}/processos/validacao?atividade=${item}`}><span>{title}</span><strong>A levantar</strong><small>{note} →</small></a>)}</div>
      </section>}
      <section className={s.card}><div className={s.sectionTitle}><div><h3>Consolidação por etapa</h3><p className={s.muted}>Base de demonstração · {dateLabel.toLowerCase()}</p></div><button className={s.quiet} onClick={downloadTemplate}>Baixar modelo de planilha</button></div>
        <div className={s.tableWrap}><table><thead><tr><th>Etapa</th><th>Agendados</th><th>Realizados</th><th>Faltas</th><th>Adiamentos</th><th>A esclarecer</th><th>Conclusão</th></tr></thead><tbody>{stages.map(stage => {
          const sum = summarize(rows.filter(row => row.stage === stage));
          return <tr key={stage}><th>{stageNames[stage]}</th><td>{integer(sum.scheduled)}</td><td>{integer(sum.completed)}</td><td>{integer(sum.absent)}</td><td>{integer(sum.postponed)}</td><td>{integer(sum.scheduled-sum.completed-sum.absent-sum.postponed)}</td><td>{percentage(sum.completion)}</td></tr>;
        })}</tbody></table></div>
      </section>
      <section className={s.note}><div><h3>Da planilha ao painel</h3><p>Atualização manual → conferência da área → resumo para a gestão.</p></div><span>Responsável e periodicidade a combinar</span></section>
      <footer className={s.footer}><span role="status">{message || "Os totais deste painel são fictícios e servem para discutir o formato com a direção."}</span><button className={s.quiet} onClick={reset}>Restaurar exemplo</button></footer>
    </>}

    <dialog ref={dialog} className={s.dialog} onCancel={() => setMessage("")}>
      <div className={s.sectionTitle}><h2>Simular atualização da planilha</h2><button className={s.quiet} onClick={() => { dialog.current?.close(); setMessage(""); }}>Fechar</button></div>
      <p>Quantidades fictícias para demonstrar a alimentação manual.</p>
      {editRow && <form onSubmit={ev => { ev.preventDefault(); save(); }}>
        <div className={s.formGrid}><label>Dia<select aria-label="Dia" value={editRow.day} onChange={ev => chooseRow(ev.target.value, editRow.stage)}>{demoDays.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Etapa<select aria-label="Etapa" value={editRow.stage} onChange={ev => chooseRow(editRow.day, ev.target.value as Stage)}>{stages.map(value => <option key={value} value={value}>{stageNames[value]}</option>)}</select></label>
          {Object.entries(quantityNames).map(([key, title]) => <label key={key}>{title}<input type="number" min={0} max={99999} step={1} required value={Number.isNaN(editRow[key as keyof typeof quantityNames]) ? "" : editRow[key as keyof typeof quantityNames]} onChange={ev => setEditRow({ ...editRow, [key]: ev.target.value === "" ? NaN : Number(ev.target.value) })}/></label>)}</div>
        <p role="alert">{message}</p><button className={s.primary}>Atualizar demonstração</button>
      </form>}
    </dialog>
  </main>;
}

