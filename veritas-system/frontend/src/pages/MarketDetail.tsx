import { useParams, useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import { useI18n } from '../App';
import { useAzuroMarket } from '../hooks/useAzuroMarkets';
import TradeModal from '../components/TradeModal';
import EmailNotify from '../components/EmailNotify';
import type { WalletState } from '../hooks/useWallet';

function oddsToPercent(oddsRaw: string): number {
  const decimal = Number(oddsRaw);
  if (!decimal || decimal <= 0) return 50;
  return Math.round((1 / decimal) * 100);
}

function oddsToDecimal(oddsRaw: string): number {
  return Number(oddsRaw);
}

function useCountdown(endTimestamp: number) {
  const diff = endTimestamp * 1000 - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hrs}h remaining`;
  if (hrs > 0) return `${hrs}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { market, isLoading } = useAzuroMarket(id);
  const [tradeOpen, setTradeOpen] = useState(false);
  const { wallet } = useOutletContext<{ wallet: WalletState }>();

  const url = window.location.href;
  const shareText = market ? `Predict "${market.game.title}" on Veritas! Join me and win USDC.` : '';

  function share(platform: string) {
    const encoded = encodeURIComponent(shareText);
    const urlEnc = encodeURIComponent(url);
    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encoded}&url=${urlEnc}`,
      whatsapp: `https://wa.me/?text=${encoded}%20${urlEnc}`,
      telegram: `https://t.me/share/url?url=${urlEnc}&text=${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`,
    };
    window.open(links[platform], '_blank');
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-5xl">🔍</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Market not found</h2>
        <p className="text-gray-500">This market may have ended or does not exist.</p>
        <a href="/markets" className="inline-block btn-primary px-6 py-3 rounded-2xl">Browse Markets</a>
      </div>
    );
  }

  const [yes, no] = market.outcomes;
  const yesPercent = yes ? oddsToPercent(yes.currentOdds) : 50;
  const noPercent = no ? oddsToPercent(no.currentOdds) : 50;
  const yesOdds = oddsToDecimal(yes?.currentOdds ?? '2').toFixed(2);
  const noOdds = oddsToDecimal(no?.currentOdds ?? '2').toFixed(2);
  const timeLeft = useCountdown(Number(market.game.startsAt));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Market header */}
      <div className="space-y-2">
        {market.game.sport && (
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold">
            {market.game.sport.name}
          </span>
        )}
        <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-snug">
          {market.game.title}
        </h1>
        <p className="text-sm text-gray-500">⏱ {timeLeft}</p>
      </div>

      {/* Probability display */}
      <div className="card-dark p-6 space-y-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Market Probability</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 text-center">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2">YES</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-300">{yesPercent}%</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">{yesOdds}x payout</p>
          </div>
          <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-5 text-center">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase mb-2">NO</p>
            <p className="text-4xl font-black text-red-600 dark:text-red-300">{noPercent}%</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{noOdds}x payout</p>
          </div>
        </div>

        {/* Visual probability bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>YES {yesPercent}%</span>
            <span>NO {noPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${yesPercent}%` }} />
            <div className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700" style={{ width: `${noPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Market info */}
      <div className="card-dark p-5 space-y-3 text-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Market Details</p>
        {[
          { label: 'Condition ID', value: market.conditionId, mono: true },
          { label: 'Status', value: market.status, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Resolution', value: 'Automatic — Azuro Oracle' },
          { label: 'Network', value: 'Polygon Blockchain' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-gray-500">{row.label}</span>
            <span className={`font-semibold text-right truncate max-w-[200px] ${row.mono ? 'font-mono text-xs' : ''} ${row.color ?? 'text-gray-900 dark:text-white'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Trade button */}
      <button
        onClick={() => setTradeOpen(true)}
        className="w-full btn-primary py-4 rounded-2xl text-lg font-black"
      >
        Trade This Market
      </button>

      {/* Email notification */}
      <EmailNotify wallet={wallet.address} marketId={market.conditionId} />

      {/* Share */}
      <div className="card-dark p-5 space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Share This Market</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '𝕏 Twitter', platform: 'twitter', color: 'hover:bg-gray-100 dark:hover:bg-white/5' },
            { label: '💬 WhatsApp', platform: 'whatsapp', color: 'hover:bg-gray-100 dark:hover:bg-white/5' },
            { label: '✈️ Telegram', platform: 'telegram', color: 'hover:bg-gray-100 dark:hover:bg-white/5' },
            { label: '👍 Facebook', platform: 'facebook', color: 'hover:bg-gray-100 dark:hover:bg-white/5' },
          ].map((s) => (
            <button
              key={s.platform}
              onClick={() => share(s.platform)}
              className={`border border-gray-200 dark:border-white/10 ${s.color} text-gray-700 dark:text-gray-300 text-sm font-medium py-2.5 rounded-xl transition`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <TradeModal market={tradeOpen ? market : null} wallet={wallet} onClose={() => setTradeOpen(false)} />
    </div>
  );
}