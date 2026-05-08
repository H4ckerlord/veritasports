import { useState, useEffect } from 'react';

interface LeaderEntry {
  bettor: string;
  totalBets: number;
  totalWon: number;
  winRate: number;
  totalVolume: number;
}

const SUBGRAPH_URL = (import.meta as any).env?.VITE_AZURO_SUBGRAPH_URL
  ?? 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-testnet';

const LEADERBOARD_QUERY = `
  query Leaderboard {
    bets(
      where: { isRedeemable: true }
      orderBy: createdAt
      orderDirection: desc
      first: 200
    ) {
      bettor
      amount
      potentialPayout
      isRedeemed
      outcome {
        isWinning
      }
    }
  }
`;

function shortWallet(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const PERIODS = ['This Week', 'This Month', 'All Time'];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('This Week');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LEADERBOARD_QUERY }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as {
        data?: {
          bets: {
            bettor: string;
            amount: string;
            potentialPayout: string;
            isRedeemed: boolean;
            outcome: { isWinning: boolean } | null;
          }[];
        };
      };

      const bets = json.data?.bets ?? [];
      const userMap: Record<string, { bets: number; wins: number; volume: number }> = {};

      for (const bet of bets) {
        const addr = bet.bettor.toLowerCase();
        if (!userMap[addr]) userMap[addr] = { bets: 0, wins: 0, volume: 0 };
        userMap[addr].bets += 1;
        userMap[addr].volume += parseFloat(bet.amount || '0');
        if (bet.outcome?.isWinning) userMap[addr].wins += 1;
      }

      const result: LeaderEntry[] = Object.entries(userMap)
        .map(([bettor, stats]) => ({
          bettor,
          totalBets: stats.bets,
          totalWon: stats.wins,
          winRate: stats.bets > 0 ? Math.round((stats.wins / stats.bets) * 100) : 0,
          totalVolume: stats.volume,
        }))
        .filter((e) => e.totalBets >= 2)
        .sort((a, b) => b.winRate - a.winRate || b.totalBets - a.totalBets)
        .slice(0, 50);

      setLeaders(result);
    } catch {
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h1>
        <p className="text-gray-400 text-sm">Top predictors ranked by win rate</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 justify-center">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
              period === p
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="text-gray-400">No leaderboard data yet.</p>
          <p className="text-gray-400 text-sm">Be the first to trade and get on the board!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((entry, i) => (
            <div
              key={entry.bettor}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                i < 3
                  ? 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}
            >
              <div className="w-8 text-center text-xl font-bold">
                {i < 3 ? medals[i] : <span className="text-gray-400 text-sm">#{i + 1}</span>}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {shortWallet(entry.bettor)}
                </p>
                <p className="text-xs text-gray-400">
                  {entry.totalBets} predictions · {entry.totalWon} wins
                </p>
              </div>

              <div className="text-right">
                <p className={`text-lg font-bold ${entry.winRate >= 60 ? 'text-emerald-600 dark:text-emerald-400' : entry.winRate >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>
                  {entry.winRate}%
                </p>
                <p className="text-xs text-gray-400">win rate</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Rankings based on resolved predictions from the Azuro Protocol
      </p>
    </div>
  );
}