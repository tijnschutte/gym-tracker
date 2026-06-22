# 02 - Google Sign-In + Auth UI

## What to build

Integrate Google Identity Services (GIS) for sign-in. Build the Auth Module that manages token state (ID token, user info: sub, email, name). Build the Login screen with a "Sign in with Google" button and a sign-out button visible when authenticated. The ID token is stored in React state for use in subsequent API calls.

This slice requires manual setup: create a Google Cloud OAuth client ID and authorize the GitHub Pages origin.

## Acceptance criteria

- [ ] Google Sign-In button renders on the login screen
- [ ] User can sign in with their Google account
- [ ] After sign-in, user's name is displayed and the sign-out button is visible
- [ ] User can sign out and returns to the login screen
- [ ] ID token, `sub`, `email`, and `name` are available in auth state after sign-in
- [ ] Unauthenticated users cannot access the session screens

## Blocked by

- 01 - Project scaffolding + GitHub Pages deploy
