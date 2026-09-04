export function calculateProgressPercent(completedMinutes: number, targetMinutes: number): number {
  if (targetMinutes <= 0) return 0;
  return Math.round((completedMinutes / targetMinutes) * 100);
}

export function formatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function calculateQuizScore(answers: number[], correctAnswers: number[]): number {
  if (correctAnswers.length === 0) return 0;
  const correct = answers.reduce((total, answer, index) => total + (answer === correctAnswers[index] ? 1 : 0), 0);
  return Math.round((correct / correctAnswers.length) * 100);
}

export function recoveryPlan(skippedDays: number): { label: string; minutes: number }[] {
  if (skippedDays <= 0) return [{ label: "Continue the planned block", minutes: 25 }];
  if (skippedDays === 1) return [{ label: "One low-friction recall block", minutes: 25 }, { label: "Five practice questions", minutes: 20 }];
  return [{ label: "Rebuild the habit with one recall block", minutes: 20 }, { label: "Review the next smallest subtopic", minutes: 15 }];
}

export function sumStudyMinutes(entries: { minutes: number }[]): number {
  return entries.reduce((total, entry) => total + Math.max(0, entry.minutes), 0);
}

export function filterLogsBySubject<T extends { subjectId: string }>(entries: T[], subjectId: string): T[] {
  return subjectId === "all" ? entries : entries.filter((entry) => entry.subjectId === subjectId);
}

export function parseSyllabus(text: string): string[] {
  return text.split("\n").map((unit) => unit.trim()).filter(Boolean);
}

export function mergeUniqueById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const existingIds = new Set(existing.map((item) => item.id));
  return [...existing, ...incoming.filter((item) => !existingIds.has(item.id))];
}
