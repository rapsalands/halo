import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { formatClock, formatLongDate } from '../lib/time'

export function ClockTile() {
  const now = useAppState((s) => s.now)
  const hour12 = useSettings((s) => s.settings.hour12)
  return (
    <TileFrame>
      <div style={{ fontSize: '5.2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-2px' }}>
        {formatClock(now, hour12)}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: 8 }}>
        {formatLongDate(now)}
      </div>
    </TileFrame>
  )
}
