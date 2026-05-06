import { Outlet, Link } from 'react-router-dom';
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
      <ReferralBanner wallet={wallet.address} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ wallet }} />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              {new Date().getFullYear()} Veritas. Powered by Azuro Protocol.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="text-xs text-gray-400 hover:text-brand-500 transition">
                Privacy Policy
              </Link>
              <Link to="/terms-of-use" className="text-xs text-gray-400 hover:text-brand-500 transition">
                Terms of Use
              </Link>
              <Link to="/how-to-trade" className="text-xs text-gray-400 hover:text-brand-500 transition">
                How to Trade
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-red-500 font-medium">
              Trading involves risk. Only trade with money you can afford to lose.
            </p>
          </div>
        </div>
      </footer>

      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition z-20"
      >
        Feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} wallet={wallet.address} />
    </div>
  );
}