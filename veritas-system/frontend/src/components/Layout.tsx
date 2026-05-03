import { Outlet } from 'react-router-dom';
import Header from './Header';
import FeedbackModal from './FeedbackModal';
import ReferralBanner from './ReferralBanner';
import { useWallet } from '../hooks/useWallet';
import { useState } from 'react';
import { useI18n } from '../App';

export default function Layout() {
  const wallet = useWallet();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col">
      <Header wallet={wallet} />

      {/* Referral banner – shown to users who arrived with a ref code */}
      <ReferralBanner wallet={wallet.address} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Pass wallet down via context or props – here we use Outlet context */}
        <Outlet context={{ wallet }} />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} Veritas. Powered by Azuro Protocol.
      </footer>

      {/* Floating feedback button */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition z-20"
      >
        💬 {t('feedback.button')}
      </button>

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        wallet={wallet.address}
      />
    </div>
  );
}
