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

  useEffect(() => {
    function calc() {
      const diff = endTimestamp * 1000 - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m ${secs}s`);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endTimestamp]);

  return timeLeft;
}

function ShareButtons({ market }: { market: AzuroMarket }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/markets/${market.conditionId}`;
  const text = `I just bet on "${market.game.title}" on Veritas! Join me and predict the outcome!`;

  function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }
  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }
  function shareTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }
  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <span className="text-xs text-gray-400">Share:</span>
      <button onClick={shareTwitter} title="Share on Twitter" className="text-base hover:scale-110 transition-transform">𝕏</button>
      <button onClick={shareWhatsapp} title="Share on WhatsApp" className="text-base hover:scale-110 transition-transform">💬</button>
      <button onClick={shareTelegram} title="Share on Telegram" className="text-base hover:scale-110 transition-transform">✈️</button>
      <button onClick={shareFacebook} title="Share on Facebook" className="text-base hover:scale-110 transition-transform">👍</button>
      <button
        onClick={copyLink}
        title="Copy link"
        className="text-xs text-gray-400 hover:text-brand-500 transition ml-1"
      >
        {copied ? '✓ Copied' : '🔗 Copy'}
      </button>
    </div>
  );
}

export default function MarketCard({ market, onTrade }: MarketCardProps) {
  const { t } = useI18n();
  const [yes, no] = market.outcomes;
  const countdown = useCountdown(Number(market.game.startsAt));
  const endTime = Number(market.game.startsAt);
  const hoursLeft = (endTime * 1000 - Date.now()) / 3600000;
  const isUrgent = hoursLeft < 2 && hoursLeft > 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-semibold flex items-center gap-1 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}>
            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />}
            {t('markets.endsIn')} {countdown}
          </span>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-3">
          {market.game.title}
        </h3>
      </div>

      {/* Odds */}
      <div className="flex gap-3">
        {yes && (
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">{t('markets.yes')}</p>
            <p className="font-bold text-lg text-emerald-700 dark:text-emerald-300">{formatOdds(yes.currentOdds)}x</p>
          </div>
        )}
        {no && (
          <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-0.5">{t('markets.no')}</p>
            <p className="font-bold text-lg text-rose-700 dark:text-rose-300">{formatOdds(no.currentOdds)}x</p>
          </div>
        )}
      </div>

      {/* Share buttons */}
      <ShareButtons market={market} />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
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