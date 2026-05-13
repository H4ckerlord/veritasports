import { useQuery } from '@tanstack/react-query';

const API_BASE = 'https://api.onchainfeed.org/api/v1/public';
// Mandatory for all requests as per Azuro V3 API
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

interface GamesResponse {
  games?: GameData[];
}

interface ConditionItem {
  conditionId: string;
  status: string;
  outcomes?: { outcomeId: string; currentOdds: string }[];
  game: GameData;
}

interface ConditionsResponse {
  conditions?: ConditionItem[];
}

async function fetchGames(): Promise<GameData[]> {
  const params = new URLSearchParams({
    environment: ENVIRONMENT,
    state: 'Prematch',
    perPage: '100',
    page: '1',
  });

  const url = `${API_BASE}/market-manager/games-by-filters?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Games fetch failed: ${res.status} - ${errorBody}`);
  }

  const json = (await res.json()) as GamesResponse;
  return json.games ?? [];
}

async function fetchConditions(gameIds: string[]): Promise<ConditionItem[]> {
  if (gameIds.length === 0) return [];

  const url = `${API_BASE}/market-manager/conditions-by-game-ids?environment=${ENVIRONMENT}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameIds }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Conditions fetch failed: ${res.status} - ${errorBody}`);
  }

  const json = (await res.json()) as ConditionsResponse;
  return json.conditions ?? [];
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