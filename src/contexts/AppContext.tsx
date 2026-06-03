import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Transaction, Category, Toast, ActiveTab, LoadingState } from '../types';

const DEFAULT_CATEGORIES: Category[] = [
  { name: '食費', order: 0 },
  { name: '外食', order: 1 },
  { name: '趣味', order: 2 },
  { name: '日用品', order: 3 },
  { name: '交通費', order: 4 },
];

function loadCategories(): Category[] {
  try {
    const stored = localStorage.getItem('mr_categories');
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

type AppState = {
  selectedMonth: string;
  transactions: Transaction[];
  transactionsLoading: LoadingState;
  monthlyNote: string;
  noteLoading: LoadingState;
  categories: Category[];
  toasts: Toast[];
  activeTab: ActiveTab;
};

type AppAction =
  | { type: 'SET_MONTH'; payload: string }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_TRANSACTIONS_LOADING'; payload: LoadingState }
  | { type: 'ADD_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_MONTHLY_NOTE'; payload: string }
  | { type: 'SET_NOTE_LOADING'; payload: LoadingState }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_TAB'; payload: ActiveTab };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MONTH':
      return { ...state, selectedMonth: action.payload, transactionsLoading: 'idle', monthlyNote: '' };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_TRANSACTIONS_LOADING':
      return { ...state, transactionsLoading: action.payload };
    case 'ADD_TRANSACTIONS':
      return { ...state, transactions: [...state.transactions, ...action.payload] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'SET_MONTHLY_NOTE':
      return { ...state, monthlyNote: action.payload };
    case 'SET_NOTE_LOADING':
      return { ...state, noteLoading: action.payload };
    case 'SET_CATEGORIES': {
      localStorage.setItem('mr_categories', JSON.stringify(action.payload));
      return { ...state, categories: action.payload };
    }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    default:
      return state;
  }
}

const initialState: AppState = {
  selectedMonth: getCurrentYearMonth(),
  transactions: [],
  transactionsLoading: 'idle',
  monthlyNote: '',
  noteLoading: 'idle',
  categories: loadCategories(),
  toasts: [],
  activeTab: 'dashboard',
};

type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
