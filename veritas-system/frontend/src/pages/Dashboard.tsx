import { useState } from 'react';
import { useI18n } from '../App';
import { useReferral } from '../hooks/useReferral';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

const AZURO_BET_URL = 'https://app.azuro.org/profile/bets';

export default function Dashboard() {
  const { t } = useI18n();
  const { wallet } = useOutletContext<{ wallet: WalletState }>();
  const {
    data: referralData,
    loading: referralLoading,
    referralLink,
    generateCode,
    claimRewards,
  } = useReferral(wallet.address);

  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('dashboard.copied'));
  }

  async function handleGenerateCode() {
    if (!wallet.address) return;
    await generateCode(wallet.address);
  }

  async function handleClaim() {
    if (!wallet.address) return;
    setClaiming(true);
    await claimRewards(wallet.address);
    setClaiming(false);
  }

  if (!wallet.address) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 space-y-4">
        <div className="text-6xl">🔐</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Connect Your Wallet</h2>
        <p className="text-gray-500">{t('dashboard.connectWallet')}</p>
        <button
          onClick={() => wallet.connect()}
          className="btn-primary px-8 py-3 rounded-2xl text-base"
        >
          {t('common.connectWallet')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 dark:text-white">{t('dashboard.title')}</h1>

      {/* Wallet Card */}
      <div className="card-dark p-5">
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-1 uppercase tracking-wide">Connected Wallet</p>
        <p className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{wallet.address}</p>
      </div>

      {/* Open Bets — Direct Link */}
      <div className="card-dark p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Open Bets and Winnings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your bets are settled on the Azuro smart contract. Click the button below to go directly to your bets page where you can see all open bets and claim any winnings with one click.
        </p>

        {/* Primary action - takes user directly to their bets */}
        
          href={`${AZURO_BET_URL}?address=${wallet.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-4 rounded-2xl transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <p className="font-bold">View My Bets and Claim Winnings</p>
              <p className="text-xs text-emerald-200">Opens your personal bets page on Azuro</p>
            </div>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
        </a>

        {/* Secondary direct link */}
        
          href="https://app.azuro.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full border border-gray-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500 text-gray-700 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium px-5 py-3 rounded-2xl transition text-sm"
        >
          <span>🔗</span>
          <span>Open Azuro App</span>
        </a>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">How to Claim Winnings:</p>
          <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-none">
            {[
              'Click "View My Bets" button above',
              'Connect the same MetaMask wallet you used to bet',
              'Find your winning bet in the list',
              'Click "Claim" next to any resolved winning bet',
              'Confirm in MetaMask — USDC arrives in seconds',
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-bold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Referral Section */}
      <div className="card-dark p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Referrals and Rewards</h2>

        {referralLoading ? (
          <div className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ) : referralLink ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">{t('dashboard.referralLink')}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-400"
                />
                <button
                  onClick={copyLink}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {referralData?.pendingUsdc ?? '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Pending USDC</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {referralData?.claimedUsdc ?? '0.00'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Claimed USDC</p>
              </div>
            </div>

            {parseFloat(referralData?.pendingUsdc ?? '0') > 0 && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3 rounded-2xl transition"
              >
                {claiming ? 'Processing...' : `Claim ${referralData?.pendingUsdc} USDC`}
              </button>
            )}

            <div className="text-xs text-gray-400 dark:text-gray-600 space-y-1">
              <p>Total referrals: {referralData?.referrals?.length ?? 0}</p>
              <p>You earn 30% of 2% platform fee from each referred user's trades</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Generate your referral link and earn rewards when friends trade.
            </p>
            <button
              onClick={handleGenerateCode}
              className="btn-primary px-6 py-3 rounded-2xl text-sm"
            >
              Generate Referral Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}