import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface ReferralData {
  referralCode: string | null;
  referralLink: string | null;
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && wallet) {
      applyReferralCode(refCode, wallet);
    }
  }, [wallet]);

  async function applyReferralCode(code: string, walletAddr: string) {
    try {
      await fetch('/api/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, wallet: walletAddr }),
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // silent
    }
  }

  async function fetchReferralData(walletAddr: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/referral/rewards?wallet=${encodeURIComponent(walletAddr)}`
      );
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as {
        referralCode: string | null;
        pendingUsdc: string;
        claimedUsdc: string;
        referrals: ReferralData['referrals'];
      };
      setData({
        referralCode: json.referralCode,
        referralLink: json.referralCode
          ? `https://veritasports.com?ref=${encodeURIComponent(json.referralCode)}`
          : null,
        pendingUsdc: json.pendingUsdc,
        claimedUsdc: json.claimedUsdc,
        referrals: json.referrals,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(walletAddr: string): Promise<string | null> {
    try {
      const res = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        toast.error(err.error ?? 'Failed to generate referral code');
        return null;
      }
      const json = await res.json() as { code: string; link: string };
      await fetchReferralData(walletAddr);
      return json.code;
    } catch {
      toast.error('Failed to generate referral code. Please try again.');
      return null;
    }
  }

  async function claimRewards(walletAddr: string): Promise<void> {
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr }),
      });
      const json = await res.json() as { message: string; amount?: string };
      toast.success(`${json.message}${json.amount ? ` - ${json.amount} USDC` : ''}`);
      await fetchReferralData(walletAddr);
    } catch {
      toast.error('Claim failed. Try again later.');
    }
  }

  useEffect(() => {
    if (wallet) fetchReferralData(wallet);
    else setData(null);
  }, [wallet]);

  const referralLink = data?.referralLink ?? null;

  return { data, loading, referralLink, generateCode, claimRewards };
}