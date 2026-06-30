# Apps Script Backend — Setup

## 1. Create the Google Sheet

The **`log`** tab is the single source of truth — every read (exercises, history)
is derived from it, so the data can never drift. The **`pivot`** tab is an
optional, self-updating cosmetic view.

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the first tab to **`log`** and add these headers in row 1:

   | A    | B          | C        | D          | E         | F        | G   | H     | I          |
   | ---- | ---------- | -------- | ---------- | --------- | -------- | --- | ----- | ---------- |
   | date | session_id | user_sub | user_email | user_name | exercise | kg  | notes | created_at |

3. _(Optional)_ Create a second tab named **`pivot`** for a human-readable
   weight-over-time matrix. Leave the tab empty and put this single formula in
   cell **A1** — it regenerates itself whenever a new session is logged:

   ```
   =QUERY(log!{C2:C, F2:F, A2:A, G2:G},
          "select Col1, Col2, max(Col4)
           where Col1 is not null
           group by Col1, Col2
           pivot Col3", 0)
   ```

   (Col1=user_sub, Col2=exercise, Col3=date, Col4=kg.) The script never reads or
   writes this tab, so the formula is free to own every cell.

## 2. Add the Apps Script

1. In your spreadsheet, go to **Extensions > Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Paste the contents of `Code.gs` from this folder.
4. Save (Ctrl+S / Cmd+S).

## 3. Deploy as a Web App

1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: _Me_.
4. Set **Who has access**: _Anyone_.
5. Click **Deploy** and authorize when prompted.
6. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/XXXXXXXXX/exec
   ```

## 4. Configure the frontend

Add the Web App URL to your `.env.local`:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXXX/exec
```

Restart the dev server (`bun run dev`) and the frontend will connect to your backend.
