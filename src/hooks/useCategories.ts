import { useAppContext } from '../contexts/AppContext';
import { api } from '../api/client';
import type { Category } from '../types';

export function useCategories() {
  const { state, dispatch } = useAppContext();

  const sync = (updated: Category[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: updated });
    api.saveSetting('categories', updated).catch(() => {});
  };

  const add = (name: string) => {
    if (state.categories.length >= 20) return;
    sync([...state.categories, { name, order: state.categories.length }]);
  };

  const remove = (name: string) => {
    sync(
      state.categories
        .filter(c => c.name !== name)
        .map((c, i) => ({ ...c, order: i }))
    );
  };

  const rename = (oldName: string, newName: string) => {
    sync(state.categories.map(c => c.name === oldName ? { ...c, name: newName } : c));
  };

  const reorder = (categories: Category[]) => {
    sync(categories);
  };

  return { categories: state.categories, add, remove, rename, reorder };
}
