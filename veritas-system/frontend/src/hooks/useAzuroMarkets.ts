import { useQuery } from '@tanstack/react-query';

const AZURO_SUBGRAPH_MAINNET =
  'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-polygon-v2';

const AZURO_SUBGRAPH_TESTNET =
  'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-v2';

export function getSubgraphUrl(): string {
  const chainId = String((import.meta as any).env?.VITE_AZURO_CHAIN_ID ?? '80002');
  return chainId === '137' ? AZURO_SUBGRAPH_MAINNET : AZURO_SUBGRAPH_TESTNET;
}

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

// Query that works with Azuro v2 subgraph
const MARKETS_QUERY = `
  query ActiveMarkets($now: String!) {
    conditions(
      first: 100
      orderBy: createdBlockTimestamp
      orderDirection: desc
      where: {
        status: Created
        game_: { startsAt_gt: $now }
      }
    ) {
      conditionId
      status
      outcomes {
        outcomeId
        currentOdds
      }
      game {
        gameId
        startsAt
        title
        sport {
          name
          slug
        }
        league {
          name
          country {
            name
          }
        }
      }
    }
  }
`;

async function fetchMarketsFromSubgraph(): Promise<AzuroMarket[]> {
  const url = getSubgraphUrl();
  const now = String(Math.floor(Date.now() / 1000));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: MARKETS_QUERY,
      variables: { now },
    }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json() as {
    data?: { conditions: AzuroMarket[] };
    errors?: { message: string }[];
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Subgraph errors: ${json.errors.map((e) => e.message).join(', ')}`);
  }

  const conditions = json.data?.conditions ?? [];

  // Filter out conditions with no valid outcomes
  return conditions.filter(
    (c) => c.outcomes && c.outcomes.length >= 2
  );
}

export function useAzuroMarkets() {
  return useQuery({
    queryKey: ['azuro-markets'],
    queryFn: fetchMarketsFromSubgraph,
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