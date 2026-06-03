import { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { DashboardData, CategorySummary, Transaction } from '../types';

function buildCategorySummary(txs: Transaction[], total: number): CategorySummary[] {
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

export function useDashboard(yearMonth: string): DashboardData | null {
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

    const diff = thisTotal - lastTotal;
    const diffRate = lastTotal === 0 ? null : (diff / lastTotal) * 100;

    return {
      thisMonth: { yearMonth, total: thisTotal, byCategory: buildCategorySummary(thisMonthTx, thisTotal) },
      lastMonth: { yearMonth: prevYM, total: lastTotal },
      diff,
      diffRate,
    };
  }, [transactions, yearMonth]);
}
