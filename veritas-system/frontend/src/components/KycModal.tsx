import { useState, useEffect } from 'react';

interface KycStatus {
  tier: number;
  cumulativeVolume: number;
  status: string;
  isFrozen: boolean;
  freezeReason: string | null;
  tier1Remaining: number;
  needsTier2: boolean;
  needsTier3: boolean;
}

interface KycModalProps {
  wallet: string | null;
}

export default function KycModal({ wallet }: KycModalProps) {
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [open, setOpen] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;
    fetchKycStatus(wallet);
    const interval = setInterval(() => fetchKycStatus(wallet), 60_000);
    return () => clearInterval(interval);
  }, [wallet]);

  async function fetchKycStatus(walletAddr: string) {
    try {
      const res = await fetch(`/api/kyc?wallet=${encodeURIComponent(walletAddr)}`);
      if (!res.ok) return;
      const data = await res.json() as KycStatus;
      setKycStatus(data);
      if (data.isFrozen || data.needsTier2) setOpen(true);
    } catch {
      // silent
    }
  }

  async function startKyc() {
    if (!wallet) return;
    setInitiating(true);
    try {
      const res = await fetch('/api/kyc?action=initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      if (!res.ok) throw new Error('Failed to start verification');
      const data = await res.json() as { sessionUrl: string };
      setSessionUrl(data.sessionUrl);
    } catch {
      // silent
    } finally {
      setInitiating(false);
    }
  }

  if (!wallet || !kycStatus || (!open && !kycStatus.isFrozen && !kycStatus.needsTier2)) {
    return null;
  }

  if (!open) return null;

  const isTier1AtLimit = kycStatus.needsTier2;
  const isFrozen = kycStatus.isFrozen;
  const isPendingVerification = kycStatus.status === 'tier2_pending';
  const isVerificationFailed = kycStatus.status === 'tier2_failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xl">
              {isFrozen ? '🔒' : '🪪'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {isFrozen ? 'Account Frozen' : 'Identity Verification Required'}
              </h2>
              <p className="text-xs text-gray-400">
                {isFrozen ? 'Your account requires attention' : 'Complete KYC to continue trading'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Trading Volume</span>
              <span>${kycStatus.cumulativeVolume.toFixed(2)} / $1,000.00</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((kycStatus.cumulativeVolume / 1000) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Status message */}
          {isFrozen && kycStatus.freezeReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{kycStatus.freezeReason}</p>
            </div>
          )}

          {isTier1AtLimit && !isFrozen && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                You have reached the Tier 1 trading limit of $1,000 USDC. To continue trading you must complete identity verification. This is free and takes about 2 minutes.
              </p>
            </div>
          )}

          {isPendingVerification && (
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
              <p className="text-sm text-brand-700 dark:text-brand-400">
                Your verification is in progress. Please complete the identity check in the verification window. Once completed your account will be upgraded automatically.
              </p>
            </div>
          )}

          {isVerificationFailed && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                Verification failed. Please try again or contact support if the issue persists.
              </p>
            </div>
          )}

          {/* KYC tier info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              What you will need
            </p>
            {[
              'A government-issued photo ID (passport or national ID card)',
              'A selfie taken in good lighting',
              'Your email address and home address',
              'About 2-3 minutes of your time',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="text-emerald-500 shrink-0">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Verification is processed by Didit. Your ID is never stored on the blockchain or shared with third parties except as required by law.
          </p>
        </div>

        <div className="p-6 pt-0 space-y-3">
          {sessionUrl ? (
            <a
              href={sessionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Open Verification
            </a>
          ) : (
            !isFrozen || isVerificationFailed ? (
              <button
                onClick={startKyc}
                disabled={initiating}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
              >
                {initiating ? 'Starting verification...' : 'Start Free Verification'}
              </button>
            ) : null
          )}

          {!isFrozen && (
            <button
              onClick={() => setOpen(false)}
              className="w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition"
            >
              Remind me later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}