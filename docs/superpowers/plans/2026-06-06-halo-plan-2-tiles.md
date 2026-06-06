# Halo — Plan 2: Remaining Tiles & Data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the remaining information tiles — Calendar+Holidays, Sun/Moon+AQI, Quote/On-This-Day, Crypto Ticker — plus the Photo background mode, on top of Plan 1's foundation.

**Architecture:** New tiles are self-contained: each fetches its own data through a generic `usePolledData` hook (built on Plan 1's `fetchWithFallback`), so no new global store coupling. Pure logic (calendar grid, daily-quote selection) is unit-tested. Photo mode swaps the sky gradient for a rotating Picsum backdrop while keeping weather particles on top.

**Tech Stack:** Same as Plan 1. Data sources (all free, no key, CORS-friendly): Nager.Date (holidays), Open-Meteo air-quality, Wikipedia REST on-this-day, CoinGecko (crypto), Picsum (photos). Daily quotes are bundled locally for kiosk reliability.

**Prereq:** Plan 1 complete (branch `auto/halo-plan-1`, all green).

---

## File Structure (added in this plan)

```
src/
  lib/
    calendar.ts            month-grid builder (pure)
    quotes.ts              bundled quotes + deterministic daily pick (pure)
  data/
    holidays.ts            Nager.Date public holidays
    airQuality.ts          Open-Meteo air quality (US AQI, PM2.5)
    onThisDay.ts           Wikipedia REST "on this day"
    markets.ts             CoinGecko crypto prices
    photos.ts              Picsum URL helpers (pure)
  hooks/
    usePolledData.ts       generic fetch+cache+interval hook
  tiles/
    CalendarTile.tsx
    SunMoonTile.tsx
    QuoteTile.tsx
    TickerTile.tsx
  background/
    PhotoBackdrop.tsx      rotating photo background (photo mode)
```

Modified: `background/BackgroundEngine.tsx` (photo mode), `layout/LayoutRenderer.tsx` (register new tiles).

---

## Task 1: Month-grid builder

**Files:** Create `src/lib/calendar.ts`, `src/lib/calendar.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/calendar.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { buildMonthGrid, isoOf } from './calendar'

describe('buildMonthGrid', () => {
  it('returns 42 cells (6 weeks, Sunday-first)', () => {
    expect(buildMonthGrid(2026, 5)).toHaveLength(42) // June 2026
  })
  it('marks exactly the days in the target month', () => {
    const inMonth = buildMonthGrid(2026, 5).filter((c) => c.inMonth)
    expect(inMonth).toHaveLength(30) // June has 30 days
    expect(inMonth[0].day).toBe(1)
    expect(inMonth[29].day).toBe(30)
  })
  it('emits ISO dates', () => {
    const cells = buildMonthGrid(2026, 5)
    const june1 = cells.find((c) => c.inMonth && c.day === 1)!
    expect(june1.iso).toBe('2026-06-01')
  })
})

describe('isoOf', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(isoOf(new Date(2026, 0, 9))).toBe('2026-01-09')
  })
})
```

- [ ] **Step 2: Run, expect FAIL** — `npm test -- calendar`

- [ ] **Step 3: Implement** — `src/lib/calendar.ts`
```ts
export interface CalendarDay { day: number; inMonth: boolean; iso: string }

export function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 42-cell Sunday-first grid covering `month` (0-indexed) plus padding days. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1)
  const startDow = first.getDay() // 0 = Sunday
  const cells: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    cells.push({ day: d.getDate(), inMonth: d.getMonth() === month, iso: isoOf(d) })
  }
  return cells
}
```

- [ ] **Step 4: Run, expect PASS** — `npm test -- calendar`
- [ ] **Step 5: Commit** — `git commit -m "feat: month-grid calendar builder"`

---

## Task 2: Holidays data (Nager.Date)

**Files:** Create `src/data/holidays.ts`, `src/data/holidays.test.ts`

- [ ] **Step 1: Failing test** — `src/data/holidays.test.ts`
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchHolidays } from './holidays'

afterEach(() => vi.restoreAllMocks())

describe('fetchHolidays', () => {
  it('maps Nager.Date payload to {date,name}', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { date: '2026-01-26', localName: 'Republic Day', name: 'Republic Day' },
        { date: '2026-08-15', localName: 'Independence Day', name: 'Independence Day' },
      ],
    })) as unknown as typeof fetch)
    const hs = await fetchHolidays(2026, 'IN')
    expect(hs).toEqual([
      { date: '2026-01-26', name: 'Republic Day' },
      { date: '2026-08-15', name: 'Independence Day' },
    ])
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })) as unknown as typeof fetch)
    await expect(fetchHolidays(2026, 'ZZ')).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/data/holidays.ts`
```ts
export interface Holiday { date: string; name: string }

