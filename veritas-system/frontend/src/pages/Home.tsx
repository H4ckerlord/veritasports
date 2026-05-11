import { Link } from 'react-router-dom';
import { useI18n } from '../App';
import { useAzuroMarkets } from '../hooks/useAzuroMarkets';
import MarketCard from '../components/MarketCard';
import TradeModal from '../components/TradeModal';
import LiveBetFeed from '../components/LiveBetFeed';
import { useState, useEffect } from 'react';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(value / 40, 1);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span className="stat-number">{display.toLocaleString()}{suffix}</span>;
}

const sports = [
  { emoji: '⚽', label: 'Football' },
  { emoji: '🏀', label: 'Basketball' },
  { emoji: '🎾', label: 'Tennis' },
  { emoji: '🥊', label: 'Boxing' },
  { emoji: '🏎️', label: 'Formula 1' },
  { emoji: '🏏', label: 'Cricket' },
];

const features = [
  { icon: '🔒', title: 'Non-Custodial', desc: 'Your funds stay in your wallet. We never hold your money.' },
  { icon: '⚡', title: 'Instant Settlement', desc: 'Winnings available to claim within hours of match end.' },
  { icon: '🌍', title: 'Global Access', desc: 'Available worldwide. Trade from anywhere, anytime.' },
  { icon: '📊', title: 'Transparent Odds', desc: 'All odds and market data are publicly verifiable on-chain.' },
  { icon: '🛡️', title: 'KYC Protected', desc: 'Tiered identity system ensures fair and safe trading for all.' },
  { icon: '🤝', title: 'Azuro Protocol', desc: 'Backed by Azuro liquidity. Deep markets, fair prices.' },
];

export default function Home() {
  const { t } = useI18n();
  const { data: markets, isLoading } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const { wallet } = useOutletContext<{ wallet: WalletState }>();
  const featured = markets?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-950 dark:to-brand-950 py-20 px-4">
        <div className="absolute inset-0 bg-dots opacity-40 dark:opacity-60 pointer-events-none" />
        <div className="orb w-96 h-96 bg-brand-300/20 dark:bg-brand-600/20 -top-20 -right-20 animate-float" />
        <div className="orb w-64 h-64 bg-indigo-300/20 dark:bg-indigo-600/15 bottom-0 -left-10 animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100 dark:bg-brand-600/20 border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Powered by Azuro Protocol on Polygon Blockchain
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-6 animate-slide-up">
            Predict.{' '}
            <span className="gradient-text">Win.</span>{' '}
            <span className="text-gray-700 dark:text-gray-300">Repeat.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed animate-fade-in">
            The world's most transparent sports prediction market.
            Non-custodial, decentralised, and resolved automatically by smart contracts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up">
            <Link to="/markets" className="btn-primary px-8 py-4 text-base rounded-2xl w-full sm:w-auto text-center">
              Browse Markets
            </Link>
            <Link
              to="/how-to-trade"
              className="px-8 py-4 text-base rounded-2xl w-full sm:w-auto text-center border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-white/5 transition-all font-semibold"
            >
              Learn How to Trade
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {sports.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-400 shadow-sm">
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-y border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Sport Markets', value: markets?.length ?? 0, suffix: '+' },
              { label: 'Protocol', value: 'Azuro', isText: true },
              { label: 'Settlement', value: 'On-Chain', isText: true },
              { label: 'KYC Tiers', value: 3 },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-black gradient-text">
                  {stat.isText ? stat.value : <AnimatedNumber value={stat.value as number} suffix={stat.suffix} />}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* Hot Markets */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Hot Markets</h2>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Trade on the biggest sport events right now</p>
            </div>
            <Link to="/markets" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 text-sm font-semibold transition flex items-center gap-1">
              View all <span>›</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-5xl">⚽</p>
              <p className="text-gray-500">{t('markets.noMarkets')}</p>
              <Link to="/how-to-trade" className="inline-block btn-primary px-6 py-3 rounded-2xl text-sm">
                Learn While You Wait
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((m) => (
                <MarketCard key={m.conditionId} market={m} onTrade={setTradingMarket} />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-500">Start trading in 3 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🔗', title: 'Connect Wallet', desc: 'Connect MetaMask in one click. No registration needed.' },
              { step: '02', icon: '🎯', title: 'Pick a Market', desc: 'Browse sport markets and choose YES or NO.' },
              { step: '03', icon: '💰', title: 'Claim Winnings', desc: 'Azuro resolves results automatically. Claim instantly.' },
            ].map((item) => (
              <div key={item.step} className="card-dark p-6 text-center relative group">
                <div className="absolute top-4 right-4 text-2xl font-black text-brand-200 dark:text-brand-500/20">{item.step}</div>
                <div className="text-4xl mb-4 group-hover:animate-float inline-block">{item.icon}</div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Activity */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Live Activity</h2>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Real-time bets from the Azuro network</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
          <div className="card-dark p-4">
            <LiveBetFeed />
          </div>
        </section>

        {/* Referral Banner */}
        <section>
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600">
            <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
            <div className="orb w-48 h-48 bg-white/10 -top-10 -right-10" />
            <div className="orb w-32 h-32 bg-white/10 -bottom-5 -left-5" style={{ animationDelay: '3s' }} />
            <div className="relative">
              <p className="text-4xl mb-3">🎁</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Earn 1 USDC Per Referral</h2>
              <p className="text-indigo-100 mb-6 max-w-md mx-auto">
                Share your link. Every friend who places their first trade earns you a reward automatically.
              </p>
              <Link to="/dashboard" className="inline-block bg-white text-brand-700 font-bold px-8 py-3 rounded-2xl hover:bg-indigo-50 transition shadow-lg">
                Get Your Referral Link
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-3">Why Veritas?</h2>
            <p className="text-gray-500 dark:text-gray-500">Built on blockchain. Designed for everyone.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card-dark p-5 flex gap-4">
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 dark:text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TradeModal market={tradingMarket} wallet={wallet} onClose={() => setTradingMarket(null)} />
    </div>
  );
}