import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import Dashboard from './pages/Dashboard';
import HowItWorks from './pages/HowItWorks';
import HowToTrade from './pages/HowToTrade';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import TermsOfService from './pages/TermsOfService';
import ProhibitedMarkets from './pages/ProhibitedMarkets';
import ResponsibleTrading from './pages/ResponsibleTrading';
import ContactLegal from './pages/ContactLegal';
import AuditTrail from './pages/AuditTrail';
import Leaderboard from './pages/Leaderboard';
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
  return (
    (path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj) as string) ?? path
  );
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: location.pathname }),
    }).catch(() => {});
  }, [location.pathname]);
  return null;
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

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
            <PageTracker />
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="markets" element={<Markets />} />
                <Route path="markets/:id" element={<MarketDetail />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="how-to-trade" element={<HowToTrade />} />
                <Route path="privacy-policy" element={<PrivacyPolicy />} />
                <Route path="terms-of-use" element={<TermsOfUse />} />
                <Route path="terms-of-service" element={<TermsOfService />} />
                <Route path="prohibited-markets" element={<ProhibitedMarkets />} />
                <Route path="responsible-trading" element={<ResponsibleTrading />} />
                <Route path="contact-legal" element={<ContactLegal />} />
                <Route path="audit-trail" element={<AuditTrail />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="admin" element={<Admin />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeContext.Provider>
      </I18nContext.Provider>
    </QueryClientProvider>
  );
}