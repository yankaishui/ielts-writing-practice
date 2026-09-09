import { isEligibleAttempt } from "./eligibility";
import {
  dimensions,
  type Assessment,
  type EssayAttempt,
  type UserStats,
} from "../types";
export const wordCount = (text: string) =>
  text.trim().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
export const band = (a: Assessment) =>
  Math.round(
    (Object.values(a.scores).reduce((n, s) => n + s.score, 0) / 4) * 2,
  ) / 2;
export const durationLabel = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(Math.max(0, seconds) % 60)
    .toString()
    .padStart(2, "0")}`;
export const languageCount = (a?: Assessment) =>
  a?.problems
    .filter((p) => p.type === "language_error")
    .reduce((n, p) => n + 1 + p.otherOccurrences.length, 0) ?? 0;
export function extremes(a: Assessment) {
  const sorted = Object.entries(a.diagnostics).sort((x, y) => x[1] - y[1]);
  return { weakest: sorted[0], strongest: sorted[sorted.length - 1] };
}
export function stats(
  attempts: EssayAttempt[],
  assessments: Record<string, Assessment>,
  now = new Date(),
): UserStats {
  const valid = attempts.filter(
    (a) => !a.demo && isEligibleAttempt(a) && a.version !== "Revision",
  );
  const day = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const days = new Set(valid.map((a) => day(new Date(a.createdAt))));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(day(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const latest = [...valid]
    .reverse()
    .find((a) => a.kind === "Full Essay" && assessments[a.id]);
  const assessment = latest ? assessments[latest.id] : null;
  return {
    essaysCompleted: valid.filter((a) => a.kind === "Full Essay").length,
    sessionsThisWeek: valid.filter((a) => new Date(a.createdAt) >= monday)
      .length,
    currentStreak: streak,
    latestBand: assessment ? band(assessment) : null,
    weakestArea: assessment
      ? dimensions[extremes(assessment).weakest[0] as keyof typeof dimensions]
      : null,
  };
}
