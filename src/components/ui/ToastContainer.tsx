import { useAppContext } from '../../contexts/AppContext';

const BG: Record<string, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-gray-600',
};

export function ToastContainer() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[min(90vw,360px)]">
      {state.toasts.map(t => (
        <div
          key={t.id}
          className={`${BG[t.type]} text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-2 animate-slide-in`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: t.id })}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
