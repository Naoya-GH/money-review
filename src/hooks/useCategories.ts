import { useAppContext } from '../contexts/AppContext';
import type { Category } from '../types';

export function useCategories() {
  const { state, dispatch } = useAppContext();

  const add = (name: string) => {
    if (state.categories.length >= 20) return;
    const order = state.categories.length;
    dispatch({ type: 'SET_CATEGORIES', payload: [...state.categories, { name, order }] });
  };

  const remove = (name: string) => {
    const updated = state.categories
      .filter(c => c.name !== name)
      .map((c, i) => ({ ...c, order: i }));
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
  };

  const rename = (oldName: string, newName: string) => {
    const updated = state.categories.map(c =>
      c.name === oldName ? { ...c, name: newName } : c
    );
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
  };

  const reorder = (categories: Category[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  return { categories: state.categories, add, remove, rename, reorder };
}
