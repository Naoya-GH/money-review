# Money Review — 型定義・状態管理設計書

## 1. TypeScript 型定義

### src/types/index.ts

```typescript
// ========== ドメイン型 ==========

export type Transaction = {
  id: string;
  date: string;        // "YYYY-MM-DD"
  category: string;
  amount: number;      // 正の整数
  description: string;
  memo: string;
};

export type MonthlyNote = {
  yearMonth: string;   // "YYYY-MM"
  comment: string;
};

export type Category = {
  name: string;
  order: number;
};

// ========== 入力パース型 ==========

export type ParsedLine = {
  lineNumber: number;
  raw: string;
} & (
  | { ok: true;  data: Omit<Transaction, 'id'> }
  | { ok: false; error: string }
);

// ========== API型 ==========

export type ApiResponse<T> =
  | { success: true;  data: T }
  | { success: false; data: null; error: string };

export type GetTransactionsResponse = {
  transactions: Transaction[];
};

export type AppendTransactionsResponse = {
  count: number;
};

export type UpsertMonthlyNoteResponse = {
  upserted: boolean;
};

// ========== ダッシュボード集計型 ==========

export type DashboardData = {
  thisMonth: {
    yearMonth: string;
    total: number;
    byCategory: CategorySummary[];
  };
  lastMonth: {
    yearMonth: string;
    total: number;
  };
  diff: number;        // thisMonth.total - lastMonth.total
  diffRate: number;    // diff / lastMonth.total * 100（先月0の場合はnull）
};

export type CategorySummary = {
  category: string;
  total: number;
  ratio: number;       // 0〜1
};

// ========== UI状態型 ==========

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export type ActiveTab = 'dashboard' | 'register' | 'list' | 'categories';

export type MonthOption = {
  yearMonth: string;   // "YYYY-MM"
  label: string;       // "2026年06月"
};
```

---

## 2. 状態管理設計

### アーキテクチャ方針

- グローバル状態: React Context + useReducer
- サーバー状態: カスタムフック（SWR/React Queryは使わずシンプルに）
- ローカルUI状態: 各コンポーネントの useState

---

### 2-1. AppContext（グローバル状態）

```typescript
// src/contexts/AppContext.tsx

type AppState = {
  // 選択中の月
  selectedMonth: string;         // "YYYY-MM"

  // トランザクション（2ヶ月分キャッシュ）
  transactions: Transaction[];
  transactionsLoading: LoadingState;

  // 月次メモ
  monthlyNote: string;
  noteLoading: LoadingState;

  // カテゴリ（localStorage永続）
  categories: Category[];

  // トースト通知
  toasts: Toast[];

  // アクティブタブ
  activeTab: ActiveTab;
};

type AppAction =
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_TRANSACTIONS_LOADING'; payload: LoadingState }
  | { type: 'ADD_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_MONTHLY_NOTE'; payload: string }
  | { type: 'SET_NOTE_LOADING'; payload: LoadingState }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_TAB'; payload: ActiveTab };
```

---

### 2-2. カスタムフック一覧

| フック名 | 責務 |
|---------|------|
| `useTransactions(yearMonth)` | 指定月のトランザクション取得・キャッシュ |
| `useAppendTransactions()` | 複数レコード登録 |
| `useUpdateTransaction()` | 1件更新 |
| `useDeleteTransaction()` | 1件削除 |
| `useDashboard(yearMonth)` | ダッシュボード集計データ生成 |
| `useMonthlyNote(yearMonth)` | 月次メモ取得・保存 |
| `useCategories()` | カテゴリのCRUD (localStorage) |
| `useToast()` | トースト表示・非表示 |
| `useMonthOptions()` | 過去12ヶ月 + 今月のセレクト選択肢生成 |
| `useInputParser()` | 複数行テキストのパース |

---

### 2-3. useTransactions の設計

```typescript
function useTransactions(yearMonth: string) {
  const { state, dispatch } = useAppContext();

  // 選択月が変わったときだけAPIコール
  useEffect(() => {
    const needsLoad =
      state.transactionsLoading === 'idle' ||
      !state.transactions.some(t => t.date.startsWith(yearMonth));

    if (!needsLoad) return;

    dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'loading' });
    api.getTransactions2Months(yearMonth)
      .then(res => {
        dispatch({ type: 'SET_TRANSACTIONS', payload: res.transactions });
        dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'success' });
      })
      .catch(err => {
        dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'error' });
        // toastを表示
      });
  }, [yearMonth]);

  // フィルタして返す
  const filtered = state.transactions.filter(t => t.date.startsWith(yearMonth));
  return { transactions: filtered, loading: state.transactionsLoading };
}
```