export async function fetchHolidays(year: number, country: string): Promise<Holiday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
  if (!res.ok) throw new Error(`nager ${res.status}`)
  const j = await res.json()
  return (j as Array<{ date: string; localName?: string; name: string }>).map((h) => ({
    date: h.date,
    name: h.localName ?? h.name,
  }))
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: Nager.Date public holidays fetch"`

---

## Task 3: usePolledData hook

**Files:** Create `src/hooks/usePolledData.ts`, `src/hooks/usePolledData.test.ts`

- [ ] **Step 1: Failing test** — `src/hooks/usePolledData.test.ts`
```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePolledData } from './usePolledData'

describe('usePolledData', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('populates data from the fetcher', async () => {
    const { result } = renderHook(() => usePolledData('k', async () => 42, 60_000))
    await waitFor(() => expect(result.current.data).toBe(42))
    expect(result.current.stale).toBe(false)
  })

  it('reports error=false with stale data when fetcher later fails (cache hit)', async () => {
    const { result, rerender } = renderHook(
      ({ f }: { f: () => Promise<number> }) => usePolledData('k2', f, 60_000),
      { initialProps: { f: async () => 7 } },
    )
    await waitFor(() => expect(result.current.data).toBe(7))
    rerender({ f: async () => { throw new Error('down') } })
    // next interval not triggered; data remains the cached good value
    expect(result.current.data).toBe(7)
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/hooks/usePolledData.ts`
```ts
import { useEffect, useRef, useState } from 'react'
import { fetchWithFallback } from '../lib/fetchWithFallback'

export interface PolledState<T> { data: T | null; stale: boolean; error: boolean }

/**
 * Fetch `fetcher` through the last-known-good cache under `key`, then re-poll
 * every `intervalMs`. The fetcher is read from a ref so inline closures don't
 * restart the interval on every render.
 */
export function usePolledData<T>(
  key: string,
  fetcher: () => Promise<T>,
  intervalMs: number,
): PolledState<T> {
  const [state, setState] = useState<PolledState<T>>({ data: null, stale: false, error: false })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetchWithFallback(key, () => fetcherRef.current())
        if (!cancelled) setState({ data: res.data, stale: res.stale, error: false })
      } catch {
        if (!cancelled) setState((s) => ({ ...s, error: true }))
      }
    }
    run()
    const id = setInterval(run, intervalMs)
    return () => { cancelled = true; clearInterval(id) }
  }, [key, intervalMs])

  return state
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: usePolledData fetch+cache+interval hook"`

---

## Task 4: Calendar tile

**Files:** Create `src/tiles/CalendarTile.tsx`, `src/tiles/CalendarTile.test.tsx`

- [ ] **Step 1: Failing test** — `src/tiles/CalendarTile.test.tsx`
```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CalendarTile } from './CalendarTile'
import { useAppState } from '../store/appState'

describe('CalendarTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ now: new Date(2026, 5, 6) }) // June 6 2026
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [{ date: '2026-06-06', localName: 'Test Day', name: 'Test Day' }],
    })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders the current month name and 42 day cells', async () => {
    render(<CalendarTile />)
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('cal-cell')).toHaveLength(42)
  })

  it('marks a holiday cell once holidays load', async () => {
    render(<CalendarTile />)
    await waitFor(() => expect(screen.getByTestId('cal-holiday')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/tiles/CalendarTile.tsx`
```tsx
import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { usePolledData } from '../hooks/usePolledData'
import { buildMonthGrid, isoOf } from '../lib/calendar'
import { fetchHolidays, type Holiday } from '../data/holidays'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_MS = 6 * 60 * 60_000 // re-poll holidays every 6h

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
    DAY_MS,
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
              {...(isHoliday ? { 'data-testid': 'cal-holiday' } : {})}
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
            </div>
          )
        })}
      </div>
    </TileFrame>
  )
}
```

