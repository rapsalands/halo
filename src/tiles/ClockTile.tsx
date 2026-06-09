import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { formatClock, formatLongDate } from '../lib/time'

export function ClockTile() {
  const now = useAppState((s) => s.now)
  const tz = useAppState((s) => s.weather?.timezone)
  const place = useAppState((s) => s.location?.name)
  const hour12 = useSettings((s) => s.settings.hour12)
  return (
    <TileFrame>
      <div style={{ fontSize: '5.2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
        {formatClock(now, hour12, tz)}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: 8 }}>
        {formatLongDate(now, tz)}
      </div>
      {place && (
        <div data-testid="clock-location" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.5" />
          </svg>
          {place}
        </div>
      )}
    </TileFrame>
  )
}
