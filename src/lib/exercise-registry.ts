// =============================================================================
// Exercise Registry — pure logic, no React dependencies
// =============================================================================

/**
 * Comprehensive starter list of common gym exercises, already in Title Case.
 */
export const STARTER_EXERCISES: string[] = [
  // Compound
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull Up',
  'Chin Up',
  'Dip',
  // Chest
  'Incline Bench Press',
  'Dumbbell Fly',
  'Cable Crossover',
  // Back
  'Lat Pulldown',
  'Seated Row',
  'T-Bar Row',
  'Face Pull',
  // Shoulders
  'Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Arnold Press',
  // Arms
  'Bicep Curl',
  'Hammer Curl',
  'Tricep Pushdown',
  'Skull Crusher',
  'Preacher Curl',
  // Legs
  'Leg Press',
  'Leg Extension',
  'Leg Curl',
  'Romanian Deadlift',
  'Bulgarian Split Squat',
  'Calf Raise',
  'Hip Thrust',
  'Hack Squat',
  'Goblet Squat',
  'Lunges',
  // Core
  'Plank',
  'Cable Crunch',
  'Hanging Leg Raise',
]

/**
 * Convert a string to Title Case.
 * Trims whitespace, capitalizes first letter of each word, lowercases the rest.
 */
export function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split('-')
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        )
        .join('-'),
    )
    .join(' ')
}

/**
 * Merge starter exercises with user's history.
 * Deduplicates case-insensitively, sorts alphabetically, returns Title Case names.
 */
export function mergeExercises(
  starterList: string[],
  userHistory: string[],
): string[] {
  const seen = new Map<string, string>()

  for (const name of [...starterList, ...userHistory]) {
    const normalized = toTitleCase(name)
    const key = normalized.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, normalized)
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
}

/**
 * Filter exercises that contain the query (case-insensitive).
 * Empty query returns all exercises.
 */
export function searchExercises(exercises: string[], query: string): string[] {
  const trimmed = query.trim().toLowerCase()
  if (trimmed === '') return exercises
  return exercises.filter((e) => e.toLowerCase().includes(trimmed))
}
