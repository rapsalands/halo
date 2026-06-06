import { usePolledData } from '../hooks/usePolledData'
import { fetchMarkets, type Coin } from '../data/markets'

const COINS = ['bitcoin', 'ethereum', 'solana']
const INTERVAL = 8 * 60_000

function fmtPrice(n: number): string {
  return n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`
}

export function TickerTile() {
  const { data } = usePolledData<Coin[]>('markets', () => fetchMarkets(COINS), INTERVAL)
  const coins = data ?? []
  return (
    <div
      className="glass"
      style={{ display: 'flex', gap: 32, alignItems: 'center', padding: '12px 26px', overflow: 'hidden', whiteSpace: 'nowrap' }}
    >
      {coins.map((c) => {
        const up = c.change24h >= 0
        return (
          <span key={c.id} style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
            <strong>{c.symbol}</strong>
            <span>{fmtPrice(c.price)}</span>
            <span style={{ color: up ? '#5fd38a' : '#ff7e7e', fontSize: '0.85rem' }}>
              {up ? '▲' : '▼'} {Math.abs(c.change24h).toFixed(1)}%
            </span>
          </span>
        )
      })}
      {coins.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Markets loading…</span>}
    </div>
  )
}
