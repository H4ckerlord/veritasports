import { useState } from 'react';
import toast from 'react-hot-toast';

interface EmailNotifyProps {
  wallet: string | null;
  marketId?: string;
}

export default function EmailNotify({ wallet, marketId }: EmailNotifyProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function subscribe() {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/kyc?action=email_subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: wallet ?? 'anonymous',
          email: email.trim().toLowerCase(),
          marketId: marketId ?? null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubscribed(true);
      toast.success('You will be notified when your bet resolves!');
    } catch {
      toast.error('Could not save email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <span>✓</span>
        <span>Notifications enabled</span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-500 transition"
      >
        <span>🔔</span>
        <span>Notify me when this resolves</span>
      </button>
    );
  }

  return (
    <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Get notified when this market resolves
      </p>
      <p className="text-xs text-gray-400">
        We will email you once the result is confirmed so you can claim your winnings.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          onKeyDown={(e) => e.key === 'Enter' && subscribe()}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={subscribe}
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {loading ? '...' : 'Notify Me'}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Your email is only used for this notification and never shared.
      </p>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </div>
  );
}