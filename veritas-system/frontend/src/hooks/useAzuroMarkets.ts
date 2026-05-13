import { useQuery } from '@tanstack/react-query';

// ── New V3 Backend API (Production) ──────────────────────────────
const API_BASE = 'https://api.onchainfeed.org/api/v1/public';
const WS_URL   = 'wss://streams.onchainfeed.org/v1/streams/feed';

// ── Types ────────────────────────────────────────────────────────
export interface Outcome {
  outcomeId: string;
  currentOdds: string;
}

export interface AzuroMarket {
  conditionId: string;
  status: string;
  game: {
    gameId: string;
    startsAt: string;
    title: string;
    sport?: { name: string; slug: string };
    league?: { name: string; country?: { name: string } };
  };
  outcomes: Outcome[];
}

// ── Helper: fetch navigation tree (sports / leagues / countries) ─
async function fetchNavigation(): Promise<any> {
  const res = await fetch(`${API_BASE}/market-manager/navigation`);
  if (!res.ok) throw new Error(`Navigation fetch failed: ${res.status}`);
  return res.json();
}

// ── Helper: fetch game IDs by filter ─────────────────────────────
async function fetchGameIds(sportSlug?: string, leagueSlug?: string): Promise<string[]> {
  const params = new URLSearchParams();
  if (sportSlug)  params.set('sportSlug',  sportSlug);
  if (leagueSlug) params.set('leagueSlug', leagueSlug);

  const res = await fetch(`${API_BASE}/market-manager/games-by-filters?${params.toString()}`);
  if (!res.ok) throw new Error(`Games fetch failed: ${res.status}`);
  const json = await res.json() as { games?: { gameId: string }[] };
  return (json.games ?? []).map((g) => g.gameId);
}

// ── Helper: fetch conditions (markets) for a list of game IDs ────
async function fetchConditions(gameIds: string[]): Promise<AzuroMarket[]> {
  if (gameIds.length === 0) return [];

  const res = await fetch(`${API_BASE}/market-manager/conditions-by-game-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameIds }),
  });
  if (!res.ok) throw new Error(`Conditions fetch failed: ${res.status}`);
  const json = await res.json() as { conditions?: AzuroMarket[] };
  return (json.conditions ?? []).filter(
    (c) => c.outcomes && c.outcomes.length >= 2
  );
}

// ── Main fetch function (used by React Query) ────────────────────
async function fetchMarketsFromAPI(): Promise<AzuroMarket[]> {
  // 1. Get the navigation tree (optional – you can cache it later)
  // 2. Fetch game IDs for the top sport / league you want to show
  //    (For now we fetch ALL games – you can add filters later)
  const gameIds = await fetchGameIds();   // no filter → all active games
  // 3. Fetch the actual market conditions
  return fetchConditions(gameIds);
}

// ── React Query hook ─────────────────────────────────────────────
export function useAzuroMarkets() {
  return useQuery({
    queryKey: ['azuro-markets'],
    queryFn: fetchMarketsFromAPI,
    refetchInterval: 30_000,            // poll every 30 seconds
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 15_000,
  });
}

export function useAzuroMarket(conditionId: string | undefined) {
  const { data: markets, ...rest } = useAzuroMarkets();
  const market = markets?.find((m) => m.conditionId === conditionId);
  return { market, ...rest };
}

// ── (Optional) WebSocket for real‑time odds updates ──────────────
// You can subscribe to `WS_URL` to receive instant price changes.
// Example:
//   const ws = new WebSocket(WS_URL);
//   ws.onmessage = (event) => { … };