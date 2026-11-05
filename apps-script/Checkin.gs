function processCheckin_(data) {
  if (!data || typeof data.ticketCode !== 'string' || !/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(data.ticketCode.replace('NWDS-', ''))) {
    throw appError_('INVALID', 404);
  }
  if (!['SCAN', 'MANUAL'].includes(String(data.method).toUpperCase())) throw appError_('INVALID_REQUEST', 400);
  if (!data.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.adminEmail))) throw appError_('UNAUTHORIZED', 401);

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = participantSheet_();
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === data.ticketCode) { rowIndex = i + 1; break; }
    }
    if (rowIndex < 0) {
      appendCheckinLog_(data, 'INVALID');
      throw appError_('INVALID', 404);
    }

    var current = sheet.getRange(rowIndex, 1, 1, 8).getDisplayValues()[0];
    if (current[5] === 'CHECKED_IN') {
      appendCheckinLog_(data, 'ALREADY_USED');
      return { status: 'ALREADY_USED', ticketCode: current[0], nama: current[1], firstCheckedInAt: current[6] };
    }

    var checkedAt = nowIso_();
    sheet.getRange(rowIndex, 6, 1, 2).setValues([['CHECKED_IN', checkedAt]]);
    var saved = sheet.getRange(rowIndex, 6, 1, 2).getDisplayValues()[0];
    if (saved[0] !== 'CHECKED_IN' || saved[1] !== checkedAt) throw appError_('INTERNAL_ERROR', 500);

    try {
      appendCheckinLog_(data, 'SUCCESS', checkedAt);
    } catch (logError) {
      // State is already checked in. Log a reconciliation marker for later repair.
      appendCheckinLogBestEffort_(data, 'LOG_WRITE_FAILED', checkedAt);
      throw appError_('INTERNAL_ERROR', 500);
    }
    return { status: 'SUCCESS', ticketCode: current[0], nama: current[1], checkedInAt: checkedAt };
  } catch (error) {
    if (error.code) throw error;
    throw appError_('SERVER_BUSY', 503);
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function appendCheckinLog_(data, result, checkedAt) {
  checkinLogSheet_().appendRow([
    Utilities.getUuid(), data.ticketCode, checkedAt || nowIso_(), safeSheetText_(data.adminEmail),
    String(data.method).toUpperCase(), result, safeSheetText_(String(data.ipHash || ''))
  ]);
}

function appendCheckinLogBestEffort_(data, result, checkedAt) {
  try { appendCheckinLog_(data, result, checkedAt); } catch (ignore) { console.error(JSON.stringify({ action: 'checkin_log', result: result })); }
}

