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

type HoursRow = {
  id: string;
  profile_id: string;
  activity_date: string;
  activity_title: string;
  preparation_hours: number | string;
  meeting_hours: number | string;
  source_note: string | null;
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
  const names = new Map<string, string>();
  if (cycle) {
    const { data, error } = await supabase
      .from("coordination_hours")
      .select("id, profile_id, activity_date, activity_title, preparation_hours, meeting_hours, source_note")
      .eq("cycle_id", cycle.id)
      .order("activity_date", { ascending: false });
    if (error) throw error;
    rows = (data ?? []) as HoursRow[];
    const profileIds = [...new Set(rows.map((row) => row.profile_id))];
    if (profileIds.length) {
      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      if (peopleError) throw peopleError;
      for (const person of people ?? []) names.set(person.id, person.full_name);
    }
  }

  const totals = new Map<string, { preparation: number; meeting: number }>();
  for (const row of rows) {
    const current = totals.get(row.profile_id) ?? { preparation: 0, meeting: 0 };
    current.preparation += Number(row.preparation_hours);
    current.meeting += Number(row.meeting_hours);
    totals.set(row.profile_id, current);
  }
  const totalPreparation = rows.reduce((sum, row) => sum + Number(row.preparation_hours), 0);
  const totalMeeting = rows.reduce((sum, row) => sum + Number(row.meeting_hours), 0);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/gestao-academica" className="text-sm font-semibold text-folha hover:underline">← Voltar à gestão acadêmica</Link>
        <header className="mt-5 border-b border-stone-200 pb-6">
          <h1 className="text-3xl font-semibold">Horas da coordenação operacional</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Controle separado das capacitações dos alunos. Registra a preparação e a participação em reuniões dos acadêmicos colaboradores. As horas dos professores não são calculadas aqui.
          </p>
          {cycle ? <p className="mt-2 text-sm text-stone-500">{cycle.name}</p> : null}
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Preparação" hours={totalPreparation} />
          <SummaryCard label="Reuniões" hours={totalMeeting} />
          <SummaryCard label="Total registrado" hours={totalPreparation + totalMeeting} />
        </section>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Total por pessoa</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-0">
            <Table>
              <TableHeader><TableRow><TableHead className="pl-6">Acadêmico colaborador</TableHead><TableHead>Preparação</TableHead><TableHead>Reunião</TableHead><TableHead className="pr-6">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {[...totals].sort(([a], [b]) => (names.get(a) ?? a).localeCompare(names.get(b) ?? b, "pt-BR")).map(([profileId, value]) => (
                  <TableRow key={profileId}>
                    <TableCell className="pl-6 font-semibold">{names.get(profileId) ?? "Cadastro não localizado"}</TableCell>
                    <TableCell>{formatHours(value.preparation)}</TableCell>
                    <TableCell>{formatHours(value.meeting)}</TableCell>
                    <TableCell className="pr-6 font-semibold">{formatHours(value.preparation + value.meeting)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!rows.length ? <p className="p-6 text-sm text-stone-500">Ainda não há horas registradas neste controle.</p> : null}
          </CardContent>
        </Card>

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
