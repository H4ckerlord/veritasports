import { useEffect, useState } from 'react';

interface LiveBet {
  id: string;
  bettor: string;
  amount: string;
  outcome: string;
  game: string;
  createdAt: string;
}

const SUBGRAPH_URL = (import.meta as any).env?.VITE_AZURO_SUBGRAPH_URL
  ?? 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-testnet';

const LIVE_BETS_QUERY = `
  query LiveBets {
    bets(
      orderBy: createdAt
      orderDirection: desc
      first: 20
    ) {
      id
      bettor
      amount
      outcome {
        outcomeId
        condition {
          game {
            title
          }
        }
      }
      createdAt
    }
  }
`;

function shortWallet(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatAmount(amount: string): string {
  const val = parseFloat(amount);
  if (isNaN(val)) return '0.00';
  return val.toFixed(2);
}

function timeAgo(ts: string): string {
  const seconds = Math.floor(Date.now() / 1000) - parseInt(ts);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LiveBetFeed() {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBetIds, setNewBetIds] = useState<Set<string>>(new Set());

  async function fetchBets() {
    try {
      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LIVE_BETS_QUERY }),
      });
      if (!res.ok) return;
      const json = await res.json() as {
        data?: {
          bets: {
            id: string;
            bettor: string;
            amount: string;
            outcome: { outcomeId: string; condition: { game: { title: string } } };
            createdAt: string;
          }[];
        };
      };
      const raw = json.data?.bets ?? [];
      const mapped: LiveBet[] = raw.map((b) => ({
        id: b.id,
        bettor: b.bettor,
        amount: b.amount,
        outcome: b.outcome?.outcomeId === '1' ? 'YES' : 'NO',
        game: b.outcome?.condition?.game?.title ?? 'Sport Market',
        createdAt: b.createdAt,
      }));

      setBets((prev) => {
        const prevIds = new Set(prev.map((b) => b.id));
        const freshIds = new Set<string>();
        mapped.forEach((b) => {
          if (!prevIds.has(b.id)) freshIds.add(b.id);
        });
        if (freshIds.size > 0) setNewBetIds(freshIds);
        setTimeout(() => setNewBetIds(new Set()), 3000);
        return mapped;
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBets();
    const interval = setInterval(fetchBets, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No recent bets found. Markets will appear here as trading activity picks up.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bets.map((bet) => {
        const isNew = newBetIds.has(bet.id);
        return (
          <div
            key={bet.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-500 ${
              isNew
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/30'
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {shortWallet(bet.bettor)}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {bet.game}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  bet.outcome === 'YES'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                }`}
              >
                {bet.outcome}
              </span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(bet.amount)} USDC
              </span>
              <span className="text-xs text-gray-400 hidden sm:block">
                {timeAgo(bet.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
      <p className="text-center text-xs text-gray-400 pt-2">
        Live from Azuro Protocol · Updates every 30 seconds
      </p>
    </div>
  );
}