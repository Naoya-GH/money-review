import { useAppContext } from '../contexts/AppContext';
import type { ActiveTab } from '../types';

const TABS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'ホーム', icon: '⊞' },
  { id: 'register', label: '登録', icon: '+' },
  { id: 'list', label: '一覧', icon: '≡' },
  { id: 'categories', label: 'カテゴリ', icon: '◈' },
];

export function BottomNav() {
  const { state, dispatch } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex pb-safe">
      {TABS.map(tab => {
        const active = state.activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs ${
              active ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            <span className={`text-xl leading-none ${active ? 'font-bold' : ''}`}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
