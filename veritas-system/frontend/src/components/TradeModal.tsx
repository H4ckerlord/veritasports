import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import type { AzuroMarket } from '../hooks/useAzuroMarkets';
import { useI18n } from '../App';
import type { WalletState } from '../hooks/useWallet';

interface TradeModalProps {
  market: AzuroMarket | null;
  wallet: WalletState;
  onClose: () => void;
}

const LP_ABI = [
  'function bet(address lp, uint256 conditionId, uint256 outcomeId, uint128 amount, uint256 minOdds, uint256 deadline) returns (uint256)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
];

const CHAIN_CONTRACTS: Record<number, { lp: string; proxyFront: string; usdc: string }> = {
  80002: {
    lp: '0x904eBd7d03f6Fb60B47BcfC9fc5c1c8e5D5EFe44',
    proxyFront: '0x1234567890abcdef1234567890abcdef12345678',
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  },
  137: {
    lp: '0xd26a7e79b91e3b0b45571abac1a57a09c4abf9f6',
    proxyFront: '0xE6E98F69a23810DA9f1E9F0E89cbE6A34A3F8e5b',
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
};

function oddsToPercent(oddsRaw: string): number {
  const decimal = Number(oddsRaw);
  if (!decimal || decimal <= 0) return 50;
  return Math.round((1 / decimal) * 100);
}

function oddsToDecimal(oddsRaw: string): number {
  return Number(oddsRaw);
}

export default function TradeModal({ market, wallet, onClose }: TradeModalProps) {
  const { t } = useI18n();
  const [outcomeIndex, setOutcomeIndex] = useState<0 | 1>(0);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!market) return;
    setOutcomeIndex(0);
    setAmount('10');
  }, [market?.conditionId]);

  useEffect(() => {
    if (!wallet.signer || !wallet.chainId || !market) return;
    const contracts = CHAIN_CONTRACTS[wallet.chainId];
    if (!contracts) return;
    const usdc = new ethers.Contract(contracts.usdc, ERC20_ABI, wallet.signer);
    wallet.signer.getAddress().then((addr) => {
      usdc.balanceOf(addr).then(async (bal: bigint) => {
        const dec = await usdc.decimals();
        const formatted = (Number(bal) / 10 ** Number(dec)).toFixed(2);
        setUsdcBalance(formatted);
      }).catch(() => {});
    }).catch(() => {});
  }, [wallet.signer, wallet.chainId, market]);

  if (!market) return null;

  const [yes, no] = market.outcomes;
  const selectedOutcome = market.outcomes[outcomeIndex];
  const oddsDecimal = selectedOutcome ? oddsToDecimal(selectedOutcome.currentOdds) : 2;
  const amountNum = parseFloat(amount || '0');
  const potentialWin = (amountNum * oddsDecimal).toFixed(2);
  const profit = (amountNum * oddsDecimal - amountNum).toFixed(2);

  const yesPercent = yes ? oddsToPercent(yes.currentOdds) : 50;
  const noPercent = no ? oddsToPercent(no.currentOdds) : 50;

  async function handleBet() {
    if (!wallet.signer || !wallet.chainId) {
      toast.error('Connect your wallet first');
      return;
    }

    const contracts = CHAIN_CONTRACTS[wallet.chainId];
    if (!contracts) {
      toast.error('Switch to Polygon network');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (usdcBalance && amountNum > parseFloat(usdcBalance)) {
      toast.error(`Insufficient balance. You have ${usdcBalance} USDC`);
      return;
    }

    setLoading(true);
    try {
      const usdc = new ethers.Contract(contracts.usdc, ERC20_ABI, wallet.signer);
      const decimals: bigint = await usdc.decimals();
      const amountBig = BigInt(Math.round(amountNum * 10 ** Number(decimals)));
      const owner = await wallet.signer.getAddress();
      const allowance: bigint = await usdc.allowance(owner, contracts.proxyFront);

      if (allowance < amountBig) {
        toast('Approving USDC... Please confirm in MetaMask', { icon: '🔐' });
        const approveTx = await usdc.approve(contracts.proxyFront, amountBig * 2n);
        await approveTx.wait();
      }

      const lp = new ethers.Contract(contracts.proxyFront, LP_ABI, wallet.signer);
      const minOdds = BigInt(Math.floor(Number(selectedOutcome.currentOdds) * 0.97));
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

      toast('Placing bet... Please confirm in MetaMask', { icon: '⏳' });
      const betTx = await lp.bet(
        contracts.lp,
        BigInt(market.conditionId),
        BigInt(selectedOutcome.outcomeId),
        amountBig,
        minOdds,
        deadline
      );
      await betTx.wait();

      await fetch('/api/kyc?action=record_trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: owner, amount: amountNum, marketId: market.conditionId, outcome: outcomeIndex === 0 ? 'YES' : 'NO' }),
      }).catch(() => {});

      toast.success(t('trade.success'));
      onClose();
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes('rejected')) {
        toast.error('Transaction cancelled');
      } else if (err?.message?.includes('insufficient')) {
        toast.error('Insufficient USDC balance');
      } else {
        toast.error(t('trade.error'));
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
        <div className="p-5 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Trade Market</p>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
                {market.game.title}
              </h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl shrink-0">×</button>
          </div>

          {usdcBalance && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">Balance:</span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{usdcBalance} USDC</span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">

          {/* Outcome selector */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Select Outcome</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'YES', percent: yesPercent, outcome: yes, index: 0 as const, activeColor: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', textColor: 'text-emerald-700 dark:text-emerald-400', percentColor: 'text-emerald-600 dark:text-emerald-300' },
                { label: 'NO', percent: noPercent, outcome: no, index: 1 as const, activeColor: 'border-red-500 bg-red-50 dark:bg-red-500/10', textColor: 'text-red-700 dark:text-red-400', percentColor: 'text-red-600 dark:text-red-300' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setOutcomeIndex(opt.index)}
                  className={`border-2 rounded-2xl p-4 transition text-left ${
                    outcomeIndex === opt.index
                      ? opt.activeColor
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${outcomeIndex === opt.index ? opt.textColor : 'text-gray-700 dark:text-gray-300'}`}>
                      {opt.label}
                    </span>
                    {outcomeIndex === opt.index && (
                      <span className="w-4 h-4 rounded-full bg-current opacity-80 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                  <p className={`text-2xl font-black ${outcomeIndex === opt.index ? opt.percentColor : 'text-gray-900 dark:text-white'}`}>
                    {opt.percent}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Price · {oddsToDecimal(opt.outcome?.currentOdds ?? '2').toFixed(2)}x
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Probability bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>YES {yesPercent}%</span>
              <span>NO {noPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                style={{ width: `${yesPercent}%` }}
              />
              <div
                className="h-full bg-red-500 rounded-r-full transition-all duration-500"
                style={{ width: `${noPercent}%` }}
              />
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide">Amount</label>
              {usdcBalance && (
                <button
                  onClick={() => setAmount(usdcBalance)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  Max: {usdcBalance}
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
                className="w-full border-2 border-gray-200 dark:border-white/10 focus:border-brand-500 rounded-2xl px-4 py-3 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none text-lg font-bold pr-20 transition"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">USDC</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {['10', '25', '50', '100'].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  amount === v
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                ${v}
              </button>
            ))}
          </div>

          {/* Payout summary */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Stake</span>
              <span className="font-bold text-gray-900 dark:text-white">{amountNum.toFixed(2)} USDC</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-bold text-gray-900 dark:text-white">{outcomeIndex === 0 ? yesPercent : noPercent}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Odds</span>
              <span className="font-bold text-gray-900 dark:text-white">{oddsDecimal.toFixed(2)}x</span>
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Potential Return</span>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{potentialWin} USDC</span>
                <p className="text-xs text-emerald-500">+{profit} profit</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          {wallet.address ? (
            <button
              onClick={handleBet}
              disabled={loading || amountNum <= 0}
              className={`w-full font-black py-4 rounded-2xl text-base transition ${
                outcomeIndex === 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60'
                  : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-60'
              }`}
            >
              {loading ? 'Processing...' : `Bet ${outcomeIndex === 0 ? 'YES' : 'NO'} — ${amountNum > 0 ? amountNum.toFixed(0) : '0'} USDC`}
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
            3% slippage tolerance applied. Market resolves automatically via Azuro oracle.
          </p>
        </div>
      </div>
    </div>
  );
}