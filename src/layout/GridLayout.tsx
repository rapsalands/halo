import type { CSSProperties, ReactNode } from 'react'
import { useSettings } from '../store/settings'
import { useOnline } from '../hooks/useOnline'
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'
import { ForecastTile } from '../tiles/ForecastTile'
import { CalendarTile } from '../tiles/CalendarTile'
import { SunMoonTile } from '../tiles/SunMoonTile'
import { QuoteTile } from '../tiles/QuoteTile'
import { TickerTile } from '../tiles/TickerTile'
import { AirQualityTile } from '../tiles/AirQualityTile'
import { PhotoPanel } from '../tiles/PhotoPanel'

type RegionId =
  | 'clock' | 'weather' | 'air' | 'calendar' | 'quote' | 'sunmoon'
  | 'forecast' | 'photo' | 'ticker'

const PLACEMENT: Record<RegionId, CSSProperties> = {
  clock:    { gridColumn: '1 / 8',  gridRow: '1 / 2' },
  weather:  { gridColumn: '1 / 5',  gridRow: '2 / 3' },
  air:      { gridColumn: '5 / 8',  gridRow: '2 / 3' },
  // Calendar is the tallest tile (full month grid) — give it 3 cols and 2 rows.
  calendar: { gridColumn: '1 / 4',  gridRow: '3 / 5' },
  quote:    { gridColumn: '4 / 8',  gridRow: '3 / 4' },
  sunmoon:  { gridColumn: '4 / 8',  gridRow: '4 / 5' },
  forecast: { gridColumn: '1 / 8',  gridRow: '5 / 6' },
  photo:    { gridColumn: '8 / 13', gridRow: '1 / 6' },
  ticker:   { gridColumn: '1 / 13', gridRow: '6 / 7' },
}

const RENDER: Record<RegionId, () => ReactNode> = {
  clock: () => <ClockTile />,
  weather: () => <WeatherTile />,
  air: () => <AirQualityTile />,
  calendar: () => <CalendarTile />,
  quote: () => <QuoteTile />,
  sunmoon: () => <SunMoonTile />,
  forecast: () => <ForecastTile />,
  photo: () => <PhotoPanel />,
  ticker: () => <TickerTile />,
}

function Cell({ id, children }: { id: RegionId; children: ReactNode }) {
  // display:grid makes the single child stretch to fill the cell.
  // data-col mirrors the placement so tests assert it without relying on jsdom
  // round-tripping the CSS grid shorthand.
  return (
    <div
      data-region={id}
      data-col={String(PLACEMENT[id].gridColumn)}
      style={{ ...PLACEMENT[id], display: 'grid', minWidth: 0, minHeight: 0 }}
    >
      {children}
    </div>
  )
}

// Regions that need the internet. When offline they are hidden so they never
// show a spinner or error; they reappear automatically once the link is back.
const NEEDS_NET: Record<RegionId, boolean> = {
  clock: false, weather: true, air: true, calendar: false, quote: false,
  // sunmoon shows sunrise/sunset/UV from the weather feed (only the moon phase is
  // local), so it has nothing useful offline — hide it with the rest.
  sunmoon: true, forecast: true, photo: true, ticker: true,
}

export function GridLayout() {
  const enabled = useSettings((s) => s.settings.enabledTiles)
  const online = useOnline()
  const show = (id: RegionId) => online || !NEEDS_NET[id]

  // Which regions are visible. The photo panel is always on (when online); the
  // forecast band follows the weather toggle (it is the same data source).
  const visible: RegionId[] = ([
    'clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'ticker',
  ] as const).filter((id) => enabled[id] && show(id))
  if (enabled.weather && show('forecast')) visible.push('forecast')
  if (show('photo')) visible.push('photo')

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: '1.4fr 1.2fr 1fr 0.9fr 0.7fr auto',
        gap: '0.9rem',
        padding: '1.6rem',
        boxSizing: 'border-box',
      }}
    >
      {visible.map((id) => (
        <Cell key={id} id={id}>{RENDER[id]()}</Cell>
      ))}
    </div>
  )
}
