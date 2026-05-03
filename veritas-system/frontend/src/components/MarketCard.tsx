import { Link } from 'react-router-dom';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useI18n } from '../App';

interface MarketCardProps {
  market: AzuroMarket;
  onTrade?: (market: AzuroMarket) => void;
}

function formatOdds(oddsRaw: string): string {
  // Azuro odds are in 1e9 format → divide to get decimal odds
  const decimal = Number(oddsRaw) / 1e9;
  return decimal.toFixed(2);
}

function formatDate(ts: string): string {
  return new Date(Number(ts) * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MarketCard({ market, onTrade }: MarketCardProps) {
  const { t } = useI18n();
  const [yes, no] = market.outcomes;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Title */}
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
          {t('markets.endsIn')} {formatDate(market.game.startsAt)}
        </p>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-3">
          {market.game.title}
        </h3>
      </div>

      {/* Odds pills */}
      <div className="flex gap-3">
        {yes && (
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
              {t('markets.yes')}
            </p>
            <p className="font-bold text-lg text-emerald-700 dark:text-emerald-300">
              {formatOdds(yes.currentOdds)}×
            </p>
          </div>
        )}
        {no && (
          <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-0.5">
              {t('markets.no')}
            </p>
            <p className="font-bold text-lg text-rose-700 dark:text-rose-300">
              {formatOdds(no.currentOdds)}×
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/markets/${market.conditionId}`}
          className="flex-1 text-center text-sm text-brand-600 dark:text-brand-400 hover:underline py-2"
        >
          Details
        </Link>
        {onTrade && (
          <button
            onClick={() => onTrade(market)}
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg transition"
          >
            {t('markets.trade')}
          </button>
        )}
      </div>
    </div>
  );
}
