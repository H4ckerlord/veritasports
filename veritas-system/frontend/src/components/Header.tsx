import { Link, useLocation } from 'react-router-dom';
import { useI18n, useTheme } from '../App';
import { useWallet } from '../hooks/useWallet';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
];

interface HeaderProps {
  wallet: ReturnType<typeof useWallet>;
}

export default function Header({ wallet }: HeaderProps) {
  const { t, lang, setLang } = useI18n();
  const { dark, toggleTheme } = useTheme();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navLinks = [
  { to: '/markets', label: t('nav.markets') },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  { to: '/how-to-trade', label: '📚 How to Trade' },
  { to: '/how-it-works', label: t('nav.howItWorks') },
  { to: '/dashboard', label: t('nav.dashboard') },
];

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : null;

  const currentLang =
    LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400"
          >
            <img src="/logo.svg" alt="Veritas" className="w-8 h-8" />
            Veritas
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">

            {/* Language dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="text-xs font-semibold px-2 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1"
              >
                🌐 {currentLang.label}
              </button>

              {langOpen && (
                <div className="absolute right-0 top-9 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-44 max-h-72 overflow-y-auto">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as any);
                        setLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                        lang === l.code
                          ? 'text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-lg"
              aria-label="Toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {/* Wallet button */}
            {wallet.address ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs font-mono bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-full">
                  {shortAddress}
                </span>
                <button
                  onClick={wallet.disconnect}
                  className="text-sm text-gray-500 hover:text-red-500 transition"
                >
                  {t('common.disconnect')}
                </button>
              </div>
            ) : (
              <button
                onClick={wallet.connect}
                disabled={wallet.connecting}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {wallet.connecting ? '...' : t('common.connectWallet')}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setMenuOpen((o) => !o)}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium transition-colors py-1 ${
                location.pathname === link.to
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}