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

export function calculateSyllabusProgress(units: string[] = [], completedUnits: string[] = []): number {
  if (units.length === 0) return 0;
  const completed = units.filter((unit) => completedUnits.includes(unit)).length;
  return Math.round((completed / units.length) * 100);
}

export function toggleCompletedUnit(completedUnits: string[] = [], unit: string): string[] {
  return completedUnits.includes(unit)
    ? completedUnits.filter((completedUnit) => completedUnit !== unit)
    : [...completedUnits, unit];
}

export type GeneratedQuizQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

export function generateSyllabusQuestions(subjectName: string, units: string[], difficulty: "Warm-up" | "Core" | "Challenge", completedUnits: string[] = []): GeneratedQuizQuestion[] {
  const available = units.filter((unit) => difficulty === "Challenge" || !completedUnits.includes(unit));
  const topics = (available.length ? available : units).slice(0, 3);
  if (!topics.length) return [];
  return topics.map((unit, index) => {
    if (difficulty === "Warm-up") {
      return {
        prompt: `Which topic belongs to ${subjectName}'s syllabus?`,
        choices: [unit, "Unrelated current affairs", "A random hobby", "None of these"],
        answer: 0,
        explanation: `${unit} is one of the syllabus topics for ${subjectName}.`,
      };
    }
    if (difficulty === "Core") {
      return {
        prompt: `What is the best first way to study “${unit}” in ${subjectName}?`,
        choices: ["Explain the idea and solve a representative example", "Memorize only the topic title", "Skip examples and reread the index", "Wait until the exam to attempt it"],
        answer: 0,
        explanation: `Active explanation plus an example turns ${unit} into usable understanding.`,
      };
    }
    return {
      prompt: `You are given an unfamiliar problem related to “${unit}”. What shows the strongest ${subjectName} mastery?`,
      choices: ["Compare trade-offs, justify an approach, and solve it", "Repeat a definition without applying it", "Choose the longest answer automatically", "Avoid the problem because it is unfamiliar"],
      answer: 0,
      explanation: `Challenge-level recall asks you to transfer the ideas from ${unit} to a new situation.`,
    };
  });
}
