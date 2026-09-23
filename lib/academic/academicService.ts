import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AcademicClassSummary,
  AcademicDashboardData,
  AcademicStudentSummary,
  AttendanceRosterData,
  StudentJourneyData,
} from "@/types/academic";
import {
  calculateAcademicPercent,
  calculateTrainingHours,
} from "@/lib/academic/academicRules";

const ACADEMIC_ROLES = ["academico_colaborador", "academico_participante"];

type ProfileRow = {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  account_status: "pendente" | "aprovado" | "suspenso";
  active: boolean;
};

type MemberRow = {
  id: string;
  profile_id: string;
  member_role: string;
  status: "pendente" | "ativo" | "inativo";
  target_workload_hours: number | string;
};

type ClassRow = {
  id: string;
  module_id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  status: string;
};

type ModuleRow = {
  id: string;
  title: string;
  area: string | null;
  workload_hours: number | string;
};

type EnrollmentRow = {
  id: string;
  class_id: string;
  member_id: string;
  status: string;
  completed_workload_hours: number | string;
};

type AttendanceRow = {
  enrollment_id: string;
  status: "presente" | "ausente" | "justificado";
  notes: string | null;
};

export async function getAcademicDashboardData(
  supabase: SupabaseClient,
): Promise<AcademicDashboardData> {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, account_status, active")
    .in("role", ACADEMIC_ROLES)
    .order("full_name");

  if (profileError) throw profileError;

  const profiles = (profileData ?? []) as ProfileRow[];
  const { data: cycleData, error: cycleError } = await supabase
    .from("program_cycles")
    .select("id, name, start_date, end_date, status, workload_hours")
    .in("status", ["planejamento", "ativo"])
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cycleError) throw cycleError;

  if (!cycleData) {
    const students = profiles.map((profile) => emptyStudent(profile));
    return {
      cycle: null,
      students,
      classes: [],
      kpis: buildKpis(students, []),
    };
  }

  const [membersResult, classesResult, modulesResult] = await Promise.all([
    supabase
      .from("program_members")
      .select("id, profile_id, member_role, status, target_workload_hours")
      .eq("cycle_id", cycleData.id),
    supabase
      .from("training_classes")
      .select("id, module_id, title, starts_at, ends_at, location, status")
      .eq("cycle_id", cycleData.id)
      .order("starts_at"),
    supabase
      .from("training_modules")
      .select("id, title, area, workload_hours")
      .eq("active", true),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (classesResult.error) throw classesResult.error;
  if (modulesResult.error) throw modulesResult.error;

  const members = (membersResult.data ?? []) as MemberRow[];
  const classes = (classesResult.data ?? []) as ClassRow[];
  const modules = (modulesResult.data ?? []) as ModuleRow[];
  const memberIds = members.map((member) => member.id);
  const enrollments = memberIds.length
    ? await loadEnrollments(supabase, memberIds)
    : [];
  const attendance = enrollments.length
    ? await loadAttendance(supabase, enrollments.map((item) => item.id))
    : [];

  const memberByProfile = new Map(members.map((member) => [member.profile_id, member]));
  const attendanceByEnrollment = new Map(
    attendance.map((record) => [record.enrollment_id, record]),
  );
  const activeClassIds = new Set(
    classes.filter((item) => item.status !== "cancelada").map((item) => item.id),
  );

  const students = profiles.map((profile) => {
    const member = memberByProfile.get(profile.id);
    if (!member) return emptyStudent(profile);

    const studentEnrollments = enrollments.filter(
      (enrollment) => enrollment.member_id === member.id && activeClassIds.has(enrollment.class_id),
    );
    const attendedClasses = studentEnrollments.filter(
      (enrollment) => attendanceByEnrollment.get(enrollment.id)?.status === "presente",
    ).length;
    const recordedClasses = studentEnrollments.filter(
      (enrollment) => attendanceByEnrollment.has(enrollment.id),
    ).length;
    const completedHours = sumHours(studentEnrollments);
    const targetHours = toNumber(member.target_workload_hours);

    return {
      profileId: profile.id,
      memberId: member.id,
      fullName: profile.full_name,
      email: profile.email,
      role: member.member_role,
      accountStatus: profile.account_status,
      memberStatus: member.status,
      targetHours,
      completedHours,
      progressPercent: calculateAcademicPercent(completedHours, targetHours),
      attendancePercent: recordedClasses
        ? calculateAcademicPercent(attendedClasses, recordedClasses)
        : null,
      attendedClasses,
      recordedClasses,
      enrolledClasses: studentEnrollments.length,
    } satisfies AcademicStudentSummary;
  });

  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const classSummaries = classes.map((trainingClass) => {
    const classEnrollments = enrollments.filter(
      (enrollment) => enrollment.class_id === trainingClass.id,
    );
    const presentStudents = classEnrollments.filter(
      (enrollment) => attendanceByEnrollment.get(enrollment.id)?.status === "presente",
    ).length;
    const recordedStudents = classEnrollments.filter(
      (enrollment) => attendanceByEnrollment.has(enrollment.id),
    ).length;
    const module = moduleById.get(trainingClass.module_id);

    return {
      id: trainingClass.id,
      title: trainingClass.title || module?.title || "Capacitação",
      moduleTitle: module?.title || "Módulo de capacitação",
      area: module?.area ?? null,
      startsAt: trainingClass.starts_at,
      endsAt: trainingClass.ends_at,
      location: trainingClass.location,
      status: trainingClass.status,
      workloadHours: calculateTrainingHours(trainingClass.starts_at, trainingClass.ends_at),
      enrolledStudents: classEnrollments.length,
      presentStudents,
      attendancePercent: recordedStudents
        ? calculateAcademicPercent(presentStudents, recordedStudents)
        : null,
    } satisfies AcademicClassSummary;
  });

  return {
    cycle: {
      id: cycleData.id,
      name: cycleData.name,
      startDate: cycleData.start_date,
      endDate: cycleData.end_date,
      status: cycleData.status,
      workloadHours: toNumber(cycleData.workload_hours),
    },
    students,
    classes: classSummaries,
    kpis: buildKpis(students, classSummaries),
  };
}

export async function getAttendanceRoster(
  supabase: SupabaseClient,
  classId: string,
): Promise<AttendanceRosterData | null> {
  const { data: trainingClass, error: classError } = await supabase
    .from("training_classes")
    .select("id, module_id, title, starts_at, ends_at, location, status")
    .eq("id", classId)
    .maybeSingle();

  if (classError) throw classError;
  if (!trainingClass) return null;

  const { data: moduleData, error: moduleError } = await supabase
    .from("training_modules")
    .select("id, title, area, workload_hours")
    .eq("id", trainingClass.module_id)
    .single();
  if (moduleError) throw moduleError;

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from("training_enrollments")
    .select("id, member_id, status, completed_workload_hours")
    .eq("class_id", classId);
  if (enrollmentError) throw enrollmentError;

  const enrollments = (enrollmentData ?? []).map((item) => ({
    ...item,
    class_id: classId,
  })) as EnrollmentRow[];
  const memberIds = enrollments.map((item) => item.member_id);

  const membersResult = memberIds.length
    ? await supabase
        .from("program_members")
        .select("id, profile_id, member_role, status, target_workload_hours")
        .in("id", memberIds)
    : { data: [], error: null };
  if (membersResult.error) throw membersResult.error;

  const members = (membersResult.data ?? []) as MemberRow[];
  const profileIds = members.map((member) => member.profile_id);
  const profilesResult = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role, account_status, active")
        .in("id", profileIds)
        .order("full_name")
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;

  const attendance = enrollments.length
    ? await loadAttendance(supabase, enrollments.map((item) => item.id))
    : [];
  const enrollmentByMember = new Map(
    enrollments.map((enrollment) => [enrollment.member_id, enrollment]),
  );
  const attendanceByEnrollment = new Map(
    attendance.map((record) => [record.enrollment_id, record]),
  );

  const entries = ((profilesResult.data ?? []) as ProfileRow[]).flatMap((profile) => {
    const member = members.find((item) => item.profile_id === profile.id);
    if (!member) return [];
    const enrollment = enrollmentByMember.get(member.id);
    if (!enrollment) return [];
    const record = attendanceByEnrollment.get(enrollment.id);
    return [{
      enrollmentId: enrollment.id,
      profileId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      status: record?.status ?? null,
      notes: record?.notes ?? null,
    }];
  });

  const presentStudents = attendance.filter((record) => record.status === "presente").length;

  return {
    classInfo: {
      id: trainingClass.id,
      title: trainingClass.title || moduleData.title,
      moduleTitle: moduleData.title,
      area: moduleData.area,
      startsAt: trainingClass.starts_at,
      endsAt: trainingClass.ends_at,
      location: trainingClass.location,
      status: trainingClass.status,
      workloadHours: calculateTrainingHours(trainingClass.starts_at, trainingClass.ends_at),
      enrolledStudents: entries.length,
      presentStudents,
      attendancePercent: attendance.length
        ? calculateAcademicPercent(presentStudents, attendance.length)
        : null,
    },
    entries,
  };
}

export async function getStudentJourneyData(
  supabase: SupabaseClient,
  profileId: string,
): Promise<StudentJourneyData> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, account_status, active")
    .eq("id", profileId)
    .single();
  if (profileError) throw profileError;

  const { data: member, error: memberError } = await supabase
    .from("program_members")
    .select("id, cycle_id, profile_id, member_role, status, target_workload_hours")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;

  const base = {
    profile: {
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  };

  if (!member) {
    return {
      ...base,
      cycle: null,
      memberStatus: "sem_vinculo",
      targetHours: 86,
      completedHours: 0,
      progressPercent: 0,
      attendancePercent: null,
      attendedClasses: 0,
      recordedClasses: 0,
      enrolledClasses: 0,
      upcomingClass: null,
      classes: [],
    };
  }

  const [cycleResult, enrollmentResult] = await Promise.all([
    supabase
      .from("program_cycles")
      .select("id, name, start_date, end_date, status, workload_hours")
      .eq("id", member.cycle_id)
      .single(),
    supabase
      .from("training_enrollments")
      .select("id, class_id, member_id, status, completed_workload_hours")
      .eq("member_id", member.id),
  ]);
  if (cycleResult.error) throw cycleResult.error;
  if (enrollmentResult.error) throw enrollmentResult.error;

  const enrollments = (enrollmentResult.data ?? []) as EnrollmentRow[];
  const classIds = enrollments.map((item) => item.class_id);
  const classesResult = classIds.length
    ? await supabase
        .from("training_classes")
        .select("id, module_id, title, starts_at, ends_at, location, status")
        .in("id", classIds)
        .order("starts_at")
    : { data: [], error: null };
  if (classesResult.error) throw classesResult.error;

  const classes = (classesResult.data ?? []) as ClassRow[];
  const moduleIds = [...new Set(classes.map((item) => item.module_id))];
  const modulesResult = moduleIds.length
    ? await supabase
        .from("training_modules")
        .select("id, title, area, workload_hours")
        .in("id", moduleIds)
    : { data: [], error: null };
  if (modulesResult.error) throw modulesResult.error;

  const attendance = enrollments.length
    ? await loadAttendance(supabase, enrollments.map((item) => item.id))
    : [];
  const moduleById = new Map(
    ((modulesResult.data ?? []) as ModuleRow[]).map((module) => [module.id, module]),
  );
  const enrollmentByClass = new Map(
    enrollments.map((enrollment) => [enrollment.class_id, enrollment]),
  );
  const attendanceByEnrollment = new Map(
    attendance.map((record) => [record.enrollment_id, record]),
  );

  const journeyClasses = classes.map((trainingClass) => {
    const enrollment = enrollmentByClass.get(trainingClass.id)!;
    const record = attendanceByEnrollment.get(enrollment.id);
    return {
      id: trainingClass.id,
      title: trainingClass.title || moduleById.get(trainingClass.module_id)?.title || "Capacitação",
      moduleTitle: moduleById.get(trainingClass.module_id)?.title || "Módulo de capacitação",
      startsAt: trainingClass.starts_at,
      endsAt: trainingClass.ends_at,
      location: trainingClass.location,
      classStatus: trainingClass.status,
      attendanceStatus: record?.status ?? null,
      creditedHours: toNumber(enrollment.completed_workload_hours),
    };
  });

  const activeEnrollments = enrollments.filter((enrollment) => {
    const trainingClass = classes.find((item) => item.id === enrollment.class_id);
    return trainingClass?.status !== "cancelada";
  });
  const attendedClasses = activeEnrollments.filter(
    (enrollment) => attendanceByEnrollment.get(enrollment.id)?.status === "presente",
  ).length;
  const recordedClasses = activeEnrollments.filter(
    (enrollment) => attendanceByEnrollment.has(enrollment.id),
  ).length;
  const completedHours = sumHours(activeEnrollments);
  const targetHours = toNumber(member.target_workload_hours);
  const now = Date.now();
  const upcomingClass = journeyClasses.find(
    (item) => new Date(item.startsAt).getTime() >= now && item.classStatus !== "cancelada",
  ) ?? null;

  return {
    ...base,
    cycle: {
      id: cycleResult.data.id,
      name: cycleResult.data.name,
      startDate: cycleResult.data.start_date,
      endDate: cycleResult.data.end_date,
      status: cycleResult.data.status,
      workloadHours: toNumber(cycleResult.data.workload_hours),
    },
    memberStatus: member.status,
    targetHours,
    completedHours,
    progressPercent: calculateAcademicPercent(completedHours, targetHours),
    attendancePercent: recordedClasses
      ? calculateAcademicPercent(attendedClasses, recordedClasses)
      : null,
    attendedClasses,
    recordedClasses,
    enrolledClasses: activeEnrollments.length,
    upcomingClass,
    classes: journeyClasses,
  };
}

async function loadEnrollments(supabase: SupabaseClient, memberIds: string[]) {
  const { data, error } = await supabase
    .from("training_enrollments")
    .select("id, class_id, member_id, status, completed_workload_hours")
    .in("member_id", memberIds);
  if (error) throw error;
  return (data ?? []) as EnrollmentRow[];
}

async function loadAttendance(supabase: SupabaseClient, enrollmentIds: string[]) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("enrollment_id, status, notes")
    .in("enrollment_id", enrollmentIds);
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

function emptyStudent(profile: ProfileRow): AcademicStudentSummary {
  return {
    profileId: profile.id,
    memberId: null,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    accountStatus: profile.account_status,
    memberStatus: "sem_vinculo",
    targetHours: 86,
    completedHours: 0,
    progressPercent: 0,
    attendancePercent: null,
    attendedClasses: 0,
    recordedClasses: 0,
    enrolledClasses: 0,
  };
}

function buildKpis(
  students: AcademicStudentSummary[],
  classes: AcademicClassSummary[],
) {
  const attendanceValues = students
    .map((student) => student.attendancePercent)
    .filter((value): value is number => value !== null);

  return {
    registeredStudents: students.length,
    approvedStudents: students.filter(
      (student) => student.accountStatus === "aprovado",
    ).length,
    linkedStudents: students.filter((student) => student.memberId !== null).length,
    averageAttendance: attendanceValues.length
      ? Math.round(
          attendanceValues.reduce((total, value) => total + value, 0) /
            attendanceValues.length,
        )
      : null,
    computedHours: Math.round(
      students.reduce((total, student) => total + student.completedHours, 0) * 10,
    ) / 10,
    configuredClasses: classes.length,
  };
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumHours(enrollments: EnrollmentRow[]) {
  return Math.round(
    enrollments.reduce(
      (total, enrollment) => total + toNumber(enrollment.completed_workload_hours),
      0,
    ) * 10,
  ) / 10;
}
