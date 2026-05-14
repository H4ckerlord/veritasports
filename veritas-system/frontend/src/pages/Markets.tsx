import { useState, useMemo, useCallback, memo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import TradeModal from '../components/TradeModal';
import type { WalletState } from '../hooks/useWallet';
import { oddsToPercent, formatOdds, getYesNo } from '../utils/odds';
import { useEffect, useRef } from 'react';

// ── Sport categories ────────────────────────────────────────────

const SPORT_CATEGORIES = [
  { id: 'all', label: 'All Sports', emoji: '🏆' },
  { id: 'football', label: 'Football', emoji: '⚽', kw: ['football', 'soccer', 'premier league', 'la liga', 'champions league', 'bundesliga', 'serie a', 'afcon', 'world cup', 'copa', 'euros', 'mls', 'epl', 'fa cup', 'nigeria', 'ghana', 'senegal', 'barcelona', 'real madrid', 'manchester', 'liverpool', 'arsenal', 'chelsea', 'inter', 'juventus', 'ac milan', 'psg', 'liga', 'ligue', 'eredivisie', 'superliga', 'bundesliga'] },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', kw: ['basketball', 'nba', 'lakers', 'warriors', 'bulls', 'celtics', 'bucks', 'heat', 'nets', 'knicks', 'suns', 'nbl', 'euroleague'] },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', kw: ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'atp', 'wta', 'djokovic', 'nadal', 'alcaraz', 'sinner', 'federer'] },
  { id: 'boxing', label: 'Boxing/MMA', emoji: '🥊', kw: ['boxing', 'mma', 'ufc', 'fury', 'usyk', 'joshua', 'fight', 'bout'] },
  { id: 'formula1', label: 'F1', emoji: '🏎️', kw: ['formula 1', 'f1', 'grand prix', 'gp', 'verstappen', 'hamilton', 'ferrari'] },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', kw: ['cricket', 'ipl', 't20', 'test match', 'odi'] },
  { id: 'american_football', label: 'NFL', emoji: '🏈', kw: ['nfl', 'american football', 'super bowl', 'touchdown'] },
  { id: 'hockey', label: 'Hockey', emoji: '🏒', kw: ['nhl', 'hockey', 'ice hockey'] },
];

function categorise(market: AzuroMarket): string {
  const text = [
    market.game.title,
    market.game.sport?.name ?? '',
    market.game.league?.name ?? '',
  ].join(' ').toLowerCase();
  for (const cat of SPORT_CATEGORIES.slice(1)) {
    if (cat.kw?.some((k) => text.includes(k))) return cat.id;
  }
  return 'other';
}

// ── Countdown hook ──────────────────────────────────────────────

function useCountdown(startsAt: string): { text: string; urgent: boolean } {
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const endTs = parseInt(startsAt) * 1000 || new Date(startsAt).getTime();

    function calc() {
      const diff = endTs - Date.now();
      if (diff <= 0) { setText('Started'); setUrgent(false); return; }
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
    timerRef.current = setInterval(calc, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startsAt]);

  return { text, urgent };
}

// ── Share menu ──────────────────────────────────────────────────

function ShareMenu({ market }: { market: AzuroMarket }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/markets/${market.conditionId}`;
  const text = `Predict "${market.game.title}" on Veritas!`;

  const items = [
    { label: '𝕏 Twitter', fn: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank') },
    { label: '💬 WhatsApp', fn: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank') },
    { label: '✈️ Telegram', fn: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank') },
    { label: '👍 Facebook', fn: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
    { label: copied ? '✓ Copied' : '🔗 Copy', fn: () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className="text-xs text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition px-1"
      >
        Share ↗
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-1.5 w-40 animate-slide-down">
            {items.map((s) => (
              <button
                key={s.label}
                onClick={(e) => { e.preventDefault(); s.fn(); setOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Market Card ─────────────────────────────────────────────────

const MarketCard = memo(({
  market,
  onTrade,
}: {
  market: AzuroMarket;
  onTrade: (m: AzuroMarket) => void;
}) => {
  const { t } = useI18n();
  const { yes, no } = getYesNo(market.outcomes);
  const { text: countdown, urgent } = useCountdown(market.game.startsAt);

  // Correct percentage calculation for V3 decimal odds
  const yesPercent = yes ? oddsToPercent(yes.currentOdds) : 50;
  const noPercent = no ? oddsToPercent(no.currentOdds) : 50;
  const yesOdds = yes ? formatOdds(yes.currentOdds) : '2.00';
  const noOdds = no ? formatOdds(no.currentOdds) : '2.00';

  return (
    <div className="card-dark p-5 flex flex-col gap-3 group h-full">

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {market.game.sport && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium shrink-0">
              {market.game.sport.name}
            </span>
          )}
          <span className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${urgent ? 'text-red-500' : 'text-gray-400'}`}>
            {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            ⏱ {countdown}
          </span>
        </div>
        <ShareMenu market={market} />
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 flex-1 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
        {market.game.title}
      </h3>

      {/* League info */}
      {market.game.league && (
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate -mt-1">
          {market.game.league.country?.name && `${market.game.league.country.name} · `}
          {market.game.league.name}
        </p>
      )}

      {/* Probability bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-emerald-600 dark:text-emerald-400">YES {yesPercent}%</span>
          <span className="text-red-600 dark:text-red-400">NO {noPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      {/* Odds grid — click either side to open trade modal */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onTrade(market)}
          className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 text-center transition"
        >
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">{t('markets.yes')}</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-300">{yesPercent}%</p>
          <p className="text-xs text-emerald-500">{yesOdds}x</p>
        </button>
        <button
          onClick={() => onTrade(market)}
          className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-3 text-center transition"
        >
          <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-0.5">{t('markets.no')}</p>
          <p className="text-lg font-black text-red-600 dark:text-red-300">{noPercent}%</p>
          <p className="text-xs text-red-500">{noOdds}x</p>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link
          to={`/markets/${market.conditionId}`}
          className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-300 dark:hover:border-brand-500/40 transition font-medium"
        >
          Details
        </Link>
        <button
          onClick={() => onTrade(market)}
          className="flex-grow btn-primary px-4 py-2.5 text-sm rounded-xl font-bold"
        >
          Trade
        </button>
      </div>
    </div>
  );
});

