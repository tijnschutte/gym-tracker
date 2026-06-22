# 04 - Exercise Registry + Exercise Logger screen

## What to build

Build the Exercise Registry module: a hardcoded starter list of common gym exercises, merged with the user's history fetched via `getExercises`. Deduplication, Title Case normalization (trim whitespace, capitalize each word), and search/filter logic. Build the Exercise Logger screen UI: a searchable combobox (free entry allowed), a kg number input, an optional notes text field, and an "Add to session" button. Adding an exercise creates a session entry in React state.

Includes unit tests for the Exercise Registry module (dedup, normalization, merge, search).

## Acceptance criteria

- [ ] Starter exercise list contains common compound and isolation movements
- [ ] User's previously logged exercises (from `getExercises`) are merged with the starter list
- [ ] Duplicate exercises are removed (case-insensitive)
- [ ] Custom exercise names are auto-normalized to Title Case
- [ ] Combobox is searchable and allows free text entry
- [ ] User can enter a kg value (float) and optional notes
- [ ] Tapping "Add to session" creates an entry in session state
- [ ] Unit tests pass for Exercise Registry: dedup, Title Case normalization, merge, and search/filter

## Blocked by

- 03 - Apps Script backend: token verification + getExercises
