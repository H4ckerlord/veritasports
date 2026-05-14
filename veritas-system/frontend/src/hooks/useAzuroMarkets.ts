import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const API_BASE = 'https://api.onchainfeed.org/api/v1/public';
const ENVIRONMENT = 'PolygonUSDT';

export interface Outcome {
  outcomeId: string;
  currentOdds: string; // decimal odds e.g. "1.7"
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

interface RawGame {
  gameId: string;
  title: string;
  startsAt: string;
  sport?: { sportId: string; name: string; slug: string };
  league?: { name: string; country?: { name: string } };
}

interface RawCondition {
  conditionId: string;
  state: string;
  outcomes: { outcomeId: string; odds: string }[];
  game: { gameId: string };
}

// ── Shared query key for React Query cache ─────────────────────
export const MARKETS_QUERY_KEY = ['azuro-markets'] as const;

// ── Fetch ALL games ────────────────────────────────────────────
async function fetchAllGames(): Promise<Map<string, RawGame>> {
  const gameMap = new Map<string, RawGame>();

  const fetchState = async (state: string) => {
    let page = 1;
    while (true) {
      const params = new URLSearchParams({
        environment: ENVIRONMENT,
        gameState: state,
        orderBy: 'startsAt',
        orderDirection: 'asc',
        perPage: '500',
        page: String(page),
      });
      const url = `${API_BASE}/market-manager/games-by-filters?${params.toString()}`;
      try {
        const res = await fetch(url);
        if (!res.ok) break;
        const json = (await res.json()) as { games?: RawGame[] };
        const games = json.games ?? [];
        if (games.length === 0) break;
        for (const g of games) gameMap.set(g.gameId, g);
        page++;
        if (games.length < 500) break;
      } catch {
        break;
      }
    }
  };

  await Promise.all([fetchState('Prematch'), fetchState('Live')]);
  return gameMap;
}

// ── Fetch conditions ───────────────────────────────────────────
async function fetchConditions(gameIds: string[]): Promise<RawCondition[]> {
  if (gameIds.length === 0) return [];
  try {
    const res = await fetch(`${API_BASE}/market-manager/conditions-by-game-ids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environment: ENVIRONMENT, gameIds }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { conditions?: RawCondition[] };
    return json.conditions ?? [];
  } catch {
    return [];
  }
}

// ── Condition → game title/sport map (shared cache) ───────────
let conditionGameMapCache: Map<string, { title: string; sport?: string }> | null = null;

export async function fetchConditionGameMap(): Promise
  Map<string, { title: string; sport?: string }>
> {
  if (conditionGameMapCache) return conditionGameMapCache;
  const gameMap = await fetchAllGames();
  const conditions = await fetchConditions(Array.from(gameMap.keys()));
  const map = new Map<string, { title: string; sport?: string }>();
  for (const c of conditions) {
    const g = gameMap.get(c.game.gameId);
    if (c.conditionId && g) {
      map.set(c.conditionId, { title: g.title, sport: g.sport?.name });
    }
  }
  conditionGameMapCache = map;
  return map;
}

export function clearConditionGameMapCache() {
  conditionGameMapCache = null;
}

// ── In-memory cache ────────────────────────────────────────────
let cachedMarkets: AzuroMarket[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15_000;

// ── Main fetcher ───────────────────────────────────────────────
async function fetchMarketsFromAPI(): Promise<AzuroMarket[]> {
  const now = Date.now();
  if (cachedMarkets && now - cacheTimestamp < CACHE_TTL) return cachedMarkets;

  const gameMap = await fetchAllGames();
  if (gameMap.size === 0) return [];

  const conditions = await fetchConditions(Array.from(gameMap.keys()));

  const markets: AzuroMarket[] = conditions
    .filter((c) => c.outcomes && c.outcomes.length >= 2)
    .map((c) => {
      const g = gameMap.get(c.game.gameId);
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
          currentOdds: o.odds, // Already decimal e.g. "1.7"
        })),
      };
    });

  cachedMarkets = markets;
  cacheTimestamp = now;
  return markets;
}

// Prefetch immediately when the module loads
fetchMarketsFromAPI().catch(() => {});

// ── Hooks ──────────────────────────────────────────────────────

export function useAzuroMarkets() {
  const queryClient = useQueryClient();

  // Prefetch on mount
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: MARKETS_QUERY_KEY,
      queryFn: fetchMarketsFromAPI,
      staleTime: CACHE_TTL,
    });
  }, [queryClient]);

  return useQuery({
    queryKey: MARKETS_QUERY_KEY,
    queryFn: fetchMarketsFromAPI,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: CACHE_TTL,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAzuroMarket(conditionId: string | undefined) {
  const { data: markets, ...rest } = useAzuroMarkets();
  const market = conditionId
    ? markets?.find((m) => m.conditionId === conditionId)
    : undefined;
  return { market, ...rest };
}