import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../../contexts/AppContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useDashboard } from '../../hooks/useDashboard';
import { useMonthlyNote } from '../../hooks/useMonthlyNote';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#D97706', '#059669', '#2563EB', '#DC2626'];

function fmt(n: number) {
  return `¥${n.toLocaleString()}`;
}

function TotalCard({ total }: { total: number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">今月の支出</p>
      <p className="text-3xl font-bold text-gray-900">{fmt(total)}</p>
    </div>
  );
}

function ComparisonCard({ diff, diffRate, lastTotal }: { diff: number; diffRate: number | null; lastTotal: number }) {
  if (lastTotal === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs text-gray-500 mb-1">先月比較</p>
        <p className="text-sm text-gray-400">先月データなし</p>
      </div>
    );
  }
  const up = diff >= 0;
  const color = up ? 'text-red-500' : 'text-green-600';
  const arrow = up ? '↑' : '↓';
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">先月比較</p>
      <p className={`text-lg font-semibold ${color}`}>
        {up ? '+' : ''}{fmt(diff)}（{up ? '+' : ''}{diffRate?.toFixed(1)}%）{arrow}
      </p>
    </div>
  );
}

function CategoryChart({ data }: { data: { category: string; total: number; ratio: number }[] }) {
  const top5 = data.slice(0, 5);
  const others = data.slice(5);
  const chartData = [
    ...top5,
    ...(others.length > 0 ? [{ category: 'その他', total: others.reduce((s, d) => s + d.total, 0), ratio: 0 }] : []),
  ];

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-3">カテゴリ別支出</p>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="total"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => fmt(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {chartData.map((d, i) => (
          <span key={d.category} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            {d.category}
          </span>
        ))}
      </div>
    </div>
  );
}

function RankingCard({ data }: { data: { category: string; total: number; ratio: number }[] }) {
  const top5 = data.slice(0, 5);
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-3">支出ランキング</p>
      <div className="space-y-2">
        {top5.map((d, i) => (
          <div key={d.category} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <span className="text-sm text-gray-700 flex-1">{d.category}</span>
            <span className="text-sm font-medium text-gray-900">{fmt(d.total)}</span>
            <span className="text-xs text-gray-400 w-12 text-right">{(d.ratio * 100).toFixed(1)}%</span>
          </div>
        ))}
        {top5.length === 0 && <p className="text-sm text-gray-400 text-center">データなし</p>}
      </div>
    </div>
  );
}

function NoteCard({ yearMonth }: { yearMonth: string }) {
  const { note, save } = useMonthlyNote(yearMonth);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => {
    setDraft(note);
    setEditing(true);
  };

  const handleSave = async () => {
    const ok = await save(draft);
    if (ok) setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-500">今月のメモ</p>
        {!editing && (
          <button onClick={startEdit} className="text-xs text-indigo-600">編集</button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[2rem]">
          {note || <span className="text-gray-400">メモなし</span>}
        </p>
      )}
    </div>
  );
}

export function DashboardTab() {
  const { state } = useAppContext();
  const { loading } = useTransactions(state.selectedMonth);
  const data = useDashboard(state.selectedMonth);

  if (loading === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data || data.thisMonth.total === 0) {
    return (
      <div className="space-y-3">
        <TotalCard total={0} />
        <p className="text-center text-sm text-gray-400 py-8">
          今月の支出はまだありません。登録タブから入力してください
        </p>
        <NoteCard yearMonth={state.selectedMonth} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TotalCard total={data.thisMonth.total} />
      <ComparisonCard diff={data.diff} diffRate={data.diffRate} lastTotal={data.lastMonth.total} />
      {data.thisMonth.byCategory.length > 0 && (
        <CategoryChart data={data.thisMonth.byCategory} />
      )}
      <RankingCard data={data.thisMonth.byCategory} />
      <NoteCard yearMonth={state.selectedMonth} />
    </div>
  );
}
