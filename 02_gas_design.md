# Money Review — GAS（Google Apps Script）設計書

## 1. スプレッドシート構成

### シート一覧

| シート名 | 用途 |
|---------|------|
| transactions | 支出レコード |
| monthly_notes | 月次メモ |

---

### transactions シート

| 列 | カラム名 | 型 | 説明 |
|----|---------|-----|------|
| A | id | string | `YYYYMMDD_HHMMSS_N` |
| B | date | string | `YYYY-MM-DD` |
| C | category | string | カテゴリ名 |
| D | amount | number | 金額（円） |
| E | description | string | 店名・用途 |
| F | memo | string | メモ（空可） |

- 1行目: ヘッダー行（`id, date, category, amount, description, memo`）
- 2行目以降: データ

### monthly_notes シート

| 列 | カラム名 | 型 | 説明 |
|----|---------|-----|------|
| A | yearMonth | string | `YYYY-MM` |
| B | comment | string | コメント |

- 1行目: ヘッダー行（`yearMonth, comment`）

---

## 2. GAS コード設計

### 2-1. エントリーポイント

```javascript
// GASはPOSTリクエストのみ受け付ける
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, payload } = body;

    const handlers = {
      getTransactions:      () => getTransactions(payload),
      getTransactions2Months: () => getTransactions2Months(payload),
      appendTransactions:   () => appendTransactions(payload),
      updateTransaction:    () => updateTransaction(payload),
      deleteTransaction:    () => deleteTransaction(payload),
      upsertMonthlyNote:    () => upsertMonthlyNote(payload),
      getMonthlyNote:       () => getMonthlyNote(payload),
    };

    if (!handlers[action]) {
      return respond(false, null, `Unknown action: ${action}`);
    }

    const result = handlers[action]();
    return respond(true, result);

  } catch (err) {
    return respond(false, null, err.message);
  }
}

// CORSヘッダー付きレスポンス
function respond(success, data, error) {
  const output = ContentService
    .createTextOutput(JSON.stringify({ success, data, error: error || null }))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
```

> **CORS対応**: GAS Web AppはデフォルトでCORSに対応していないため、フロントエンドからは `no-cors` モードを使うか、GAS側でOptionsリクエストを処理する。MVP では `mode: 'no-cors'` を回避するためにJSONP風の対処か、Apps Script の `doOptions` で対応する。

---

### 2-2. getTransactions

```javascript
function getTransactions({ yearMonth }) {
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  const transactions = rows.slice(1) // ヘッダーをスキップ
    .filter(row => row[1] && row[1].startsWith(yearMonth))
    .map(rowToTransaction);

  return { transactions };
}
```

---

### 2-3. getTransactions2Months

```javascript
function getTransactions2Months({ yearMonth }) {
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  const [y, m] = yearMonth.split('-').map(Number);
  const prevDate = m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, '0')}`;

  const transactions = rows.slice(1)
    .filter(row => row[1] && (row[1].startsWith(yearMonth) || row[1].startsWith(prevDate)))
    .map(rowToTransaction);

  return { transactions };
}
```

---

### 2-4. appendTransactions

```javascript
function appendTransactions({ transactions }) {
  const sheet = getSheet('transactions');
  const timestamp = new Date();

  const rows = transactions.map((t, i) => {
    const id = `${timestamp.getFullYear()}${pad(timestamp.getMonth()+1)}${pad(timestamp.getDate())}_${pad(timestamp.getHours())}${pad(timestamp.getMinutes())}${pad(timestamp.getSeconds())}_${i}`;
    return [id, t.date, t.category, t.amount, t.description, t.memo || ''];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 6).setValues(rows);
  return { count: rows.length };
}
```

---

### 2-5. updateTransaction

```javascript
function updateTransaction({ transaction }) {
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === transaction.id) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[
        transaction.id,
        transaction.date,
        transaction.category,
        transaction.amount,
        transaction.description,
        transaction.memo || ''
      ]]);
      return { updated: true };
    }
  }
  throw new Error(`Transaction not found: ${transaction.id}`);
}
```

---

### 2-6. deleteTransaction

```javascript
function deleteTransaction({ id }) {
  const sheet = getSheet('transactions');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error(`Transaction not found: ${id}`);
}
```

---

### 2-7. upsertMonthlyNote / getMonthlyNote

```javascript
function upsertMonthlyNote({ yearMonth, comment }) {
  const sheet = getSheet('monthly_notes');
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === yearMonth) {
      sheet.getRange(i + 1, 2).setValue(comment);
      return { upserted: true };
    }
  }
  sheet.appendRow([yearMonth, comment]);
  return { upserted: true };
}

function getMonthlyNote({ yearMonth }) {
  const sheet = getSheet('monthly_notes');
  const rows = sheet.getDataRange().getValues();
  const found = rows.slice(1).find(row => row[0] === yearMonth);
  return { comment: found ? found[1] : '' };
}
```

---

### 2-8. ユーティリティ

```javascript
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet not found: ${name}`);
  return sheet;
}

function rowToTransaction(row) {
  return {
    id: row[0],
    date: row[1],
    category: row[2],
    amount: Number(row[3]),
    description: row[4],
    memo: row[5] || ''
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}
```

---

## 3. GAS デプロイ手順

1. Google スプレッドシートを新規作成
2. `transactions`, `monthly_notes` シートを作成しヘッダー行を入力
3. 拡張機能 → Apps Script でコードを貼り付け
4. デプロイ → 新しいデプロイ → ウェブアプリ
   - 実行ユーザー: 自分
   - アクセス権限: 全員（匿名を含む）※個人利用のため
5. デプロイ後のURLを `.env` の `VITE_GAS_URL` に設定

---

## 4. CORS 対応方針

GAS Web App の制約により `Content-Type: application/json` の POST は preflight が発生する。

### 対応策: `doOptions` で200を返す

```javascript
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

フロントエンド側では fetch の `mode` を通常通り使用する。

---

## 5. パフォーマンス考慮

| 懸念 | 対応 |
|------|------|
| GASコールドスタート（数秒） | ローディングスピナーを表示 |
| 大量データ時の全件読み込み | MVP では月別フィルタで対処（全件取得後にフィルタ） |
| 同時書き込みの競合 | 個人利用のため許容 |

