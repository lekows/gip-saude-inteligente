import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { AttendanceRoster } from "@/components/academic/AttendanceRoster";
import { Badge } from "@/components/ui/badge";
import { getAttendanceRoster } from "@/lib/academic/academicService";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MANAGER_ROLES = ["administrador", "professor_coordenador"];

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect(`/entrar?redirect=/gestao-academica/presencas/${classId}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile || profile.account_status !== "aprovado" || !profile.active) {
    redirect("/aguardando-aprovacao");
  }
  if (!MANAGER_ROLES.includes(profile.role)) redirect("/meu-gip");

  const roster = await getAttendanceRoster(supabase, classId);
  if (!roster) notFound();

  return (
    <main className="min-h-screen bg-[#f7f7f2] px-4 py-6 text-ink sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/gestao-academica"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-folha"
        >
          <ArrowLeft size={17} />
          Voltar à Gestão Acadêmica
        </Link>

        <header className="mt-5 border-b border-stone-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge className="border-green-200 bg-green-50 text-green-800">Chamada da capacitação</Badge>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{roster.classInfo.title}</h1>
              <p className="mt-2 text-sm text-stone-500">{roster.classInfo.moduleTitle}</p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-folha" />
                {formatDate(roster.classInfo.startsAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} className="text-folha" />
                {formatTimeRange(roster.classInfo.startsAt, roster.classInfo.endsAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} className="text-folha" />
                {roster.classInfo.location || "Local não informado"}
              </span>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <AttendanceRoster data={roster} />
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
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
