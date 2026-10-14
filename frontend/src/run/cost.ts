// Costs are shown the same way everywhere: 4 decimals under $1 so small runs aren't all "$0.00".
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(Math.abs(usd) < 1 ? 4 : 2)}`;
}
