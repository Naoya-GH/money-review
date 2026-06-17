import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { api } from '../api/client';

export function useSettings() {
  const { dispatch } = useAppContext();

  useEffect(() => {
    api.getSettings()
      .then(settings => {
        if (Object.keys(settings).length > 0) {
          dispatch({ type: 'LOAD_SETTINGS', payload: settings });
        }
      })
      .catch(() => {});
  }, []);
}
