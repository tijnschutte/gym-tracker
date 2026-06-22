## Problem Statement

Gym-goers want a fast, frictionless way to log their working weights during a session. Existing apps are bloated with features (rep schemes, rest timers, program builders) when all most people need is to record what weight they lifted on each exercise today. There's no simple, mobile-first tool that lets you sign in, punch in a few numbers, and get back to your workout.

## Solution

A mobile-first web app hosted on GitHub Pages. Users sign in with their Google account, log exercises with a single kg value each, review the session, and save. Data is stored in a shared Google Sheet (isolated per user), giving the developer full visibility and the user a simple, reliable experience with zero app installs.

## User Stories

1. As a gym-goer, I want to sign in with my Google account, so that my data is tied to my identity without creating yet another account.
2. As a gym-goer, I want to search for an exercise from a pre-populated list, so that I can quickly find what I'm looking for without typing the full name.
3. As a gym-goer, I want to add a custom exercise that's not in the starter list, so that I'm not limited to a fixed set of exercises.
4. As a gym-goer, I want custom exercise names to be auto-normalized to Title Case, so that I don't end up with duplicate entries due to inconsistent capitalization.
5. As a gym-goer, I want to enter a single kg value per exercise, so that logging is as fast as possible between sets.
6. As a gym-goer, I want to add an optional note to an exercise, so that I can capture context like "felt easy" or "left shoulder pain."
7. As a gym-goer, I want to see all exercises I've logged in the current session, so that I know what I've already done.
8. As a gym-goer, I want to tap an exercise in my current session to edit its kg value inline, so that I can correct mistakes without navigating away.
9. As a gym-goer, I want to delete an exercise from my current session, so that I can remove entries I added by mistake.
10. As a gym-goer, I want logging the same exercise twice in a session to overwrite the previous value, so that I always see one clean entry per exercise.
11. As a gym-goer, I want to review a read-only summary of my session before saving, so that I can catch any errors before committing.
12. As a gym-goer, I want to see the top set (kg) per exercise on the summary screen, so that I get a quick snapshot of my session.
13. As a gym-goer, I want to confirm and save my session with one tap, so that the data is persisted to the backend.
14. As a gym-goer, I want to see a success toast after saving, so that I have clear confirmation my data was stored.
15. As a gym-goer, I want the app to return to a clean state after saving, so that I'm ready for the next session.
16. As a gym-goer, I want my in-progress session to survive a page refresh or accidental tab close, so that I don't lose my data.
17. As a gym-goer, I want to be prompted to resume an unfinished session when I reopen the app, so that I can pick up where I left off.
18. As a gym-goer, I want to see a clear error message if saving fails, so that I know something went wrong and can retry.
19. As a gym-goer, I want to retry saving after a failure without re-entering data, so that network issues don't cause data loss.
20. As a gym-goer, I want the exercise dropdown to include exercises I've previously logged, so that my personal exercise vocabulary grows over time.
21. As a gym-goer, I want the app to work well on my phone, so that I can use it comfortably at the gym.
22. As a gym-goer, I want to sign out, so that I can switch accounts or protect my session on a shared device.

## Implementation Decisions

### Architecture
- **Frontend:** Vite + React + TypeScript + shadcn/ui, deployed to GitHub Pages (`tijnschutte.github.io/gym-tracker`) via GitHub Actions.
- **Backend:** Google Apps Script Web App — single `doPost` endpoint with action-based routing.
- **Storage:** Single shared Google Sheet with two tabs (`pivot`, `log`). Data isolated per user by filtering on `user_sub`.
- **Auth:** Google Identity Services (GIS) library. Frontend obtains a JWT ID token on sign-in. Token sent with every request to Apps Script, which verifies it server-side and extracts the user's `sub` (stable Google user ID), `email`, and `name`.

