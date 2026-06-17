function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload } = body;

    const handlers = {
      getTransactions:        () => getTransactions(payload),
      getTransactions2Months: () => getTransactions2Months(payload),
      appendTransactions:     () => appendTransactions(payload),
      updateTransaction:      () => updateTransaction(payload),
      deleteTransaction:      () => deleteTransaction(payload),
      upsertMonthlyNote:      () => upsertMonthlyNote(payload),
      getMonthlyNote:         () => getMonthlyNote(payload),
    };

    if (!handlers[action]) {
      return respond(false, null, 'Unknown action: ' + action);
    }

    const result = handlers[action]();
    return respond(true, result);
  } catch (err) {
    return respond(false, null, err.message);
  }
}

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function respond(success, data, error) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, data: data, error: error || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── transactions ─────────────────────────────────────────

function getTransactions(payload) {
  const { yearMonth } = payload;
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();
  const transactions = rows.slice(1)
    .filter(function(row) { return row[1] && formatDate(row[1]).startsWith(yearMonth); })
    .map(rowToTransaction);
  return { transactions: transactions };
}

function getTransactions2Months(payload) {
  const { yearMonth } = payload;
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  const parts = yearMonth.split('-').map(Number);
  const y = parts[0];
  const m = parts[1];
  const prevDate = m === 1
    ? (y - 1) + '-12'
    : y + '-' + String(m - 1).padStart(2, '0');

  const transactions = rows.slice(1)
    .filter(function(row) {
      var d = formatDate(row[1]);
      return d && (d.startsWith(yearMonth) || d.startsWith(prevDate));
    })
    .map(rowToTransaction);
  return { transactions: transactions };
}

function appendTransactions(payload) {
  const { transactions } = payload;
  const sheet = getSheet('transactions');
  const now = new Date();

  const rows = transactions.map(function(t, i) {
    const id = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate())
      + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds())
      + '_' + i;
    return [id, t.date, t.category, t.amount, t.description, t.memo || '', t.person || ''];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  return { count: rows.length };
}

function updateTransaction(payload) {
  const { transaction } = payload;
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === transaction.id) {
      sheet.getRange(i + 1, 1, 1, 7).setValues([[
        transaction.id,
        transaction.date,
        transaction.category,
        transaction.amount,
        transaction.description,
        transaction.memo || '',
        transaction.person || ''
      ]]);
      return { updated: true };
    }
  }
  throw new Error('Transaction not found: ' + transaction.id);
}

function deleteTransaction(payload) {
  const { id } = payload;
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error('Transaction not found: ' + id);
}

// ─── monthly_notes ─────────────────────────────────────────

function upsertMonthlyNote(payload) {
  const { yearMonth, comment } = payload;
  const sheet = getSheet('monthly_notes');
  const rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === yearMonth) {
      sheet.getRange(i + 1, 2).setValue(comment);
      return { upserted: true };
    }
  }
  sheet.appendRow([yearMonth, comment]);
  return { upserted: true };
}

function getMonthlyNote(payload) {
  const { yearMonth } = payload;
  const sheet = getSheet('monthly_notes');
  const rows = sheet.getDataRange().getValues();
  const found = rows.slice(1).find(function(row) { return row[0] === yearMonth; });
  return { comment: found ? found[1] : '' };
}

// ─── utilities ─────────────────────────────────────────────

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function rowToTransaction(row) {
  return {
    id: String(row[0]),
    date: formatDate(row[1]),
    category: String(row[2]),
    amount: Number(row[3]),
    description: String(row[4]),
    memo: row[5] ? String(row[5]) : '',
    person: row[6] ? String(row[6]) : undefined
  };
}

// Sheets stores date strings as Date objects. Always return 'YYYY-MM-DD' string.
function formatDate(val) {
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val);
}

function pad(n) {
  return String(n).padStart(2, '0');
}
