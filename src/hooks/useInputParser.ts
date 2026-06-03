import { useCallback } from 'react';
import type { Category, ParsedLine } from '../types';

export function useInputParser(categories: Category[]) {
  const parse = useCallback((text: string, date: string): ParsedLine[] => {
    const categoryNames = new Set(categories.map(c => c.name));

    return text
      .split('\n')
      .map((raw, i): ParsedLine | null => {
        const line = raw.trim();
        if (!line) return null;

        const tokens = line.split(/[\s　]+/).filter(Boolean);
        const lineNumber = i + 1;

        if (tokens.length < 3) {
          return { lineNumber, raw, ok: false, error: '形式が正しくありません（カテゴリ 金額 内容）' };
        }

        const [cat, amtStr, desc, ...memoTokens] = tokens;

        if (!categoryNames.has(cat)) {
          return { lineNumber, raw, ok: false, error: `カテゴリ「${cat}」は存在しません` };
        }

        const amount = Number(amtStr.replace(/[¥,]/g, ''));
        if (isNaN(amount) || amount <= 0) {
          return { lineNumber, raw, ok: false, error: '金額が無効です' };
        }

        if (!desc) {
          return { lineNumber, raw, ok: false, error: '内容を入力してください' };
        }

        return {
          lineNumber, raw, ok: true,
          data: { date, category: cat, amount, description: desc, memo: memoTokens.join(' ') },
        };
      })
      .filter((x): x is ParsedLine => x !== null);
  }, [categories]);

  return { parse };
}
