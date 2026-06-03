import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { api } from '../api/client';
import { useToast } from './useToast';

export function useMonthlyNote(yearMonth: string) {
  const { state, dispatch } = useAppContext();
  const { showToast } = useToast();

  useEffect(() => {
    dispatch({ type: 'SET_NOTE_LOADING', payload: 'loading' });
    api
      .getMonthlyNote(yearMonth)
      .then(res => {
        dispatch({ type: 'SET_MONTHLY_NOTE', payload: res.comment });
        dispatch({ type: 'SET_NOTE_LOADING', payload: 'success' });
      })
      .catch((err: Error) => {
        dispatch({ type: 'SET_NOTE_LOADING', payload: err.message.includes('VITE_GAS_URL') ? 'idle' : 'error' });
      });
  }, [yearMonth]);

  const save = async (comment: string) => {
    try {
      await api.upsertMonthlyNote(yearMonth, comment);
      dispatch({ type: 'SET_MONTHLY_NOTE', payload: comment });
      showToast('success', 'メモを保存しました');
      return true;
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '通信エラーが発生しました');
      return false;
    }
  };

  return { note: state.monthlyNote, loading: state.noteLoading, save };
}
