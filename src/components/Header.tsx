import { useAppContext } from '../contexts/AppContext';
import { useMonthOptions } from '../hooks/useMonthOptions';

export function Header() {
  const { state, dispatch } = useAppContext();
  const options = useMonthOptions();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 flex items-center justify-between h-14">
      <span className="text-base font-medium text-gray-800">家計ノート</span>
      <select
        value={state.selectedMonth}
        onChange={e => dispatch({ type: 'SET_MONTH', payload: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map(o => (
          <option key={o.yearMonth} value={o.yearMonth}>{o.label}</option>
        ))}
      </select>
    </header>
  );
}
