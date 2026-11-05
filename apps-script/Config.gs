/**
 * TEST/production values belong in Apps Script Script Properties only.
 * Never place secret values in this file.
 */
function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: props.getProperty('SPREADSHEET_ID'),
    backendSecret: props.getProperty('BACKEND_SECRET'),
    maxParticipants: Number(props.getProperty('MAX_PARTICIPANTS') || '200'),
    timezone: props.getProperty('APP_TIMEZONE') || 'Asia/Jakarta',
    replayWindowSeconds: 60,
    replayRetentionSeconds: 24 * 60 * 60
  };
}

function getDatabase_() {
  var config = getConfig_();
  if (!config.spreadsheetId) throw new Error('SPREADSHEET_ID is not configured');
  return SpreadsheetApp.openById(config.spreadsheetId);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), getConfig_().timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function sheetOrCreate_(name, headers) {
  var spreadsheet = getDatabase_();
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function participantSheet_() {
  return sheetOrCreate_('Participants', [
    'ticket_code', 'full_name', 'email', 'whatsapp', 'registered_at',
    'checkin_status', 'checked_in_at', 'client_request_id'
  ]);
}

function checkinLogSheet_() {
  return sheetOrCreate_('Checkin_Log', [
    'log_id', 'ticket_code', 'checked_at', 'admin_email', 'method', 'result', 'ip_address_hash'
  ]);
}

function replaySheet_() {
  return sheetOrCreate_('Replay_Nonces', ['nonce', 'received_at', 'expires_at']);
}

function idempotencySheet_() {
  return sheetOrCreate_('Registration_Requests', [
    'client_request_id', 'request_hash', 'status', 'ticket_code', 'created_at', 'full_name'
  ]);
}
