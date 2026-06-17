import { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useTransactions, useUpdateTransaction, useDeleteTransaction } from '../../hooks/useTransactions';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Transaction } from '../../types';

const BADGE_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
];

function categoryColor(categories: { name: string }[], name: string) {
  const idx = categories.findIndex(c => c.name === name);
  return idx >= 0 && idx < BADGE_COLORS.length ? BADGE_COLORS[idx] : 'bg-gray-100 text-gray-600';
}

function EditForm({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  const { state } = useAppContext();
  const { update } = useUpdateTransaction();
  const [form, setForm] = useState({ ...tx });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await update(form);
    setSaving(false);
    if (ok) onClose();
  };

  const field = (label: string, content: React.ReactNode) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      {content}
    </div>
  );

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
      {field('日付',
        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
      )}
      {field('カテゴリ',
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
          {state.categories.map(c => <option key={c.name}>{c.name}</option>)}
        </select>
      )}
      {state.persons.length > 0 && field('メンバー',
        <select value={form.person ?? ''} onChange={e => setForm(f => ({ ...f, person: e.target.value }))} className={inputCls}>
          <option value="">（未設定）</option>
          {state.persons.map(p => <option key={p}>{p}</option>)}
        </select>
      )}
      {field('金額',
        <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className={inputCls} />
      )}
      {field('内容',
        <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
      )}
      {field('メモ',
        <input type="text" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} className={inputCls} />
      )}
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const { state } = useAppContext();
  const { remove } = useDeleteTransaction();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mmdd = tx.date.slice(5).replace('-', '/');

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div
          className="flex items-center px-4 py-3 gap-2 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <span className="text-xs text-gray-400 w-10 shrink-0">{mmdd}</span>
          {tx.person && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
              {tx.person}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryColor(state.categories, tx.category)}`}>
            {tx.category}
          </span>
          <span className="text-sm font-medium text-gray-900 shrink-0">¥{tx.amount.toLocaleString()}</span>
          <span className="text-sm text-gray-600 flex-1 truncate">{tx.description}</span>
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
            className="text-gray-300 hover:text-red-400 text-sm px-1 shrink-0"
          >
            ✕
          </button>
        </div>
        {expanded && <EditForm tx={tx} onClose={() => setExpanded(false)} />}
      </div>
      {confirmDelete && (
        <ConfirmDialog
          message="この支出を削除しますか？"
          onConfirm={async () => { await remove(tx.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

export function ListTab() {
  const { state } = useAppContext();
  const { transactions, loading } = useTransactions(state.selectedMonth);

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const total = transactions.reduce((s, t) => s + t.amount, 0);

  if (loading === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
        <span className="text-sm text-gray-500">全{transactions.length}件</span>
        <span className="text-sm font-bold text-gray-900">合計 ¥{total.toLocaleString()}</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">この月の支出はありません</p>
      ) : (
        sorted.map(tx => <TransactionRow key={tx.id} tx={tx} />)
      )}
    </div>
  );
}