### Data Model
- **`pivot` tab:** `user_sub | exercise | <date columns as DD/MM/YYYY>`. One kg value per cell. New rows created for new (user, exercise) pairs. New columns created for new dates.
- **`log` tab:** `date | session_id | user_sub | user_email | user_name | exercise | kg | notes | created_at`. One row per exercise per session. Append-only.

### Modules
1. **Auth Module** — Google Sign-In integration, token state management, sign-in/sign-out flow.
2. **Session Module** — Core domain logic: create session, add/edit/remove exercise entries, session lifecycle (active, reviewing, saved). Pure state, no UI or API dependencies.
3. **Exercise Registry** — Hardcoded starter list merged with user's history fetched from the backend. Dedup, Title Case normalization, search/filter. Pure logic.
4. **API Client** — Talks to the Apps Script endpoint. Attaches ID token, sends action-based payloads (`save`, `getExercises`), handles errors.
5. **Persistence Module** — localStorage wrapper for session backup. Writes on every state change, reads on app init for resume detection.
6. **UI Layer** — React + shadcn components: Login, Exercise Logger (combobox + kg input + notes), Session In Progress (exercise list with inline edit), Summary/Review, toast notifications.
7. **Apps Script Backend** — `doPost` handler: verify ID token, route by `action` field, read/write pivot and log tabs.

### Apps Script Actions
- `getExercises`: Returns the list of exercises the authenticated user has previously logged (from pivot tab column B, filtered by user_sub).
- `save`: Receives session data. For each exercise entry: upsert pivot cell at (user_sub + exercise row, date column), append row to log tab.

### Key Behaviors
- **Session ID:** Generated client-side (UUID v4) at session start.
- **Duplicate exercise handling:** Last value wins — overwrite within the session.
- **Exercise normalization:** Trim whitespace, convert to Title Case before storage and search.
- **Session persistence:** React state as primary, synced to localStorage on every change. On app load, check localStorage for unfinished session and prompt to resume or discard.
- **Post-save flow:** Clear React state + localStorage, show success toast, return to empty session screen.
- **Error handling:** On save failure, show error toast. Session remains active for retry. localStorage still has the backup.

### User Identity
- Primary key: Google `sub` claim (stable, never changes).
- `email` and `name` stored alongside for display and developer convenience.
- Schema is social-feature-ready: shared sheet with user_sub allows future group/leaderboard queries without migration.

## Testing Decisions

Good tests verify external behavior through public interfaces, not implementation details. Tests should be resilient to refactoring — if the internal structure changes but the behavior stays the same, tests should still pass.

### Tested Modules
1. **Session Module** — Test session lifecycle: adding exercises, editing kg, removing entries, duplicate overwrite behavior, session state transitions. Pure state logic with clear inputs/outputs.
2. **Exercise Registry** — Test dedup logic, Title Case normalization, merge of starter list with user history, search/filter behavior. Pure functions.
3. **Persistence Module** — Test write-on-change, read-on-init, resume detection, clear-on-save. Uses a mock localStorage interface.

### Not Tested (for now)
- UI components (manual testing sufficient at this scale)
- API Client (integration with Apps Script is better verified end-to-end)
- Apps Script backend (tested manually via the Google Sheet)

## Out of Scope

- Social features (groups, leaderboards, friend comparisons) — deferred, schema supports future addition
- Progress charts or historical data views
- Rep/set tracking — only kg is logged
- Offline-first / service worker / PWA
- Exercise categorization (muscle groups, push/pull, etc.)
- Workout programs or templates
- Rest timers
- Data export (the Google Sheet itself is the export)

## Further Notes

- The Google OAuth client ID must authorize the GitHub Pages origin (`https://tijnschutte.github.io`).
- Apps Script is deployed as "Execute as me, access anyone" — the developer's Google account owns the Sheet and the script.
- The pivot tab's date columns grow rightward over time. This is fine for individual use but may need periodic archival if it grows to hundreds of columns.
- The starter exercise list should cover common compound and isolation movements. It will be defined as a constant in the Exercise Registry module.
