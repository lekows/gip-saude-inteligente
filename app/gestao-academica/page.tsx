import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { AcademicSetupButton } from "@/components/academic/AcademicSetupButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAcademicDashboardData } from "@/lib/academic/academicService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MANAGER_ROLES = ["administrador", "professor_coordenador"];

export default async function AcademicManagementPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/entrar?redirect=/gestao-academica");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.account_status !== "aprovado" || !profile.active) {
    redirect("/aguardando-aprovacao");
  }
  if (!MANAGER_ROLES.includes(profile.role)) redirect("/meu-gip");

  const data = await getAcademicDashboardData(supabase);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-folha">
              <GraduationCap size={19} />
              Gestão Acadêmica GIP
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">Turma, capacitações e presença</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Acompanhamento interno dos acadêmicos, carga horária efetivamente cumprida e encontros do programa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/gestao-avaliacoes" className="inline-flex h-10 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-folha">Avaliações e sugestões</Link>
            {data.cycle ? <AcademicSetupButton configured /> : null}
            {profile.role === "administrador" ? (
              <Link
                href="/admin/usuarios"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-[#28352d]"
              >
                <UsersRound size={17} />
                Gerenciar cadastros
              </Link>
            ) : null}
          </div>
        </header>

        {!data.cycle ? (
          <section className="mt-6 border-y border-stone-200 bg-white px-5 py-7 sm:px-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <Badge className="border-amber-200 bg-amber-50 text-amber-900">Primeira configuração</Badge>
                <h2 className="mt-3 text-2xl font-semibold">Preparar a turma piloto de 2026</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                  O início assistido cria o ciclo de 86 horas, o encontro de integração, quatro capacitações e as matrículas dos acadêmicos que já estiverem aprovados.
                </p>
                <div className="mt-5">
                  <AcademicSetupButton />
                </div>
              </div>
              <div className="border-l-4 border-folha bg-green-50 p-5">
                <p className="text-sm font-semibold text-green-900">Serão configurados</p>
                <ul className="mt-3 space-y-2 text-sm text-green-900/80">
                  <li>Turma piloto com meta máxima de 86 horas</li>
                  <li>Quatro encontros de capacitação</li>
                  <li>Vínculo somente de contas aprovadas</li>
                  <li>Chamada e carga horária auditáveis</li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard icon={UsersRound} label="Acadêmicos cadastrados" value={data.kpis.registeredStudents} />
          <KpiCard icon={CheckCircle2} label="Cadastros aprovados" value={data.kpis.approvedStudents} tone="green" />
          <KpiCard icon={GraduationCap} label="Vinculados à turma" value={data.kpis.linkedStudents} />
          <KpiCard
            icon={BookOpenCheck}
            label="Presença média"
            value={data.kpis.averageAttendance === null ? "--" : `${data.kpis.averageAttendance}%`}
            tone="amber"
          />
          <KpiCard icon={Clock3} label="Horas computadas" value={formatHours(data.kpis.computedHours)} />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Acadêmicos</CardTitle>
                <p className="mt-1 text-sm text-stone-500">Presença e carga horária do ciclo atual</p>
              </div>
              {data.cycle ? (
                <Badge className="border-green-200 bg-green-50 text-green-800">{data.cycle.name}</Badge>
              ) : null}
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Acadêmico</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Presença</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead className="pr-5">Progresso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.students.map((student) => (
                      <TableRow key={student.profileId} className="hover:bg-stone-50">
                        <TableCell className="pl-5">
                          <p className="font-semibold">{student.fullName}</p>
                          <p className="text-xs text-stone-500">{student.email || "E-mail não informado"}</p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={student.accountStatus} />
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {student.attendancePercent === null ? "--" : `${student.attendancePercent}%`}
                          </span>
                          <p className="text-xs text-stone-500">
                            {student.attendedClasses}/{student.enrolledClasses} encontros
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{formatHours(student.completedHours)}</span>
                          <p className="text-xs text-stone-500">de {formatHours(student.targetHours)}</p>
                        </TableCell>
                        <TableCell className="min-w-44 pr-5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-500">Carga horária</span>
                            <span className="font-semibold">{student.progressPercent}%</span>
                          </div>
                          <Progress value={student.progressPercent} className="mt-2 h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {data.students.length === 0 ? (
                <div className="p-8 text-center text-sm text-stone-500">
                  Ainda não existem acadêmicos cadastrados.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Capacitações</h2>
                <p className="text-sm text-stone-500">{data.kpis.configuredClasses} encontros configurados</p>
              </div>
              <CalendarDays size={20} className="text-folha" />
            </div>
            <div className="space-y-3">
              {data.classes.map((trainingClass, index) => (
                <article key={trainingClass.id} className="border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-folha">ENCONTRO {index + 1}</p>
                      <h3 className="mt-1 font-semibold leading-5">{trainingClass.title}</h3>
                    </div>
                    <StatusBadge status={trainingClass.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-stone-600">
                    <div>
                      <span className="block text-stone-400">Data</span>
                      <strong className="font-semibold text-stone-700">{formatDate(trainingClass.startsAt)}</strong>
                    </div>
                    <div>
                      <span className="block text-stone-400">Horário</span>
                      <strong className="font-semibold text-stone-700">{formatTimeRange(trainingClass.startsAt, trainingClass.endsAt)}</strong>
                    </div>
                    <div>
                      <span className="block text-stone-400">Matriculados</span>
                      <strong className="font-semibold text-stone-700">{trainingClass.enrolledStudents}</strong>
                    </div>
                    <div>
                      <span className="block text-stone-400">Presença</span>
                      <strong className="font-semibold text-stone-700">
                        {trainingClass.attendancePercent === null ? "--" : `${trainingClass.attendancePercent}%`}
                      </strong>
                    </div>
                  </div>
                  <Link
                    href={`/gestao-academica/presencas/${trainingClass.id}`}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-stone-300 text-sm font-semibold hover:border-folha"
                  >
                    Fazer chamada
                    <ArrowRight size={15} />
                  </Link>
                </article>
              ))}
              {data.classes.length === 0 ? (
                <div className="border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
                  As capacitações aparecerão aqui após a configuração da turma.
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "ink",
}: {
  icon: typeof UsersRound;
  label: string;
  value: string | number;
  tone?: "ink" | "green" | "amber";
}) {
  const toneClass = {
    ink: "text-ink",
    green: "text-green-700",
    amber: "text-amber-800",
  }[tone];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium leading-4 text-stone-500">{label}</p>
            <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-stone-100 text-stone-600">
            <Icon size={18} />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "aprovado" || status === "ativo" || status === "concluida"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "suspenso" || status === "cancelada"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return <Badge className={style}>{status.replaceAll("_", " ")}</Badge>;
}

function formatHours(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}h`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return `${formatter.format(new Date(startsAt))}–${formatter.format(new Date(endsAt))}`;
}
