import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useInputParser } from '../../hooks/useInputParser';
import { useAppendTransactions } from '../../hooks/useTransactions';
import { LoadingSpinner } from '../ui/LoadingSpinner';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function RegisterTab() {
  const { state } = useAppContext();
  const { parse } = useInputParser(state.categories);
  const { append } = useAppendTransactions();

  const [date, setDate] = useState(todayStr);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [parsed, setParsed] = useState<ReturnType<typeof parse>>([]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParsed(parse(text, date));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, date, parse]);

  const errors = parsed.filter(p => !p.ok);
  const valids = parsed.filter(p => p.ok);
  const canSubmit = valids.length > 0 && errors.length === 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const items = valids
      .filter((p): p is Extract<typeof p, { ok: true }> => p.ok)
      .map(p => p.data);
    const ok = await append(items);
    if (ok) setText('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-xs text-gray-500 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <label className="block text-xs text-gray-500 mb-1">支出を入力（1行 = 1件）</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {state.categories.map(c => (
            <button
              key={c.name}
              onClick={() => setText(prev => prev + (prev.endsWith('\n') || !prev ? '' : '\n') + c.name + ' ')}
              className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs border border-indigo-100"
            >
              {c.name}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'食費 5000 スーパー\n外食 1200 ランチ 友人と'}
          rows={6}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{ minHeight: '160px' }}
        />
        <p className="text-xs text-gray-400 mt-1">形式: カテゴリ 金額 内容 [メモ]</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 rounded-xl p-4 shadow-sm space-y-1">
          {errors.map(e => (
            <p key={e.lineNumber} className="text-xs text-red-600">
              ⚠ 行{e.lineNumber}: {'error' in e ? e.error : ''}
            </p>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <LoadingSpinner />
            <span>登録中...</span>
          </>
        ) : (
          <span>一括登録{valids.length > 0 && `（${valids.length}件）`}</span>
        )}
      </button>
    </div>
  );
}
