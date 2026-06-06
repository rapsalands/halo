import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { usePolledData } from '../hooks/usePolledData'
import { moonPhase } from '../lib/sun'
import { formatClock } from '../lib/time'
import { fetchAirQuality, type AirQuality } from '../data/airQuality'

const AQI_INTERVAL = 30 * 60_000

function hhmm(iso: string): string {
  return formatClock(new Date(iso), false)
}

export function SunMoonTile() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const location = useAppState((s) => s.location)

  const { data: aq } = usePolledData<AirQuality>(
    location ? `aqi:${location.lat},${location.lon}` : 'aqi:none',
    () => fetchAirQuality(location!),
    AQI_INTERVAL,
  )

  if (!weather) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Sun/Moon unavailable</div></TileFrame>
  }
  const moon = moonPhase(now)
  const uv = weather.daily[0]?.uvMax ?? 0

  const row = { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '4px 0' } as const
  return (
    <TileFrame>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Sunrise</span><span>{hhmm(weather.sunriseToday)}</span></div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Sunset</span><span>{hhmm(weather.sunsetToday)}</span></div>
      <div style={row}>
        <span style={{ color: 'var(--text-dim)' }}>Moon</span>
        <span data-testid="moon-name">{moon.name} · {Math.round(moon.illumination * 100)}%</span>
      </div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>UV</span><span>{Math.round(uv)}</span></div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Air</span><span>{aq ? `AQI ${aq.usAqi}` : '—'}</span></div>
    </TileFrame>
  )
}
