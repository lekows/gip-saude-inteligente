export type AcademicAttendanceStatus = "presente" | "ausente" | "justificado";

export type AcademicMemberStatus = "pendente" | "ativo" | "inativo" | "sem_vinculo";

export type AcademicAccountStatus = "pendente" | "aprovado" | "suspenso";

export interface AcademicCycleSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  workloadHours: number;
}

export interface AcademicStudentSummary {
  profileId: string;
  memberId: string | null;
  fullName: string;
  email: string | null;
  role: string;
  accountStatus: AcademicAccountStatus;
  memberStatus: AcademicMemberStatus;
  targetHours: number;
  completedHours: number;
  progressPercent: number;
  attendancePercent: number | null;
  attendedClasses: number;
  recordedClasses: number;
  enrolledClasses: number;
}

export interface AcademicClassSummary {
  id: string;
  title: string;
  moduleTitle: string;
  area: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  status: string;
  workloadHours: number;
  enrolledStudents: number;
  presentStudents: number;
  attendancePercent: number | null;
}

export interface AcademicDashboardData {
  cycle: AcademicCycleSummary | null;
  students: AcademicStudentSummary[];
  classes: AcademicClassSummary[];
  kpis: {
    registeredStudents: number;
    approvedStudents: number;
    linkedStudents: number;
    averageAttendance: number | null;
    computedHours: number;
    configuredClasses: number;
  };
}

export interface AttendanceRosterEntry {
  enrollmentId: string;
  profileId: string;
  fullName: string;
  email: string | null;
  status: AcademicAttendanceStatus | null;
  notes: string | null;
}

export interface AttendanceRosterData {
  classInfo: AcademicClassSummary;
  entries: AttendanceRosterEntry[];
}

export interface StudentJourneyClass {
  id: string;
  title: string;
  moduleTitle: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  classStatus: string;
  attendanceStatus: AcademicAttendanceStatus | null;
  creditedHours: number;
}

export interface StudentJourneyData {
  profile: {
    fullName: string;
    email: string | null;
    role: string;
  };
  cycle: AcademicCycleSummary | null;
  memberStatus: AcademicMemberStatus;
  targetHours: number;
  completedHours: number;
  progressPercent: number;
  attendancePercent: number | null;
  attendedClasses: number;
  recordedClasses: number;
  enrolledClasses: number;
  upcomingClass: StudentJourneyClass | null;
  classes: StudentJourneyClass[];
}
