# 08 - Progress: getHistory Apps Script action

## What to build

Add a `getHistory` action to the Apps Script `doPost` handler. It reads the pivot tab, filters rows by the authenticated user's `user_sub`, and returns all exercise history as an exercise-keyed object.

Response shape:

```json
{
  "Bench Press": { "01/01/2026": 60, "08/01/2026": 65 },
  "Squat": { "15/01/2026": 100 }
}
```

Date keys match the pivot tab column headers (DD/MM/YYYY format). Empty cells are omitted.

## Acceptance criteria

- [ ] Apps Script handles `action: "getHistory"` in `doPost`
- [ ] ID token is verified and `user_sub` is extracted (same as other actions)
- [ ] Response contains only rows matching the authenticated user's `user_sub`
- [ ] Response shape is an object keyed by exercise name, with date→kg sub-objects
- [ ] Empty cells in the pivot tab are excluded from the response
- [ ] Returns `{ }` (empty object) if the user has no history

## Blocked by

- 03 - Apps Script backend: token verification + getExercises
