"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calculateTrainingHours, getCreditedTrainingHours } from "@/lib/academic/academicRules";
import type { AcademicAttendanceStatus } from "@/types/academic";

type AcademicActionResult = {
  success?: boolean;
  message?: string;
  error?: string;
};

const PILOT_CYCLE_NAME = "Turma Piloto GIP 2026";
const ACADEMIC_ROLES = ["academico_colaborador", "academico_participante"];
const MANAGER_ROLES = ["administrador", "professor_coordenador"];

const pilotTrainings = [
  {
    title: "Encontro de integração e apresentação do Programa GIP",
    description: "Acolhimento da turma, apresentação do programa e organização da jornada acadêmica.",
    area: "Integração",
    startsAt: "2026-08-12T18:30:00-03:00",
    endsAt: "2026-08-12T22:30:00-03:00",
    workloadHours: 4,
  },
  {
    title: "Capacitação 1 - Da pergunta clínica à ação territorial",
    description: "Integração entre raciocínio clínico, prevenção, dados e planejamento territorial.",
    area: "Clínica e tecnologia",
    startsAt: "2026-08-19T18:30:00-03:00",
    endsAt: "2026-08-19T22:30:00-03:00",
    workloadHours: 4,
  },
  {
    title: "Capacitação 2 - Inteligência artificial e dados em saúde",
    description: "Uso responsável de IA, organização de dados e leitura de indicadores.",
    area: "IA e dados",
    startsAt: "2026-08-26T18:30:00-03:00",
    endsAt: "2026-08-26T22:30:00-03:00",
    workloadHours: 4,
  },
  {
    title: "Capacitação 3 - Gestão, 5W2H e instrumentos de coleta",
    description: "Planejamento prático, entrevistas e construção de matrizes de trabalho.",
    area: "Gestão e coleta",
    startsAt: "2026-09-02T18:30:00-03:00",
    endsAt: "2026-09-02T22:30:00-03:00",
    workloadHours: 4,
  },
  {
    title: "Capacitação 4 - Inteligência territorial e ação comunitária",
    description: "Mapas, priorização territorial e preparação das ações de campo.",
    area: "Território e comunidade",
    startsAt: "2026-09-09T18:30:00-03:00",
    endsAt: "2026-09-09T22:30:00-03:00",
    workloadHours: 4,
  },
] as const;

