import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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

export const MARKETS_QUERY_KEY = ['azuro-markets'] as const;

// ── Batched condition fetcher with concurrency limit ────────────
async function fetchConditionsBatched(
  gameIds: string[],
  batchSize = 200,
  concurrency = 4
): Promise<RawCondition[]> {
  if (gameIds.length === 0) return [];

  const batches: string[][] = [];
  for (let i = 0; i < gameIds.length; i += batchSize) {
    batches.push(gameIds.slice(i, i + batchSize));
  }

  async function fetchBatch(batch: string[]): Promise<RawCondition[]> {
    try {
      const res = await fetch(`${API_BASE}/market-manager/conditions-by-game-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: ENVIRONMENT, gameIds: batch }),
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { conditions?: RawCondition[] };
      return json.conditions ?? [];
    } catch {
      return [];
    }
  }

  // Controlled concurrency: run up to `concurrency` batches in parallel
  const results: RawCondition[][] = [];
  let index = 0;
  const pool: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    const worker = async () => {
      while (index < batches.length) {
        const batch = batches[index++];
        const data = await fetchBatch(batch);
        results.push(data);
      }
    };
    pool.push(worker());
  }
  await Promise.all(pool);
  return results.flat();
}

// ── Fetch games (still needed for titles) ──────────────────────
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

// ── Shared data loader (runs only once) ────────────────────────
let sharedMarkets: AzuroMarket[] | null = null;
let sharedConditionMap: Map<string, { title: string; sport?: string }> | null = null;
let sharedLoadPromise: Promise<void> | null = null;
let loadTimestamp = 0;

async function loadAllData() {
  if (sharedLoadPromise) return sharedLoadPromise;

  sharedLoadPromise = (async () => {
    const gameMap = await fetchAllGames();
    const allGameIds = Array.from(gameMap.keys());

    // Fetch conditions in batches – this is the slow step
    const conditions = await fetchConditionsBatched(allGameIds, 200, 4);

    // Build markets
    sharedMarkets = conditions
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
            currentOdds: o.odds,
          })),
        };
      });

    // Build condition map for live feed
    sharedConditionMap = new Map<string, { title: string; sport?: string }>();
    for (const c of conditions) {
      const g = gameMap.get(c.game.gameId);
      if (c.conditionId && g) {
        sharedConditionMap.set(c.conditionId, {
          title: g.title,
          sport: g.sport?.name,
        });
      }
    }
    loadTimestamp = Date.now();
  })();

  return sharedLoadPromise;
}

// ── Public functions used by components ─────────────────────────
export async function fetchConditionGameMap(): Promise<Map<string, { title: string; sport?: string }>> {
  if (sharedConditionMap && Date.now() - loadTimestamp < 120_000) {
    return sharedConditionMap;
  }
  // Reload if cache expired
  sharedLoadPromise = null;
  await loadAllData();
  return sharedConditionMap!;
}

async function fetchMarketsFromAPI(): Promise<AzuroMarket[]> {
  if (sharedMarkets && Date.now() - loadTimestamp < 120_000) {
    return sharedMarkets;
  }
  sharedLoadPromise = null;
  await loadAllData();
  return sharedMarkets ?? [];
}

// Prefetch on module load – kicks off the first load immediately
loadAllData().catch(() => {});

// ── React Query hooks ──────────────────────────────────────────
export function useAzuroMarkets() {
  const queryClient = useQueryClient();

  // Keep the query cache fresh
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: MARKETS_QUERY_KEY,
      queryFn: fetchMarketsFromAPI,
      staleTime: 60_000,
    });
  }, [queryClient]);

  return useQuery({
    queryKey: MARKETS_QUERY_KEY,
    queryFn: fetchMarketsFromAPI,
    refetchInterval: 60_000,            // 1 minute
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    staleTime: 60_000,                 // 1 minute
    gcTime: 10 * 60 * 1000,            // keep data in cache 10 min
    initialData: sharedMarkets ?? undefined, // show cached instantly
  });
}

export function useAzuroMarket(conditionId: string | undefined) {
  const { data: markets, ...rest } = useAzuroMarkets();
  const market = conditionId
    ? markets?.find((m) => m.conditionId === conditionId)
    : undefined;
  return { market, ...rest };
}