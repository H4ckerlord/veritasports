/**
 * Odds utilities for Azuro V3 OnChainFeed API
 *
 * currentOdds from this API is ALREADY a decimal string e.g. "1.7"
 * Do NOT divide by 1e9 — that was only for the old V2 subgraph
 */

/** Convert decimal odds string to implied probability percentage */
export function oddsToPercent(oddsRaw: string): number {
  const decimal = parseFloat(oddsRaw);
  if (!decimal || decimal <= 0) return 50;
  const pct = (1 / decimal) * 100;
  return Math.min(99, Math.max(1, Math.round(pct)));
}

/** Format decimal odds for display */
export function formatOdds(oddsRaw: string): string {
  const d = parseFloat(oddsRaw);
  if (!d) return '2.00';
  return d.toFixed(2);
}

/** Get decimal odds value */
export function getDecimalOdds(oddsRaw: string): number {
  return parseFloat(oddsRaw) || 2.0;
}

/**
 * Given two outcomes, return which is YES and which is NO.
 * Azuro typically uses outcomeId ending in odd = YES, even = NO
 * But we also pick by higher odds = the underdog
 */
export function getYesNo(outcomes: { outcomeId: string; currentOdds: string }[]) {
  if (!outcomes || outcomes.length < 2) {
    return { yes: outcomes?.[0], no: outcomes?.[1] };
  }
  // Sort by outcomeId — lower id is typically YES
  const sorted = [...outcomes].sort(
    (a, b) => parseInt(a.outcomeId) - parseInt(b.outcomeId)
  );
  return { yes: sorted[0], no: sorted[1] };
}