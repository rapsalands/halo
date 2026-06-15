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
    <TileFrame>
      <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 8 }}>
        {MONTHS[month]} {year}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
        {DOW.map((d, i) => (
          <div key={i} style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', paddingBottom: 4 }}>{d}</div>
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
                height: 34,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                paddingTop: 3,
                opacity: c.inMonth ? 1 : 0.28,
                borderRadius: 10,
                background: isToday ? 'var(--accent)' : isHoliday ? 'rgba(255,120,120,0.18)' : 'transparent',
                color: isToday ? '#0b0f1a' : 'inherit',
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: isToday ? 800 : 500 }}>{c.day}</span>
              {isHoliday && (
                <>
                  <span
                    style={{
                      marginTop: 2, fontSize: '0.52rem', lineHeight: 1.1, maxWidth: '96%',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: isToday ? '#0b0f1a' : '#ffb0b0', fontWeight: 600,
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