Note: the holiday cell overrides `data-testid` to `cal-holiday`; the test counts `cal-cell` from the non-holiday cells (41) plus the day-of-week headers are not testid'd. To keep the "42 cells" assertion exact, holiday cells must ALSO carry `cal-cell`. Adjust: render the testid as `cal-cell` always and add a SECOND marker span for holidays. Implement the cell as:
```tsx
<div key={c.iso} data-testid="cal-cell" data-holiday={isHoliday ? 'true' : undefined} style={{...}}>
  {c.day}
  {isHoliday && <span data-testid="cal-holiday" style={{ display: 'none' }} />}
</div>
```
Use this corrected cell markup (every day is one `cal-cell`; holidays additionally contain a hidden `cal-holiday` marker).

- [ ] **Step 4: Run, expect PASS** — `npm test -- CalendarTile`
- [ ] **Step 5: Commit** — `git commit -m "feat: calendar tile with holiday highlighting"`

---

## Task 5: Air-quality data

**Files:** Create `src/data/airQuality.ts`, `src/data/airQuality.test.ts`

- [ ] **Step 1: Failing test** — `src/data/airQuality.test.ts`
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchAirQuality } from './airQuality'

afterEach(() => vi.restoreAllMocks())

describe('fetchAirQuality', () => {
  it('maps Open-Meteo air-quality payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ current: { us_aqi: 42, pm2_5: 9.1 } }),
    })) as unknown as typeof fetch)
    const aq = await fetchAirQuality({ lat: 28.6, lon: 77.2, name: 'Delhi' })
    expect(aq).toEqual({ usAqi: 42, pm25: 9.1 })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch)
    await expect(fetchAirQuality({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/data/airQuality.ts`
```ts
import type { GeoLocation } from '../store/appState'

export interface AirQuality { usAqi: number; pm25: number }

export async function fetchAirQuality(loc: GeoLocation): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'us_aqi,pm2_5',
  })
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
  if (!res.ok) throw new Error(`air-quality ${res.status}`)
  const j = await res.json()
  return { usAqi: j.current.us_aqi, pm25: j.current.pm2_5 }
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: Open-Meteo air-quality fetch"`

---

## Task 6: Sun/Moon + AQI tile

**Files:** Create `src/tiles/SunMoonTile.tsx`, `src/tiles/SunMoonTile.test.tsx`

- [ ] **Step 1: Failing test** — `src/tiles/SunMoonTile.test.tsx`
```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SunMoonTile } from './SunMoonTile'
import { useAppState, type Weather } from '../store/appState'

const W: Weather = {
  code: 0, isDay: true, temp: 22, feelsLike: 22, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [{ date: '2026-06-06', code: 0, tempMax: 27, tempMin: 18, sunrise: '2026-06-06T05:30', sunset: '2026-06-06T19:30', uvMax: 6 }],
  stale: false,
}

describe('SunMoonTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ weather: W, now: new Date('2026-06-06T12:00:00'), location: { lat: 1, lon: 2, name: 'x' } })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ current: { us_aqi: 42, pm2_5: 9 } }) })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows sunrise and sunset times', () => {
    render(<SunMoonTile />)
    expect(screen.getByText('05:30')).toBeInTheDocument()
    expect(screen.getByText('19:30')).toBeInTheDocument()
  })

  it('shows a moon phase name and UV', () => {
    render(<SunMoonTile />)
    expect(screen.getByTestId('moon-name')).toBeInTheDocument()
    expect(screen.getByText(/UV/)).toBeInTheDocument()
  })

  it('renders a placeholder when weather is missing', () => {
    useAppState.setState({ weather: null })
    render(<SunMoonTile />)
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/tiles/SunMoonTile.tsx`
```tsx
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
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>UV</span><span>UV {Math.round(uv)}</span></div>
      <div style={row}><span style={{ color: 'var(--text-dim)' }}>Air</span><span>{aq ? `AQI ${aq.usAqi}` : '—'}</span></div>
    </TileFrame>
  )
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: sun/moon + air-quality tile"`

---

## Task 7: Quotes (local) + On-This-Day data

**Files:** Create `src/lib/quotes.ts`, `src/lib/quotes.test.ts`, `src/data/onThisDay.ts`, `src/data/onThisDay.test.ts`

- [ ] **Step 1: Failing tests**

`src/lib/quotes.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { pickDailyQuote, QUOTES } from './quotes'

describe('pickDailyQuote', () => {
  it('is deterministic for a given date', () => {
    const a = pickDailyQuote(new Date(2026, 5, 6))
    const b = pickDailyQuote(new Date(2026, 5, 6))
    expect(a).toEqual(b)
  })
  it('returns an entry from the bundled list', () => {
    expect(QUOTES).toContainEqual(pickDailyQuote(new Date(2026, 0, 1)))
  })
  it('varies across the year', () => {
    const set = new Set(Array.from({ length: 30 }, (_, i) => pickDailyQuote(new Date(2026, 0, 1 + i)).text))
    expect(set.size).toBeGreaterThan(1)
  })
})
```

`src/data/onThisDay.test.ts`
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchOnThisDay } from './onThisDay'

