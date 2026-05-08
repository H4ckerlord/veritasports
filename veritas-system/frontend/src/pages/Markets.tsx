import { useState, useMemo } from 'react';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import MarketCard from '../components/MarketCard';
import TradeModal from '../components/TradeModal';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

const SPORT_CATEGORIES = [
  { id: 'all', label: 'All Sports', emoji: '🏆' },
  { id: 'football', label: 'Football', emoji: '⚽', keywords: ['football', 'soccer', 'premier league', 'la liga', 'champions league', 'bundesliga', 'serie a', 'ligue 1', 'mls', 'epl', 'afcon', 'world cup', 'euros', 'copa'] },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', keywords: ['basketball', 'nba', 'nbl', 'euroleague', 'lakers', 'warriors', 'bulls', 'celtics'] },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', keywords: ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'atp', 'wta', 'djokovic', 'nadal', 'federer', 'alcaraz'] },
  { id: 'boxing', label: 'Boxing/MMA', emoji: '🥊', keywords: ['boxing', 'mma', 'ufc', 'fury', 'usyk', 'joshua', 'fight', 'bout'] },
  { id: 'american_football', label: 'NFL', emoji: '🏈', keywords: ['nfl', 'american football', 'super bowl', 'touchdown'] },
  { id: 'formula1', label: 'Formula 1', emoji: '🏎️', keywords: ['formula 1', 'f1', 'grand prix', 'gp', 'verstappen', 'hamilton', 'ferrari', 'mercedes'] },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', keywords: ['cricket', 'ipl', 'test match', 'odi', 'twenty20', 't20'] },
  { id: 'esports', label: 'Esports', emoji: '🎮', keywords: ['esports', 'esport', 'cs:', 'dota', 'league of legends', 'valorant'] },
];

function categoriseMarket(market: AzuroMarket): string {
  const title = market.game.title.toLowerCase();
  for (const cat of SPORT_CATEGORIES.slice(1)) {
    if (cat.keywords?.some((kw) => title.includes(kw))) {
      return cat.id;
    }
  }
  return 'other';
}

export default function Markets() {
  const { t } = useI18n();
  const { data: markets, isLoading, error } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  const filtered = useMemo(() => {
    let list = markets ?? [];
    if (category !== 'all') {
      list = list.filter((m) => categoriseMarket(m) === category);
    }
    if (search.trim()) {
      list = list.filter((m) =>
        m.game.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [markets, category, search]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: markets?.length ?? 0 };
    SPORT_CATEGORIES.slice(1).forEach((cat) => {
      result[cat.id] = (markets ?? []).filter((m) => categoriseMarket(m) === cat.id).length;
    });
    return result;
  }, [markets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('markets.title')}
        </h1>
        <input
          type="search"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
        />
      </div>

      {/* Sport category filters */}
      <div className="flex gap-2 flex-wrap">
        {SPORT_CATEGORIES.map((cat) => {
          const count = counts[cat.id] ?? 0;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition ${
                isActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300 bg-white dark:bg-gray-900'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-brand-200 dark:bg-brand-800 text-brand-700 dark:text-brand-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-gray-400">{t('common.error')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-gray-400">
            {search || category !== 'all'
              ? 'No markets found for this filter. Try a different category.'
              : t('markets.noMarkets')}
          </p>
          {(search || category !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); }}
              className="text-brand-500 hover:underline text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MarketCard key={m.conditionId} market={m} onTrade={setTradingMarket} />
          ))}
        </div>
      )}

      <TradeModal market={tradingMarket} wallet={wallet} onClose={() => setTradingMarket(null)} />
    </div>
  );
}