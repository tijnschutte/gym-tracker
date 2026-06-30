// =============================================================================
// Gym Tracker — Google Apps Script Backend
// =============================================================================
//
// Deploy as: Web App  |  Execute as: Me  |  Access: Anyone
//
// Sheet structure:
//
//   "log" tab — THE SINGLE SOURCE OF TRUTH
//   +------+------------+----------+------------+-----------+----------+----+-------+------------+
//   | date | session_id | user_sub | user_email | user_name | exercise | kg | notes | created_at |
//   +------+------------+----------+------------+-----------+----------+----+-------+------------+
//   Append-only log of every set recorded. All reads (getExercises, getHistory)
//   are derived from this tab, so they can never drift out of sync.
//
//   "pivot" tab — DERIVED, COSMETIC VIEW (optional)
//   Not written or read by this script. Make it a self-updating view by putting
//   a single formula in pivot!A1 (clear the tab first):
//
//     =QUERY(log!{C2:C, F2:F, A2:A, G2:G},
//            "select Col1, Col2, max(Col4)
//             where Col1 is not null
//             group by Col1, Col2
//             pivot Col3", 0)
//
//   (Col1=user_sub, Col2=exercise, Col3=date, Col4=kg.) It regenerates itself
//   whenever a new log row is appended.
//
// =============================================================================

// The OAuth client ID this backend trusts. A valid Google ID token is only
// accepted if its `aud` claim matches this — i.e. the token was minted by THIS
// app's sign-in button, not some other website's. Must match the frontend's
// VITE_GOOGLE_CLIENT_ID.
var CLIENT_ID =
  '537441633732-daj873jocmrqigmqloj0707scaobcacd.apps.googleusercontent.com'

/**
 * Handles incoming POST requests from the frontend.
 *
 * Expected JSON body:
 *   { action: string, idToken: string, ...other fields depending on action }
 *
 * Supported actions:
 *   "getExercises" — distinct exercise names the authenticated user has logged
 *   "save"         — append a session's exercises to the log tab
 *   "getHistory"   — the user's full exercise history (exercise → date → kg)
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    var idToken = body.idToken

    if (!idToken) {
      return _jsonResponse({ error: 'Missing idToken' }, 400)
    }

    // ---- Verify the Google ID token ----------------------------------------
    var tokenPayload = _verifyIdToken(idToken)
    if (tokenPayload.error) {
      return _jsonResponse(
        { error: 'Invalid token: ' + tokenPayload.error },
        401,
      )
    }

    var userSub = tokenPayload.sub
    var userEmail = tokenPayload.email
    var userName = tokenPayload.name || tokenPayload.email

    // ---- Route by action ---------------------------------------------------
    var action = body.action

    if (action === 'getExercises') {
      return _handleGetExercises(userSub)
    }

    if (action === 'save') {
      return _handleSave(userSub, userEmail, userName, body.data)
    }

    if (action === 'getHistory') {
      return _handleGetHistory(userSub)
    }

    return _jsonResponse({ error: 'Unknown action: ' + action }, 400)
  } catch (err) {
    return _jsonResponse({ error: 'Server error: ' + err.message }, 500)
  }
}

// =============================================================================
// Action handlers
// =============================================================================

/**
 * Reads the "log" sheet and returns the unique exercise names for a user.
 *
 * @param {string} userSub - The Google `sub` claim identifying the user.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON with { exercises: string[] }
 */
function _handleGetExercises(userSub) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var logSheet = ss.getSheetByName('log')

  if (!logSheet) {
    return _jsonResponse({ exercises: [] })
  }

  var data = logSheet.getDataRange().getValues()
  var exercises = []
  var seen = {}

  // Row 0 is the header row; data rows start at index 1.
  // Columns: date(0), session_id(1), user_sub(2), email(3), name(4),
  //          exercise(5), kg(6), notes(7), created_at(8)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]) !== userSub) {
      continue
    }
    var exercise = String(data[i][5]).trim()
    if (exercise && !seen[exercise]) {
      seen[exercise] = true
      exercises.push(exercise)
    }
  }

  return _jsonResponse({ exercises: exercises })
}

