import { useQuery } from '@tanstack/react-query';

const API_BASE = 'https://api.onchainfeed.org/api/v1/public';
const ENVIRONMENT = 'PolygonUSDT';

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

// ── Raw shapes from the API ──────────────────────────────────────
interface RawGame {
  gameId: string;
  title: string;
  startsAt: string;
  sport?: { name?: string; slug?: string };
  league?: { name?: string; country?: { name?: string } };
}

interface RawCondition {
  conditionId: string;
  state: string;
  outcomes: { outcomeId: string; odds: string }[];
  game: { gameId: string };
}

// ── Fetch full game details ──────────────────────────────────────
async function fetchGames(): Promise<RawGame[]> {
  const params = new URLSearchParams({
    environment: ENVIRONMENT,
    gameState: 'Prematch',
    orderBy: 'startsAt',
    orderDirection: 'asc',
    perPage: '100',
    page: '1',
  });
  const url = `${API_BASE}/market-manager/games-by-filters?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Games fetch failed: ${res.status} - ${text}`);
  }
  const json = await res.json() as { games?: RawGame[] };
  return json.games ?? [];
}

// ── Fetch conditions for a list of game IDs ──────────────────────
async function fetchConditions(gameIds: string[]): Promise<RawCondition[]> {
  if (gameIds.length === 0) return [];
  const res = await fetch(`${API_BASE}/market-manager/conditions-by-game-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ environment: ENVIRONMENT, gameIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Conditions fetch failed: ${res.status} - ${text}`);
  }
  const json = await res.json() as { conditions?: RawCondition[] };
  return json.conditions ?? [];
}

// ── Shared cache: conditionId → game title (for LiveBetFeed) ────
let conditionGameMapCache: Map<string, { title: string; sport?: string }> | null = null;

export async function fetchConditionGameMap(): Promise<
  Map<string, { title: string; sport?: string }>
> {
  if (conditionGameMapCache) return conditionGameMapCache;

  const games = await fetchGames();
  const allGameIds = games.map((g) => g.gameId);
  const conditions = await fetchConditions(allGameIds);

  // Build a gameId → game lookup first
  const gameById = new Map<string, RawGame>();
  for (const g of games) gameById.set(g.gameId, g);

  const map = new Map<string, { title: string; sport?: string }>();
  for (const c of conditions) {
    const g = gameById.get(c.game.gameId);
    if (c.conditionId && g) {
      map.set(c.conditionId, {
        title: g.title,
        sport: g.sport?.name,
      });
    }
  }
  conditionGameMapCache = map;
  return map;
}

export function clearConditionGameMapCache() {
  conditionGameMapCache = null;
}

// ── Main market fetcher ──────────────────────────────────────────
async function fetchMarketsFromAPI(): Promise<AzuroMarket[]> {
  const games = await fetchGames();
  if (games.length === 0) return [];

  const gameById = new Map<string, RawGame>();
  for (const g of games) gameById.set(g.gameId, g);

  const gameIds = games.map((g) => g.gameId);
  const conditions = await fetchConditions(gameIds);

  return conditions
    .filter((c) => c.outcomes && c.outcomes.length >= 2)
    .map((c) => {
      const g = gameById.get(c.game.gameId);
      return {
        conditionId: c.conditionId,
        status: c.state,
        game: {
          gameId: c.game.gameId,
          startsAt: g?.startsAt ?? '',
          title: g?.title ?? 'Unknown Game',
          sport: g?.sport?.name
            ? { name: g.sport.name, slug: g.sport.slug ?? g.sport.name }
            : undefined,
          league: g?.league?.name
            ? { name: g.league.name, country: g.league.country }
            : undefined,
        },
        outcomes: c.outcomes.map((o) => ({
          outcomeId: o.outcomeId,
          currentOdds: o.odds,
        })),
      };
    });
}

// ── React Query hooks ────────────────────────────────────────────
export function useAzuroMarkets() {
  return useQuery({
    queryKey: ['azuro-markets'],
    queryFn: fetchMarketsFromAPI,
    refetchInterval: 30_000,
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