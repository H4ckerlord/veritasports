import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchConditionGameMap } from '../hooks/useAzuroMarkets';

interface DisplayBet {
  id: string;
  bettor: string;
  amount: string;
  outcome: string;
  gameTitle: string;
  sport?: string;
  timestamp: number;
  isNew: boolean;
}

// In-memory cache
let _cache: DisplayBet[] = [];
let _cacheTime = 0;
const CACHE_TTL = 28_000;

function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return 'Unknown';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

// Use the Azuro subgraph just for the live bet feed (public data)
const LIVE_QUERY = `
  query LiveBets {
    bets(first: 15, orderBy: createdBlockTimestamp, orderDirection: desc) {
      id bettor amount createdBlockTimestamp
      outcome {
        outcomeId
        condition { conditionId }
      }
    }
  }
`;

export default function LiveBetFeed() {
  const [bets, setBets] = useState<DisplayBet[]>(_cache);
  const [loading, setLoading] = useState(_cache.length === 0);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (_cache.length > 0 && Date.now() - _cacheTime < CACHE_TTL) {
      setBets(_cache);
      setLoading(false);
      return;
    }

    try {
      // Use V3 subgraph for live bets
      const chainId = String((import.meta as any).env?.VITE_AZURO_CHAIN_ID ?? '80002');
      const subgraphUrl = chainId === '137'
        ? 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-polygon-v3'
        : 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-v3';

      const res = await fetch(subgraphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LIVE_QUERY }),
      });

      if (!res.ok) throw new Error('Subgraph unavailable');

      const json = await res.json() as {
        data?: {
          bets: {
            id: string;
            bettor: string;
            amount: string;
            createdBlockTimestamp: string;
            outcome: {
              outcomeId: string;
              condition: { conditionId: string };
            } | null;
          }[];
        };
      };

      const rawBets = json.data?.bets ?? [];

      if (rawBets.length === 0) {
        if (mounted.current) setLoading(false);
        return;
      }

      // Get game titles for condition IDs
      const conditionIds = rawBets
        .map((b) => b.outcome?.condition?.conditionId)
        .filter(Boolean) as string[];

      const gameMap = conditionIds.length > 0
        ? await fetchConditionGameMap().catch(() => new Map<string, { title: string; sport?: string }>())
        : new Map<string, { title: string; sport?: string }>();

      const now = Date.now();
      const display: DisplayBet[] = rawBets.map((bet) => {
        const condId = bet.outcome?.condition?.conditionId ?? '';
        const gameInfo = gameMap.get(condId);
        const outId = parseInt(bet.outcome?.outcomeId ?? '0');
        const isYes = outId % 2 === 1;
        const rawAmt = parseFloat(bet.amount) / 1e18;
        const amount = isNaN(rawAmt) ? '?' : rawAmt >= 1000 ? `${(rawAmt / 1000).toFixed(1)}K` : rawAmt.toFixed(2);
        const ts = parseInt(bet.createdBlockTimestamp) * 1000 || now;

        return {
          id: bet.id,
          bettor: bet.bettor,
          amount,
          outcome: isYes ? 'YES' : 'NO',
          gameTitle: gameInfo?.title ?? 'Market',
          sport: gameInfo?.sport,
          timestamp: ts,
          isNew: now - ts < 120_000,
        };
      });

      _cache = display;
      _cacheTime = Date.now();
      if (mounted.current) { setBets(display); setLoading(false); }
    } catch {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    const id = setInterval(load, 30_000);
    return () => { mounted.current = false; clearInterval(id); };
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-11 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No recent activity yet. Be the first to trade!
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {bets.map((bet) => (
        <div
          key={bet.id}
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition ${
            bet.isNew
              ? 'border-brand-200 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10'
              : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/3 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-gray-400">{shortWallet(bet.bettor)}</span>
                {bet.sport && <span className="text-xs text-gray-400">[{bet.sport}]</span>}
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[160px] sm:max-w-[260px]">
                {bet.gameTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              bet.outcome === 'YES'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
            }`}>
              {bet.outcome}
            </span>
            <span className="text-xs font-bold text-gray-900 dark:text-white">{bet.amount} USDC</span>
            <span className="text-xs text-gray-400 hidden sm:block">{timeAgo(bet.timestamp)}</span>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-gray-400 pt-1">
        Live · Azuro Protocol · Updates every 30s
      </p>
    </div>
  );
}