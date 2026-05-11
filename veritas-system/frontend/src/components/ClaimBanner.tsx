import { useState, useEffect } from 'react';

interface ClaimBannerProps {
  wallet: string | null;
}

export default function ClaimBanner({ wallet }: ClaimBannerProps) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!wallet || dismissed) return;
    const key = `claim_check_${wallet.slice(-8)}`;
    const lastCheck = localStorage.getItem(key);
    const now = Date.now();
    if (lastCheck && now - parseInt(lastCheck) < 3600000) return;
    localStorage.setItem(key, String(now));
    setTimeout(() => setShow(true), 2000);
  }, [wallet, dismissed]);

  if (!show || dismissed || !wallet) return null;

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-slide-down">
      <div className="bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xl shrink-0">
              💰
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Check Your Winnings</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                If any of your predictions resolved, claim your USDC now
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-gray-400 hover:text-gray-600 shrink-0 text-lg">x</button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Later
          </button>
          <a
            href="https://app.azuro.org"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDismissed(true)}
            className="flex-1 btn-primary text-sm py-2 rounded-xl text-center"
          >
            Claim on Azuro
          </a>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-3">
          Winnings are held safely in the smart contract until you claim
        </p>
      </div>
    </div>
  );
}