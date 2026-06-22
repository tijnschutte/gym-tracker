import { describe, expect, it } from "vitest";
import {
  toTitleCase,
  mergeExercises,
  searchExercises,
  STARTER_EXERCISES,
} from "./exercise-registry";

// ---------------------------------------------------------------------------
// toTitleCase
// ---------------------------------------------------------------------------
describe("toTitleCase", () => {
  it('converts "bench press" to "Bench Press"', () => {
    expect(toTitleCase("bench press")).toBe("Bench Press");
  });

  it('trims and normalizes "  BENCH  PRESS  " to "Bench Press"', () => {
    expect(toTitleCase("  BENCH  PRESS  ")).toBe("Bench Press");
  });

  it('leaves "Bench Press" unchanged', () => {
    expect(toTitleCase("Bench Press")).toBe("Bench Press");
  });

  it("handles single word", () => {
    expect(toTitleCase("squat")).toBe("Squat");
  });

  it("handles mixed case with extra spaces", () => {
    expect(toTitleCase("  rOmAnIaN   dEaDlIfT  ")).toBe("Romanian Deadlift");
  });
});

// ---------------------------------------------------------------------------
// mergeExercises
// ---------------------------------------------------------------------------
describe("mergeExercises", () => {
  it("deduplicates across lists", () => {
    const result = mergeExercises(["Bench Press", "Squat"], ["Bench Press"]);
    expect(result.filter((e) => e === "Bench Press")).toHaveLength(1);
  });

  it("handles case variants as duplicates", () => {
    const result = mergeExercises(["Bench Press"], ["bench press", "BENCH PRESS"]);
    expect(result.filter((e) => e === "Bench Press")).toHaveLength(1);
  });

  it("sorts alphabetically", () => {
    const result = mergeExercises(["Squat", "Bench Press"], ["Deadlift"]);
    expect(result).toEqual(["Bench Press", "Deadlift", "Squat"]);
  });

  it("includes user exercises not in starter list", () => {
    const result = mergeExercises(["Squat"], ["My Custom Exercise"]);
    expect(result).toContain("My Custom Exercise");
    expect(result).toContain("Squat");
  });

  it("normalises user history to Title Case", () => {
    const result = mergeExercises([], ["cable crunch"]);
    expect(result).toContain("Cable Crunch");
  });

  it("returns empty array for empty inputs", () => {
    expect(mergeExercises([], [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// searchExercises
// ---------------------------------------------------------------------------
describe("searchExercises", () => {
  const exercises = ["Bench Press", "Incline Bench Press", "Squat", "Deadlift"];

  it("filters by partial match", () => {
    const result = searchExercises(exercises, "bench");
    expect(result).toEqual(["Bench Press", "Incline Bench Press"]);
  });

  it("is case insensitive", () => {
    const result = searchExercises(exercises, "SQUAT");
    expect(result).toEqual(["Squat"]);
  });

  it("returns all exercises for empty query", () => {
    expect(searchExercises(exercises, "")).toEqual(exercises);
  });

  it("returns all exercises for whitespace-only query", () => {
    expect(searchExercises(exercises, "   ")).toEqual(exercises);
  });

  it("returns empty array when nothing matches", () => {
    expect(searchExercises(exercises, "zzzzz")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// STARTER_EXERCISES sanity checks
// ---------------------------------------------------------------------------
describe("STARTER_EXERCISES", () => {
  it("contains expected exercises", () => {
    expect(STARTER_EXERCISES).toContain("Bench Press");
    expect(STARTER_EXERCISES).toContain("Squat");
    expect(STARTER_EXERCISES).toContain("Deadlift");
    expect(STARTER_EXERCISES).toContain("Hanging Leg Raise");
  });

  it("all entries are already Title Case", () => {
    for (const exercise of STARTER_EXERCISES) {
      expect(exercise).toBe(toTitleCase(exercise));
    }
  });
});
