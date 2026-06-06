export interface Coin { id: string; symbol: string; price: number; change24h: number }

const SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA', dogecoin: 'DOGE',
}

export async function fetchMarkets(ids: string[]): Promise<Coin[]> {
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  })
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`)
  if (!res.ok) throw new Error(`coingecko ${res.status}`)
  const j = await res.json()
  return ids
    .filter((id) => j[id])
    .map((id) => ({
      id,
      symbol: SYMBOLS[id] ?? id.slice(0, 4).toUpperCase(),
      price: j[id].usd,
      change24h: j[id].usd_24h_change ?? 0,
    }))
}