export async function setupPilotAcademicCycle(): Promise<AcademicActionResult> {
  try {
    const { supabase, user } = await validateAcademicManager();

    const { data: existingCycle, error: cycleLookupError } = await supabase
      .from("program_cycles")
      .select("id")
      .eq("name", PILOT_CYCLE_NAME)
      .maybeSingle();
    if (cycleLookupError) throw cycleLookupError;

    let cycleId = existingCycle?.id as string | undefined;
    if (!cycleId) {
      const { data: insertedCycle, error: cycleInsertError } = await supabase
        .from("program_cycles")
        .insert({
          name: PILOT_CYCLE_NAME,
          description: "Turma piloto de acadêmicos do Programa GIP Saúde Inteligente.",
          start_date: "2026-08-12",
          end_date: "2026-10-28",
          status: "ativo",
          workload_hours: 86,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (cycleInsertError) throw cycleInsertError;
      cycleId = insertedCycle.id;
    }

    const titles = pilotTrainings.map((training) => training.title);
    const { data: existingModules, error: moduleLookupError } = await supabase
      .from("training_modules")
      .select("id, title")
      .in("title", titles);
    if (moduleLookupError) throw moduleLookupError;

    const existingTitles = new Set((existingModules ?? []).map((item) => item.title));
    const missingModules = pilotTrainings
      .filter((training) => !existingTitles.has(training.title))
      .map((training) => ({
        title: training.title,
        description: training.description,
        area: training.area,
        workload_hours: training.workloadHours,
        mandatory: true,
        active: true,
        created_by: user.id,
      }));

    if (missingModules.length) {
      const { error } = await supabase.from("training_modules").insert(missingModules);
      if (error) throw error;
    }

    const { data: modules, error: modulesError } = await supabase
      .from("training_modules")
      .select("id, title")
      .in("title", titles);
    if (modulesError) throw modulesError;
    const moduleByTitle = new Map((modules ?? []).map((item) => [item.title, item.id]));

    const { data: existingClasses, error: classLookupError } = await supabase
      .from("training_classes")
      .select("title")
      .eq("cycle_id", cycleId);
    if (classLookupError) throw classLookupError;
    const existingClassTitles = new Set((existingClasses ?? []).map((item) => item.title));
    const missingClasses = pilotTrainings
      .filter((training) => !existingClassTitles.has(training.title))
      .map((training) => ({
        module_id: moduleByTitle.get(training.title),
        cycle_id: cycleId,
        instructor_id: user.id,
        title: training.title,
        starts_at: training.startsAt,
        ends_at: training.endsAt,
        location: "UniRV - Campus Luziânia",
        capacity: 40,
        status: "aberta",
      }));

    if (missingClasses.some((training) => !training.module_id)) {
      throw new Error("Não foi possível relacionar todos os módulos às capacitações.");
    }
    if (missingClasses.length) {
      const { error } = await supabase.from("training_classes").insert(missingClasses);
      if (error) throw error;
    }

    const { data: academicProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .in("role", ACADEMIC_ROLES)
      .eq("account_status", "aprovado")
      .eq("active", true);
    if (profileError) throw profileError;

    if (academicProfiles?.length) {
      const { error: memberError } = await supabase.from("program_members").upsert(
        academicProfiles.map((profile) => ({
          cycle_id: cycleId,
          profile_id: profile.id,
          member_role: profile.role,
          status: "ativo",
          joined_at: "2026-08-12",
          target_workload_hours: 86,
        })),
        { onConflict: "cycle_id,profile_id" },
      );
      if (memberError) throw memberError;
    }

    const [{ data: members, error: membersError }, { data: classes, error: classesError }] =
      await Promise.all([
        supabase.from("program_members").select("id").eq("cycle_id", cycleId),
        supabase.from("training_classes").select("id").eq("cycle_id", cycleId),
      ]);
    if (membersError) throw membersError;
    if (classesError) throw classesError;

    const enrollments = (classes ?? []).flatMap((trainingClass) =>
      (members ?? []).map((member) => ({
        class_id: trainingClass.id,
        member_id: member.id,
        status: "em_andamento",
        completed_workload_hours: 0,
      })),
    );
    if (enrollments.length) {
      const { data: existingEnrollments, error: lookupError } = await supabase
        .from("training_enrollments")
        .select("class_id, member_id")
        .in("class_id", (classes ?? []).map((trainingClass) => trainingClass.id));
      if (lookupError) throw lookupError;
      const existingKeys = new Set(
        (existingEnrollments ?? []).map((item) => `${item.class_id}:${item.member_id}`),
      );
      const missingEnrollments = enrollments.filter(
        (item) => !existingKeys.has(`${item.class_id}:${item.member_id}`),
      );
      if (missingEnrollments.length) {
        const { error } = await supabase
          .from("training_enrollments")
          .insert(missingEnrollments);
        if (error) throw error;
      }
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "setup_pilot_academic_cycle",
      entity_type: "program_cycle",
      entity_id: cycleId,
      metadata: {
        training_count: pilotTrainings.length,
        linked_students: academicProfiles?.length ?? 0,
      },
    });
    if (auditError) throw auditError;

    revalidatePath("/gestao-academica");
    revalidatePath("/meu-gip");
    return {
      success: true,
      message: `Turma piloto configurada com um encontro de integração, quatro capacitações e ${academicProfiles?.length ?? 0} acadêmicos aprovados.`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível configurar a turma piloto.",
    };
  }
}

export async function saveClassAttendance(
  classId: string,
  records: Array<{
    enrollmentId: string;
    status: AcademicAttendanceStatus;
    notes?: string;
  }>,
): Promise<AcademicActionResult> {
  try {
    if (!classId || records.length === 0) {
      return { error: "A chamada não possui registros para salvar." };
    }
    if (records.some((record) => !isAttendanceStatus(record.status))) {
      return { error: "A chamada contém uma situação de presença inválida." };
    }

    const { supabase, user } = await validateAcademicManager();
    const enrollmentIds = records.map((record) => record.enrollmentId);

    const { data: trainingClass, error: classError } = await supabase
      .from("training_classes")
      .select("id, starts_at, ends_at")
      .eq("id", classId)
      .single();
    if (classError) throw classError;

    const { data: validEnrollments, error: enrollmentError } = await supabase
      .from("training_enrollments")
      .select("id")
      .eq("class_id", classId)
      .in("id", enrollmentIds);
    if (enrollmentError) throw enrollmentError;
    if ((validEnrollments?.length ?? 0) !== records.length) {
      return { error: "A chamada contém uma matrícula que não pertence a esta capacitação." };
    }

    const now = new Date().toISOString();
    const { error: attendanceError } = await supabase.from("attendance_records").upsert(
      records.map((record) => ({
        enrollment_id: record.enrollmentId,
        status: record.status,
        check_in_at: record.status === "presente" ? trainingClass.starts_at : null,
        check_out_at: record.status === "presente" ? trainingClass.ends_at : null,
        notes: record.notes?.trim() || null,
        recorded_by: user.id,
      })),
      { onConflict: "enrollment_id" },
    );
    if (attendanceError) throw attendanceError;

    for (const record of records) {
      const { error } = await supabase
        .from("training_enrollments")
        .update({
          status: "concluido",
          completed_workload_hours: getCreditedTrainingHours(
            record.status,
            calculateTrainingHours(trainingClass.starts_at, trainingClass.ends_at),
          ),
          completed_at: now,
        })
        .eq("id", record.enrollmentId)
        .eq("class_id", classId);
      if (error) throw error;
    }

    const { error: classUpdateError } = await supabase
      .from("training_classes")
      .update({ status: "concluida" })
      .eq("id", classId);
    if (classUpdateError) throw classUpdateError;

    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "save_training_attendance",
      entity_type: "training_class",
      entity_id: classId,
      metadata: {
        records: records.length,
        present: records.filter((record) => record.status === "presente").length,
        absent: records.filter((record) => record.status === "ausente").length,
        justified: records.filter((record) => record.status === "justificado").length,
      },
    });
    if (auditError) throw auditError;

    revalidatePath("/gestao-academica");
    revalidatePath(`/gestao-academica/presencas/${classId}`);
    revalidatePath("/meu-gip");
    return { success: true, message: "Chamada salva e carga horária atualizada." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Não foi possível salvar a chamada.",
    };
  }
}

async function validateAcademicManager() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Autenticação necessária.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, account_status, active")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) throw new Error("Perfil não encontrado.");

  if (
    !MANAGER_ROLES.includes(profile.role) ||
    profile.account_status !== "aprovado" ||
    !profile.active
  ) {
    throw new Error("Apenas a coordenação aprovada pode alterar capacitações e presenças.");
  }

  return { supabase, user };
}

function isAttendanceStatus(value: string): value is AcademicAttendanceStatus {
  return value === "presente" || value === "ausente" || value === "justificado";
}
