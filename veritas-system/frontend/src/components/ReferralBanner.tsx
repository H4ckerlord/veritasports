import { useEffect, useState } from 'react';
import { useI18n } from '../App';
import { Link } from 'react-router-dom';

interface ReferralBannerProps {
  wallet: string | null;
}

export default function ReferralBanner({ wallet }: ReferralBannerProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner only if no wallet connected (encourage sign-up via referral)
    const params = new URLSearchParams(window.location.search);
    const hasRef = params.has('ref');
    setShow(hasRef && !wallet);
  }, [wallet]);

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm py-2.5 px-4 flex items-center justify-between gap-4">
      <span>🎉 {t('referral.banner')}</span>
      <Link
        to="/dashboard"
        className="shrink-0 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition"
      >
        {t('referral.getLink')}
      </Link>
      <button
        onClick={() => setShow(false)}
        className="shrink-0 text-white/70 hover:text-white text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
