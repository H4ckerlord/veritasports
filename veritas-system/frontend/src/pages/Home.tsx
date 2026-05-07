import { Link } from 'react-router-dom';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import MarketCard from '../components/MarketCard';
import LiveBetFeed from '../components/LiveBetFeed';
import TradeModal from '../components/TradeModal';
import { useState } from 'react';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

export default function Home() {
  const { t } = useI18n();
  const { data: markets, isLoading } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  const featured = markets?.slice(0, 3) ?? [];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <div className="inline-block bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold px-3 py-1 rounded-full">
          Powered by Azuro Protocol
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          {t('hero.title')}{' '}
          <span className="text-brand-600 dark:text-brand-400">
            {t('hero.subtitle')}
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-lg text-gray-500 dark:text-gray-400">
          {t('hero.description')}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/markets"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            {t('hero.cta')} →
          </Link>
          <Link
            to="/how-to-trade"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            📚 How to Trade
          </Link>
          <Link
            to="/how-it-works"
            className="text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition"
          >
            {t('nav.howItWorks')}
          </Link>
        </div>
      </section>

      {/* Featured markets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('markets.title')}
          </h2>
          <Link
            to="/markets"
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-52 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-gray-400">{t('markets.noMarkets')}</p>
            <Link
              to="/how-to-trade"
              className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              📚 Learn How to Trade While You Wait
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {featured.map((m) => (
              <MarketCard
                key={m.conditionId}
                market={m}
                onTrade={setTradingMarket}
              />
            ))}
          </div>
        )}
      </section>

      {/* How to trade banner */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-white space-y-1">
          <p className="text-xl font-bold">New to prediction markets?</p>
          <p className="opacity-90 text-sm">
            We will show you exactly how to get started step by step — even if you have never used crypto before.
          </p>
        </div>
        <Link
          to="/how-to-trade"
          className="shrink-0 bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl transition whitespace-nowrap"
        >
          📚 How to Trade →
        </Link>
      </section>

{/* Live bet feed */}
<section>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
      Live Activity
    </h2>
    <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </span>
  </div>
  <LiveBetFeed />
</section>

      {/* Stats bar */}
      <section className="grid grid-cols-3 gap-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        {[
          { label: 'Markets Live', value: markets?.length ?? '–' },
          { label: 'Protocol', value: 'Azuro' },
          { label: 'Network', value: 'Polygon' },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      <TradeModal
        market={tradingMarket}
        wallet={wallet}
        onClose={() => setTradingMarket(null)}
      />
    </div>
  );
}