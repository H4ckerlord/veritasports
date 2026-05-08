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
    const step = value / 40;
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

export default function Home() {
  const { t } = useI18n();
  const { data: markets, isLoading } = useAzuroMarkets();
  const [tradingMarket, setTradingMarket] = useState<AzuroMarket | null>(null);
  const { wallet } = useOutletContext<{ wallet: WalletState }>();
  const featured = markets?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb w-96 h-96 bg-brand-600/20 -top-20 -left-20" style={{ animationDelay: '0s' }} />
          <div className="orb w-72 h-72 bg-brand-500/15 top-40 right-10" style={{ animationDelay: '2s' }} />
          <div className="orb w-48 h-48 bg-gold-500/10 bottom-10 left-1/3" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0 bg-dots opacity-50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Azuro Protocol · Polygon Blockchain
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tight mb-6 animate-slide-up">
            <span className="block">Predict.</span>
            <span className="block gradient-text">Win.</span>
            <span className="block text-white/80">Repeat.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10 animate-fade-in leading-relaxed">
            The world's most transparent sports prediction market.
            Non-custodial, decentralised, and resolved automatically by smart contracts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up">
            <Link
              to="/markets"
              className="btn-primary px-8 py-4 text-base rounded-2xl w-full sm:w-auto text-center relative z-10"
            >
              <span className="relative z-10">Browse Markets</span>
            </Link>
            <Link
              to="/how-to-trade"
              className="px-8 py-4 text-base rounded-2xl w-full sm:w-auto text-center border border-white/10 text-gray-300 hover:border-brand-500/50 hover:text-white hover:bg-white/5 transition-all"
            >
              Learn How to Trade
            </Link>
          </div>

          {/* Sports strip */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {sports.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-sm text-gray-400"
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Sports Markets', value: markets?.length ?? 0, suffix: '+' },
              { label: 'Protocol', value: 'Azuro', isText: true },
              { label: 'Settlement', value: 'Blockchain', isText: true },
              { label: 'KYC Tiers', value: 3, suffix: '' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-2xl sm:text-3xl font-black gradient-text">
                  {stat.isText
                    ? stat.value
                    : <AnimatedNumber value={stat.value as number} suffix={stat.suffix} />
                  }
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-20">

        {/* Featured Markets */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Hot Markets</h2>
              <p className="text-gray-500 text-sm mt-1">Trade on the biggest sport events</p>
            </div>
            <Link
              to="/markets"
              className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition"
            >
              View all
              <span className="text-lg">›</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <p className="text-5xl">⚽</p>
              <p className="text-gray-500">{t('markets.noMarkets')}</p>
              <Link
                to="/how-to-trade"
                className="inline-block btn-primary px-6 py-3 rounded-2xl text-sm relative z-10"
              >
                <span className="relative z-10">Learn While You Wait</span>
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
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">How It Works</h2>
            <p className="text-gray-500">Start trading in 3 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🔗', title: 'Connect Wallet', desc: 'Connect MetaMask with one click. No registration or email needed.' },
              { step: '02', icon: '🎯', title: 'Pick a Market', desc: 'Browse sport markets. Choose YES or NO on your prediction.' },
              { step: '03', icon: '💰', title: 'Claim Winnings', desc: 'Azuro oracle resolves results automatically. Claim instantly on-chain.' },
            ].map((item) => (
              <div key={item.step} className="card-dark p-6 text-center relative group">
                <div className="absolute top-4 right-4 text-xs font-black text-brand-500/30 text-2xl">
                  {item.step}
                </div>
                <div className="text-4xl mb-4 group-hover:animate-float inline-block">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live Activity */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white">Live Activity</h2>
              <p className="text-gray-500 text-sm mt-1">Real-time bets from the Azuro network</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
          <div className="card-dark p-4">
            <LiveBetFeed />
          </div>
        </section>

        {/* Referral banner */}
        <section>
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)' }}>
            <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
            <div className="orb w-48 h-48 bg-white/10 -top-10 -right-10" />
            <div className="orb w-32 h-32 bg-white/10 -bottom-5 -left-5" style={{ animationDelay: '3s' }} />
            <div className="relative">
              <p className="text-3xl mb-3">🎁</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                Earn 1 USDC Per Referral
              </h2>
              <p className="text-indigo-200 mb-6 max-w-md mx-auto">
                Share your referral link. Every friend who makes their first trade earns you 1 USDC automatically.
              </p>
              <Link
                to="/dashboard"
                className="inline-block bg-white text-brand-700 font-bold px-8 py-3 rounded-2xl hover:bg-indigo-50 transition-all hover:shadow-lg"
              >
                Get Your Referral Link
              </Link>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Why Veritas?</h2>
            <p className="text-gray-500">Built on blockchain. Designed for everyone.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🔒', title: 'Non-Custodial', desc: 'Your funds stay in your wallet. We never hold your money.' },
              { icon: '⚡', title: 'Instant Settlement', desc: 'Winnings available to claim within hours of match end.' },
              { icon: '🌍', title: 'Global Access', desc: 'Available worldwide. Trade from anywhere, anytime.' },
              { icon: '📊', title: 'Transparent Odds', desc: 'All odds and market data are publicly verifiable on-chain.' },
              { icon: '🛡️', title: 'KYC Protected', desc: 'Tiered identity system ensures fair and safe trading for all.' },
              { icon: '🤝', title: 'Azuro Protocol', desc: 'Backed by Azuro liquidity. Deep markets, fair prices.' },
            ].map((f) => (
              <div key={f.title} className="card-dark p-5 flex gap-4">
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
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