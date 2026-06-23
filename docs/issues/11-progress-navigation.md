# 11 - Progress: header navigation button

## What to build

Add a "Progress" button (chart icon) to the header area of the session screen, next to the existing user avatar / sign-out controls. Tapping it navigates to the Progress page. The Progress page has a back button to return to the session screen.

This is simple view-level routing within the app (React state or lightweight client-side routing), not a full router setup.

## Acceptance criteria

- [ ] Header shows a Progress button/icon when the user is authenticated
- [ ] Tapping the button navigates to the Progress page
- [ ] Progress page has a back button that returns to the session screen
- [ ] Navigation does not interfere with in-progress session state (session is preserved)
- [ ] Button is not shown on the login screen

## Blocked by

- 10 - Progress: exercise list + line chart page