// ── Skeleton ────────────────────────────────────────────────────

const MarketSkeleton = memo(() => (
  <div className="card-dark p-5 space-y-3 animate-pulse">
    <div className="flex gap-2">
      <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-full w-20" />
      <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-full w-16" />
    </div>
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full" />
    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
    <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-full" />
    <div className="grid grid-cols-2 gap-2">
      <div className="h-16 bg-gray-200 dark:bg-white/10 rounded-xl" />
      <div className="h-16 bg-gray-200 dark:bg-white/10 rounded-xl" />
    </div>
    <div className="flex gap-2">
      <div className="h-9 bg-gray-200 dark:bg-white/10 rounded-xl flex-1" />
      <div className="h-9 bg-gray-200 dark:bg-white/10 rounded-xl flex-grow" />
    </div>
  </div>
));

// ── Main Markets Page ───────────────────────────────────────────

export default function Markets() {
  const { t } = useI18n();
  const { data: markets, isLoading, error, refetch } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { wallet } = useOutletContext<{ wallet: WalletState }>();
  const handleTrade = useCallback((m: AzuroMarket) => setTradingMarket(m), []);

  const filtered = useMemo(() => {
    let list = markets ?? [];
    if (category !== 'all') list = list.filter((m) => categorise(m) === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.game.title.toLowerCase().includes(q) ||
        m.game.sport?.name?.toLowerCase().includes(q) ||
        m.game.league?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [markets, category, search]);

  const counts = useMemo(() => {
    const r: Record<string, number> = { all: markets?.length ?? 0 };
    SPORT_CATEGORIES.slice(1).forEach((c) => {
      r[c.id] = (markets ?? []).filter((m) => categorise(m) === c.id).length;
    });
    return r;
  }, [markets]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('markets.title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isLoading
              ? 'Loading markets from Azuro...'
              : `${markets?.length ?? 0} live markets · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search team, league, sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64 placeholder-gray-400"
          />
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 transition text-lg"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Sport category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {SPORT_CATEGORIES.map((cat) => {
          const count = counts[cat.id] ?? 0;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border-2 whitespace-nowrap transition shrink-0 ${
                active
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300'
                  : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-brand-300 bg-white dark:bg-transparent'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                  active
                    ? 'bg-brand-200 dark:bg-brand-700 text-brand-700 dark:text-brand-200'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <MarketSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-5xl">⚠️</p>
          <p className="font-bold text-gray-900 dark:text-white text-lg">Could not load markets</p>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            The Azuro API may be temporarily unavailable. Please wait a moment and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary px-6 py-3 rounded-2xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">🔍</p>
          <p className="font-bold text-gray-900 dark:text-white">No markets found</p>
          <p className="text-gray-500 text-sm">
            {search || category !== 'all'
              ? 'Try clearing your filters'
              : 'Markets will appear here when available'}
          </p>
          {(search || category !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); }}
              className="text-brand-500 hover:underline text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MarketCard key={m.conditionId} market={m} onTrade={handleTrade} />
          ))}
        </div>
      )}

      <TradeModal market={tradingMarket} wallet={wallet} onClose={() => setTradingMarket(null)} />
    </div>
  );
}