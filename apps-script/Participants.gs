function getStats_() {
  var rows = participantSheet_().getDataRange().getDisplayValues();
  var total = Math.max(0, rows.length - 1);
  var checkedIn = rows.slice(1).filter(function(row) { return row[5] === 'CHECKED_IN'; }).length;
  return {
    status: 'SUCCESS',
    totalRegistered: total,
    checkedIn: checkedIn,
    notCheckedIn: total - checkedIn,
    attendancePercentage: total ? Math.round((checkedIn / total) * 1000) / 10 : 0,
    quotaCapacity: getConfig_().maxParticipants
  };
}

function getParticipants_(data) {
  var query = normalizeText_(data && data.q).toLowerCase();
  var status = data && data.status ? String(data.status) : 'all';
  var rows = participantSheet_().getDataRange().getDisplayValues();
  var participants = rows.slice(1).filter(function(row) {
    var matchQuery = !query || row.slice(0, 4).join(' ').toLowerCase().indexOf(query) >= 0;
    var matchStatus = status === 'all' || row[5] === status;
    return matchQuery && matchStatus;
  }).slice(0, 200).map(function(row) {
    return {
      ticketCode: row[0], nama: row[1], email: row[2], whatsapp: row[3],
      registeredAt: row[4], status: row[5], checkedInAt: row[6] || null
    };
  });
  return { status: 'SUCCESS', participants: participants };
}
