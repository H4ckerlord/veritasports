import { useState } from 'react';
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

// Minimal Azuro LP ABI for placeBet
const LP_ABI = [
  'function bet(address lp, uint256 conditionId, uint256 outcomeId, uint128 amount, uint256 minOdds, uint256 deadline) returns (uint256)',
];

// USDC ABI - approve + allowance
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const CHAIN_CONTRACTS: Record<
  number,
  { lp: string; proxyFront: string; usdc: string }
> = {
  80002: {
    lp: '0x904eBd7d03f6Fb60B47BcfC9fc5c1c8e5D5EFe44',
    proxyFront: '0x1234567890abcdef1234567890abcdef12345678', // replace with Azuro ProxyFront
    usdc: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
  },
  137: {
    lp: '0xd26a7e79b91e3b0b45571abac1a57a09c4abf9f6',
    proxyFront: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', // replace with mainnet ProxyFront
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
};

export default function TradeModal({ market, wallet, onClose }: TradeModalProps) {
  const { t } = useI18n();
  const [outcomeIndex, setOutcomeIndex] = useState<0 | 1>(0);
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);

  if (!market) return null;

  const selectedOutcome = market.outcomes[outcomeIndex];
  const oddsDecimal = selectedOutcome
    ? Number(selectedOutcome.currentOdds) / 1e9
    : 0;
  const potentialWin = (parseFloat(amount || '0') * oddsDecimal).toFixed(2);

  async function handleBet() {
    if (!wallet.signer || !wallet.chainId) {
      toast.error('Connect your wallet first');
      return;
    }

    const contracts = CHAIN_CONTRACTS[wallet.chainId];
    if (!contracts) {
      toast.error('Unsupported network. Please switch to Polygon.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const usdc = new ethers.Contract(contracts.usdc, ERC20_ABI, wallet.signer);
      const decimals: bigint = await usdc.decimals();
      const amountBig = BigInt(Math.round(amountNum * 10 ** Number(decimals)));

      // Check and set allowance
      const owner = await wallet.signer.getAddress();
      const allowance: bigint = await usdc.allowance(owner, contracts.proxyFront);
      if (allowance < amountBig) {
        const approveTx = await usdc.approve(contracts.proxyFront, amountBig);
        await approveTx.wait();
      }

      // Place bet via Azuro ProxyFront
      const lp = new ethers.Contract(contracts.proxyFront, LP_ABI, wallet.signer);
      const minOdds = BigInt(Math.floor(Number(selectedOutcome.currentOdds) * 0.98)); // 2% slippage
      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 min

      const betTx = await lp.bet(
        contracts.lp,
        BigInt(market.conditionId),
        BigInt(selectedOutcome.outcomeId),
        amountBig,
        minOdds,
        BigInt(deadline)
      );
      await betTx.wait();

     toast.success(t('trade.success'));

      // Record trade in our platform database
      try {
        await fetch('/api/kyc?action=record_trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: owner,
            amount: amountNum,
            marketId: market.conditionId,
            outcome: outcomeIndex === 0 ? 'YES' : 'NO',
          }),
        });
      } catch {
        // Silent - trade recording is non-critical
      }

      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('user rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(t('trade.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {t('trade.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Market title */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
            {market.game.title}
          </p>

          {/* Outcome selector */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('trade.selectOutcome')}</p>
            <div className="flex gap-3">
              {market.outcomes.map((outcome, i) => (
                <button
                  key={outcome.outcomeId}
                  onClick={() => setOutcomeIndex(i as 0 | 1)}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition border-2 ${
                    outcomeIndex === i
                      ? i === 0
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-rose-500 border-rose-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400'
                  }`}
                >
                  {i === 0 ? t('markets.yes') : t('markets.no')}
                  <span className="block text-xs opacity-80">
                    {(Number(outcome.currentOdds) / 1e9).toFixed(2)}×
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              {t('trade.amount')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                USDC
              </span>
            </div>
          </div>

          {/* Potential win */}
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('trade.potentialWin')}
            </span>
            <span className="font-bold text-brand-700 dark:text-brand-300 text-lg">
              {potentialWin} USDC
            </span>
          </div>

          {/* CTA */}
          {wallet.address ? (
            <button
              onClick={handleBet}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition"
            >
              {loading ? 'Processing…' : t('trade.confirm')}
            </button>
          ) : (
            <p className="text-center text-sm text-gray-500">
              {t('dashboard.connectWallet')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
