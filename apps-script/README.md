# Apps Script Backend — Setup

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the first tab to **`pivot`** and add these headers in row 1:

   | A | B | C … |
   |---|---|-----|
   | user_sub | exercise | _(date columns added automatically)_ |

3. Create a second tab named **`log`** with these headers in row 1:

   | A | B | C | D | E | F | G | H | I |
   |---|---|---|---|---|---|---|---|---|
   | date | session_id | user_sub | user_email | user_name | exercise | kg | notes | created_at |

## 2. Add the Apps Script

1. In your spreadsheet, go to **Extensions > Apps Script**.
2. Delete any existing code in `Code.gs`.
3. Paste the contents of `Code.gs` from this folder.
4. Save (Ctrl+S / Cmd+S).

## 3. Deploy as a Web App

1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Set **Execute as**: *Me*.
4. Set **Who has access**: *Anyone*.
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
