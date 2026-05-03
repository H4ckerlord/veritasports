import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_BASE_URL ?? '';

export interface ReferralData {
  referralCode: string | null;
  pendingUsdc: string;
  claimedUsdc: string;
  referrals: {
    code: string;
    referred_wallet: string | null;
    reward_amount: string;
    reward_claimed: boolean;
  }[];
}

export function useReferral(wallet: string | null) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);

  // Apply referral code from URL query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && wallet) {
      applyReferralCode(refCode, wallet);
    }
  }, [wallet]);

  async function applyReferralCode(code: string, wallet: string) {
    try {
      await fetch(`${API}/api/referral/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, wallet }),
      });
      // Remove ref param from URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Silent – non-critical
    }
  }

  async function fetchReferralData(wallet: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/referral/rewards?wallet=${encodeURIComponent(wallet)}`
      );
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as ReferralData;
      setData(json);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(wallet: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/referral/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as { code: string };
      await fetchReferralData(wallet);
      return json.code;
    } catch {
      toast.error('Failed to generate referral code');
      return null;
    }
  }

  async function claimRewards(wallet: string): Promise<void> {
    try {
      const res = await fetch(`${API}/api/referral/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      const json = await res.json() as { message: string; amount?: string };
      toast.success(`${json.message}${json.amount ? ` – ${json.amount} USDC` : ''}`);
      await fetchReferralData(wallet);
    } catch {
      toast.error('Claim failed. Try again later.');
    }
  }

  useEffect(() => {
    if (wallet) fetchReferralData(wallet);
    else setData(null);
  }, [wallet]);

  const referralLink = data?.referralCode
    ? `${window.location.origin}?ref=${data.referralCode}`
    : null;

  return { data, loading, referralLink, generateCode, claimRewards };
}
