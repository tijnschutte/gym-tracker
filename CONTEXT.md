# Gym Tracker - Domain Context

## Glossary

| Term           | Definition                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Session        | A single gym visit. Created when the user starts logging, ends when saved. Contains one or more exercise entries.                                      |
| Exercise Entry | A single exercise logged within a session. One kg value per exercise per session. Duplicate exercise names overwrite (last value wins).                |
| Exercise       | A named movement (e.g. "Bench Press", "Squat"). Auto-normalized to Title Case.                                                                         |
| Pivot Tab      | Google Sheet tab storing the weight matrix: user_sub x exercise x date = kg. Source of truth for progress history.                                     |
| Log Tab        | Google Sheet tab with append-only rows. One row per exercise per session. Contains full metadata (session_id, user info, timestamps).                  |
| Progress       | Weight over time per exercise. Visualized as a line chart with all-time data.                                                                          |
| user_sub       | Google's stable user ID (`sub` claim from the ID token). Primary key for all user data. Never changes, unlike email.                                   |
| History Data   | The full weight history for a user, returned by `getHistory` as an exercise-keyed object: `{ exercise: { date: kg } }`. Fetched once, browsed locally. |
