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

function loadPersons(): string[] {
  try {
    const stored = localStorage.getItem('mr_persons');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadPlaces(): string[] {
  try {
    const stored = localStorage.getItem('mr_places');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
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
  persons: string[];
  places: string[];
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
  | { type: 'SET_PERSONS'; payload: string[] }
  | { type: 'SET_PLACES'; payload: string[] }
  | { type: 'LOAD_SETTINGS'; payload: { categories?: Category[]; persons?: string[]; places?: string[] } }
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
    case 'SET_PERSONS': {
      localStorage.setItem('mr_persons', JSON.stringify(action.payload));
      return { ...state, persons: action.payload };
    }
    case 'SET_PLACES': {
      localStorage.setItem('mr_places', JSON.stringify(action.payload));
      return { ...state, places: action.payload };
    }
    case 'LOAD_SETTINGS': {
      const categories = action.payload.categories ?? state.categories;
      const persons = action.payload.persons ?? state.persons;
      const places = action.payload.places ?? state.places;
      localStorage.setItem('mr_categories', JSON.stringify(categories));
      localStorage.setItem('mr_persons', JSON.stringify(persons));
      localStorage.setItem('mr_places', JSON.stringify(places));
      return { ...state, categories, persons, places };
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
  persons: loadPersons(),
  places: loadPlaces(),
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
