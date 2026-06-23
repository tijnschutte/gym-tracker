# 09 - Progress: fetchHistory API client function

## What to build

Add a `fetchHistory` function to `src/lib/api.ts` that calls the `getHistory` Apps Script action and returns the typed response. Define the `HistoryData` type as `Record<string, Record<string, number>>` (exercise name → date string → kg).

## Acceptance criteria

- [ ] `fetchHistory(idToken: string): Promise<HistoryData>` is exported from `src/lib/api.ts`
- [ ] `HistoryData` type is exported: `Record<string, Record<string, number>>`
- [ ] Calls `postAction<{ history: HistoryData }>('getHistory', idToken)` and returns `data.history`
- [ ] Errors are handled consistently with `fetchExercises` and `saveSession`

## Blocked by

- 08 - Progress: getHistory Apps Script action
