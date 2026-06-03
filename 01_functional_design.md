# Money Review — 機能設計書

## 1. システム全体構成

```
[iPhone / Mac ブラウザ]
       │
       │ HTTPS
       ▼
[React フロントエンド (Vite + TypeScript)]
       │
       │ fetch (POST/GET)
       ▼
[Google Apps Script (Web App)]
       │
       │ SpreadsheetApp
       ▼
[Google Spreadsheet]
  ├── transactions シート
  └── monthly_notes シート
```

---

## 2. データモデル

### 2-1. Transaction（支出レコード）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | ○ | `YYYYMMDD_HHMMSS_N`（GAS側で採番） |
| date | string | ○ | `YYYY-MM-DD` |
| category | string | ○ | カテゴリ名 |
| amount | number | ○ | 正の整数（円） |
| description | string | ○ | 店名・用途 |
| memo | string | × | 任意メモ |

### 2-2. MonthlyNote（月次メモ）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| yearMonth | string | ○ | `YYYY-MM` |
| comment | string | ○ | 振り返りコメント |

### 2-3. Category（カテゴリ）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| name | string | カテゴリ名（ユニーク） |
| order | number | 表示順 |

初期値: `食費, 外食, 趣味, 日用品, 交通費`

> **注**: カテゴリはフロントエンドの localStorage に保存。スプレッドシートには categories シートを将来的に追加可能。

---

## 3. 機能仕様

### 3-1. 支出登録

#### 入力フォーマット（1行 = 1レコード）

```
<カテゴリ> <金額> <内容> [メモ]
```

例:
```
食費 5000 オーケーストア
外食 1200 ラーメン 辛口
趣味 3000 書籍
```

#### パース仕様

1. 行を空白（半角・全角スペース、タブ）で分割
2. トークン[0]: カテゴリ名（カテゴリ一覧と照合）
3. トークン[1]: 金額（数値変換。`¥` や `,` は除去）
4. トークン[2]: 内容（必須）
5. トークン[3]: メモ（省略可）
6. 不正行: 行番号と理由をエラー表示

#### バリデーション

| チェック | エラーメッセージ |
|---------|----------------|
| カテゴリが未定義 | `行N: カテゴリ「XX」は存在しません` |
| 金額が0以下または非数値 | `行N: 金額が無効です` |
| 内容が空 | `行N: 内容を入力してください` |
| トークン数が3未満 | `行N: 形式が正しくありません` |

#### 登録フロー

```
入力テキスト
  → パース（全行）
  → バリデーション
  → エラーあり → エラー行を赤表示・登録中断
  → エラーなし → GAS API (appendTransactions) 呼び出し
                → 成功: 「N件登録しました」トースト表示
                → 失敗: エラートースト表示
```

---

### 3-2. 支出一覧

#### 表示仕様

- デフォルト: 今月の支出、日付降順
- 月別フィルタ: セレクトで月を選択（過去12ヶ月 + 今月）
- ページネーション: 1ページ50件（MVP ではスクロール表示でも可）

#### 編集

- 行タップでインライン編集フォームを展開
- 編集項目: 日付・カテゴリ・金額・内容・メモ
- 「保存」→ GAS API (updateTransaction) → 一覧更新

#### 削除

- 削除ボタン → 確認ダイアログ → GAS API (deleteTransaction) → 一覧更新

---

### 3-3. ダッシュボード

#### 今月総支出

```
SUM(transactions WHERE date LIKE 'YYYY-MM-%')
```

#### 先月比較

```
今月合計 / 先月合計 を計算
差額 = 今月 - 先月
増減率 = (差額 / 先月) × 100
```

#### カテゴリ別支出

```
GROUP BY category → SUM(amount) → 円グラフ + ランキング
「その他」= 定義外カテゴリの合計（MVP では発生しないが念のため）
```

#### データ取得戦略

- ダッシュボード表示時に「今月 + 先月」のトランザクションを1回のAPI呼び出しで取得
- フロントエンドで集計処理

---

### 3-4. 月次メモ

- 1ヶ月につき1件（UPSERT）
- 保存: GAS API (upsertMonthlyNote)
- 表示: 当月選択時のダッシュボードに表示

---

### 3-5. カテゴリ管理

- 保存先: フロントエンドの localStorage（`mr_categories`）
- 追加: 最大20件
- 削除: 既存トランザクションのカテゴリ名は変更しない（孤立カテゴリとして表示）
- 編集: カテゴリ名の更新（既存トランザクションには反映しない）

---

## 4. API 設計（フロント → GAS）

GASをウェブアプリとしてデプロイし、`doPost` / `doGet` で処理。

### Base URL

```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

### リクエスト形式

```json
POST /exec
Content-Type: application/json

{
  "action": "アクション名",
  "payload": { ... }
}
```

### レスポンス形式

```json
{
  "success": true,
  "data": { ... }
}
// エラー時
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### アクション一覧

| action | 説明 | payload |
|--------|------|---------|
| `getTransactions` | 指定月のトランザクション取得 | `{ yearMonth: "YYYY-MM" }` |
| `getTransactions2Months` | 今月+先月を一括取得 | `{ yearMonth: "YYYY-MM" }` |
| `appendTransactions` | 複数レコード一括追加 | `{ transactions: Transaction[] }` |
| `updateTransaction` | 1件更新 | `{ transaction: Transaction }` |
| `deleteTransaction` | 1件削除 | `{ id: string }` |
| `upsertMonthlyNote` | 月次メモ保存 | `{ yearMonth: "YYYY-MM", comment: string }` |
| `getMonthlyNote` | 月次メモ取得 | `{ yearMonth: "YYYY-MM" }` |

---

## 5. エラーハンドリング方針

| 状況 | 対応 |
|------|------|
| ネットワークエラー | 「通信エラーが発生しました」トースト |
| GASエラー（`success: false`） | エラーメッセージをトーストで表示 |
| バリデーションエラー | インライン表示（フォーム直下） |
| タイムアウト（10秒） | 「タイムアウトしました。再試行してください」 |

---

## 6. ローカルキャッシュ戦略（MVP）

| データ | キャッシュ先 | 有効期限 |
|--------|------------|---------|
| カテゴリ一覧 | localStorage | 永続 |
| 直近2ヶ月のトランザクション | メモリ（React state） | セッション中 |
| 月次メモ | メモリ（React state） | セッション中 |

> GASの応答は2〜5秒かかる場合があるため、ローディング表示は必須。

