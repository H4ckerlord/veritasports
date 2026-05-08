import { Link, useLocation } from 'react-router-dom';
import { useI18n, useTheme } from '../App';
import { useWallet } from '../hooks/useWallet';
import { useState, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'pt', label: 'PT' },
  { code: 'ar', label: 'AR' },
  { code: 'zh', label: 'ZH' },
  { code: 'hi', label: 'HI' },
  { code: 'ru', label: 'RU' },
  { code: 'tr', label: 'TR' },
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/markets', label: t('nav.markets') },
    { to: '/leaderboard', label: '🏆 Leaderboard' },
    { to: '/how-to-trade', label: '📚 How to Trade' },
    { to: '/dashboard', label: t('nav.dashboard') },
  ];

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-gray-950/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
        style={{ backgroundImage: scrolled ? undefined : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.svg" alt="V" className="w-8 h-8 rounded-xl shadow-glow-brand group-hover:shadow-lg transition-all" />
              <span className="font-black text-xl tracking-tight text-white group-hover:text-brand-300 transition-colors">
                Veritas
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">

              {/* Language */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen((o) => !o)}
                  className="text-xs font-bold px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition"
                >
                  {lang.toUpperCase()}
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-10 z-50 glass rounded-xl shadow-2xl w-28 py-1 animate-slide-down">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLang(l.code as any); setLangOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition ${lang === l.code ? 'text-brand-400 font-semibold' : 'text-gray-300'}`}
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
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
              >
                {dark ? '☀️' : '🌙'}
              </button>

              {/* Wallet */}
              {wallet.address ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-600/20 border border-brand-500/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-brand-300">{shortAddress}</span>
                  </div>
                  <button
                    onClick={wallet.disconnect}
                    className="text-xs text-gray-500 hover:text-red-400 transition px-2 py-1"
                  >
                    {t('common.disconnect')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={wallet.connect}
                  disabled={wallet.connecting}
                  className="btn-primary px-4 py-2 text-sm relative z-10"
                >
                  <span className="relative z-10">
                    {wallet.connecting ? 'Connecting...' : t('common.connectWallet')}
                  </span>
                </button>
              )}

              {/* Mobile menu */}
              <button
                className="md:hidden w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <div className="space-y-1">
                  <span className={`block w-4 h-0.5 bg-gray-300 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                  <span className={`block w-4 h-0.5 bg-gray-300 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block w-4 h-0.5 bg-gray-300 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-16 left-0 right-0 glass border-b border-white/10 p-4 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                    location.pathname === link.to
                      ? 'bg-brand-600/20 text-brand-300'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}