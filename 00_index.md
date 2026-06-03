# Money Review — 設計ドキュメント インデックス

## ドキュメント一覧

| # | ファイル | 内容 |
|---|---------|------|
| 01 | `01_functional_design.md` | 機能設計（データモデル・API仕様・機能フロー） |
| 02 | `02_gas_design.md` | GAS設計（スプレッドシート構成・サーバーコード） |
| 03 | `03_type_state_design.md` | 型定義・状態管理設計（TypeScript型・React Context・カスタムフック） |
| 04 | `04_ui_design.md` | UI設計（レイアウト・画面仕様・コンポーネント構成） |

---

## 実装順序（推奨）

```
Phase 1: 基盤
  ├── GAS: スプレッドシート作成 + コードデプロイ
  └── フロント: Viteプロジェクト作成 + 型定義 + APIクライアント

Phase 2: コア機能
  ├── 支出登録（入力パーサー + GAS連携）
  └── 支出一覧（取得・表示）

Phase 3: 可視化
  └── ダッシュボード（集計ロジック + グラフ）

Phase 4: 補完機能
  ├── 月次メモ
  └── カテゴリ管理

Phase 5: 仕上げ
  ├── レスポンシブ調整
  ├── エラーハンドリング
  └── トースト・ローディング
```

---

## 技術スタック確認

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite |
| スタイリング | Tailwind CSS |
| グラフ | Recharts |
| バックエンド | Google Apps Script |
| データ | Google Spreadsheet |
| 状態管理 | React Context + useReducer |
| パッケージマネージャ | npm |

