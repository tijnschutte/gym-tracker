# 03 - Apps Script backend: token verification + getExercises

## What to build

Create the Google Sheet with two tabs (`pivot` and `log`) with the correct column headers. Write and deploy a Google Apps Script Web App with a single `doPost` endpoint. The endpoint verifies the Google ID token server-side, extracts the user's `sub`, and routes by `action` field. Implement the `getExercises` action: return the list of exercises the authenticated user has previously logged (from the pivot tab, filtered by `user_sub`). The frontend calls `getExercises` on login and logs the result.

This slice requires manual setup: create the Google Sheet, write and deploy the Apps Script, paste the Web App URL into the frontend config.

## Acceptance criteria

- [ ] Google Sheet exists with `pivot` tab (columns: user_sub, exercise, then date columns) and `log` tab (columns: date, session_id, user_sub, user_email, user_name, exercise, kg, notes, created_at)
- [ ] Apps Script `doPost` verifies the Google ID token and rejects invalid/missing tokens with an error response
- [ ] `getExercises` action returns exercises filtered by the authenticated user's `sub`
- [ ] Frontend API Client module sends requests with the ID token and action field
- [ ] Frontend calls `getExercises` after login and receives the response (empty list for new users)
- [ ] Apps Script is deployed as "Execute as me, access anyone"

## Blocked by

- 02 - Google Sign-In + Auth UI
