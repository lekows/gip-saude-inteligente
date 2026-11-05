export type CoordinationPerson = {
  profileId: string;
  memberId: string;
  fullName: string;
};

export type CoordinationTrainingStage = {
  id: string;
  date: string;
  title: string;
};

export type CoordinationTrainingEntry = {
  classId: string;
  memberId: string;
  status: "presente" | "ausente" | "justificado" | null;
  hours: number;
};

export type CoordinationMeetingEntry = {
  profileId: string;
  date: string;
  title: string;
  preparationHours: number;
  meetingHours: number;
};

export type CoordinationFieldEntry = {
  activityId: string;
  profileId: string;
  date: string;
  title: string;
  hours: number;
};

export type CoordinationStage = {
  key: string;
  date: string;
  label: string;
  title: string;
  kind: "training" | "meeting" | "field";
};

export type CoordinationCell = {
  hours: number;
  status: "recebeu" | "ausente" | "sem_registro";
};

export function buildCoordinationMatrix(
  people: CoordinationPerson[],
  trainingStages: CoordinationTrainingStage[],
  trainingEntries: CoordinationTrainingEntry[],
  meetingEntries: CoordinationMeetingEntry[],
  fieldEntries: CoordinationFieldEntry[] = [],
) {
  const meetingStages = new Map<string, CoordinationStage>();
  for (const entry of meetingEntries) {
    const key = `meeting:${entry.date}:${entry.title}`;
    meetingStages.set(key, {
      key, date: entry.date, label: "Reunião on-line", title: entry.title, kind: "meeting",
    });
  }
  const stages: CoordinationStage[] = [
    ...[...trainingStages].sort((a, b) => a.date.localeCompare(b.date)).map((stage, index) => ({
      key: `training:${stage.id}`,
      date: stage.date,
      label: `Treinamento ${index + 1}`,
      title: stage.title,
      kind: "training" as const,
    })),
    ...meetingStages.values(),
    ...[...new Map(fieldEntries.map((entry) => [entry.activityId, {
      key: `field:${entry.activityId}`,
      date: entry.date,
      label: "Visita técnica",
      title: entry.title,
      kind: "field" as const,
    }])).values()],
  ].sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));

  const trainings = new Map(trainingEntries.map((entry) => [`${entry.classId}:${entry.memberId}`, entry]));
  const meetings = new Map(meetingEntries.map((entry) => [`${entry.date}:${entry.title}:${entry.profileId}`, entry]));
  const fields = new Map(fieldEntries.map((entry) => [`${entry.activityId}:${entry.profileId}`, entry]));

  const participants = people.map((person) => {
    let trainingHours = 0;
    let coordinationHours = 0;
    let fieldHours = 0;
    const cells = stages.map((stage): CoordinationCell => {
      if (stage.kind === "training") {
        const entry = trainings.get(`${stage.key.slice("training:".length)}:${person.memberId}`);
        if (!entry?.status) return { hours: 0, status: "sem_registro" };
        if (entry.status !== "presente") return { hours: 0, status: "ausente" };
        trainingHours += entry.hours;
        return { hours: entry.hours, status: "recebeu" };
      }
      if (stage.kind === "field") {
        const entry = fields.get(`${stage.key.slice("field:".length)}:${person.profileId}`);
        if (!entry) return { hours: 0, status: "sem_registro" };
        fieldHours += entry.hours;
        return { hours: entry.hours, status: "recebeu" };
      }
      const entry = meetings.get(`${stage.date}:${stage.title}:${person.profileId}`);
      if (!entry) return { hours: 0, status: "sem_registro" };
      const hours = entry.preparationHours + entry.meetingHours;
      coordinationHours += hours;
      return { hours, status: "recebeu" };
    });
    return {
      ...person,
      cells,
      trainingHours,
      coordinationHours,
      fieldHours,
      totalHours: trainingHours + coordinationHours + fieldHours,
    };
  }).sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));

  return { stages, participants };
}
