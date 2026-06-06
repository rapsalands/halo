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
  const holidays = new Set((data ?? []).map((h) => h.date))

  return (
    <TileFrame>
      <div style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: 10 }}>
        {MONTHS[month]} {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{d}</div>
        ))}
        {grid.map((c) => {
          const isToday = c.iso === todayIso
          const isHoliday = holidays.has(c.iso)
          return (
            <div
              key={c.iso}
              data-testid="cal-cell"
              data-holiday={isHoliday ? 'true' : undefined}
              style={{
                fontSize: '0.85rem',
                opacity: c.inMonth ? 1 : 0.3,
                width: 30, height: 30, lineHeight: '30px', margin: '0 auto',
                borderRadius: '50%',
                background: isToday ? 'var(--accent)' : isHoliday ? 'rgba(255,120,120,0.35)' : 'transparent',
                color: isToday ? '#0b0f1a' : 'inherit',
                fontWeight: isToday ? 800 : 400,
              }}
            >
              {c.day}
              {isHoliday && <span data-testid="cal-holiday" style={{ display: 'none' }} />}
            </div>
          )
        })}
      </div>
    </TileFrame>
  )
}
