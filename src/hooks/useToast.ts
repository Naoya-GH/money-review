import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Toast } from '../types';

export function useToast() {
  const { dispatch } = useAppContext();

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, type, message } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 3000);
  }, [dispatch]);

  return { showToast };
}
