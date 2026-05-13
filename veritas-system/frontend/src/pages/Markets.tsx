import { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { Link, useOutletContext } from 'react-router-dom';
import TradeModal from '../components/TradeModal';
import type { WalletState } from '../hooks/useWallet';

// ── Correct odds helpers (API already returns decimal odds) ──────
function oddsToPercent(oddsRaw: string): number {
  const d = Number(oddsRaw);
  if (!d || d <= 0) return 50;
  return Math.min(99, Math.max(1, Math.round((1 / d) * 100)));
}

function oddsToDecimal(oddsRaw: string): number {
  return Number(oddsRaw);
}

// ── Sport categories with direct API sport name matching ─────────
const SPORT_NAMES: Record<string, { label: string; emoji: string }> = {
  football: { label: 'Football', emoji: '⚽' },
  soccer: { label: 'Football', emoji: '⚽' },
  basketball: { label: 'Basketball', emoji: '🏀' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  boxing: { label: 'Boxing/MMA', emoji: '🥊' },
  mma: { label: 'Boxing/MMA', emoji: '🥊' },
  'formula 1': { label: 'Formula 1', emoji: '🏎️' },
  f1: { label: 'Formula 1', emoji: '🏎️' },
  cricket: { label: 'Cricket', emoji: '🏏' },
  'american football': { label: 'NFL', emoji: '🏈' },
  nfl: { label: 'NFL', emoji: '🏈' },
  hockey: { label: 'Hockey', emoji: '🏒' },
  'ice hockey': { label: 'Hockey', emoji: '🏒' },
  baseball: { label: 'Baseball', emoji: '⚾' },
  rugby: { label: 'Rugby', emoji: '🏉' },
  volleyball: { label: 'Volleyball', emoji: '🏐' },
  handball: { label: 'Handball', emoji: '🤾' },
  esports: { label: 'Esports', emoji: '🎮' },
};

function categorise(market: AzuroMarket): string {
  const sportName = (market.game.sport?.name ?? '').toLowerCase().trim();
  if (sportName && SPORT_NAMES[sportName]) return sportName;

  const title = market.game.title.toLowerCase();
  const league = (market.game.league?.name ?? '').toLowerCase();

  for (const [key, val] of Object.entries(SPORT_NAMES)) {
    if (title.includes(key) || league.includes(key)) return key;
  }
  return 'other';
}

const CATEGORY_LIST = [
  { id: 'all', label: 'All Sports', emoji: '🏆' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'boxing', label: 'Boxing/MMA', emoji: '🥊' },
  { id: 'formula 1', label: 'Formula 1', emoji: '🏎️' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏' },
  { id: 'american football', label: 'NFL', emoji: '🏈' },
  { id: 'hockey', label: 'Hockey', emoji: '🏒' },
  { id: 'baseball', label: 'Baseball', emoji: '⚾' },
  { id: 'other', label: 'Other', emoji: '🎯' },
];

function useCountdown(endTs: number): { text: string; urgent: boolean } {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function calc() {
      const diff = endTs * 1000 - Date.now();
      if (diff <= 0) { setText('Ended'); setUrgent(false); return; }
      const h = diff / 3600000;
      setUrgent(h < 3);
      const d = Math.floor(diff / 86400000);
      const hr = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setText(`${d}d ${hr}h`);
      else if (hr > 0) setText(`${hr}h ${m}m`);
      else setText(`${m}m ${s}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTs]);

  return { text, urgent };
}

function MarketCardEnhanced({ market, onTrade, index }: { market: AzuroMarket; onTrade: (m: AzuroMarket) => void; index: number }) {
  const { t } = useI18n();
  const [yes, no] = market.outcomes;
  const { text: countdown, urgent } = useCountdown(Number(market.game.startsAt));
  const yesPercent = yes ? oddsToPercent(yes.currentOdds) : 50;
  const noPercent = no ? oddsToPercent(no.currentOdds) : 50;
  const yesOdds = yes ? oddsToDecimal(yes.currentOdds).toFixed(2) : '2.00';
  const noOdds = no ? oddsToDecimal(no.currentOdds).toFixed(2) : '2.00';
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const url = `${window.location.origin}/markets/${market.conditionId}`;
  const shareText = `Predict "${market.game.title}" on Veritas!`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card-dark p-5 flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {market.game.sport && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium">
              {market.game.sport.name}
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs font-semibold ${urgent ? 'text-red-500' : 'text-gray-400'}`}>
            {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            ⏱ {countdown}
          </span>
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setShareOpen((o) => !o)} className="text-xs text-gray-400 hover:text-brand-600 transition">
            Share ↗
          </button>
          {shareOpen && (
            <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-2 w-40">
              {[
                { label: '𝕏 Twitter', fn: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`, '_blank') },
                { label: '💬 WhatsApp', fn: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`, '_blank') },
                { label: '✈️ Telegram', fn: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`, '_blank') },
                { label: copied ? '✓ Copied' : '🔗 Copy Link', fn: copyLink },
              ].map((s) => (
                <button key={s.label} onClick={(e) => { e.stopPropagation(); s.fn(); }} className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition">
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
        {market.game.title}
      </h3>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">YES {yesPercent}%</span>
          <span className="text-red-600 dark:text-red-400">NO {noPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-white/10">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${yesPercent}%` }} />
          <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500" style={{ width: `${noPercent}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onTrade(market)} className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-center transition">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">{t('markets.yes')}</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">{yesPercent}%</p>
          <p className="text-xs text-emerald-500">{yesOdds}x</p>
        </button>
        <button onClick={() => onTrade(market)} className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3 text-center transition">
          <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">{t('markets.no')}</p>
          <p className="text-lg font-black text-red-600 dark:text-red-300">{noPercent}%</p>
          <p className="text-xs text-red-500">{noOdds}x</p>
        </button>
      </div>

      <div className="flex gap-2">
        <Link to={`/markets/${market.conditionId}`} className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-300 transition font-medium">
          Details
        </Link>
        <button onClick={() => onTrade(market)} className="flex-grow btn-primary px-4 py-2.5 text-sm rounded-xl font-bold">
          Trade
        </button>
      </div>
    </div>
  );
}

export default function Markets() {
  const { t } = useI18n();
  const { data: markets, isLoading, error, refetch } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  const filtered = useMemo(() => {
    let list = markets ?? [];
    if (category !== 'all') list = list.filter((m) => categorise(m) === category);
    if (search.trim()) list = list.filter((m) => m.game.title.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [markets, category, search]);

  const counts = useMemo(() => {
    const r: Record<string, number> = {};
    for (const cat of CATEGORY_LIST) r[cat.id] = 0;
    r['all'] = markets?.length ?? 0;
    for (const m of markets ?? []) {
      const c = categorise(m);
      if (r[c] !== undefined) r[c]++;
    }
    return r;
  }, [markets]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('markets.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? 'Loading markets...' : `${markets?.length ?? 0} live markets available`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="search" placeholder="Search markets..." value={search} onChange={(e) => setSearch(e.target.value)} className="border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-56" />
          <button onClick={() => refetch()} className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-brand-600 transition" title="Refresh">↻</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_LIST.map((cat) => {
          const count = counts[cat.id] ?? 0;
          const active = category === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 whitespace-nowrap transition shrink-0 ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-brand-300 bg-white dark:bg-transparent'}`}>
              {cat.emoji} {cat.label}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-brand-200 dark:bg-brand-700 text-brand-700 dark:text-brand-200' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-4xl">⚠️</p>
          <p className="font-bold text-gray-900 dark:text-white">Something went wrong loading markets</p>
          <button onClick={() => refetch()} className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold">Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="font-bold text-gray-900 dark:text-white">No markets found</p>
          <p className="text-gray-500 text-sm">{search || category !== 'all' ? 'Try clearing your filters' : 'Markets appear here when available.'}</p>
          {(search || category !== 'all') && <button onClick={() => { setSearch(''); setCategory('all'); }} className="text-brand-500 hover:underline text-sm">Clear all filters</button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => <MarketCardEnhanced key={m.conditionId} market={m} onTrade={setTradingMarket} index={i} />)}
        </div>
      )}

      <TradeModal market={tradingMarket} wallet={wallet} onClose={() => setTradingMarket(null)} />
    </div>
  );
}