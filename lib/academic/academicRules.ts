import type { AcademicAttendanceStatus } from "../../types/academic.ts";

export function calculateAcademicPercent(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function calculateTrainingHours(startsAt: string, endsAt: string) {
  const milliseconds = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0;
  return Math.round((milliseconds / 3_600_000) * 10) / 10;
}

export function getCreditedTrainingHours(
  status: AcademicAttendanceStatus,
  workloadHours: number,
) {
  if (status !== "presente" || !Number.isFinite(workloadHours) || workloadHours <= 0) {
    return 0;
  }

  return Math.round(workloadHours * 10) / 10;
}
