export type Stage = "consultas" | "retornos" | "cirurgias" | "revisoes";
export type DemoRow = {
  day: string;
  stage: Stage;
  scheduled: number;
  completed: number;
  absent: number;
  postponed: number;
};
export const stageNames: Record<Stage, string> = {
  consultas: "Consultas",
  retornos: "Retornos",
  cirurgias: "Cirurgias",
  revisoes: "Revisões pós-operatórias",
};
export const demoDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export function initialDemo(cataract: boolean): DemoRow[] {
  return demoDays.flatMap((day, index) => {
    const stages: Stage[] = cataract ? ["consultas", "cirurgias", "revisoes"] : ["consultas", "retornos", "cirurgias"];
    return stages.map(stage => {
      const scheduled = stage === "consultas" ? 64 : stage === "cirurgias" ? cataract ? 44 : 12 : 38;
      const absent = stage === "consultas" ? index % 2 ? 4 : 3 : 2;
      const postponed = index === 2 ? 4 : 2;
      return { day, stage, scheduled, absent, postponed, completed: scheduled - absent - postponed };
    });
  });
}
export function summarize(rows: DemoRow[]) {
  const total = rows.reduce((sum, row) => ({
    scheduled: sum.scheduled + row.scheduled,
    completed: sum.completed + row.completed,
    absent: sum.absent + row.absent,
    postponed: sum.postponed + row.postponed,
  }), { scheduled: 0, completed: 0, absent: 0, postponed: 0 });
  return { ...total, completion: total.scheduled ? total.completed / total.scheduled * 100 : null };
}
export function rowError(row: DemoRow): string | null {
  if (![row.scheduled, row.completed, row.absent, row.postponed].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 99999)) {
    return "Use quantidades inteiras entre zero e 99.999.";
  }
  if (row.completed + row.absent + row.postponed > row.scheduled) {
    return "Realizados, faltas e adiamentos somados precisam caber na agenda.";
  }
  return null;
}

