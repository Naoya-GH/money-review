import { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { api } from '../api/client';
import { useToast } from './useToast';
import type { Transaction } from '../types';

export function useTransactions(yearMonth: string) {
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const hasData = state.transactions.some(t => t.date.startsWith(yearMonth));
    if (hasData || state.transactionsLoading === 'loading') return;

    dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'loading' });
    api
      .getTransactions2Months(yearMonth)
      .then(res => {
        if (cancelledRef.current) return;
        dispatch({ type: 'SET_TRANSACTIONS', payload: res.transactions });
        dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'success' });
      })
      .catch((err: unknown) => {
        if (cancelledRef.current) return;
        dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'error' });
        const msg = err instanceof Error ? err.message : '通信エラーが発生しました';
        if (!msg.includes('VITE_GAS_URL')) {
          showToast('error', msg);
        }
      });

    return () => { cancelledRef.current = true; };
  }, [yearMonth]);

  const filtered = state.transactions.filter(t => t.date.startsWith(yearMonth));
  return { transactions: filtered, loading: state.transactionsLoading };
}

export function useAppendTransactions() {
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();

  const append = async (transactions: Omit<Transaction, 'id'>[]) => {
    try {
      const res = await api.appendTransactions(transactions);
      // Re-fetch so the list reflects GAS-assigned IDs immediately
      dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'loading' });
      const fresh = await api.getTransactions2Months(state.selectedMonth);
      dispatch({ type: 'SET_TRANSACTIONS', payload: fresh.transactions });
      dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'success' });
      showToast('success', `${res.count}件登録しました`);
      return true;
    } catch (err) {
      dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: 'error' });
      const msg = err instanceof Error ? err.message : '通信エラーが発生しました';
      showToast('error', msg);
      return false;
    }
  };

  return { append };
}

export function useUpdateTransaction() {
  const { dispatch } = useAppContext();
  const { showToast } = useToast();

  const update = async (transaction: Transaction) => {
    try {
      await api.updateTransaction(transaction);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
      showToast('success', '更新しました');
      return true;
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '通信エラーが発生しました');
      return false;
    }
  };

  return { update };
}

export function useDeleteTransaction() {
  const { dispatch } = useAppContext();
  const { showToast } = useToast();

  const remove = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      showToast('success', '削除しました');
      return true;
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '通信エラーが発生しました');
      return false;
    }
  };

  return { remove };
}
