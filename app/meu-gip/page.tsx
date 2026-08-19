import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudentJourneyData } from "@/lib/academic/academicService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function MyGipPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/entrar?redirect=/meu-gip");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_status, active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || profile.account_status !== "aprovado" || !profile.active) {
    redirect("/aguardando-aprovacao");
  }

  const journey = await getStudentJourneyData(supabase, user.id);

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-folha">
                <GraduationCap size={19} />
                Minha jornada no GIP
              </div>
              <h1 className="mt-2 text-3xl font-semibold">Olá, {firstName(journey.profile.fullName)}</h1>
              <p className="mt-2 text-sm text-stone-600">
                Acompanhe sua presença e a carga horária efetivamente cumprida no programa.
              </p>
            </div>
            <Badge className={journey.memberStatus === "ativo" ? "border-green-200 bg-green-50 text-green-800" : "border-amber-200 bg-amber-50 text-amber-900"}>
              {journey.memberStatus === "ativo" ? "Participação ativa" : "Aguardando vínculo à turma"}
            </Badge>
          </div>
        </header>

        {!journey.cycle ? (
          <section className="mt-6 border border-stone-200 bg-white p-6 sm:p-8">
            <UserRoundCheck size={28} className="text-folha" />
            <h2 className="mt-4 text-xl font-semibold">Seu cadastro está aprovado</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              A coordenação ainda está organizando a turma e as capacitações. Assim que o vínculo for concluído, seus encontros e horas aparecerão aqui.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-stone-500">Carga horária</p>
                      <p className="mt-2 text-3xl font-semibold">
                        {formatHours(journey.completedHours)}
                        <span className="text-base font-medium text-stone-400"> de {formatHours(journey.targetHours)}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-semibold text-folha">{journey.progressPercent}%</p>
                      <p className="text-xs text-stone-500">da meta individual</p>
                    </div>
                  </div>
                  <Progress value={journey.progressPercent} className="mt-5 h-3" />
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    A certificação considera somente as horas validadas pela coordenação.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase text-stone-500">Frequência</p>
                  <p className="mt-2 text-3xl font-semibold text-amber-800">
                    {journey.attendancePercent === null ? "--" : `${journey.attendancePercent}%`}
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    {journey.attendedClasses} presença(s) em {journey.enrolledClasses} encontro(s)
                  </p>
                </CardContent>
              </Card>
            </section>

            {journey.upcomingClass ? (
              <section className="mt-5 border-l-4 border-folha bg-[#173d2b] p-5 text-white sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-green-200">Próxima capacitação</p>
                    <h2 className="mt-2 text-xl font-semibold">{journey.upcomingClass.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-green-50">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={16} />
                        {formatDate(journey.upcomingClass.startsAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={16} />
                        {formatTimeRange(journey.upcomingClass.startsAt, journey.upcomingClass.endsAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={16} />
                        {journey.upcomingClass.location || "Local não informado"}
                      </span>
                    </div>
                  </div>
                  <span className="grid h-12 w-12 shrink-0 place-items-center bg-folha">
                    <BookOpenCheck size={23} />
                  </span>
                </div>
              </section>
            ) : null}

            <Card className="mt-5">
              <CardHeader>
                <CardTitle className="text-base">Minhas capacitações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 px-0 pb-0 pt-2">
                {journey.classes.map((trainingClass, index) => (
                  <div
                    key={trainingClass.id}
                    className="grid gap-3 border-t border-stone-200 px-5 py-4 sm:grid-cols-[40px_minmax(0,1fr)_140px_110px] sm:items-center"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-stone-100 text-sm font-semibold text-stone-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{trainingClass.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatDate(trainingClass.startsAt)} · {formatTimeRange(trainingClass.startsAt, trainingClass.endsAt)}
                      </p>
                    </div>
                    <AttendanceBadge status={trainingClass.attendanceStatus} />
                    <div className="text-left sm:text-right">
                      <p className="font-semibold">{formatHours(trainingClass.creditedHours)}</p>
                      <p className="text-xs text-stone-500">validadas</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <Link href="/mobile" className="inline-flex items-center gap-2 text-sm font-semibold text-folha hover:underline">
            Abrir Busca Ativa GIP
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function AttendanceBadge({ status }: { status: "presente" | "ausente" | "justificado" | null }) {
  if (status === "presente") {
    return <Badge className="w-fit border-green-200 bg-green-50 text-green-800"><CheckCircle2 size={14} className="mr-1" />Presente</Badge>;
  }
  if (status === "ausente") {
    return <Badge className="w-fit border-red-200 bg-red-50 text-red-800">Ausente</Badge>;
  }
  if (status === "justificado") {
    return <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-900">Justificado</Badge>;
  }
  return <Badge className="w-fit border-stone-200 bg-stone-50 text-stone-600">Aguardando chamada</Badge>;
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "participante";
}

function formatHours(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}h`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
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