---

### 2-4. useDashboard の設計

```typescript
function useDashboard(yearMonth: string): DashboardData | null {
  const { state } = useAppContext();
  const { transactions } = state;

  return useMemo(() => {
    const [y, m] = yearMonth.split('-').map(Number);
    const prevYM = m === 1
      ? `${y - 1}-12`
      : `${y}-${String(m - 1).padStart(2, '0')}`;

    const thisMonthTx = transactions.filter(t => t.date.startsWith(yearMonth));
    const lastMonthTx = transactions.filter(t => t.date.startsWith(prevYM));

    const thisTotal = thisMonthTx.reduce((s, t) => s + t.amount, 0);
    const lastTotal = lastMonthTx.reduce((s, t) => s + t.amount, 0);

    const byCat = buildCategorySummary(thisMonthTx, thisTotal);
    const diff = thisTotal - lastTotal;
    const diffRate = lastTotal === 0 ? null : (diff / lastTotal) * 100;

    return {
      thisMonth: { yearMonth, total: thisTotal, byCategory: byCat },
      lastMonth: { yearMonth: prevYM, total: lastTotal },
      diff,
      diffRate,
    };
  }, [transactions, yearMonth]);
}

function buildCategorySummary(
  txs: Transaction[],
  total: number
): CategorySummary[] {
  const map = new Map<string, number>();
  txs.forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.amount));
  return Array.from(map.entries())
    .map(([category, catTotal]) => ({
      category,
      total: catTotal,
      ratio: total > 0 ? catTotal / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
```

---

### 2-5. useInputParser の設計

```typescript
function useInputParser(categories: Category[]) {
  const parse = useCallback((text: string, date: string): ParsedLine[] => {
    const categoryNames = new Set(categories.map(c => c.name));

    return text
      .split('\n')
      .map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;

        const tokens = line.split(/[\s　]+/).filter(Boolean);
        const lineNumber = i + 1;

        if (tokens.length < 3) {
          return { lineNumber, raw, ok: false, error: '形式が正しくありません（カテゴリ 金額 内容）' };
        }

        const [cat, amtStr, desc, ...memoTokens] = tokens;

        if (!categoryNames.has(cat)) {
          return { lineNumber, raw, ok: false, error: `カテゴリ「${cat}」は存在しません` };
        }

        const amount = Number(amtStr.replace(/[¥,]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return { lineNumber, raw, ok: false, error: '金額が無効です' };
        }

        return {
          lineNumber, raw, ok: true,
          data: { date, category: cat, amount, description: desc, memo: memoTokens.join(' ') }
        };
      })
      .filter(Boolean) as ParsedLine[];
  }, [categories]);

  return { parse };
}
```

---

## 3. APIクライアント設計

### src/api/client.ts

```typescript
const GAS_URL = import.meta.env.VITE_GAS_URL;

async function callGas<T>(action: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
    const json: ApiResponse<T> = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  getTransactions2Months: (yearMonth: string) =>
    callGas<GetTransactionsResponse>('getTransactions2Months', { yearMonth }),

  appendTransactions: (transactions: Omit<Transaction, 'id'>[]) =>
    callGas<AppendTransactionsResponse>('appendTransactions', { transactions }),

  updateTransaction: (transaction: Transaction) =>
    callGas<{ updated: boolean }>('updateTransaction', { transaction }),

  deleteTransaction: (id: string) =>
    callGas<{ deleted: boolean }>('deleteTransaction', { id }),

  upsertMonthlyNote: (yearMonth: string, comment: string) =>
    callGas<UpsertMonthlyNoteResponse>('upsertMonthlyNote', { yearMonth, comment }),

  getMonthlyNote: (yearMonth: string) =>
    callGas<{ comment: string }>('getMonthlyNote', { yearMonth }),
};
```

---

## 4. localStorage 設計

### キー一覧

| キー | 型 | 説明 |
|-----|-----|------|
| `mr_categories` | `Category[]` JSON | カテゴリ一覧 |
| `mr_last_selected_month` | string | 最後に選択した月 |

### 初期化ロジック

```typescript
// アプリ起動時
const stored = localStorage.getItem('mr_categories');
const categories: Category[] = stored
  ? JSON.parse(stored)
  : DEFAULT_CATEGORIES;
```

