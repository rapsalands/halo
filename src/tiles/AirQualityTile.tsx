import { TileFrame } from './TileFrame'
import { TilePlaceholder } from './TilePlaceholder'
import { TileLabel } from './TileLabel'
import { useAppState } from '../store/appState'
import { useAirQuality } from '../hooks/useAirQuality'
import { aqiCategory } from '../lib/aqi'

export function AirQualityTile() {
  const location = useAppState((s) => s.location)
  const { data: aq, stale } = useAirQuality(location)

  if (!aq) {
    return <TilePlaceholder>Air quality…</TilePlaceholder>
  }
  const band = aqiCategory(aq.usAqi)
  return (
    <TileFrame style={{ minWidth: 150 }}>
      <TileLabel stale={stale}>Air quality</TileLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1, color: band.color }}>{Math.round(aq.usAqi)}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>US AQI</span>
      </div>
      <div style={{ marginTop: 8, fontWeight: 600, color: band.color }}>{band.label}</div>
      <div style={{ height: 6, borderRadius: 3, marginTop: 8, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (aq.usAqi / 500) * 100)}%`, height: '100%', background: band.color, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>PM2.5 {Math.round(aq.pm25)} µg/m³</div>
    </TileFrame>
  )
}
