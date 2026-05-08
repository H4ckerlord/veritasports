import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../App';
import { useAzuroMarket } from '../hooks/useAzuroMarkets';
import TradeModal from '../components/TradeModal';
import EmailNotify from '../components/EmailNotify';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { market, isLoading } = useAzuroMarket(id);
  const [tradeOpen, setTradeOpen] = useState(false);
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-24 text-gray-400">
        Market not found.
      </div>
    );
  }

  const [yes, no] = market.outcomes;
  const yesOdds = (Number(yes?.currentOdds ?? 0) / 1e9).toFixed(2);
  const noOdds = (Number(no?.currentOdds ?? 0) / 1e9).toFixed(2);
  const endDate = new Date(Number(market.game.startsAt) * 1000).toLocaleString();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs text-gray-400 mb-2">
          {t('markets.endsIn')} {endDate}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
          {market.game.title}
        </h1>
      </div>

      {/* Odds card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
            {t('markets.yes')}
          </p>
          <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
            {yesOdds}×
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-5 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-2">
            {t('markets.no')}
          </p>
          <p className="text-4xl font-bold text-rose-700 dark:text-rose-300">
            {noOdds}×
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Condition ID</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{market.conditionId}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Status</span>
          <span className="capitalize text-emerald-600">{market.status}</span>
        </div>
        <div className="flex justify-between text-gray-500">
          <span>Resolution</span>
          <span>Automatic (Azuro Oracle)</span>
        </div>
      </div>

      <button
        onClick={() => setTradeOpen(true)}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 rounded-xl text-lg transition"
      >
        {t('markets.trade')}
      </button>

      <EmailNotify wallet={wallet.address} marketId={market.conditionId} />

      <TradeModal
        market={tradeOpen ? market : null}
        wallet={wallet}
        onClose={() => setTradeOpen(false)}
      />
    </div>
  );
}
