# 07 - Summary screen + save to Apps Script

## What to build

Build the Summary/Review screen: a read-only view of all exercises in the session, showing exercise name and kg value. A "Save" button POSTs the session data to Apps Script. Implement the Apps Script `save` action: for each exercise entry, upsert the pivot cell at (user_sub + exercise row, date column) — creating the row or column if new — and append a row to the log tab. On success, clear React state and localStorage, show a success toast, and return to a clean session screen. On failure, show an error toast and keep the session active for retry.

Session ID is generated client-side (UUID v4) at session start.

## Acceptance criteria

- [x] Summary screen displays all exercises with their kg values in read-only format
- [x] "Save" button sends session data to Apps Script with the user's ID token
- [x] Apps Script `save` action upserts kg values into the pivot tab at the correct (user_sub, exercise, date) cell
- [x] Apps Script `save` action creates new rows for new exercises and new columns for new dates in the pivot tab
- [x] Apps Script `save` action appends one row per exercise to the log tab with all fields (date, session_id, user_sub, user_email, user_name, exercise, kg, notes, created_at)
- [x] On successful save: React state and localStorage are cleared, success toast is shown, app returns to empty session screen
- [x] On failed save: error toast is shown, session remains active, user can retry
- [x] Session ID is a UUID v4 generated at session start

## Blocked by

- 05 - Session In Progress screen + inline editing
- 03 - Apps Script backend: token verification + getExercises
