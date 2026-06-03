import { useMemo } from 'react';
import type { MonthOption } from '../types';

export function useMonthOptions(): MonthOption[] {
  return useMemo(() => {
    const options: MonthOption[] = [];
    const now = new Date();
    for (let i = 0; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月`;
      options.push({ yearMonth, label });
    }
    return options;
  }, []);
}