/**
 * Saves a workout session to the log tab. The log is the single source of
 * truth; the pivot view is derived from it.
 *
 * Idempotent upsert keyed on sessionId: any existing rows for this session are
 * removed and replaced with the current payload, so a retry (or an edit-then-
 * retry after a lost response) never duplicates rows and always reflects the
 * latest contents. A script lock serializes concurrent saves so two overlapping
 * writes can't clobber each other.
 *
 * @param {string} userSub   - Google `sub` claim.
 * @param {string} userEmail - User email from the token.
 * @param {string} userName  - User display name from the token.
 * @param {object} data      - { sessionId: string, exercises: { name, kg, notes? }[] }
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function _handleSave(userSub, userEmail, userName, data) {
  if (!data || !data.sessionId || !Array.isArray(data.exercises) || data.exercises.length === 0) {
    return _jsonResponse({ error: 'Invalid session data' }, 400)
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var tz = ss.getSpreadsheetTimeZone()
  var now = new Date()
  var dateOnly = Utilities.formatDate(now, tz, 'yyyy-MM-dd')
  var isoNow = now.toISOString()
  var sessionId = String(data.sessionId)

  var lock = LockService.getScriptLock()
  // Wait up to 10s for any in-flight save to finish before we read/write.
  if (!lock.tryLock(10000)) {
    return _jsonResponse({ error: 'Busy, please retry' }, 503)
  }

  try {
    var logSheet = ss.getSheetByName('log')
    if (!logSheet) {
      logSheet = ss.insertSheet('log')
      logSheet.appendRow([
        'date', 'session_id', 'user_sub', 'user_email',
        'user_name', 'exercise', 'kg', 'notes', 'created_at',
      ])
    }

    // Upsert: delete any existing rows for this session (bottom-to-top so row
    // indices stay valid as we remove them), then append the current payload.
    // Columns: date(0), session_id(1), user_sub(2), ...
    var existing = logSheet.getDataRange().getValues()
    for (var r = existing.length - 1; r >= 1; r--) {
      if (
        String(existing[r][1]) === sessionId &&
        String(existing[r][2]) === userSub
      ) {
        logSheet.deleteRow(r + 1)
      }
    }

    var rows = []
    for (var j = 0; j < data.exercises.length; j++) {
      rows.push([
        dateOnly,
        sessionId,
        userSub,
        userEmail,
        userName,
        data.exercises[j].name,
        data.exercises[j].kg,
        data.exercises[j].notes || '',
        isoNow,
      ])
    }
    logSheet
      .getRange(logSheet.getLastRow() + 1, 1, rows.length, rows[0].length)
      .setValues(rows)
  } finally {
    lock.releaseLock()
  }

  return _jsonResponse({ success: true })
}

/**
 * Returns the full exercise history for a user, keyed by exercise name,
 * derived from the append-only log tab.
 *
 * Response shape:
 *   { history: { "Bench Press": { "01/01/2026": 60, ... }, ... } }
 *
 * @param {string} userSub - The Google `sub` claim identifying the user.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON with { history: object }
 */
function _handleGetHistory(userSub) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var logSheet = ss.getSheetByName('log')

  if (!logSheet) {
    return _jsonResponse({ history: {} })
  }

  var tz = ss.getSpreadsheetTimeZone()
  var data = logSheet.getDataRange().getValues()

  var history = {}
  // Tracks the newest created_at seen per "exercise date" cell, so the
  // latest log wins even if the rows aren't in physical append order (e.g. the
  // sheet was hand-sorted). ISO-8601 UTC strings sort correctly as text.
  var newestAt = {}

  // Columns: date(0), session_id(1), user_sub(2), email(3), name(4),
  //          exercise(5), kg(6), notes(7), created_at(8)
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]) !== userSub) {
      continue
    }

    var exercise = String(data[i][5]).trim()
    if (!exercise) {
      continue
    }

    var kg = data[i][6]
    if (kg === '' || kg == null) {
      continue
    }

    var dateLabel = _formatLogDate(data[i][0], tz)
    var cellKey = exercise + ' ' + dateLabel
    var createdAt = String(data[i][8] || '')

    // Only overwrite if this row is newer than what we've already recorded for
    // this (exercise, date). Rows with a blank created_at sort oldest.
    if (newestAt[cellKey] !== undefined && createdAt <= newestAt[cellKey]) {
      continue
    }
    newestAt[cellKey] = createdAt

    if (!history[exercise]) {
      history[exercise] = {}
    }
    history[exercise][dateLabel] = kg
  }

  return _jsonResponse({ history: history })
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Format a log-tab date cell into the "DD/MM/YYYY" label the frontend expects.
 * The date is stored as "yyyy-MM-dd" text but may be coerced to a Date by Sheets.
 *
 * @param {string|Date} value - The raw cell value from the log's date column.
 * @param {string} tz - The spreadsheet time zone.
 * @returns {string} A "DD/MM/YYYY" date label.
 */
function _formatLogDate(value, tz) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, tz, 'dd/MM/yyyy')
  }
  var s = String(value).trim()
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) {
    return m[3] + '/' + m[2] + '/' + m[1]
  }
  return s
}

/**
 * Verify a Google ID token using Google's tokeninfo endpoint.
 *
 * @param {string} token - The raw JWT id_token from the frontend.
 * @returns {object} The decoded token payload, or { error: string } on failure.
 */
function _verifyIdToken(token) {
  var url =
    'https://oauth2.googleapis.com/tokeninfo?id_token=' +
    encodeURIComponent(token)

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
  var code = response.getResponseCode()

  if (code !== 200) {
    // tokeninfo returns 4xx for malformed, expired, or otherwise invalid tokens.
    return { error: 'tokeninfo returned HTTP ' + code }
  }

  var payload = JSON.parse(response.getContentText())

  // tokeninfo already verified the signature and expiry. We additionally check
  // that the token was issued FOR this app (aud) BY Google (iss), and that the
  // email is verified. These guard against replaying a token minted for a
  // different site against this endpoint.
  if (payload.aud !== CLIENT_ID) {
    return { error: 'unexpected audience' }
  }
  if (
    payload.iss !== 'accounts.google.com' &&
    payload.iss !== 'https://accounts.google.com'
  ) {
    return { error: 'unexpected issuer' }
  }
  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    return { error: 'email not verified' }
  }

  return payload
}

/**
 * Create a JSON response with the given payload.
 *
 * @param {object} payload - The object to serialize.
 * @param {number} [statusCode] - Unused by ContentService but kept for clarity.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function _jsonResponse(payload, statusCode) {
  // Note: Apps Script Web Apps always return HTTP 200 regardless of the
  // statusCode we might want.  We embed status info in the JSON body instead.
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