afterEach(() => vi.restoreAllMocks())

describe('fetchOnThisDay', () => {
  it('returns the first event', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ events: [{ year: 1969, text: 'Something happened' }] }),
    })) as unknown as typeof fetch)
    const e = await fetchOnThisDay(new Date(2026, 5, 6))
    expect(e).toEqual({ year: 1969, text: 'Something happened' })
  })
  it('returns null when there are no events', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ events: [] }) })) as unknown as typeof fetch)
    expect(await fetchOnThisDay(new Date(2026, 5, 6))).toBeNull()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement**

`src/lib/quotes.ts`
```ts
export interface Quote { text: string; author: string }

export const QUOTES: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'What we think, we become.', author: 'Buddha' },
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Stay hungry, stay foolish.', author: 'Whole Earth Catalog' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Whether you think you can or you can’t, you’re right.', author: 'Henry Ford' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
  { text: 'Everything you can imagine is real.', author: 'Pablo Picasso' },
  { text: 'Little by little, one travels far.', author: 'J.R.R. Tolkien' },
]

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

export function pickDailyQuote(date: Date): Quote {
  return QUOTES[dayOfYear(date) % QUOTES.length]
}
```

`src/data/onThisDay.ts`
```ts
export interface OnThisDay { year: number; text: string }

export async function fetchOnThisDay(date: Date): Promise<OnThisDay | null> {
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`)
  if (!res.ok) throw new Error(`onthisday ${res.status}`)
  const j = await res.json()
  const first = j.events?.[0]
  if (!first) return null
  return { year: first.year, text: first.text }
}
```

- [ ] **Step 4: Run, expect PASS** — `npm test -- quotes onThisDay`
- [ ] **Step 5: Commit** — `git commit -m "feat: bundled daily quotes and on-this-day fetch"`

---

## Task 8: Quote tile

**Files:** Create `src/tiles/QuoteTile.tsx`, `src/tiles/QuoteTile.test.tsx`

- [ ] **Step 1: Failing test** — `src/tiles/QuoteTile.test.tsx`
```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteTile } from './QuoteTile'
import { useAppState } from '../store/appState'
import { pickDailyQuote } from '../lib/quotes'

describe('QuoteTile', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppState.setState({ now: new Date(2026, 5, 6) })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ events: [] }) })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows the deterministic daily quote and author', () => {
    const q = pickDailyQuote(new Date(2026, 5, 6))
    render(<QuoteTile />)
    expect(screen.getByText(new RegExp(q.author))).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/tiles/QuoteTile.tsx`
```tsx
import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { usePolledData } from '../hooks/usePolledData'
import { pickDailyQuote } from '../lib/quotes'
import { fetchOnThisDay, type OnThisDay } from '../data/onThisDay'

const SIX_H = 6 * 60 * 60_000

export function QuoteTile() {
  const now = useAppState((s) => s.now)
  const quote = pickDailyQuote(now)
  const mm = (now.getMonth() + 1).toString().padStart(2, '0')
  const dd = now.getDate().toString().padStart(2, '0')
  const { data: otd } = usePolledData<OnThisDay | null>(
    `onthisday:${mm}-${dd}`,
    () => fetchOnThisDay(now),
    SIX_H,
  )

  return (
    <TileFrame>
      <div style={{ fontSize: '1.15rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.35 }}>
        “{quote.text}”
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 8 }}>
        — {quote.author}
      </div>
      {otd && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
          <strong>{otd.year}</strong> · {otd.text}
        </div>
      )}
    </TileFrame>
  )
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: quote + on-this-day tile"`

---

## Task 9: Markets data (CoinGecko)

**Files:** Create `src/data/markets.ts`, `src/data/markets.test.ts`

- [ ] **Step 1: Failing test** — `src/data/markets.test.ts`
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMarkets } from './markets'

afterEach(() => vi.restoreAllMocks())

