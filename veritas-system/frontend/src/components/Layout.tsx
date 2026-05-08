import { Outlet, Link } from 'react-router-dom';
import Header from './Header';
import FeedbackModal from './FeedbackModal';
import ReferralBanner from './ReferralBanner';
import KycModal from './KycModal';
import InstallPrompt from './InstallPrompt';
import { useWallet } from '../hooks/useWallet';
import { useState } from 'react';

const footerLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-of-service', label: 'Terms of Service' },
  { to: '/prohibited-markets', label: 'Prohibited Markets' },
  { to: '/responsible-trading', label: 'Responsible Trading' },
  { to: '/how-to-trade', label: 'How to Trade' },
  { to: '/audit-trail', label: 'Audit Trail' },
  { to: '/contact-legal', label: 'Legal Contact' },
];

export default function Layout() {
  const wallet = useWallet();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a1a' }}>
      <Header wallet={wallet} />
      <ReferralBanner wallet={wallet.address} />

      <main className="flex-1">
        <Outlet context={{ wallet }} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

          {/* Logo and tagline */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Veritas" className="w-8 h-8 rounded-xl" />
              <span className="font-black text-xl text-white">Veritas</span>
            </div>
            <p className="text-xs text-gray-600 text-center sm:text-right">
              Powered by Azuro Protocol on Polygon blockchain
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {footerLinks.map((link, i) => (
              <span key={link.to} className="flex items-center gap-4">
                <Link to={link.to} className="text-xs text-gray-600 hover:text-brand-400 transition">
                  {link.label}
                </Link>
                {i < footerLinks.length - 1 && (
                  <span className="text-gray-800 text-xs">|</span>
                )}
              </span>
            ))}
          </div>

          {/* Risk warning */}
          <div className="text-center space-y-1">
            <p className="text-xs text-red-500/80 font-medium">
              ⚠️ Trading involves risk. Only trade with money you can afford to lose. 18+ only.
            </p>
            <p className="text-xs text-gray-700">
              {new Date().getFullYear()} Veritas. All market resolutions are handled by Azuro Protocol oracle.
            </p>
          </div>
        </div>
      </footer>

     {/* Feedback button */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg transition z-20"
      >
        💬 Feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} wallet={wallet.address} />
      <KycModal wallet={wallet.address} />
      <InstallPrompt />
    </div>
  );
}