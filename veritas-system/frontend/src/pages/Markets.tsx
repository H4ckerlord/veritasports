import { useState } from 'react';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import MarketCard from '../components/MarketCard';
import TradeModal from '../components/TradeModal';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

export default function Markets() {
  const { t } = useI18n();
  const { data: markets, isLoading, error } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const [search, setSearch] = useState('');
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  const filtered = (markets ?? []).filter((m) =>
    m.game.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('markets.title')}
        </h1>
        <input
          type="search"
          placeholder="Search markets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-gray-400">{t('common.error')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('markets.noMarkets')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MarketCard key={m.conditionId} market={m} onTrade={setTradingMarket} />
          ))}
        </div>
      )}

      <TradeModal
        market={tradingMarket}
        wallet={wallet}
        onClose={() => setTradingMarket(null)}
      />
    </div>
  );
}
