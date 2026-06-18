import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { formatClock, formatLongDate, greeting } from '../lib/time'

/** The hero clock floats directly on the sky (no card) — the surrounding space
 *  reads as intentional breathing room rather than an empty box. */
export function ClockTile() {
  const now = useAppState((s) => s.now)
  const weatherTz = useAppState((s) => s.weather?.timezone)
  const fallbackTz = useSettings((s) => s.settings.timezone)
  const tz = weatherTz ?? fallbackTz ?? undefined
  const place = useAppState((s) => s.location?.name)
  const hour12 = useSettings((s) => s.settings.hour12)
  const showSeconds = useSettings((s) => s.settings.showSeconds)
  const name = useSettings((s) => s.settings.greetingName)
  const greet = name.trim() ? `${greeting(now, tz)}, ${name.trim()}` : greeting(now, tz)
  return (
    <div
      style={{
        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 0.5rem', textShadow: '0 0.12em 0.6em rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.4rem' }}>
        {greet}
      </div>
      <div style={{ fontSize: '6rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {formatClock(now, hour12, tz, showSeconds)}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '0.5rem' }}>
        {formatLongDate(now, tz)}
      </div>
      {place && (
        <div
          data-testid="clock-location"
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dim)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.5" />
          </svg>
          {place}
        </div>
      )}
    </div>
  )
}
