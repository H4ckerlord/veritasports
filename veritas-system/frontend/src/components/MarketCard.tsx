import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useI18n } from '../App';

interface MarketCardProps {
  market: AzuroMarket;
  onTrade?: (market: AzuroMarket) => void;
}

function formatOdds(oddsRaw: string): string {
  const decimal = Number(oddsRaw) / 1e9;
  return decimal.toFixed(2);
}

function useCountdown(endTimestamp: number) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function calc() {
      const diff = endTimestamp * 1000 - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); setUrgent(false); return; }
      const hours = diff / 3600000;
      setUrgent(hours < 3);
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (days > 0) setTimeLeft(`${days}d ${hrs}h`);
      else if (hrs > 0) setTimeLeft(`${hrs}h ${mins}m`);
      else setTimeLeft(`${mins}m ${secs}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTimestamp]);

  return { timeLeft, urgent };
}

function ShareMenu({ market }: { market: AzuroMarket }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/markets/${market.conditionId}`;
  const text = `Predict "${market.game.title}" on Veritas and win USDC!`;

  const shares = [
    { label: '𝕏 Twitter', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank') },
    { label: '💬 WhatsApp', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank') },
    { label: '✈️ Telegram', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank') },
    { label: '👍 Facebook', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank') },
    {
      label: copied ? '✓ Copied!' : '🔗 Copy Link',
      action: () => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="text-xs text-gray-500 hover:text-brand-400 transition flex items-center gap-1"
      >
        Share ↗
      </button>
      {open && (
        <div className="absolute bottom-6 left-0 z-20 glass rounded-2xl shadow-2xl p-2 w-44 animate-slide-up">
          {shares.map((s) => (
            <button
              key={s.label}
              onClick={(e) => { e.preventDefault(); s.action(); }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-white/10 transition"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketCard({ market, onTrade }: MarketCardProps) {
  const { t } = useI18n();
  const [yes, no] = market.outcomes;
  const { timeLeft, urgent } = useCountdown(Number(market.game.startsAt));

  return (
    <div className="card-dark p-5 flex flex-col gap-4 group cursor-pointer">

      {/* Timer badge */}
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
          urgent
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : 'bg-white/5 text-gray-400 border border-white/10'
        }`}>
          {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
          ⏱ {timeLeft}
        </span>
        <ShareMenu market={market} />
      </div>

      {/* Title */}
      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors">
        {market.game.title}
      </h3>

      {/* Odds */}
      <div className="grid grid-cols-2 gap-2">
        {yes && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center hover:bg-emerald-500/20 transition cursor-pointer"
            onClick={() => onTrade?.(market)}>
            <p className="text-xs font-semibold text-emerald-400 mb-1">{t('markets.yes')}</p>
            <p className="text-xl font-black text-emerald-300">{formatOdds(yes.currentOdds)}x</p>
          </div>
        )}
        {no && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center hover:bg-red-500/20 transition cursor-pointer"
            onClick={() => onTrade?.(market)}>
            <p className="text-xs font-semibold text-red-400 mb-1">{t('markets.no')}</p>
            <p className="text-xl font-black text-red-300">{formatOdds(no.currentOdds)}x</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/markets/${market.conditionId}`}
          className="flex-1 text-center text-xs text-gray-500 hover:text-brand-400 py-2 border border-white/5 rounded-xl hover:border-brand-500/30 transition"
        >
          Details
        </Link>
        {onTrade && (
          <button
            onClick={() => onTrade(market)}
            className="flex-2 flex-grow btn-primary px-4 py-2 text-sm rounded-xl relative z-10"
          >
            <span className="relative z-10">{t('markets.trade')}</span>
          </button>
        )}
      </div>
    </div>
  );
}