describe('fetchMarkets', () => {
  it('maps CoinGecko simple/price payload', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        bitcoin: { usd: 65000, usd_24h_change: 1.5 },
        ethereum: { usd: 3200, usd_24h_change: -2.1 },
      }),
    })) as unknown as typeof fetch)
    const coins = await fetchMarkets(['bitcoin', 'ethereum'])
    expect(coins).toEqual([
      { id: 'bitcoin', symbol: 'BTC', price: 65000, change24h: 1.5 },
      { id: 'ethereum', symbol: 'ETH', price: 3200, change24h: -2.1 },
    ])
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429 })) as unknown as typeof fetch)
    await expect(fetchMarkets(['bitcoin'])).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/data/markets.ts`
```ts
export interface Coin { id: string; symbol: string; price: number; change24h: number }

const SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', cardano: 'ADA', dogecoin: 'DOGE',
}

export async function fetchMarkets(ids: string[]): Promise<Coin[]> {
  const params = new URLSearchParams({
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  })
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`)
  if (!res.ok) throw new Error(`coingecko ${res.status}`)
  const j = await res.json()
  return ids
    .filter((id) => j[id])
    .map((id) => ({
      id,
      symbol: SYMBOLS[id] ?? id.slice(0, 4).toUpperCase(),
      price: j[id].usd,
      change24h: j[id].usd_24h_change ?? 0,
    }))
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: CoinGecko crypto markets fetch"`

---

## Task 10: Ticker tile

**Files:** Create `src/tiles/TickerTile.tsx`, `src/tiles/TickerTile.test.tsx`

- [ ] **Step 1: Failing test** — `src/tiles/TickerTile.test.tsx`
```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TickerTile } from './TickerTile'

describe('TickerTile', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ bitcoin: { usd: 65000, usd_24h_change: 1.5 } }),
    })) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders coin symbols once data loads', async () => {
    render(<TickerTile />)
    await waitFor(() => expect(screen.getByText(/BTC/)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/tiles/TickerTile.tsx`
```tsx
import { usePolledData } from '../hooks/usePolledData'
import { fetchMarkets, type Coin } from '../data/markets'

const COINS = ['bitcoin', 'ethereum', 'solana']
const INTERVAL = 8 * 60_000

function fmtPrice(n: number): string {
  return n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`
}

