import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { usePolledData } from '../hooks/usePolledData'
import { buildMonthGrid, isoOf } from '../lib/calendar'
import { fetchHolidays, type Holiday } from '../data/holidays'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const SIX_H = 6 * 60 * 60_000 // re-poll holidays every 6h

export function CalendarTile() {
  const now = useAppState((s) => s.now)
  const country = useSettings((s) => s.settings.holidayCountry)
  const year = now.getFullYear()
  const month = now.getMonth()
  const todayIso = isoOf(now)
  const grid = buildMonthGrid(year, month)

  const { data } = usePolledData<Holiday[]>(
    `holidays:${year}:${country}`,
    () => fetchHolidays(year, country),
    SIX_H,
  )
  const holidays = new Map((data ?? []).map((h) => [h.date, h.name]))

  return (
    <TileFrame justify="flex-start">
      <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.4rem' }}>
        {MONTHS[month]} {year}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'auto repeat(6, 1fr)', gap: '0.2rem', textAlign: 'center' }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', paddingBottom: '0.2rem' }}>{d}</div>
        ))}
        {grid.map((c) => {
          const isToday = c.iso === todayIso
          const holidayName = holidays.get(c.iso)
          const isHoliday = holidayName !== undefined
          return (
            <div
              key={c.iso}
              data-testid="cal-cell"
              data-holiday={isHoliday ? 'true' : undefined}
              title={holidayName}
              style={{
                position: 'relative',
                minHeight: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '0.12rem',
                opacity: c.inMonth ? 1 : 0.4,
              }}
            >
              {/* Compact chip around the number so the highlight hugs content
                  instead of flooding the whole (tall) cell. */}
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '1.85rem', height: '1.85rem', padding: '0 0.3rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem', fontWeight: isToday ? 800 : 500,
                  background: isToday ? 'var(--accent)' : isHoliday ? 'rgba(255,168,120,0.16)' : 'transparent',
                  boxShadow: isHoliday && !isToday ? 'inset 0 0 0 1px rgba(255,168,120,0.42)' : 'none',
                  color: isToday ? '#0b0f1a' : 'inherit',
                }}
              >
                {c.day}
              </span>
              {isHoliday && (
                <>
                  <span
                    style={{
                      maxWidth: '100%', fontSize: '0.5rem', lineHeight: 1.15, fontWeight: 600,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', textAlign: 'center',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {holidayName}
                  </span>
                  <span data-testid="cal-holiday" style={{ display: 'none' }} />
                </>
              )}
            </div>
          )
        })}
      </div>
    </TileFrame>
  )
}
