import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { usePolledData } from '../hooks/usePolledData'
import { fetchAirQuality, type AirQuality } from '../services/airQualityService'
import { aqiCategory } from '../lib/aqi'

const AQI_INTERVAL = 30 * 60_000

export function AirQualityTile() {
  const location = useAppState((s) => s.location)
  const { data: aq } = usePolledData<AirQuality>(
    location ? `aqi:${location.lat},${location.lon}` : 'aqi:none',
    () => fetchAirQuality(location!),
    AQI_INTERVAL,
  )

  if (!aq) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Air quality…</div></TileFrame>
  }
  const band = aqiCategory(aq.usAqi)
  return (
    <TileFrame style={{ minWidth: 150 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
        Air quality
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: '2.6rem', fontWeight: 800, lineHeight: 1, color: band.color }}>{Math.round(aq.usAqi)}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>US AQI</span>
      </div>
      <div style={{ marginTop: 8, fontWeight: 600, color: band.color }}>{band.label}</div>
      <div style={{ height: 6, borderRadius: 3, marginTop: 8, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (aq.usAqi / 300) * 100)}%`, height: '100%', background: band.color, transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 8 }}>PM2.5 {Math.round(aq.pm25)} µg/m³</div>
    </TileFrame>
  )
}
