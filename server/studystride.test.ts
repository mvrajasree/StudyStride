import { describe, expect, it } from "vitest";
import { calculateProgressPercent, calculateQuizScore, formatDuration, recoveryPlan } from "../client/src/lib/studystride";

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
});
