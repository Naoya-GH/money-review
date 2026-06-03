import { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial || '');

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <label className="block text-xs text-gray-500">カテゴリ名</label>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">
          キャンセル
        </button>
        <button
          onClick={() => value.trim() && onSave(value.trim())}
          disabled={!value.trim()}
          className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
        >
          保存
        </button>
      </div>
    </div>
  );
}

export function CategoryTab() {
  const { categories, add, remove, rename, reorder } = useCategories();
  const [adding, setAdding] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...categories];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    reorder(arr.map((c, idx) => ({ ...c, order: idx })));
  };

  const moveDown = (i: number) => {
    if (i === categories.length - 1) return;
    const arr = [...categories];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    reorder(arr.map((c, idx) => ({ ...c, order: idx })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">カテゴリ（{categories.length}/20）</span>
        {!adding && categories.length < 20 && (
          <button
            onClick={() => setAdding(true)}
            className="text-sm text-indigo-600 font-medium"
          >
            ＋ 追加
          </button>
        )}
      </div>

      {adding && (
        <CategoryForm
          onSave={name => { add(name); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}

      {editingName && (
        <CategoryForm
          initial={editingName}
          onSave={name => { rename(editingName, name); setEditingName(null); }}
          onCancel={() => setEditingName(null)}
        />
      )}

      <div className="space-y-2">
        {categories.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">カテゴリを追加してください</p>
        )}
        {categories.map((c, i) => (
          <div key={c.name} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-300 disabled:opacity-20 text-xs leading-none">▲</button>
              <button onClick={() => moveDown(i)} disabled={i === categories.length - 1} className="text-gray-300 disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
            <span className="flex-1 text-sm text-gray-800">{c.name}</span>
            <button
              onClick={() => setEditingName(c.name)}
              className="text-xs text-gray-400 hover:text-indigo-600 px-1"
            >
              ✎
            </button>
            <button
              onClick={() => setDeletingName(c.name)}
              className="text-xs text-gray-400 hover:text-red-500 px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {deletingName && (
        <ConfirmDialog
          message={`「${deletingName}」を削除しますか？既存の支出には影響しません。`}
          onConfirm={() => { remove(deletingName); setDeletingName(null); }}
          onCancel={() => setDeletingName(null)}
        />
      )}
    </div>
  );
}
