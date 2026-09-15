import { Home, CirclePlus, List, Tags, type LucideIcon } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import type { ActiveTab } from '../types';

const TABS: { id: ActiveTab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'ホーム', icon: Home },
  { id: 'register', label: '登録', icon: CirclePlus },
  { id: 'list', label: '一覧', icon: List },
  { id: 'categories', label: 'カテゴリ', icon: Tags },
];

export function BottomNav() {
  const { state, dispatch } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex pb-safe">
      {TABS.map(tab => {
        const active = state.activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-xs ${
              active ? 'text-primary-600 font-medium' : 'text-gray-400'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2 : 1.5} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
