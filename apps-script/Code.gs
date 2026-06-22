// =============================================================================
// Gym Tracker — Google Apps Script Backend
// =============================================================================
//
// Deploy as: Web App  |  Execute as: Me  |  Access: Anyone
//
// Sheet structure:
//
//   "pivot" tab
//   +-----------+-----------+------------+------------+-----+
//   | A         | B         | C          | D          | ... |
//   | user_sub  | exercise  | DD/MM/YYYY | DD/MM/YYYY | ... |
//   +-----------+-----------+------------+------------+-----+
//   Each row is a unique (user, exercise) pair.
//   Date columns hold the weight (kg) logged on that date.
//
//   "log" tab
//   +------+------------+----------+------------+-----------+----------+----+-------+------------+
//   | date | session_id | user_sub | user_email | user_name | exercise | kg | notes | created_at |
//   +------+------------+----------+------------+-----------+----------+----+-------+------------+
//   Append-only log of every set recorded.
//
// =============================================================================

/**
 * Handles incoming POST requests from the frontend.
 *
 * Expected JSON body:
 *   { action: string, idToken: string, ...other fields depending on action }
 *
 * Supported actions:
 *   "getExercises" — returns the distinct exercise names for the authenticated user
 *   "save"         — (placeholder) will persist session data in a future release
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

    return _jsonResponse({ error: 'Unknown action: ' + action }, 400)
  } catch (err) {
    return _jsonResponse({ error: 'Server error: ' + err.message }, 500)
  }
}

// =============================================================================
// Action handlers
// =============================================================================

/**
 * Reads the "pivot" sheet and returns the unique exercise names for a user.
 *
 * @param {string} userSub - The Google `sub` claim identifying the user.
 * @returns {GoogleAppsScript.Content.TextOutput} JSON with { exercises: string[] }
 */
function _handleGetExercises(userSub) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var pivotSheet = ss.getSheetByName('pivot')

  if (!pivotSheet) {
    return _jsonResponse({ exercises: [] })
  }

  var data = pivotSheet.getDataRange().getValues()
  var exercises = []
  var seen = {}

  // Row 0 is the header row; data rows start at index 1
  for (var i = 1; i < data.length; i++) {
    var rowSub = String(data[i][0]) // Column A = user_sub
    var rowExercise = String(data[i][1]) // Column B = exercise

    if (rowSub === userSub && rowExercise && !seen[rowExercise]) {
      seen[rowExercise] = true
      exercises.push(rowExercise)
    }
  }

  return _jsonResponse({ exercises: exercises })
}

/**
 * Saves a workout session: upserts the pivot tab and appends to the log tab.
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
  var dateStr = Utilities.formatDate(now, tz, 'dd/MM/yyyy')
  var dateOnly = Utilities.formatDate(now, tz, 'yyyy-MM-dd')
  var isoNow = now.toISOString()

  // ---- Pivot tab ------------------------------------------------------------
  var pivotSheet = ss.getSheetByName('pivot')
  if (!pivotSheet) {
    pivotSheet = ss.insertSheet('pivot')
    pivotSheet.appendRow(['user_sub', 'exercise'])
  }

  var pivotData = pivotSheet.getDataRange().getValues()
  var headers = pivotData[0]

  // Find or create the date column
  var dateColIndex = -1
  for (var c = 2; c < headers.length; c++) {
    var headerVal = headers[c]
    if (headerVal instanceof Date) {
      headerVal = Utilities.formatDate(headerVal, tz, 'dd/MM/yyyy')
    }
    if (String(headerVal) === dateStr) {
      dateColIndex = c
      break
    }
  }
  if (dateColIndex === -1) {
    dateColIndex = headers.length
    pivotSheet.getRange(1, dateColIndex + 1).setValue(dateStr)
  }

  // Upsert each exercise row
  for (var i = 0; i < data.exercises.length; i++) {
    var exerciseName = data.exercises[i].name
    var kg = data.exercises[i].kg
    var rowIndex = -1

    for (var r = 1; r < pivotData.length; r++) {
      if (String(pivotData[r][0]) === userSub && String(pivotData[r][1]) === exerciseName) {
        rowIndex = r
        break
      }
    }

    if (rowIndex === -1) {
      // New exercise — append row and update pivotData so subsequent exercises
      // can detect it without re-reading the sheet.
      var newRow = pivotSheet.getLastRow() + 1
      pivotSheet.getRange(newRow, 1).setValue(userSub)
      pivotSheet.getRange(newRow, 2).setValue(exerciseName)
      pivotSheet.getRange(newRow, dateColIndex + 1).setValue(kg)
      pivotData.push([userSub, exerciseName])
    } else {
      pivotSheet.getRange(rowIndex + 1, dateColIndex + 1).setValue(kg)
    }
  }

  // ---- Log tab --------------------------------------------------------------
  var logSheet = ss.getSheetByName('log')
  if (!logSheet) {
    logSheet = ss.insertSheet('log')
    logSheet.appendRow([
      'date', 'session_id', 'user_sub', 'user_email',
      'user_name', 'exercise', 'kg', 'notes', 'created_at',
    ])
  }

  for (var j = 0; j < data.exercises.length; j++) {
    logSheet.appendRow([
      dateOnly,
      data.sessionId,
      userSub,
      userEmail,
      userName,
      data.exercises[j].name,
      data.exercises[j].kg,
      data.exercises[j].notes || '',
      isoNow,
    ])
  }

  return _jsonResponse({ success: true })
}

// =============================================================================
// Helpers
// =============================================================================

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
    return { error: 'tokeninfo returned HTTP ' + code }
  }

  return JSON.parse(response.getContentText())
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
