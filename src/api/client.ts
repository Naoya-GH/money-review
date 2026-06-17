import type {
  ApiResponse,
  GetTransactionsResponse,
  AppendTransactionsResponse,
  UpsertMonthlyNoteResponse,
  Transaction,
  Category,
} from '../types';

const GAS_URL = import.meta.env.VITE_GAS_URL as string;

async function callGas<T>(action: string, payload: unknown): Promise<T> {
  if (!GAS_URL) throw new Error('GAS URLが設定されていません（.env の VITE_GAS_URL を設定してください）');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      // text/plain avoids CORS preflight (GAS doesn't handle OPTIONS)
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
    const json: ApiResponse<T> = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('タイムアウトしました。再試行してください');
    }
    throw err;
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

  getSettings: () =>
    callGas<{ categories?: Category[]; persons?: string[]; places?: string[] }>('getSettings', {}),

  saveSetting: (key: string, value: unknown) =>
    callGas<{ saved: boolean }>('saveSetting', { key, value }),
};
