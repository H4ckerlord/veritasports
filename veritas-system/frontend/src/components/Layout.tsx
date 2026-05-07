import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import FeedbackModal from './FeedbackModal';
import ReferralBanner from './ReferralBanner';
import { useWallet } from '../hooks/useWallet';
import KycModal from './KycModal';
import { useState } from 'react';

export default function Layout() {
  const wallet = useWallet();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const footerLinks = [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
    { to: '/prohibited-markets', label: 'Prohibited Markets' },
    { to: '/responsible-trading', label: 'Responsible Trading' },
    { to: '/how-to-trade', label: 'How to Trade' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/audit-trail', label: 'Audit Trail' },
    { to: '/contact-legal', label: 'Legal Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header wallet={wallet} />
      <ReferralBanner wallet={wallet.address} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ wallet }} />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {footerLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-3">
                <Link to={link.to} className="text-xs text-gray-400 hover:text-brand-500 transition">
                  {link.label}
                </Link>
                {i < footerLinks.length - 1 && (
                  <span className="text-gray-300 dark:text-gray-700 text-xs">|</span>
                )}
              </span>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">
            {new Date().getFullYear()} Veritas. Powered by Azuro Protocol.
          </p>
          <p className="text-center text-xs text-red-500 font-medium">
            Trading involves risk. Only trade with money you can afford to lose. 18+ only.
          </p>
        </div>
      </footer>
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition z-20"
      >
        Feedback
      </button>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} wallet={wallet.address} />
      <KycModal wallet={wallet.address} />
    </div>
  );
}