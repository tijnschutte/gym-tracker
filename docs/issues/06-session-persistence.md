# 06 - Session persistence (localStorage)

## What to build

Build the Persistence Module: a localStorage wrapper that syncs the current session state on every change. On app load, check localStorage for an unfinished session. If found, prompt the user to resume or discard. On successful save, clear localStorage. This ensures in-progress sessions survive page refresh, accidental tab close, or phone lock.

Includes unit tests for the Persistence Module (write-on-change, read-on-init, resume detection, clear-on-save).

## Acceptance criteria

- [ ] Session state is written to localStorage on every change (add, edit, remove exercise)
- [ ] On app load, if an unfinished session exists in localStorage, user is prompted to resume or discard
- [ ] Choosing "resume" restores the session and navigates to Session In Progress
- [ ] Choosing "discard" clears localStorage and starts fresh
- [ ] localStorage is cleared after a successful save
- [ ] Unit tests pass for Persistence Module: write, read, resume detection, clear

## Blocked by

- 05 - Session In Progress screen + inline editing
