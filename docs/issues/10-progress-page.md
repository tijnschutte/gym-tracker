# 10 - Progress: exercise list + line chart page

## What to build

Build the Progress page with two views:

1. **Exercise list** — shows all exercises the user has logged. Tapping one navigates to the chart view.
2. **Chart view** — a line chart (shadcn/ui chart components, Recharts under the hood) showing weight over time for the selected exercise. X-axis: dates formatted as DD/MM/YY. Y-axis: kg. Tooltips on tap show exact date + kg value. All-time data, no time range controls.

Empty states:

- No history at all: show "No progress yet. Complete your first session to start tracking!"
- Exercise with < 2 data points: show "Need at least 2 data points"

Data is fetched once via `fetchHistory` when the page opens and cached in React state. Switching between exercises is instant (no additional API calls).

## Acceptance criteria

- [ ] Progress page fetches history data via `fetchHistory` on mount
- [ ] Exercise list displays all exercises from the history data
- [ ] Tapping an exercise shows a line chart for that exercise
- [ ] Chart uses shadcn/ui chart components (install via `bunx shadcn@latest add chart`)
- [ ] X-axis shows dates formatted as DD/MM/YY
- [ ] Y-axis shows kg values
- [ ] Tapping a data point shows a tooltip with exact date and kg
- [ ] All-time data displayed, no time range controls
- [ ] Empty state shown when user has no history
- [ ] "Need at least 2 data points" shown for exercises with < 2 entries
- [ ] Back button returns to the exercise list
- [ ] Loading state shown while fetching history

## Blocked by

- 09 - Progress: fetchHistory API client function
