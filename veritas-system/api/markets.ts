import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUBGRAPH_URLS: Record<number, string> = {
  137: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-polygon-v2',
  80002: 'https://api.thegraph.com/subgraphs/name/azuro-protocol/azuro-polygon-amoy-v2',
};

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
        sport { name slug }
        league { name country { name } }
      }
    }
  }
`;

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  try {
    const raw = process.env.AZURO_CONFIG;
    const cfg = raw ? JSON.parse(raw) as { chainId: number } : { chainId: 80002 };
    const url = SUBGRAPH_URLS[cfg.chainId] ?? SUBGRAPH_URLS[80002];
    const now = String(Math.floor(Date.now() / 1000));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: MARKETS_QUERY,
        variables: { now },
      }),
    });

    if (!response.ok) {
      res.status(200).json({
        markets: [],
        error: `Subgraph returned ${response.status}`,
      });
      return;
    }

    const json = await response.json() as {
      data?: { conditions: unknown[] };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      res.status(200).json({
        markets: [],
        error: json.errors[0]?.message,
      });
      return;
    }

    const conditions = (json.data?.conditions ?? []) as { outcomes?: unknown[] }[];
    const markets = conditions.filter((c) => c.outcomes && c.outcomes.length >= 2);

    res.status(200).json({ markets });
  } catch (err) {
    res.status(200).json({
      markets: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}