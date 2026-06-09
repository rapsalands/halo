import { usePolledData } from '../hooks/usePolledData'
import { useSettings } from '../store/settings'
import { TICKER_CURRENCIES } from '../store/defaults'
import { fetchMarkets, type Coin } from '../data/markets'

const INTERVAL = 8 * 60_000

function fmtPrice(n: number, sym: string): string {
  return n >= 1000 ? `${sym}${Math.round(n).toLocaleString()}` : `${sym}${n.toFixed(2)}`
}

export function TickerTile() {
  const coinsCfg = useSettings((s) => s.settings.tickerCoins)
  const currency = useSettings((s) => s.settings.tickerCurrency)
  const sym = TICKER_CURRENCIES[currency] ?? ''
  const { data } = usePolledData<Coin[]>(
    `markets:${currency}:${coinsCfg.join(',')}`,
    () => fetchMarkets(coinsCfg, currency),
    INTERVAL,
  )
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
            <span>{fmtPrice(c.price, sym)}</span>
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
