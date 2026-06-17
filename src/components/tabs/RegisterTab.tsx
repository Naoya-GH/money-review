import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useAppendTransactions } from '../../hooks/useTransactions';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Transaction } from '../../types';

type PendingItem = Omit<Transaction, 'id'>;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function RegisterTab() {
  const { state, dispatch } = useAppContext();
  const { append } = useAppendTransactions();

  const [date, setDate] = useState(todayStr);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formCategory, setFormCategory] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMemo, setFormMemo] = useState('');
  const [showForm, setShowForm] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const hasPersons = state.persons.length > 0;

  useEffect(() => {
    if (showForm) amountRef.current?.focus();
  }, [showForm]);

  const selectCategory = (name: string) => {
    setFormCategory(name);
    setFormAmount('');
    setFormDescription('');
    setFormMemo('');
    setShowForm(true);
  };

  const addItem = () => {
    const amount = parseInt(formAmount, 10);
    if (!formCategory || !amount || amount <= 0 || !formDescription.trim()) return;
    if (hasPersons && !formPerson) return;
    setPendingItems(prev => [...prev, {
      date,
      category: formCategory,
      amount,
      description: formDescription.trim(),
      memo: formMemo.trim(),
      ...(hasPersons ? { person: formPerson } : {}),
    }]);
    setShowForm(false);
    setFormCategory('');
  };

  const removeItem = (index: number) => {
    setPendingItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (pendingItems.length === 0 || submitting) return;
    setSubmitting(true);
    const ok = await append(pendingItems);
    if (ok) {
      const newPlaces = pendingItems
        .map(i => i.description)
        .filter(d => d && !state.places.includes(d));
      if (newPlaces.length > 0) {
        dispatch({ type: 'SET_PLACES', payload: [...state.places, ...newPlaces] });
      }
      setPendingItems([]);
    }
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addItem();
  };

  const canAdd =
    formCategory &&
    parseInt(formAmount, 10) > 0 &&
    formDescription.trim().length > 0 &&
    (!hasPersons || formPerson);
  const canSubmit = pendingItems.length > 0 && !submitting;

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
        <p className="text-xs text-gray-500 mb-2">カテゴリを選択</p>
        <div className="flex flex-wrap gap-2">
          {state.categories.map(c => (
            <button
              key={c.name}
              onClick={() => selectCategory(c.name)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                formCategory === c.name && showForm
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-indigo-50 rounded-xl p-4 shadow-sm border border-indigo-100 space-y-3">
          <p className="text-sm font-semibold text-indigo-800">{formCategory}</p>

          {hasPersons && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">メンバー</label>
              <div className="flex gap-2 flex-wrap">
                {state.persons.map(p => (
                  <button
                    key={p}
                    onClick={() => setFormPerson(p)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formPerson === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="numeric"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">内容</label>
            {state.places.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {state.places.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormDescription(p)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                      formDescription === p
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例：スーパー、ランチ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">メモ（任意）</label>
            <input
              type="text"
              value={formMemo}
              onChange={e => setFormMemo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="例：友人と、特売"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 bg-white"
            >
              キャンセル
            </button>
            <button
              onClick={addItem}
              disabled={!canAdd}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {pendingItems.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">登録予定（{pendingItems.length}件）</p>
          <div className="divide-y divide-gray-100">
            {pendingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-2.5">
                {item.person && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs shrink-0 border border-amber-100">
                    {item.person}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs shrink-0">
                  {item.category}
                </span>
                <span className="text-sm font-medium text-gray-900 shrink-0">
                  ¥{item.amount.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600 flex-1 truncate">{item.description}</span>
                {item.memo && (
                  <span className="text-xs text-gray-400 truncate max-w-[80px]">{item.memo}</span>
                )}
                <button
                  onClick={() => removeItem(i)}
                  className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
          <span>一括登録{pendingItems.length > 0 && `（${pendingItems.length}件）`}</span>
        )}
      </button>
    </div>
  );
}
