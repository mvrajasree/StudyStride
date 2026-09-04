import { describe, expect, it } from "vitest";
import { calculateProgressPercent, calculateQuizScore, filterLogsBySubject, formatDuration, mergeUniqueById, parseSyllabus, recoveryPlan, sumStudyMinutes } from "../client/src/lib/studystride";

describe("StudyStride progress helpers", () => {
  it("calculates a bounded-looking progress percentage without hiding over-target work", () => {
    expect(calculateProgressPercent(90, 180)).toBe(50);
    expect(calculateProgressPercent(225, 180)).toBe(125);
    expect(calculateProgressPercent(60, 0)).toBe(0);
  });

  it("formats minutes into a compact study duration", () => {
    expect(formatDuration(95)).toBe("1h 35m");
    expect(formatDuration(0)).toBe("0h 00m");
    expect(formatDuration(-10)).toBe("0h 00m");
  });

  it("scores quiz answers against the answer key", () => {
    expect(calculateQuizScore([1, 0, 2], [1, 2, 2])).toBe(67);
    expect(calculateQuizScore([], [])).toBe(0);
  });

  it("keeps a skipped day small instead of resetting the plan", () => {
    expect(recoveryPlan(1)).toEqual([
      { label: "One low-friction recall block", minutes: 25 },
      { label: "Five practice questions", minutes: 20 },
    ]);
    expect(recoveryPlan(4)).toEqual([
      { label: "Rebuild the habit with one recall block", minutes: 20 },
      { label: "Review the next smallest subtopic", minutes: 15 },
    ]);
  });

  it("summarizes and filters subject-linked study blocks", () => {
    const logs = [{ subjectId: "os", minutes: 45 }, { subjectId: "dbms", minutes: 25 }, { subjectId: "os", minutes: 20 }];
    expect(sumStudyMinutes(logs)).toBe(90);
    expect(filterLogsBySubject(logs, "os")).toHaveLength(2);
    expect(filterLogsBySubject(logs, "all")).toHaveLength(3);
  });

  it("parses optional syllabus text and supports a blank syllabus", () => {
    expect(parseSyllabus("Unit 1 — Basics\n\n Unit 2 — Practice ")).toEqual(["Unit 1 — Basics", "Unit 2 — Practice"]);
    expect(parseSyllabus("")).toEqual([]);
  });

  it("imports subjects without creating duplicates", () => {
    expect(mergeUniqueById([{ id: "daa" }, { id: "iot" }], [{ id: "daa" }, { id: "csharp" }])).toEqual([
      { id: "daa" },
      { id: "iot" },
      { id: "csharp" },
    ]);
  });
});
