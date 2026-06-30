import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useNowTick } from '../hooks/useNow'
import { moonPhase } from '../lib/sun'
import { formatClock } from '../lib/time'

function hhmm(iso: string): string {
  return formatClock(new Date(iso), false)
}

export function SunMoonTile() {
  const weather = useAppState((s) => s.weather)
  // Moon phase shifts over days — minute granularity is ample (and 60× cheaper).
  const now = useNowTick(false)

  if (!weather) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Sun/Moon unavailable</div></TileFrame>
  }
  const moon = moonPhase(now)
  const uv = weather.daily[0]?.uvMax ?? 0

  const row = { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', margin: '4px 0' } as const
  return (
    <TileFrame justify="space-between">
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Sunrise</span><span>{hhmm(weather.sunriseToday)}</span></div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Sunset</span><span>{hhmm(weather.sunsetToday)}</span></div>
      <div style={row}>
        <span style={{ color: 'var(--text-dim)' }}>Moon</span>
        <span data-testid="moon-name">{moon.name} · {Math.round(moon.illumination * 100)}%</span>
      </div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>UV</span><span>{Math.round(uv)}</span></div>
    </TileFrame>
  )
}
