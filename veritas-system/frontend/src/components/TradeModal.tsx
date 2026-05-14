import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import type { WalletState } from '../hooks/useWallet';
import { oddsToPercent, getDecimalOdds, getYesNo } from '../utils/odds';

interface TradeModalProps {
  market: AzuroMarket | null;
  wallet: WalletState;
  onClose: () => void;
}

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
];

const LP_ABI = [
  'function bet(address core, uint256 conditionId, uint64 outcomeId, uint128 amount, uint64 deadline, uint64 minOdds) returns (uint256)',
];

const CHAIN_CONFIG: Record<number, { lp: string; usdc: string }> = {
  137: {
    lp: '0xd26a7e79b91e3b0b45571abac1a57a09c4abf9f6',
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  80002: {
    lp: '0x904eBd7d03f6Fb60B47BcfC9fc5c1c8e5D5EFe44',
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  },
};

export default function TradeModal({ market, wallet, onClose }: TradeModalProps) {
  const [outcomeIndex, setOutcomeIndex] = useState<0 | 1>(0);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!market) return;
    setOutcomeIndex(0);
    setAmount('10');
  }, [market?.conditionId]);

  useEffect(() => {
    if (!wallet.signer || !wallet.chainId || !market) return;
    const cfg = CHAIN_CONFIG[wallet.chainId];
    if (!cfg) return;
    const usdc = new ethers.Contract(cfg.usdc, ERC20_ABI, wallet.signer);
    wallet.signer.getAddress()
      .then(async (addr) => {
        const [bal, dec] = await Promise.all([usdc.balanceOf(addr), usdc.decimals()]);
        setBalance((Number(bal) / 10 ** Number(dec)).toFixed(2));
      })
      .catch(() => {});
  }, [wallet.signer, wallet.chainId, market]);

  if (!market) return null;

  const { yes, no } = getYesNo(market.outcomes);
  const selectedOutcome = outcomeIndex === 0 ? yes : no;

  // V3 odds are already decimal — use directly
  const selectedOdds = selectedOutcome ? getDecimalOdds(selectedOutcome.currentOdds) : 2;
  const yesPercent = yes ? oddsToPercent(yes.currentOdds) : 50;
  const noPercent = no ? oddsToPercent(no.currentOdds) : 50;

  const amountNum = parseFloat(amount || '0');
  const potentialReturn = (amountNum * selectedOdds).toFixed(2);
  const profit = (amountNum * selectedOdds - amountNum).toFixed(2);

  async function handleBet() {
    if (!wallet.signer || !wallet.chainId) {
      toast.error('Please connect your wallet first');
      return;
    }
    const cfg = CHAIN_CONFIG[wallet.chainId];
    if (!cfg) {
      toast.error('Please switch to Polygon network');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (balance && amountNum > parseFloat(balance)) {
      toast.error(`Insufficient USDC. You have ${balance} USDC`);
      return;
    }
    if (!selectedOutcome) return;

    setLoading(true);
    try {
      const usdc = new ethers.Contract(cfg.usdc, ERC20_ABI, wallet.signer);
      const decimals: bigint = await usdc.decimals();
      const amountBig = BigInt(Math.round(amountNum * 10 ** Number(decimals)));
      const owner = await wallet.signer.getAddress();
      const allowance: bigint = await usdc.allowance(owner, cfg.lp);

      if (allowance < amountBig) {
        toast('Approving USDC... confirm in MetaMask', { icon: '🔐' });
        const tx = await usdc.approve(cfg.lp, amountBig * 10n);
        await tx.wait();
      }

      const lp = new ethers.Contract(cfg.lp, LP_ABI, wallet.signer);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      // Convert decimal odds to V3 format (multiply by 1e9 for contract)
      const oddsForContract = BigInt(Math.floor(selectedOdds * 0.97 * 1e9));

      toast('Placing bet... confirm in MetaMask', { icon: '⏳' });
      const betTx = await lp.bet(
        cfg.lp,
        BigInt(market.conditionId),
        BigInt(selectedOutcome.outcomeId),
        amountBig,
        deadline,
        oddsForContract
      );
      await betTx.wait();

      // Record in platform DB
      wallet.signer.getAddress().then((addr) => {
        fetch('/api/kyc?action=record_trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: addr,
            amount: amountNum,
            marketId: market.conditionId,
            outcome: outcomeIndex === 0 ? 'YES' : 'NO',
          }),
        }).catch(() => {});
      });

      toast.success('Bet placed successfully! 🎉');
      onClose();
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001 || e?.message?.includes('rejected')) {
        toast.error('Transaction cancelled');
      } else if (e?.message?.includes('insufficient')) {
        toast.error('Insufficient USDC balance');
      } else {
        toast.error('Transaction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 animate-slide-up">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Trade Market</p>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">
              {market.game.title}
            </h2>
            {balance && (
              <p className="text-xs text-gray-400 mt-1">
                Balance: <span className="font-bold text-gray-700 dark:text-gray-300">{balance} USDC</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none shrink-0">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* YES / NO selector */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Choose Outcome</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'YES',
                  pct: yesPercent,
                  odds: yes ? yes.currentOdds : '2.00',
                  idx: 0 as const,
                  active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
                  text: 'text-emerald-700 dark:text-emerald-400',
                  pctText: 'text-emerald-600 dark:text-emerald-300',
                },
                {
                  label: 'NO',
                  pct: noPercent,
                  odds: no ? no.currentOdds : '2.00',
                  idx: 1 as const,
                  active: 'border-red-500 bg-red-50 dark:bg-red-500/10',
                  text: 'text-red-700 dark:text-red-400',
                  pctText: 'text-red-600 dark:text-red-300',
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setOutcomeIndex(opt.idx)}
                  className={`rounded-2xl p-4 border-2 text-left transition ${
                    outcomeIndex === opt.idx
                      ? opt.active
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 bg-white dark:bg-white/5'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase mb-1 ${outcomeIndex === opt.idx ? opt.text : 'text-gray-500'}`}>
                    {opt.label}
                  </p>
                  <p className={`text-2xl font-black ${outcomeIndex === opt.idx ? opt.pctText : 'text-gray-900 dark:text-white'}`}>
                    {opt.pct}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {parseFloat(opt.odds).toFixed(2)}x payout
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Probability bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>YES {yesPercent}%</span>
              <span>NO {noPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-white/10">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${yesPercent}%` }} />
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${noPercent}%` }} />
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Stake Amount</label>
              {balance && (
                <button
                  onClick={() => setAmount(balance)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-semibold"
                >
                  Max {balance}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-gray-200 dark:border-white/10 focus:border-brand-500 rounded-2xl px-4 py-3 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white text-lg font-bold pr-20 focus:outline-none transition"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                USDC
              </span>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {['5', '10', '25', '50'].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition ${
                  amount === v
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>

          {/* Payout summary */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 space-y-2.5 border border-gray-100 dark:border-white/5">
            {[
              { label: 'Stake', value: `${amountNum.toFixed(2)} USDC` },
              { label: 'Odds', value: `${selectedOdds.toFixed(2)}x` },
              { label: 'Probability', value: `${outcomeIndex === 0 ? yesPercent : noPercent}%` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{row.value}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-white/10 pt-2.5 flex justify-between items-end">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Potential Return</span>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{potentialReturn} USDC</p>
                <p className="text-xs text-emerald-500">+{profit} profit</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          {wallet.address ? (
            <button
              onClick={handleBet}
              disabled={loading || amountNum <= 0}
              className={`w-full font-black py-4 rounded-2xl text-base transition disabled:opacity-60 ${
                outcomeIndex === 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {loading
                ? 'Processing...'
                : `Bet ${outcomeIndex === 0 ? 'YES' : 'NO'} · ${amountNum > 0 ? amountNum.toFixed(0) : '0'} USDC`}
            </button>
          ) : (
            <button
              onClick={wallet.connect}
              className="w-full btn-primary py-4 rounded-2xl text-base font-bold"
            >
              Connect Wallet to Trade
            </button>
          )}

          <p className="text-xs text-gray-400 text-center">
            3% slippage protection · Resolved automatically by Azuro oracle
          </p>
        </div>
      </div>
    </div>
  );
}