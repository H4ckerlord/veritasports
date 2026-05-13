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

interface GameData {
  gameId: string;
  title: string;
  startsAt: string;
  sport?: { name: string; slug: string };
  league?: { name: string; country?: { name: string } };
}

interface ConditionItem {
  conditionId: string;
  status: string;
  outcomes?: { outcomeId: string; currentOdds: string }[];
  game: GameData;
}

async function fetchGames(): Promise<GameData[]> {
  const params = new URLSearchParams({
    environment: ENVIRONMENT,
    gameState: 'Prematch',
    orderBy: 'startsAt',
    orderDirection: 'asc',
    perPage: '10',
    page: '1',
  });
  const res = await fetch(`${API_BASE}/market-manager/games-by-filters?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Games fetch failed: ${res.status} - ${text}`);
  }
  const json = await res.json() as { games?: GameData[] };
  return json.games ?? [];
}

async function fetchConditions(gameIds: string[]): Promise<ConditionItem[]> {
  if (gameIds.length === 0) return [];

  const res = await fetch(`${API_BASE}/market-manager/conditions-by-game-ids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environment: ENVIRONMENT,   // ← REQUIRED in body
      gameIds,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Conditions fetch failed: ${res.status} - ${text}`);
  }
  const json = await res.json() as { conditions?: ConditionItem[] };
  return json.conditions ?? [];
}

// Shared cache for condition → game title mapping (used by LiveBetFeed)
let conditionGameMapCache: Map<string, { title: string; sport?: string }> | null = null;

export async function fetchConditionGameMap(): Promise<Map<string, { title: string; sport?: string }>> {
  if (conditionGameMapCache) return conditionGameMapCache;
  const games = await fetchGames();
  const allGameIds = games.map((g) => g.gameId);
  const conditions = await fetchConditions(allGameIds);
  const map = new Map<string, { title: string; sport?: string }>();
  for (const c of conditions) {
    if (c.conditionId && c.game) {
      map.set(c.conditionId, {
        title: c.game.title,
        sport: c.game.sport?.name,
      });
    }
  }
  conditionGameMapCache = map;
  return map;
}

export function clearConditionGameMapCache() {
  conditionGameMapCache = null;
}

async function fetchMarketsFromAPI(): Promise<AzuroMarket[]> {
  const games = await fetchGames();
  if (games.length === 0) return [];
  const gameIds = games.map((g) => g.gameId);
  const conditions = await fetchConditions(gameIds);
  return conditions
    .filter((c) => c.outcomes && c.outcomes.length >= 2)
    .map((c) => ({
      conditionId: c.conditionId,
      status: c.status,
      game: c.game,
      outcomes: c.outcomes!,
    }));
}

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