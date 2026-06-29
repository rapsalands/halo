import { API } from './endpoints'
export interface Coin { id: string; symbol: string; price: number; change24h: number }

const SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA', dogecoin: 'DOGE',
}

export async function fetchMarkets(ids: string[], currency = 'usd'): Promise<Coin[]> {
  const cur = currency.toLowerCase()
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: cur,
    include_24hr_change: 'true',
  })
  const res = await fetch(`${API.coingecko}/simple/price?${params}`)
  if (!res.ok) throw new Error(`coingecko ${res.status}`)
  const j = await res.json()
  return ids
    .filter((id) => j[id])
    .map((id) => ({
      id,
      symbol: SYMBOLS[id] ?? id.slice(0, 4).toUpperCase(),
      price: j[id][cur],
      change24h: j[id][`${cur}_24h_change`] ?? 0,
    }))
}
