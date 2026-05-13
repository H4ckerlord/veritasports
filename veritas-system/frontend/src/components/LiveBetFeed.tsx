import { useEffect, useState, useCallback } from 'react';
import { getSubgraphUrl } from '../hooks/useAzuroMarkets';

interface LiveBet {
  id: string;
  bettor: string;
  amount: string;
  createdAt: string;
  outcome: {
    outcomeId: string;
    condition: {
      conditionId: string;
      game: {
        title: string;
        sport?: { name: string };
      };
    };
  } | null;
}

const LIVE_BETS_QUERY = `
  query LiveBets {
    bets(
      first: 20
      orderBy: createdBlockTimestamp
      orderDirection: desc
    ) {
      id
      bettor
      amount
      createdBlockTimestamp
      outcome {
        outcomeId
        condition {
          conditionId
          game {
            title
            sport { name }
          }
        }
      }
    }
  }
`;

function shortWallet(addr: string): string {
  if (!addr) return 'Unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: string): string {
  const seconds = Math.floor(Date.now() / 1000) - parseInt(ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatAmount(amount: string): string {
  const val = parseFloat(amount) / 1e18;
  if (isNaN(val)) return '0.00';
  return val.toFixed(2);
}

export default function LiveBetFeed() {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBets = useCallback(async () => {
    try {
      const url = getSubgraphUrl();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LIVE_BETS_QUERY }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json() as {
        data?: { bets: LiveBet[] };
        errors?: unknown[];
      };

      if (json.errors?.length) throw new Error('Subgraph error');

      const fetchedBets = json.data?.bets ?? [];
      setBets(fetchedBets);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBets();
    const interval = setInterval(fetchBets, 30_000);
    return () => clearInterval(interval);
  }, [fetchBets]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || bets.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-gray-400 text-sm">
          {error
            ? 'Unable to load live activity. Check your network connection.'
            : 'No recent activity yet. Be the first to trade!'}
        </p>
        <button
          onClick={fetchBets}
          className="text-xs text-brand-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bets.map((bet) => {
        const gameTitle = bet.outcome?.condition?.game?.title ?? 'Unknown Market';
        const sport = bet.outcome?.condition?.game?.sport?.name;
        const outId = parseInt(bet.outcome?.outcomeId ?? '0');
        const isYes = outId % 2 === 1;
        const amount = formatAmount(bet.amount);

        return (
          <div
            key={bet.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 transition"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {shortWallet(bet.bettor)}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[180px] sm:max-w-[260px]">
                  {sport ? `[${sport}] ` : ''}{gameTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isYes
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {isYes ? 'YES' : 'NO'}
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {amount} USDC
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {timeAgo(bet.createdBlockTimestamp)}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs text-gray-400 pt-1">
        Live from Azuro Protocol · Updates every 30s
      </p>
    </div>
  );
}