import { TileFrame } from './TileFrame'
import { useSettings } from '../store/settings'
import { TICKER_CURRENCIES } from '../store/defaults'
import { useMarkets } from '../hooks/useMarkets'

function fmtPrice(n: number, sym: string): string {
  if (!Number.isFinite(n)) return '—' // upstream may omit a coin's price in this fiat
  return n >= 1000 ? `${sym}${Math.round(n).toLocaleString()}` : `${sym}${n.toFixed(2)}`
}

export function TickerTile() {
  const coinsCfg = useSettings((s) => s.settings.tickerCoins)
  const currency = useSettings((s) => s.settings.tickerCurrency)
  const sym = TICKER_CURRENCIES[currency] ?? ''
  const { data, stale } = useMarkets(coinsCfg, currency)
  const coins = data ?? []
  return (
    <TileFrame justify="flex-start" style={{ flexDirection: 'row', gap: '2rem', alignItems: 'center', padding: '0.55rem 1.6rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
      {stale && coins.length > 0 && (
        <span title="Showing last known prices" style={{ color: '#ffd27e', fontSize: '0.85rem' }}>· stale</span>
      )}
    </TileFrame>
  )
}
