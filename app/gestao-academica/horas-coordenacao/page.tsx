import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildCoordinationMatrix } from "@/lib/academic/coordinationMatrix";

type HoursRow = {
  id: string;
  profile_id: string;
  activity_date: string;
  activity_title: string;
  preparation_hours: number | string;
  meeting_hours: number | string;
  source_note: string | null;
};

type AdministrativeRow = {
  id: string;
  profile_id: string;
  period_start: string;
  period_end: string;
  activity_title: string;
  credited_hours: number | string;
  scope_note: string;
  source_note: string;
  validation_status: "declarado" | "validado";
};

export default async function CoordinationHoursPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/entrar?redirect=/gestao-academica/horas-coordenacao");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || profile.account_status !== "aprovado" || !profile.active) {
    redirect("/aguardando-aprovacao");
  }
  if (!["administrador", "professor_coordenador"].includes(profile.role)) redirect("/meu-gip");

  const { data: cycle, error: cycleError } = await supabase
    .from("program_cycles")
    .select("id, name")
    .in("status", ["planejamento", "ativo"])
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cycleError) throw cycleError;

  let rows: HoursRow[] = [];
  let administrativeRows: AdministrativeRow[] = [];
  const names = new Map<string, string>();
  let members: { id: string; profile_id: string }[] = [];
  let classes: { id: string; title: string | null; starts_at: string }[] = [];
  let enrollments: { id: string; class_id: string; member_id: string; completed_workload_hours: number | string }[] = [];
  let attendance: { enrollment_id: string; status: "presente" | "ausente" | "justificado" }[] = [];
  let fieldEntries: { activityId: string; profileId: string; date: string; title: string; hours: number }[] = [];
  if (cycle) {
    const [ledgerResult, membersResult, classesResult, activitiesResult, administrativeResult] = await Promise.all([
      supabase.from("coordination_hours")
        .select("id, profile_id, activity_date, activity_title, preparation_hours, meeting_hours, source_note")
        .eq("cycle_id", cycle.id).order("activity_date", { ascending: false }),
      supabase.from("program_members").select("id, profile_id")
        .eq("cycle_id", cycle.id).eq("member_role", "academico_colaborador"),
      supabase.from("training_classes").select("id, title, starts_at")
        .eq("cycle_id", cycle.id).eq("status", "concluida").order("starts_at"),
      supabase.from("activities").select("id, title")
        .eq("cycle_id", cycle.id).eq("status", "concluida"),
      supabase.from("administrative_hours")
        .select("id, profile_id, period_start, period_end, activity_title, credited_hours, scope_note, source_note, validation_status")
        .eq("cycle_id", cycle.id).order("period_end", { ascending: false }),
    ]);
    if (ledgerResult.error) throw ledgerResult.error;
    if (membersResult.error) throw membersResult.error;
    if (classesResult.error) throw classesResult.error;
    if (activitiesResult.error) throw activitiesResult.error;
    if (administrativeResult.error) throw administrativeResult.error;
    rows = (ledgerResult.data ?? []) as HoursRow[];
    administrativeRows = (administrativeResult.data ?? []) as AdministrativeRow[];
    members = membersResult.data ?? [];
    classes = classesResult.data ?? [];
    const activities = activitiesResult.data ?? [];
    if (activities.length) {
      const { data, error } = await supabase.from("activity_participant_hours")
        .select("activity_id, profile_id, activity_date, credited_hours")
        .in("activity_id", activities.map((activity) => activity.id));
      if (error) throw error;
      const titleById = new Map(activities.map((activity) => [activity.id, activity.title]));
      fieldEntries = (data ?? []).map((entry) => ({
        activityId: entry.activity_id,
        profileId: entry.profile_id,
        date: entry.activity_date,
        title: titleById.get(entry.activity_id) ?? "Atividade de campo",
        hours: Number(entry.credited_hours),
      }));
    }
    const profileIds = [...new Set([...rows.map((row) => row.profile_id), ...administrativeRows.map((row) => row.profile_id), ...members.map((member) => member.profile_id)])];
    if (profileIds.length) {
      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      if (peopleError) throw peopleError;
      for (const person of people ?? []) names.set(person.id, person.full_name);
    }
    if (members.length && classes.length) {
      const { data, error } = await supabase.from("training_enrollments")
        .select("id, class_id, member_id, completed_workload_hours")
        .in("member_id", members.map((member) => member.id))
        .in("class_id", classes.map((trainingClass) => trainingClass.id));
      if (error) throw error;
      enrollments = data ?? [];
      if (enrollments.length) {
        const attendanceResult = await supabase.from("attendance_records")
          .select("enrollment_id, status")
          .in("enrollment_id", enrollments.map((enrollment) => enrollment.id));
        if (attendanceResult.error) throw attendanceResult.error;
        attendance = (attendanceResult.data ?? []) as typeof attendance;
      }
    }
  }

  const attendanceByEnrollment = new Map(attendance.map((record) => [record.enrollment_id, record.status]));
  const matrix = buildCoordinationMatrix(
    members.map((member) => ({
      profileId: member.profile_id,
      memberId: member.id,
      fullName: names.get(member.profile_id) ?? "Cadastro não localizado",
    })),
    classes.map((trainingClass) => ({
      id: trainingClass.id,
      date: trainingClass.starts_at.slice(0, 10),
      title: trainingClass.title ?? "Capacitação",
    })),
    enrollments.map((enrollment) => ({
      classId: enrollment.class_id,
      memberId: enrollment.member_id,
      status: attendanceByEnrollment.get(enrollment.id) ?? null,
      hours: Number(enrollment.completed_workload_hours),
    })),
    rows.map((row) => ({
      profileId: row.profile_id,
      date: row.activity_date,
      title: row.activity_title,
      preparationHours: Number(row.preparation_hours),
      meetingHours: Number(row.meeting_hours),
    })),
    fieldEntries,
    administrativeRows.map((row) => ({
      profileId: row.profile_id,
      periodEnd: row.period_end,
      title: row.activity_title,
      hours: Number(row.credited_hours),
    })),
  );

  const totalPreparation = rows.reduce((sum, row) => sum + Number(row.preparation_hours), 0);
  const totalMeeting = rows.reduce((sum, row) => sum + Number(row.meeting_hours), 0);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/gestao-academica" className="text-sm font-semibold text-folha hover:underline">← Voltar à gestão acadêmica</Link>
        <header className="mt-5 border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-semibold">Horas da coordenação operacional</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Cada etapa mostra se o acadêmico colaborador recebeu horas. Reuniões, capacitações, campo e apoio administrativo têm registros próprios. As horas dos professores não são calculadas aqui.
          </p>
          {cycle ? <p className="mt-2 text-sm text-stone-500">{cycle.name}</p> : null}
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Preparação" hours={totalPreparation} />
          <SummaryCard label="Reuniões" hours={totalMeeting} />
          <SummaryCard label="Campo" hours={matrix.participants.reduce((sum, person) => sum + person.fieldHours, 0)} />
          <SummaryCard label="Administrativas" hours={matrix.participants.reduce((sum, person) => sum + person.administrativeHours, 0)} />
          <SummaryCard label="Total registrado" hours={matrix.participants.reduce((sum, person) => sum + person.totalHours, 0)} />
        </section>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Horas por etapa do projeto</CardTitle>
            <p className="text-sm text-stone-500">Cada treinamento credita 10 h por presença; cada reunião on-line, 4 h; a visita de 03/11, 20 h por acadêmico confirmado; o bloco administrativo declarado, 30 h por colaborador. “0 h · falta” indica ausência registrada; “—” indica que não há crédito nessa etapa.</p>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <Table className="min-w-[1100px]">
              <TableHeader><TableRow>
                <TableHead className="pl-6">Acadêmico colaborador</TableHead>
                {matrix.stages.map((stage) => <TableHead key={stage.key} className="min-w-36"><span className="block">{formatStageDate(stage.date)}</span><span className="block text-xs font-semibold">{stage.label}</span><span className="block max-w-40 text-xs font-normal leading-tight">{stage.title}</span></TableHead>)}
                <TableHead>Capacitações</TableHead><TableHead>Reuniões</TableHead><TableHead>Campo</TableHead><TableHead>Administrativas</TableHead><TableHead className="pr-6">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {matrix.participants.map((person) => (
                  <TableRow key={person.profileId}>
                    <TableCell className="pl-6 font-semibold">{person.fullName}</TableCell>
                    {person.cells.map((cell, index) => <TableCell key={matrix.stages[index].key} className="whitespace-nowrap text-xs">{cell.status === "recebeu" ? formatHours(cell.hours) : cell.status === "ausente" ? "0 h · falta" : "—"}</TableCell>)}
                    <TableCell>{formatHours(person.trainingHours)}</TableCell>
                    <TableCell>{formatHours(person.coordinationHours)}</TableCell>
                    <TableCell>{formatHours(person.fieldHours)}</TableCell>
                    <TableCell>{formatHours(person.administrativeHours)}</TableCell>
                    <TableCell className="pr-6 font-semibold">{formatHours(person.totalHours)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!matrix.participants.length ? <p className="p-6 text-sm text-stone-500">Ainda não há acadêmicos colaboradores vinculados ao ciclo.</p> : null}
          </CardContent>
        </Card>

        {administrativeRows.length ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Apoio administrativo e operacional</CardTitle>
              <p className="text-sm text-stone-500">Bloco de 30 h por colaborador, declarado pelo responsável para o período de 01/08 a 04/11/2026. As tarefas não foram distribuídas em horas individuais por tipo. A validação institucional ainda é necessária para certificação.</p>
              <p className="text-sm text-stone-600">{administrativeRows[0].scope_note}</p>
              <p className="text-xs text-stone-500">As duas reuniões on-line já lançadas, os treinamentos e a visita de campo são etapas distintas. A estimativa de desenvolvimento de 85 h atribuída a Leonardo Karino é um controle separado e não deve ser somada automaticamente a este bloco.</p>
            </CardHeader>
            <CardContent className="overflow-x-auto px-0 pb-0">
              <Table className="min-w-[750px]">
                <TableHeader><TableRow><TableHead className="pl-6">Colaborador</TableHead><TableHead>Período</TableHead><TableHead>Horas</TableHead><TableHead>Situação</TableHead><TableHead className="pr-6">Fonte</TableHead></TableRow></TableHeader>
                <TableBody>
                  {administrativeRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="pl-6 font-semibold">{names.get(row.profile_id) ?? "Cadastro não localizado"}</TableCell>
                      <TableCell>{formatStageDate(row.period_start)} a {formatStageDate(row.period_end)}</TableCell>
                      <TableCell>{formatHours(Number(row.credited_hours))}</TableCell>
                      <TableCell>{row.validation_status === "declarado" ? "Declaradas" : "Validadas"}</TableCell>
                      <TableCell className="max-w-72 pr-6 text-xs text-stone-500">{row.source_note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Lançamentos e fonte</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <Table className="min-w-[750px]">
              <TableHeader><TableRow><TableHead className="pl-6">Data</TableHead><TableHead>Pessoa</TableHead><TableHead>Atividade</TableHead><TableHead>Preparação</TableHead><TableHead>Reunião</TableHead><TableHead className="pr-6">Fonte</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-6">{new Date(`${row.activity_date}T12:00:00-03:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</TableCell>
                    <TableCell className="font-semibold">{names.get(row.profile_id) ?? "Cadastro não localizado"}</TableCell>
                    <TableCell>{row.activity_title}</TableCell>
                    <TableCell>{formatHours(Number(row.preparation_hours))}</TableCell>
                    <TableCell>{formatHours(Number(row.meeting_hours))}</TableCell>
                    <TableCell className="max-w-72 pr-6 text-xs text-stone-500">{row.source_note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SummaryCard({ label, hours }: { label: string; hours: number }) {
  return <div className="border border-stone-200 bg-white p-5"><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-2xl font-semibold">{formatHours(hours)}</p></div>;
}

function formatHours(hours: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(hours)} h`;
}

function formatStageDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
