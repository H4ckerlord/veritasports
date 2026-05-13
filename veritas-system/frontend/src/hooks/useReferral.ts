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

  // Apply referral code from URL when wallet connects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode && wallet) {
      applyReferralCode(refCode, wallet);
    }
  }, [wallet]);

  async function applyReferralCode(code: string, walletAddr: string) {
    try {
      await fetch('/api/referral?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, wallet: walletAddr }),
      });
      // Remove ref param from URL after processing
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Silent — referral registration is non-critical
    }
  }

  async function fetchReferralData(walletAddr: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/referral?action=rewards&wallet=${encodeURIComponent(walletAddr)}`
      );
      if (!res.ok) throw new Error('Failed to fetch referral data');
      const json = await res.json() as {
        referralCode: string | null;
        referralLink: string | null;
        pendingUsdc: string;
        claimedUsdc: string;
        referrals: ReferralData['referrals'];
      };
      setData({
        referralCode: json.referralCode,
        referralLink: json.referralLink,
        pendingUsdc: json.pendingUsdc,
        claimedUsdc: json.claimedUsdc,
        referrals: json.referrals,
      });
    } catch {
      // Silent on fetch errors
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(walletAddr: string): Promise<string | null> {
    try {
      const res = await fetch('/api/referral?action=generate', {
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
      const res = await fetch('/api/referral?action=claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr }),
      });
      const json = await res.json() as { message: string; amount?: string };
      toast.success(
        json.amount && parseFloat(json.amount) > 0
          ? `Claimed ${json.amount} USDC successfully!`
          : json.message
      );
      await fetchReferralData(walletAddr);
    } catch {
      toast.error('Claim failed. Please try again later.');
    }
  }

  useEffect(() => {
    if (wallet) {
      fetchReferralData(wallet);
    } else {
      setData(null);
    }
  }, [wallet]);

  return {
    data,
    loading,
    referralLink: data?.referralLink ?? null,
    generateCode,
    claimRewards,
  };
}