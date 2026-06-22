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
      // Placeholder — will be implemented in issue #7
      return _jsonResponse({ success: true })
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
