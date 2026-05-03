import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';
import Admin from './pages/Admin';
import translations from './i18n/translations.json';

type Lang = 'en' | 'es';

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  t: (p) => p,
});

export function useI18n() {
  return useContext(I18nContext);
}

interface ThemeContextType {
  dark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as string ?? path;
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

  // Read saved theme from localStorage on first load
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Every time dark changes, update the HTML element class AND save to storage
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [dark]);

  function toggleTheme() {
    setDark((prev) => !prev);
  }

  const t = (path: string): string => {
    const dict = translations[lang] as unknown as Record<string, unknown>;
    return getNestedValue(dict, path);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <I18nContext.Provider value={{ lang, setLang, t }}>
        <ThemeContext.Provider value={{ dark, toggleTheme }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="markets" element={<Markets />} />
                <Route path="markets/:id" element={<MarketDetail />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeContext.Provider>
      </I18nContext.Provider>
    </QueryClientProvider>
  );
}