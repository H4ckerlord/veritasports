import { useState } from 'react';
import { useI18n } from '../App';
import { useReferral } from '../hooks/useReferral';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';
import type { WalletState } from '../hooks/useWallet';

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
        <div className="text-5xl">🔐</div>
        <p className="text-gray-500 dark:text-gray-400">{t('dashboard.connectWallet')}</p>
        <button
          onClick={() => wallet.connect()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          {t('common.connectWallet')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
        <p className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">{wallet.address}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('dashboard.openBets')}</h2>
        <p className="text-sm text-gray-400">
          Your open bets and claimable winnings are managed directly on Azuro.{' '}
          <a href="https://azuro.org" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
            Visit Azuro →
          </a>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.referrals')}</h2>

        {referralLoading ? (
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : referralLink ? (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-2">{t('dashboard.referralLink')}</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 dark:text-gray-400"
                />
                <button
                  onClick={copyLink}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition"
                >
                  {copied ? t('dashboard.copied') : t('dashboard.copy')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {referralData?.pendingUsdc ?? '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{t('dashboard.pendingRewards')} USDC</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {referralData?.claimedUsdc ?? '0.00'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Claimed USDC</p>
              </div>
            </div>

            {parseFloat(referralData?.pendingUsdc ?? '0') > 0 && (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
              >
                {claiming ? 'Processing…' : t('dashboard.claimRewards')}
              </button>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Generate a referral link and earn 30% for each friend who makes their first trade.
            </p>
            <button
              onClick={handleGenerateCode}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition text-sm"
            >
              {t('referral.getLink')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}