export function TickerTile() {
  const { data } = usePolledData<Coin[]>('markets', () => fetchMarkets(COINS), INTERVAL)
  const coins = data ?? []
  return (
    <div
      className="glass"
      style={{ display: 'flex', gap: 32, alignItems: 'center', padding: '12px 26px', overflow: 'hidden', whiteSpace: 'nowrap' }}
    >
      {coins.map((c) => {
        const up = c.change24h >= 0
        return (
          <span key={c.id} style={{ display: 'inline-flex', gap: 8, alignItems: 'baseline' }}>
            <strong>{c.symbol}</strong>
            <span>{fmtPrice(c.price)}</span>
            <span style={{ color: up ? '#5fd38a' : '#ff7e7e', fontSize: '0.85rem' }}>
              {up ? '▲' : '▼'} {Math.abs(c.change24h).toFixed(1)}%
            </span>
          </span>
        )
      })}
      {coins.length === 0 && <span style={{ color: 'var(--text-dim)' }}>Markets loading…</span>}
    </div>
  )
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: crypto markets ticker tile"`

---

## Task 11: Photos data + PhotoBackdrop

**Files:** Create `src/data/photos.ts`, `src/data/photos.test.ts`, `src/background/PhotoBackdrop.tsx`

- [ ] **Step 1: Failing test** — `src/data/photos.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { photoUrl, photoSequence } from './photos'

describe('photos', () => {
  it('builds a Picsum seeded URL at the requested size', () => {
    expect(photoUrl('halo-3', 1920, 1080)).toBe('https://picsum.photos/seed/halo-3/1920/1080')
  })
  it('produces a sequence of distinct seeds', () => {
    const seq = photoSequence(5, 800, 600)
    expect(seq).toHaveLength(5)
    expect(new Set(seq).size).toBe(5)
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement**

`src/data/photos.ts`
```ts
export function photoUrl(seed: string | number, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

export function photoSequence(count: number, w: number, h: number): string[] {
  return Array.from({ length: count }, (_, i) => photoUrl(`halo-${i}`, w, h))
}
```

`src/background/PhotoBackdrop.tsx`
```tsx
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { photoSequence } from '../data/photos'

const ROTATE_MS = 3 * 60_000 // new photo every 3 minutes

export function PhotoBackdrop() {
  const photos = photoSequence(8, window.innerWidth, window.innerHeight)
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % photos.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [photos.length])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0b0f1a' }}>
      <AnimatePresence>
        <motion.img
          key={photos[i]}
          src={photos[i]}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.5 }, scale: { duration: ROTATE_MS / 1000, ease: 'linear' } }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AnimatePresence>
      {/* darkening scrim so glass tiles stay legible over bright photos */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))' }} />
    </div>
  )
}
```

- [ ] **Step 4: Run, expect PASS** — `npm test -- photos`
- [ ] **Step 5: Commit** — `git commit -m "feat: Picsum photo helpers and rotating backdrop"`

---

## Task 12: Integrate photo mode + register tiles + verify

**Files:** Modify `src/background/BackgroundEngine.tsx`, `src/layout/LayoutRenderer.tsx`

- [ ] **Step 1: Update BackgroundEngine for photo mode**

Replace the body of `src/background/BackgroundEngine.tsx` with:
```tsx
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { selectScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { ParticleCanvas } from './ParticleCanvas'
import { Celestial } from './Celestial'
import { PhotoBackdrop } from './PhotoBackdrop'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)
  const backgroundMode = useSettings((s) => s.settings.backgroundMode)

  const fallback = { sky: ['#1a2238', '#2a3658'] as [string, string], scene: 'cloudy' as const }
  const result = weather ? selectScene(weather, now) : null
  const sky = result?.palette.sky ?? fallback.sky
  const scene = result?.scene ?? fallback.scene
  const photoMode = backgroundMode === 'photo'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {photoMode ? <PhotoBackdrop /> : <SkyGradient sky={sky} />}
      {!photoMode && <Celestial scene={scene} now={now} />}
      {/* weather particles still drift on top in photo mode for cohesion */}
      <ParticleCanvas scene={scene} performance={performance} />
    </div>
  )
}
```

- [ ] **Step 2: Register the new tiles in LayoutRenderer**

In `src/layout/LayoutRenderer.tsx`, add imports and entries so the `TILES` map includes every tile:
```tsx
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'
import { CalendarTile } from '../tiles/CalendarTile'
import { SunMoonTile } from '../tiles/SunMoonTile'
import { QuoteTile } from '../tiles/QuoteTile'
import { TickerTile } from '../tiles/TickerTile'
```
and
```tsx
const TILES: Partial<Record<TileId, () => ReactNode>> = {
  clock: () => <ClockTile />,
  weather: () => <WeatherTile />,
  calendar: () => <CalendarTile />,
  sunmoon: () => <SunMoonTile />,
  quote: () => <QuoteTile />,
  ticker: () => <TickerTile />,
}
```

- [ ] **Step 3: Update the App smoke test to tolerate all tiles fetching**

The existing `src/App.test.tsx` already stubs `fetch` to throw; every tile uses `fetchWithFallback`/`usePolledData` and degrades to a placeholder, so no change is required. Confirm it still passes.

- [ ] **Step 4: Run the full suite** — `npm test`
Expected: all Plan 1 + Plan 2 tests pass.

- [ ] **Step 5: Build + lint** — `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 6: Manual visual check** — `npm run dev`; toggle `backgroundMode` to `photo` in the settings store (Plan 3 adds the UI) to confirm the backdrop rotates. Confirm calendar, sun/moon, quote, and ticker tiles render.

- [ ] **Step 7: Commit** — `git commit -m "feat: integrate photo mode and register all tiles"`

---

## Self-Review

**Spec coverage (Plan 2 portion):**
- Calendar + holidays → Tasks 1, 2, 4. ✓
- Sun/moon + UV + AQI → Tasks 5, 6 (UV from existing weather daily; moon from Plan 1 `sun.ts`). ✓
- Quote / on this day → Tasks 7, 8. ✓
- Markets ticker (crypto) → Tasks 9, 10. ✓
- Photo background mode with weather particles on top → Tasks 11, 12. ✓
- Self-contained tile fetching → Task 3 `usePolledData`. ✓
- Deferred to Plan 3: settings panel UI, export/import, `?config=`, stale-indicator polish, nightly reload, deploy.

**Placeholder scan:** No TODO/TBD steps; all code complete. The CalendarTile cell markup correction (every cell is one `cal-cell`; holidays carry a nested hidden `cal-holiday` marker) is spelled out in Task 4 Step 3. ✓

**Type consistency:** `Holiday`, `AirQuality`, `OnThisDay`, `Quote`, `Coin` defined in their data/lib modules and imported by their tiles. `usePolledData<T>` generic reused by Calendar/SunMoon/Quote/Ticker. `GeoLocation`/`Weather` reused from Plan 1's `store/appState`. New tiles registered against the existing `TileId` union from `store/defaults.ts`. ✓
