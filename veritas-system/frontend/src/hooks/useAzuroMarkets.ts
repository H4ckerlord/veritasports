import { useQuery } from '@tanstack/react-query';

const API = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

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
  };
  outcomes: Outcome[];
}

async function fetchMarkets(): Promise<AzuroMarket[]> {
  const res = await fetch(`${API}/api/markets`);
  if (!res.ok) throw new Error('Failed to fetch markets');
  const json = await res.json() as { markets: AzuroMarket[] };
  return json.markets;
}

export function useAzuroMarkets() {
  return useQuery({
    queryKey: ['azuro-markets'],
    queryFn: fetchMarkets,
    refetchInterval: 60_000,
  });
}

export function useAzuroMarket(conditionId: string | undefined) {
  const { data: markets, ...rest } = useAzuroMarkets();
  const market = markets?.find((m) => m.conditionId === conditionId);
  return { market, ...rest };
}