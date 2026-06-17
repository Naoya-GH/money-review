export type Transaction = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  memo: string;
  person?: string;
};

export type MonthlyNote = {
  yearMonth: string;
  comment: string;
};

export type Category = {
  name: string;
  order: number;
};

export type ParsedLine = {
  lineNumber: number;
  raw: string;
} & (
  | { ok: true; data: Omit<Transaction, 'id'> }
  | { ok: false; error: string }
);

export type ApiResponse<T> =
  | { success: true; data: T }
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
  diff: number;
  diffRate: number | null;
};

export type CategorySummary = {
  category: string;
  total: number;
  ratio: number;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export type ActiveTab = 'dashboard' | 'register' | 'list' | 'categories';

export type MonthOption = {
  yearMonth: string;
  label: string;
};
