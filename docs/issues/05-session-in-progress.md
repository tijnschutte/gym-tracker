# 05 - Session In Progress screen + inline editing

## What to build

Build the Session Module: core domain logic for managing a session's exercise entries. Supports add, edit (update kg), remove, and duplicate overwrite (logging the same exercise again replaces the previous entry). Build the Session In Progress screen UI: displays all logged exercises in a list, each showing exercise name, kg, and notes. Tap an exercise to inline-edit the kg value. Swipe or tap a delete button to remove an entry. "Add more" navigates back to the Exercise Logger. "Finish session" transitions to the Summary screen.

Includes unit tests for the Session Module (add, edit, remove, duplicate overwrite, state transitions).

## Acceptance criteria

- [ ] Session In Progress screen displays all exercises logged in the current session
- [ ] Each entry shows exercise name, kg value, and notes
- [ ] Tapping an exercise allows inline editing of the kg value
- [ ] User can delete an exercise entry from the session
- [ ] Logging the same exercise twice overwrites the previous entry (last value wins)
- [ ] "Add more" navigates to the Exercise Logger screen
- [ ] "Finish session" navigates to the Summary screen
- [ ] Unit tests pass for Session Module: add, edit, remove, duplicate overwrite

## Blocked by

- 04 - Exercise Registry + Exercise Logger screen
