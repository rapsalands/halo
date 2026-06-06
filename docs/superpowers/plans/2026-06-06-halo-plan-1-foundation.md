# Halo — Plan 1: Foundation & Reactive Core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Halo static React app with a working weather-reactive background and the Clock + Weather tiles, driven by live Open-Meteo data with last-known-good caching.

**Architecture:** A Vite + React + TypeScript single-page app. Pure-logic libraries (caching, weather-code mapping, sun/moon math, formatting) are unit-tested with Vitest. Two Zustand stores hold device settings (persisted to `localStorage`) and live app state (clock, weather, location). A data layer fetches Open-Meteo with a generic last-known-good fallback. A `BackgroundEngine` derives a "scene" from weather + time and renders a CSS sky gradient plus a `<canvas>` particle layer. Tiles are frosted "Aurora Glass" components placed by a layout preset.

**Tech Stack:** React 18, Vite, TypeScript, Zustand, Framer Motion, Vitest, @testing-library/react, jsdom. No backend. No API keys.

**Scope of this plan:** scaffold → core libs → stores → geo + weather data → scene selection → background engine → TileFrame + Clock + Weather tiles → Photo-first layout shell → App wiring. End state: `npm run dev` shows a live, weather-reactive dashboard. Calendar, sun/moon, quote, ticker, photo mode, and the settings panel come in Plans 2 and 3.

**Conventions:**
- All source under `src/`. Tests are colocated as `*.test.ts` / `*.test.tsx` next to the unit they test.
- `Date.now()` and `new Date()` are allowed in app code (this is not a workflow script). In tests, control time with `vi.useFakeTimers()` + `vi.setSystemTime(...)`.
- Commit after every task with the message shown in its final step.

---

## File Structure (created across this plan)

```
src/
  main.tsx                 App entry
  App.tsx                  Orchestration: stores, polling, layout
  lib/
    storage.ts             localStorage cache get/set + staleness
    fetchWithFallback.ts   generic last-known-good fetch wrapper
    weatherCodes.ts        WMO code → condition/label/scene
    sun.ts                 moon phase + day/night helpers
    time.ts                time/date formatting + time-of-day bucket
  store/
    defaults.ts            default Settings + Settings type
    settings.ts            Zustand settings store (persisted)
    appState.ts            Zustand live-state store (now/weather/location)
  data/
    geo.ts                 IP geolocation + Open-Meteo geocoding
    weather.ts             Open-Meteo forecast fetch + parse → Weather
  background/
    scene.ts               selectScene(weather, now) → Scene + palette
    SkyGradient.tsx        CSS gradient sky for the scene
    particles/
      types.ts             ParticleSystem interface
      rain.ts              rain system
      snow.ts              snow system
      stars.ts             stars system
    ParticleCanvas.tsx     canvas host that runs the active system
    Celestial.tsx          sun / moon SVG element
    BackgroundEngine.tsx   assembles sky + canvas + celestial
  tiles/
    TileFrame.tsx          Aurora Glass wrapper
    ClockTile.tsx          clock + date
    WeatherTile.tsx        current + 7-day forecast
  layout/
    presets.ts             layout preset definitions
    LayoutRenderer.tsx     places enabled tiles per active preset
  hooks/
    useClock.ts            ticking `now` into appState
  styles/
    theme.css              CSS variables + Aurora Glass classes
    global.css             reset + full-screen kiosk base
```

---

## Task 1: Scaffold project and tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/setupTests.ts`, `src/sanity.test.ts`, `src/styles/global.css`

- [ ] **Step 1: Create the Vite React-TS project in place**

The working directory `/home/sandeep/dev/weather` already contains `docs/` and a git repo. Scaffold without overwriting docs.

Run:
```bash
npm create vite@latest halo-tmp -- --template react-ts
cp -r halo-tmp/. . && rm -rf halo-tmp
rm -f src/App.css src/index.css src/assets/react.svg public/vite.svg
```
Expected: `src/`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` now exist.

- [ ] **Step 2: Install runtime and test dependencies**

Run:
```bash
npm install zustand framer-motion
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: installs succeed; `package.json` lists these.

- [ ] **Step 3: Configure Vite + Vitest**

Replace `vite.config.ts` with:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // relative paths so the static build works from any kiosk URL or file path
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
```

- [ ] **Step 4: Add test setup and npm scripts**

Create `src/setupTests.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

Edit `package.json` `"scripts"` to:
```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Replace entry files and global CSS**

Create `src/styles/global.css`:
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #0b0f1a;
  color: #fff;
  overflow: hidden;            /* kiosk: never scroll */
  -webkit-font-smoothing: antialiased;
  cursor: none;                /* hide cursor on the wall panel */
}
#root { position: relative; }
```

Replace `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Replace `src/App.tsx`:
```tsx
export default function App() {
  return <div>Halo</div>
}
```

- [ ] **Step 6: Add a sanity test**

Create `src/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('tooling', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 7: Run tests and dev build to verify the toolchain**

Run: `npm test`
Expected: 1 passing test.

Run: `npm run build`
Expected: build completes, `dist/` produced, no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Halo Vite React-TS app with Vitest"
```

---

## Task 2: localStorage cache library

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/storage.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { saveCache, loadCache, isStale } from './storage'

describe('storage cache', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('returns null when nothing is cached', () => {
    expect(loadCache<number>('missing')).toBeNull()
  })

  it('round-trips a value with a timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    saveCache('weather', { temp: 24 })
    const got = loadCache<{ temp: number }>('weather')
    expect(got).toEqual({ value: { temp: 24 }, ts: Date.parse('2026-06-06T10:00:00Z') })
  })

  it('flags an entry as stale once older than maxAge', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T10:00:00Z'))
    saveCache('weather', { temp: 24 })
    vi.setSystemTime(new Date('2026-06-06T10:20:00Z')) // +20 min
    const got = loadCache<{ temp: number }>('weather')!
    expect(isStale(got, 15 * 60_000)).toBe(true)
    expect(isStale(got, 30 * 60_000)).toBe(false)
  })

  it('survives corrupt JSON by returning null', () => {
    localStorage.setItem('halo:bad', '{not json')
    expect(loadCache('bad')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- storage`
Expected: FAIL — `./storage` has no exports.

- [ ] **Step 3: Implement `storage.ts`**

Create `src/lib/storage.ts`:
```ts
const PREFIX = 'halo:'

export interface Cached<T> {
  value: T
  ts: number
}

export function saveCache<T>(key: string, value: T): void {
  try {
    const entry: Cached<T> = { value, ts: Date.now() }
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota or disabled storage — ignore, app keeps working from memory */
  }
}

export function loadCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached<T>
    if (typeof parsed?.ts !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function isStale<T>(entry: Cached<T>, maxAgeMs: number): boolean {
  return Date.now() - entry.ts > maxAgeMs
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- storage`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: localStorage cache with timestamp and staleness"
```

---

## Task 3: Generic last-known-good fetch wrapper

**Files:**
- Create: `src/lib/fetchWithFallback.ts`, `src/lib/fetchWithFallback.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/fetchWithFallback.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { fetchWithFallback } from './fetchWithFallback'

describe('fetchWithFallback', () => {
  beforeEach(() => localStorage.clear())

  it('returns fresh data and caches it on success', async () => {
    const res = await fetchWithFallback('k', async () => ({ n: 1 }))
    expect(res).toEqual({ data: { n: 1 }, stale: false, ts: expect.any(Number) })
  })

  it('falls back to cached data when the fetcher throws', async () => {
    await fetchWithFallback('k', async () => ({ n: 1 }))
    const res = await fetchWithFallback('k', async () => {
      throw new Error('network down')
    })
    expect(res.data).toEqual({ n: 1 })
    expect(res.stale).toBe(true)
  })

  it('rethrows when the fetcher fails and there is no cache', async () => {
    await expect(
      fetchWithFallback('cold', async () => {
        throw new Error('boom')
      }),
    ).rejects.toThrow('boom')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- fetchWithFallback`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `fetchWithFallback.ts`**

Create `src/lib/fetchWithFallback.ts`:
```ts
import { saveCache, loadCache } from './storage'

export interface FetchResult<T> {
  data: T
  stale: boolean
  ts: number
}

/**
 * Run `fetcher` (network + parse). On success, cache the result and return it
 * fresh. On failure, return the last cached value flagged stale. If there is no
 * cache at all, rethrow so the caller can show an empty state.
 */
export async function fetchWithFallback<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
): Promise<FetchResult<T>> {
  try {
    const data = await fetcher()
    saveCache(cacheKey, data)
    return { data, stale: false, ts: Date.now() }
  } catch (err) {
    const cached = loadCache<T>(cacheKey)
    if (cached) return { data: cached.value, stale: true, ts: cached.ts }
    throw err
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- fetchWithFallback`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/fetchWithFallback.ts src/lib/fetchWithFallback.test.ts
git commit -m "feat: generic last-known-good fetch wrapper"
```

---

## Task 4: WMO weather-code mapping

**Files:**
- Create: `src/lib/weatherCodes.ts`, `src/lib/weatherCodes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/weatherCodes.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { describeCode, sceneFor } from './weatherCodes'

describe('describeCode', () => {
  it('labels representative codes', () => {
    expect(describeCode(0).label).toBe('Clear sky')
    expect(describeCode(3).condition).toBe('overcast')
    expect(describeCode(45).condition).toBe('fog')
    expect(describeCode(63).condition).toBe('rain')
    expect(describeCode(75).condition).toBe('snow')
    expect(describeCode(95).condition).toBe('thunder')
  })

  it('falls back gracefully for unknown codes', () => {
    expect(describeCode(999).label).toBe('Unknown')
    expect(describeCode(999).condition).toBe('cloudy')
  })
})

describe('sceneFor', () => {
  it('splits clear by day/night', () => {
    expect(sceneFor(0, true)).toBe('clear-day')
    expect(sceneFor(1, false)).toBe('clear-night')
  })
  it('maps weather families to scenes', () => {
    expect(sceneFor(2, true)).toBe('cloudy')
    expect(sceneFor(3, true)).toBe('cloudy')
    expect(sceneFor(48, true)).toBe('fog')
    expect(sceneFor(51, true)).toBe('rain')
    expect(sceneFor(82, true)).toBe('rain')
    expect(sceneFor(73, true)).toBe('snow')
    expect(sceneFor(86, true)).toBe('snow')
    expect(sceneFor(99, true)).toBe('thunder')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- weatherCodes`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `weatherCodes.ts`**

Create `src/lib/weatherCodes.ts`:
```ts
export type Condition =
  | 'clear' | 'partly' | 'cloudy' | 'overcast' | 'fog'
  | 'drizzle' | 'rain' | 'snow' | 'thunder'

export type Scene =
  | 'clear-day' | 'clear-night' | 'cloudy' | 'fog' | 'rain' | 'thunder' | 'snow'

interface CodeInfo { condition: Condition; label: string }

const TABLE: Record<number, CodeInfo> = {
  0: { condition: 'clear', label: 'Clear sky' },
  1: { condition: 'clear', label: 'Mainly clear' },
  2: { condition: 'partly', label: 'Partly cloudy' },
  3: { condition: 'overcast', label: 'Overcast' },
  45: { condition: 'fog', label: 'Fog' },
  48: { condition: 'fog', label: 'Rime fog' },
  51: { condition: 'drizzle', label: 'Light drizzle' },
  53: { condition: 'drizzle', label: 'Drizzle' },
  55: { condition: 'drizzle', label: 'Dense drizzle' },
  56: { condition: 'drizzle', label: 'Freezing drizzle' },
  57: { condition: 'drizzle', label: 'Freezing drizzle' },
  61: { condition: 'rain', label: 'Light rain' },
  63: { condition: 'rain', label: 'Rain' },
  65: { condition: 'rain', label: 'Heavy rain' },
  66: { condition: 'rain', label: 'Freezing rain' },
  67: { condition: 'rain', label: 'Freezing rain' },
  71: { condition: 'snow', label: 'Light snow' },
  73: { condition: 'snow', label: 'Snow' },
  75: { condition: 'snow', label: 'Heavy snow' },
  77: { condition: 'snow', label: 'Snow grains' },
  80: { condition: 'rain', label: 'Rain showers' },
  81: { condition: 'rain', label: 'Rain showers' },
  82: { condition: 'rain', label: 'Violent showers' },
  85: { condition: 'snow', label: 'Snow showers' },
  86: { condition: 'snow', label: 'Snow showers' },
  95: { condition: 'thunder', label: 'Thunderstorm' },
  96: { condition: 'thunder', label: 'Thunderstorm, hail' },
  99: { condition: 'thunder', label: 'Thunderstorm, hail' },
}

export function describeCode(code: number): CodeInfo {
  return TABLE[code] ?? { condition: 'cloudy', label: 'Unknown' }
}

export function sceneFor(code: number, isDay: boolean): Scene {
  const { condition } = describeCode(code)
  switch (condition) {
    case 'thunder': return 'thunder'
    case 'snow': return 'snow'
    case 'rain':
    case 'drizzle': return 'rain'
    case 'fog': return 'fog'
    case 'partly':
    case 'overcast':
    case 'cloudy': return 'cloudy'
    case 'clear':
    default: return isDay ? 'clear-day' : 'clear-night'
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- weatherCodes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weatherCodes.ts src/lib/weatherCodes.test.ts
git commit -m "feat: WMO weather-code to condition and scene mapping"
```

---

## Task 5: Sun/moon math

**Files:**
- Create: `src/lib/sun.ts`, `src/lib/sun.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/sun.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { moonPhase, isDaytime } from './sun'

describe('moonPhase', () => {
  it('identifies a known new moon (2026-01-? near reference) by name bucket', () => {
    // 2025-12-20 was a new moon; fraction should be near 0
    const p = moonPhase(new Date('2025-12-20T00:00:00Z'))
    expect(p.fraction).toBeGreaterThanOrEqual(0)
    expect(p.fraction).toBeLessThan(1)
    expect(['New Moon', 'Waning Crescent', 'Waxing Crescent']).toContain(p.name)
  })

  it('identifies a full moon around 2026-01-03', () => {
    const p = moonPhase(new Date('2026-01-03T12:00:00Z'))
    expect(p.name).toBe('Full Moon')
    expect(p.illumination).toBeGreaterThan(0.9)
  })

  it('returns illumination between 0 and 1', () => {
    const p = moonPhase(new Date('2026-06-06T00:00:00Z'))
    expect(p.illumination).toBeGreaterThanOrEqual(0)
    expect(p.illumination).toBeLessThanOrEqual(1)
  })
})

describe('isDaytime', () => {
  it('is true between sunrise and sunset', () => {
    const sunrise = new Date('2026-06-06T05:30:00Z')
    const sunset = new Date('2026-06-06T19:30:00Z')
    expect(isDaytime(new Date('2026-06-06T12:00:00Z'), sunrise, sunset)).toBe(true)
    expect(isDaytime(new Date('2026-06-06T22:00:00Z'), sunrise, sunset)).toBe(false)
    expect(isDaytime(new Date('2026-06-06T03:00:00Z'), sunrise, sunset)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- sun`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `sun.ts`**

Create `src/lib/sun.ts`:
```ts
const SYNODIC = 29.53058867 // days in a lunation
// Reference new moon: 2000-01-06 18:14 UTC as a Julian-style epoch in ms.
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0)
const DAY_MS = 86_400_000

export interface MoonPhase {
  fraction: number // 0..1 position in the cycle (0 = new, 0.5 = full)
  illumination: number // 0..1 fraction of disc lit
  name: string
}

const NAMES: [number, string][] = [
  [0.0625, 'New Moon'],
  [0.1875, 'Waxing Crescent'],
  [0.3125, 'First Quarter'],
  [0.4375, 'Waxing Gibbous'],
  [0.5625, 'Full Moon'],
  [0.6875, 'Waning Gibbous'],
  [0.8125, 'Last Quarter'],
  [0.9375, 'Waning Crescent'],
]

export function moonPhase(date: Date): MoonPhase {
  const days = (date.getTime() - REF_NEW_MOON) / DAY_MS
  let fraction = (days / SYNODIC) % 1
  if (fraction < 0) fraction += 1
  // Illumination: 0 at new, 1 at full, back to 0 — cosine curve.
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2
  let name = 'New Moon'
  for (const [edge, label] of NAMES) {
    if (fraction < edge) { name = label; break }
    name = 'New Moon' // wraps past 0.9375 back to New
  }
  return { fraction, illumination, name }
}

export function isDaytime(now: Date, sunrise: Date, sunset: Date): boolean {
  return now >= sunrise && now < sunset
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- sun`
Expected: PASS. If the full-moon name assertion is off by a bucket, adjust `REF_NEW_MOON` minutes — but the provided epoch matches the listed dates.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sun.ts src/lib/sun.test.ts
git commit -m "feat: moon phase and daytime helpers"
```

---

## Task 6: Time/date formatting and time-of-day bucket

**Files:**
- Create: `src/lib/time.ts`, `src/lib/time.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/time.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatClock, formatLongDate, timeOfDay } from './time'

describe('formatClock', () => {
  const d = new Date('2026-06-06T14:05:00')
  it('formats 24-hour', () => expect(formatClock(d, false)).toBe('14:05'))
  it('formats 12-hour', () => expect(formatClock(d, true)).toBe('2:05'))
})

describe('formatLongDate', () => {
  it('formats a weekday and month', () => {
    expect(formatLongDate(new Date('2026-06-06T09:00:00'))).toBe('Saturday · June 6')
  })
})

describe('timeOfDay', () => {
  const sunrise = new Date('2026-06-06T05:30:00')
  const sunset = new Date('2026-06-06T19:30:00')
  it('buckets dawn near sunrise', () => {
    expect(timeOfDay(new Date('2026-06-06T05:45:00'), sunrise, sunset)).toBe('dawn')
  })
  it('buckets midday as day', () => {
    expect(timeOfDay(new Date('2026-06-06T12:00:00'), sunrise, sunset)).toBe('day')
  })
  it('buckets dusk near sunset', () => {
    expect(timeOfDay(new Date('2026-06-06T19:15:00'), sunrise, sunset)).toBe('dusk')
  })
  it('buckets deep night', () => {
    expect(timeOfDay(new Date('2026-06-06T23:00:00'), sunrise, sunset)).toBe('night')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- time`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `time.ts`**

Create `src/lib/time.ts`:
```ts
export type DayPart = 'dawn' | 'day' | 'dusk' | 'night'

export function formatClock(date: Date, hour12: boolean): string {
  let h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, '0')
  if (hour12) {
    h = h % 12
    if (h === 0) h = 12
    return `${h}:${m}`
  }
  return `${h.toString().padStart(2, '0')}:${m}`
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]} · ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

const WINDOW_MS = 45 * 60_000 // dawn/dusk window around sun events

export function timeOfDay(now: Date, sunrise: Date, sunset: Date): DayPart {
  const t = now.getTime()
  if (Math.abs(t - sunrise.getTime()) <= WINDOW_MS) return 'dawn'
  if (Math.abs(t - sunset.getTime()) <= WINDOW_MS) return 'dusk'
  if (t > sunrise.getTime() && t < sunset.getTime()) return 'day'
  return 'night'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- time`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/time.ts src/lib/time.test.ts
git commit -m "feat: time/date formatting and day-part bucketing"
```

---

## Task 7: Settings store with defaults and persistence

**Files:**
- Create: `src/store/defaults.ts`, `src/store/settings.ts`, `src/store/settings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/settings.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useSettings } from './settings'
import { DEFAULT_SETTINGS } from './defaults'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
  })

  it('starts from defaults', () => {
    expect(useSettings.getState().settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updates and persists a setting', () => {
    useSettings.getState().update({ units: 'imperial' })
    expect(useSettings.getState().settings.units).toBe('imperial')
    const raw = JSON.parse(localStorage.getItem('halo:settings')!)
    expect(raw.value.units).toBe('imperial')
  })

  it('merges persisted settings over defaults on load', () => {
    localStorage.setItem('halo:settings', JSON.stringify({ value: { hour12: true }, ts: 1 }))
    useSettings.getState().load()
    expect(useSettings.getState().settings.hour12).toBe(true)
    expect(useSettings.getState().settings.units).toBe(DEFAULT_SETTINGS.units)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- settings`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement defaults and store**

Create `src/store/defaults.ts`:
```ts
export type Units = 'metric' | 'imperial'
export type BackgroundMode = 'weather' | 'photo'
export type Performance = 'low' | 'high'
export type LayoutPreset = 'photo-first' | 'bento'
export type TileId = 'clock' | 'weather' | 'calendar' | 'sunmoon' | 'quote' | 'ticker'

export interface Settings {
  layout: LayoutPreset
  backgroundMode: BackgroundMode
  performance: Performance
  units: Units
  hour12: boolean
  holidayCountry: string // ISO-3166 alpha-2, e.g. 'IN'
  enabledTiles: Record<TileId, boolean>
  location: { lat: number; lon: number; name: string } | null // null = auto-detect
}

export const DEFAULT_SETTINGS: Settings = {
  layout: 'photo-first',
  backgroundMode: 'weather',
  performance: 'high',
  units: 'metric',
  hour12: false,
  holidayCountry: 'IN',
  enabledTiles: {
    clock: true, weather: true, calendar: true,
    sunmoon: true, quote: true, ticker: true,
  },
  location: null,
}
```

Create `src/store/settings.ts`:
```ts
import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Settings } from './defaults'
import { saveCache, loadCache } from '../lib/storage'

const KEY = 'settings'

interface SettingsState {
  settings: Settings
  load: () => void
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  load: () => {
    const cached = loadCache<Partial<Settings>>(KEY)
    if (cached) set({ settings: { ...DEFAULT_SETTINGS, ...cached.value } })
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch }
    saveCache(KEY, next)
    set({ settings: next })
  },
  reset: () => set({ settings: DEFAULT_SETTINGS }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- settings`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/defaults.ts src/store/settings.ts src/store/settings.test.ts
git commit -m "feat: persisted settings store with defaults"
```

---

## Task 8: Live app-state store

**Files:**
- Create: `src/store/appState.ts`, `src/store/appState.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/appState.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppState } from './appState'

describe('appState store', () => {
  beforeEach(() => useAppState.setState({ now: new Date('2026-06-06T10:00:00'), weather: null, location: null }))

  it('holds a ticking now', () => {
    const t = new Date('2026-06-06T10:00:01')
    useAppState.getState().setNow(t)
    expect(useAppState.getState().now).toBe(t)
  })

  it('stores weather and location', () => {
    useAppState.getState().setLocation({ lat: 1, lon: 2, name: 'Test' })
    expect(useAppState.getState().location?.name).toBe('Test')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- appState`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `appState.ts`**

Create `src/store/appState.ts`:
```ts
import { create } from 'zustand'

export interface GeoLocation { lat: number; lon: number; name: string }

export interface DailyForecast {
  date: string
  code: number
  tempMax: number
  tempMin: number
  sunrise: string
  sunset: string
  uvMax: number
}

export interface Weather {
  code: number
  isDay: boolean
  temp: number
  feelsLike: number
  humidity: number
  windSpeed: number
  sunriseToday: string
  sunsetToday: string
  daily: DailyForecast[]
  stale: boolean
}

interface AppState {
  now: Date
  weather: Weather | null
  location: GeoLocation | null
  setNow: (d: Date) => void
  setWeather: (w: Weather) => void
  setLocation: (l: GeoLocation) => void
}

export const useAppState = create<AppState>((set) => ({
  now: new Date(),
  weather: null,
  location: null,
  setNow: (now) => set({ now }),
  setWeather: (weather) => set({ weather }),
  setLocation: (location) => set({ location }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- appState`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/appState.ts src/store/appState.test.ts
git commit -m "feat: live app-state store for now/weather/location"
```

---

## Task 9: Geo — IP geolocation + city geocoding

**Files:**
- Create: `src/data/geo.ts`, `src/data/geo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/geo.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { ipLocate, geocodeCity } from './geo'

afterEach(() => vi.restoreAllMocks())

describe('ipLocate', () => {
  it('maps ipapi.co payload to a GeoLocation', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ latitude: 28.6, longitude: 77.2, city: 'Delhi', country_code: 'IN' }),
    })) as unknown as typeof fetch)
    const loc = await ipLocate()
    expect(loc).toEqual({ lat: 28.6, lon: 77.2, name: 'Delhi' })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })) as unknown as typeof fetch)
    await expect(ipLocate()).rejects.toThrow()
  })
})

describe('geocodeCity', () => {
  it('returns the first geocoding result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [{ latitude: 51.5, longitude: -0.12, name: 'London', country: 'UK' }] }),
    })) as unknown as typeof fetch)
    const loc = await geocodeCity('London')
    expect(loc).toEqual({ lat: 51.5, lon: -0.12, name: 'London' })
  })

  it('returns null when there are no results', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch)
    expect(await geocodeCity('zzzz')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- geo`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `geo.ts`**

Create `src/data/geo.ts`:
```ts
import type { GeoLocation } from '../store/appState'

export async function ipLocate(): Promise<GeoLocation> {
  const res = await fetch('https://ipapi.co/json/')
  if (!res.ok) throw new Error(`ipapi ${res.status}`)
  const j = await res.json()
  if (typeof j.latitude !== 'number' || typeof j.longitude !== 'number') {
    throw new Error('ipapi: no coordinates')
  }
  return { lat: j.latitude, lon: j.longitude, name: j.city ?? 'Current location' }
}

export async function geocodeCity(query: string): Promise<GeoLocation | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`geocoding ${res.status}`)
  const j = await res.json()
  const first = j.results?.[0]
  if (!first) return null
  return { lat: first.latitude, lon: first.longitude, name: first.name }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- geo`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/geo.ts src/data/geo.test.ts
git commit -m "feat: IP geolocation and city geocoding"
```

---

## Task 10: Weather fetch + parse (Open-Meteo)

**Files:**
- Create: `src/data/weather.ts`, `src/data/weather.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/weather.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWeather } from './weather'

afterEach(() => vi.restoreAllMocks())

const SAMPLE = {
  current: {
    temperature_2m: 24.3, apparent_temperature: 23.1, relative_humidity_2m: 40,
    is_day: 1, weather_code: 3, wind_speed_10m: 12,
  },
  daily: {
    time: ['2026-06-06', '2026-06-07'],
    weather_code: [3, 0],
    temperature_2m_max: [27, 29],
    temperature_2m_min: [18, 19],
    sunrise: ['2026-06-06T05:30', '2026-06-07T05:30'],
    sunset: ['2026-06-06T19:30', '2026-06-07T19:31'],
    uv_index_max: [6, 7],
  },
}

describe('fetchWeather', () => {
  it('parses Open-Meteo current + daily into a Weather object', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => SAMPLE })) as unknown as typeof fetch)
    const w = await fetchWeather({ lat: 28.6, lon: 77.2, name: 'Delhi' })
    expect(w.temp).toBe(24)            // rounded
    expect(w.isDay).toBe(true)
    expect(w.code).toBe(3)
    expect(w.daily).toHaveLength(2)
    expect(w.daily[0].tempMax).toBe(27)
    expect(w.sunriseToday).toBe('2026-06-06T05:30')
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch)
    await expect(fetchWeather({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- weather`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `weather.ts`**

Create `src/data/weather.ts`:
```ts
import type { GeoLocation, Weather, DailyForecast } from '../store/appState'

export async function fetchWeather(loc: GeoLocation): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(loc.lat),
    longitude: String(loc.lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()
  const c = j.current
  const d = j.daily
  const daily: DailyForecast[] = d.time.map((date: string, i: number) => ({
    date,
    code: d.weather_code[i],
    tempMax: Math.round(d.temperature_2m_max[i]),
    tempMin: Math.round(d.temperature_2m_min[i]),
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
    uvMax: d.uv_index_max[i],
  }))
  return {
    code: c.weather_code,
    isDay: c.is_day === 1,
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    sunriseToday: daily[0].sunrise,
    sunsetToday: daily[0].sunset,
    daily,
    stale: false,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- weather`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/weather.ts src/data/weather.test.ts
git commit -m "feat: Open-Meteo weather fetch and parse"
```

---

## Task 11: Scene selection + palette

**Files:**
- Create: `src/background/scene.ts`, `src/background/scene.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/background/scene.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { selectScene } from './scene'
import type { Weather } from '../store/appState'

function weather(over: Partial<Weather>): Weather {
  return {
    code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
    sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
    daily: [], stale: false, ...over,
  }
}

describe('selectScene', () => {
  it('returns clear-day for clear daytime weather', () => {
    const s = selectScene(weather({ code: 0, isDay: true }), new Date('2026-06-06T12:00:00'))
    expect(s.scene).toBe('clear-day')
    expect(s.dayPart).toBe('day')
    expect(s.palette.accent).toMatch(/^#|rgb/)
  })

  it('returns rain scene with cool accent', () => {
    const s = selectScene(weather({ code: 63 }), new Date('2026-06-06T12:00:00'))
    expect(s.scene).toBe('rain')
  })

  it('returns clear-night when isDay false', () => {
    const s = selectScene(weather({ code: 0, isDay: false }), new Date('2026-06-06T23:00:00'))
    expect(s.scene).toBe('clear-night')
    expect(s.dayPart).toBe('night')
  })

  it('warms the accent at dusk', () => {
    const s = selectScene(weather({ code: 0 }), new Date('2026-06-06T19:15:00'))
    expect(s.dayPart).toBe('dusk')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scene`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `scene.ts`**

Create `src/background/scene.ts`:
```ts
import { sceneFor, type Scene } from '../lib/weatherCodes'
import { timeOfDay, type DayPart } from '../lib/time'
import type { Weather } from '../store/appState'

export interface Palette {
  /** Two-stop sky gradient (top → bottom). */
  sky: [string, string]
  /** Aurora-glass accent tint that matches the scene/time. */
  accent: string
}

export interface SceneResult {
  scene: Scene
  dayPart: DayPart
  palette: Palette
}

const SKIES: Record<Scene, Record<DayPart, [string, string]>> = {
  'clear-day': {
    dawn: ['#ff9a76', '#ffd9a0'], day: ['#4a90e2', '#a7d3ff'],
    dusk: ['#ff7e5f', '#feb47b'], night: ['#0b1a3a', '#10254f'],
  },
  'clear-night': {
    dawn: ['#1a2a52', '#3a4a72'], day: ['#2a3a62', '#4a5a82'],
    dusk: ['#16203f', '#23305a'], night: ['#070b18', '#0e1630'],
  },
  cloudy: {
    dawn: ['#8a93a8', '#c2c8d4'], day: ['#7d8aa0', '#aeb8c8'],
    dusk: ['#5a6276', '#8a8f9e'], night: ['#1a1f2c', '#2a3140'],
  },
  fog: {
    dawn: ['#b9bcc2', '#dfe2e6'], day: ['#aeb2ba', '#d4d7dc'],
    dusk: ['#888d96', '#b4b8c0'], night: ['#3a3e46', '#565b64'],
  },
  rain: {
    dawn: ['#4a5568', '#6b7488'], day: ['#3f4a5c', '#5a6478'],
    dusk: ['#363f50', '#4c5566'], night: ['#10141d', '#1c2230'],
  },
  thunder: {
    dawn: ['#2a2f3a', '#414857'], day: ['#2c313c', '#454c5b'],
    dusk: ['#23272f', '#363c47'], night: ['#0a0c11', '#161a22'],
  },
  snow: {
    dawn: ['#9aa6b8', '#d6dde7'], day: ['#8f9cb0', '#cdd6e2'],
    dusk: ['#6f7a8c', '#a6b0c0'], night: ['#222a36', '#374252'],
  },
}

const ACCENTS: Record<DayPart, string> = {
  dawn: '#ffb37e', day: '#7fd0ff', dusk: '#ff9e6d', night: '#9db4ff',
}

export function selectScene(weather: Weather, now: Date): SceneResult {
  const sunrise = new Date(weather.sunriseToday)
  const sunset = new Date(weather.sunsetToday)
  const dayPart = timeOfDay(now, sunrise, sunset)
  const scene = sceneFor(weather.code, weather.isDay)
  const sky = SKIES[scene][dayPart]
  // Rain/thunder/snow override the accent toward a cool tone for cohesion.
  const accent = scene === 'rain' || scene === 'thunder'
    ? '#8fb4d8'
    : ACCENTS[dayPart]
  return { scene, dayPart, palette: { sky, accent } }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scene`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/background/scene.ts src/background/scene.test.ts
git commit -m "feat: scene selection with sky and accent palette"
```

---

## Task 12: Theme CSS + Aurora Glass TileFrame

**Files:**
- Create: `src/styles/theme.css`, `src/tiles/TileFrame.tsx`, `src/tiles/TileFrame.test.tsx`
- Modify: `src/main.tsx` (import theme.css)

- [ ] **Step 1: Write the failing test**

Create `src/tiles/TileFrame.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TileFrame } from './TileFrame'

describe('TileFrame', () => {
  it('renders children inside a glass container', () => {
    render(<TileFrame><span>hello</span></TileFrame>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('applies the accent as a CSS variable', () => {
    const { container } = render(<TileFrame accent="#abcdef">x</TileFrame>)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue('--accent')).toBe('#abcdef')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TileFrame`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement theme + TileFrame**

Create `src/styles/theme.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');

:root {
  --glass-bg: rgba(255, 255, 255, 0.13);
  --glass-border: rgba(255, 255, 255, 0.28);
  --glass-blur: 14px;
  --accent: #7fd0ff;
  --text: #ffffff;
  --text-dim: rgba(255, 255, 255, 0.7);
}

.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 22px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  color: var(--text);
  padding: 22px 26px;
}

/* Low performance mode disables the expensive blur. */
.perf-low .glass {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(20, 26, 40, 0.55);
}
```

Create `src/tiles/TileFrame.tsx`:
```tsx
import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  accent?: string
  style?: CSSProperties
  className?: string
}

export function TileFrame({ children, accent, style, className }: Props) {
  const vars = accent ? ({ ['--accent']: accent } as CSSProperties) : {}
  return (
    <motion.div
      className={`glass ${className ?? ''}`}
      style={{ ...vars, ...style }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
```

Edit `src/main.tsx` — add the theme import after the global import:
```tsx
import './styles/global.css'
import './styles/theme.css'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TileFrame`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/tiles/TileFrame.tsx src/tiles/TileFrame.test.tsx src/main.tsx
git commit -m "feat: Aurora Glass theme and TileFrame component"
```

---

## Task 13: Clock tile + ticking hook

**Files:**
- Create: `src/hooks/useClock.ts`, `src/tiles/ClockTile.tsx`, `src/tiles/ClockTile.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tiles/ClockTile.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClockTile } from './ClockTile'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'

describe('ClockTile', () => {
  beforeEach(() => {
    useAppState.setState({ now: new Date('2026-06-06T14:05:00') })
    useSettings.getState().reset()
  })

  it('shows the 24h time and long date', () => {
    render(<ClockTile />)
    expect(screen.getByText('14:05')).toBeInTheDocument()
    expect(screen.getByText('Saturday · June 6')).toBeInTheDocument()
  })

  it('respects the 12-hour setting', () => {
    useSettings.getState().update({ hour12: true })
    render(<ClockTile />)
    expect(screen.getByText('2:05')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ClockTile`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement hook + tile**

Create `src/hooks/useClock.ts`:
```ts
import { useEffect } from 'react'
import { useAppState } from '../store/appState'

/** Ticks the shared `now` once per second. Mount once near the app root. */
export function useClock() {
  const setNow = useAppState((s) => s.setNow)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [setNow])
}
```

Create `src/tiles/ClockTile.tsx`:
```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ClockTile`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useClock.ts src/tiles/ClockTile.tsx src/tiles/ClockTile.test.tsx
git commit -m "feat: clock tile and ticking clock hook"
```

---

## Task 14: Weather tile

**Files:**
- Create: `src/tiles/WeatherTile.tsx`, `src/tiles/WeatherTile.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tiles/WeatherTile.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WeatherTile } from './WeatherTile'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const W: Weather = {
  code: 3, isDay: true, temp: 24, feelsLike: 23, humidity: 40, windSpeed: 12,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [
    { date: '2026-06-06', code: 3, tempMax: 27, tempMin: 18, sunrise: '', sunset: '', uvMax: 6 },
    { date: '2026-06-07', code: 0, tempMax: 29, tempMin: 19, sunrise: '', sunset: '', uvMax: 7 },
  ],
  stale: false,
}

describe('WeatherTile', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: W })
  })

  it('shows current temperature in metric with the condition label', () => {
    render(<WeatherTile />)
    expect(screen.getByText('24°')).toBeInTheDocument()
    expect(screen.getByText('Overcast')).toBeInTheDocument()
  })

  it('converts to Fahrenheit in imperial mode', () => {
    useSettings.getState().update({ units: 'imperial' })
    render(<WeatherTile />)
    expect(screen.getByText('75°')).toBeInTheDocument() // 24C → 75F
  })

  it('renders a forecast row per day', () => {
    render(<WeatherTile />)
    expect(screen.getAllByTestId('forecast-day')).toHaveLength(2)
  })

  it('shows a placeholder when weather is missing', () => {
    useAppState.setState({ weather: null })
    render(<WeatherTile />)
    expect(screen.getByText(/weather unavailable/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- WeatherTile`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `WeatherTile.tsx`**

Create `src/tiles/WeatherTile.tsx`:
```tsx
import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { describeCode } from '../lib/weatherCodes'

const toF = (c: number) => Math.round((c * 9) / 5 + 32)

function weekday(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

export function WeatherTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  if (!weather) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Weather unavailable</div></TileFrame>
  }
  const temp = units === 'imperial' ? toF(weather.temp) : weather.temp
  const { label } = describeCode(weather.code)
  return (
    <TileFrame>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: '3.6rem', fontWeight: 800 }}>{temp}°</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>{label}</span>
      </div>
      {weather.stale && (
        <div style={{ fontSize: '0.7rem', color: '#ffd27e', marginTop: 2 }}>· stale</div>
      )}
      <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
        {weather.daily.map((d) => (
          <div key={d.date} data-testid="forecast-day" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-dim)' }}>{weekday(d.date)}</div>
            <div style={{ fontWeight: 600 }}>
              {units === 'imperial' ? toF(d.tempMax) : d.tempMax}°
            </div>
            <div style={{ color: 'var(--text-dim)' }}>
              {units === 'imperial' ? toF(d.tempMin) : d.tempMin}°
            </div>
          </div>
        ))}
      </div>
    </TileFrame>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- WeatherTile`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/tiles/WeatherTile.tsx src/tiles/WeatherTile.test.tsx
git commit -m "feat: weather tile with unit conversion and forecast row"
```

---

## Task 15: Sky gradient component

**Files:**
- Create: `src/background/SkyGradient.tsx`, `src/background/SkyGradient.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/background/SkyGradient.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkyGradient } from './SkyGradient'

describe('SkyGradient', () => {
  it('renders a full-screen layer using the palette stops', () => {
    const { container } = render(<SkyGradient sky={['#111111', '#222222']} />)
    const el = container.firstChild as HTMLElement
    expect(el.style.background).toContain('#111111')
    expect(el.style.background).toContain('#222222')
    expect(el.style.position).toBe('absolute')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SkyGradient`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `SkyGradient.tsx`**

Create `src/background/SkyGradient.tsx`:
```tsx
interface Props { sky: [string, string] }

/** Full-screen background gradient. Transitions are handled by CSS. */
export function SkyGradient({ sky }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)`,
        transition: 'background 2s ease',
      }}
    />
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SkyGradient`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/background/SkyGradient.tsx src/background/SkyGradient.test.tsx
git commit -m "feat: full-screen sky gradient layer"
```

---

## Task 16: Particle systems + canvas host

**Files:**
- Create: `src/background/particles/types.ts`, `src/background/particles/rain.ts`, `src/background/particles/snow.ts`, `src/background/particles/stars.ts`, `src/background/particles/rain.test.ts`, `src/background/ParticleCanvas.tsx`

- [ ] **Step 1: Write the failing test (particle factory contract)**

Create `src/background/particles/rain.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createRain } from './rain'

describe('createRain', () => {
  it('spawns a particle count scaled by performance', () => {
    const high = createRain({ width: 1920, height: 1080, performance: 'high' })
    const low = createRain({ width: 1920, height: 1080, performance: 'low' })
    expect(high.count).toBeGreaterThan(low.count)
  })

  it('advances without throwing and stays within bounds height-wise', () => {
    const sys = createRain({ width: 100, height: 100, performance: 'low' })
    const fakeCtx = {
      clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      set strokeStyle(_v: string) {}, set lineWidth(_v: number) {}, set globalAlpha(_v: number) {},
    } as unknown as CanvasRenderingContext2D
    expect(() => { for (let i = 0; i < 5; i++) sys.step(fakeCtx, 16) }).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- rain`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the particle interface and three systems**

Create `src/background/particles/types.ts`:
```ts
import type { Performance } from '../../store/defaults'

export interface ParticleInit {
  width: number
  height: number
  performance: Performance
}

export interface ParticleSystem {
  count: number
  /** Advance and draw one frame. `dt` is milliseconds since the last frame. */
  step(ctx: CanvasRenderingContext2D, dt: number): void
}
```

Create `src/background/particles/rain.ts`:
```ts
import type { ParticleInit, ParticleSystem } from './types'

interface Drop { x: number; y: number; len: number; speed: number }

export function createRain(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 320 : 110
  const drops: Drop[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    len: 12 + Math.random() * 18,
    speed: 600 + Math.random() * 500, // px per second
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)'
      ctx.lineWidth = 1.2
      for (const d of drops) {
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x, d.y + d.len)
        ctx.stroke()
        d.y += d.speed * sec
        if (d.y > height) { d.y = -d.len; d.x = Math.random() * width }
      }
    },
  }
}
```

Create `src/background/particles/snow.ts`:
```ts
import type { ParticleInit, ParticleSystem } from './types'

interface Flake { x: number; y: number; r: number; speed: number; drift: number; phase: number }

export function createSnow(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 220 : 80
  const flakes: Flake[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 1.5 + Math.random() * 2.5,
    speed: 40 + Math.random() * 50,
    drift: 20 + Math.random() * 30,
    phase: Math.random() * Math.PI * 2,
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      for (const f of flakes) {
        f.phase += sec
        f.y += f.speed * sec
        f.x += Math.sin(f.phase) * f.drift * sec
        if (f.y > height) { f.y = -f.r; f.x = Math.random() * width }
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}
```

Create `src/background/particles/stars.ts`:
```ts
import type { ParticleInit, ParticleSystem } from './types'

interface Star { x: number; y: number; r: number; twinkle: number; phase: number }

export function createStars(init: ParticleInit): ParticleSystem {
  const { width, height, performance } = init
  const count = performance === 'high' ? 180 : 80
  const stars: Star[] = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.7,
    r: 0.6 + Math.random() * 1.4,
    twinkle: 0.5 + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
  }))
  return {
    count,
    step(ctx, dt) {
      const sec = dt / 1000
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#ffffff'
      for (const s of stars) {
        s.phase += sec * s.twinkle
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
  }
}
```

- [ ] **Step 4: Implement the canvas host that runs the active system**

Create `src/background/ParticleCanvas.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import type { Scene } from '../lib/weatherCodes'
import type { Performance } from '../store/defaults'
import type { ParticleSystem } from './particles/types'
import { createRain } from './particles/rain'
import { createSnow } from './particles/snow'
import { createStars } from './particles/stars'

interface Props { scene: Scene; performance: Performance }

function makeSystem(scene: Scene, width: number, height: number, performance: Performance): ParticleSystem | null {
  const init = { width, height, performance }
  switch (scene) {
    case 'rain':
    case 'thunder': return createRain(init)
    case 'snow': return createSnow(init)
    case 'clear-night': return createStars(init)
    default: return null // clear-day, cloudy, fog have no canvas particles
  }
}

export function ParticleCanvas({ scene, performance }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = (canvas.width = window.innerWidth)
    const height = (canvas.height = window.innerHeight)
    const system = makeSystem(scene, width, height, performance)
    if (!system) {
      ctx.clearRect(0, 0, width, height)
      return
    }
    let raf = 0
    let prev = Date.now()
    const targetMs = performance === 'low' ? 1000 / 30 : 1000 / 60 // throttle on Low
    const loop = () => {
      const t = Date.now()
      const dt = t - prev
      if (dt >= targetMs) {
        system.step(ctx, dt)
        prev = t
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [scene, performance])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- rain`
Expected: PASS — 2 tests.

```bash
git add src/background/particles src/background/ParticleCanvas.tsx
git commit -m "feat: rain/snow/stars particle systems and canvas host"
```

---

## Task 17: Celestial body + BackgroundEngine assembly

**Files:**
- Create: `src/background/Celestial.tsx`, `src/background/BackgroundEngine.tsx`, `src/background/BackgroundEngine.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/background/BackgroundEngine.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BackgroundEngine } from './BackgroundEngine'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const clearDay: Weather = {
  code: 0, isDay: true, temp: 22, feelsLike: 22, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], stale: false,
}

describe('BackgroundEngine', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: clearDay, now: new Date('2026-06-06T12:00:00') })
  })

  it('renders a sky layer and a canvas', () => {
    const { container } = render(<BackgroundEngine />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
    // sky gradient div is the first child layer
    expect(container.firstChild).toBeTruthy()
  })

  it('renders nothing-breaking when weather is null', () => {
    useAppState.setState({ weather: null })
    expect(() => render(<BackgroundEngine />)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BackgroundEngine`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement Celestial + BackgroundEngine**

Create `src/background/Celestial.tsx`:
```tsx
import { moonPhase } from '../lib/sun'
import type { Scene } from '../lib/weatherCodes'

interface Props { scene: Scene; now: Date }

/** A sun for clear-day, a phase-lit moon for clear-night. Nothing otherwise. */
export function Celestial({ scene, now }: Props) {
  if (scene === 'clear-day') {
    return (
      <div style={{
        position: 'absolute', top: '12%', right: '14%', width: 120, height: 120,
        borderRadius: '50%', background: 'radial-gradient(circle, #fff7d6, #ffd86b)',
        boxShadow: '0 0 120px 40px rgba(255, 216, 107, 0.6)',
      }} />
    )
  }
  if (scene === 'clear-night') {
    const { illumination } = moonPhase(now)
    // Shadow offset fakes the lit fraction.
    const shadow = `inset ${(-40 + illumination * 80).toFixed(0)}px 0 30px 4px rgba(8,10,22,0.92)`
    return (
      <div style={{
        position: 'absolute', top: '12%', right: '16%', width: 90, height: 90,
        borderRadius: '50%', background: '#e8ecf5',
        boxShadow: `0 0 60px 10px rgba(220,228,245,0.35), ${shadow}`,
      }} />
    )
  }
  return null
}
```

Create `src/background/BackgroundEngine.tsx`:
```tsx
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { selectScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { ParticleCanvas } from './ParticleCanvas'
import { Celestial } from './Celestial'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)

  // Sensible default before the first weather load.
  const fallback = { sky: ['#1a2238', '#2a3658'] as [string, string], scene: 'cloudy' as const }
  const result = weather ? selectScene(weather, now) : null
  const sky = result?.palette.sky ?? fallback.sky
  const scene = result?.scene ?? fallback.scene

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <SkyGradient sky={sky} />
      <Celestial scene={scene} now={now} />
      <ParticleCanvas scene={scene} performance={performance} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BackgroundEngine`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/background/Celestial.tsx src/background/BackgroundEngine.tsx src/background/BackgroundEngine.test.tsx
git commit -m "feat: celestial body and background engine assembly"
```

---

## Task 18: Layout presets + renderer

**Files:**
- Create: `src/layout/presets.ts`, `src/layout/LayoutRenderer.tsx`, `src/layout/presets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/layout/presets.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { PRESETS, slotsFor } from './presets'

describe('layout presets', () => {
  it('defines the photo-first preset with positioned slots', () => {
    expect(PRESETS['photo-first']).toBeDefined()
    const clock = PRESETS['photo-first'].slots.clock
    expect(clock).toMatchObject({ top: expect.any(String), left: expect.any(String) })
  })

  it('slotsFor returns only enabled tiles that have a slot', () => {
    const slots = slotsFor('photo-first', { clock: true, weather: false, calendar: true, sunmoon: false, quote: false, ticker: false })
    const ids = slots.map((s) => s.id)
    expect(ids).toContain('clock')
    expect(ids).toContain('calendar')
    expect(ids).not.toContain('weather')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- presets`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement presets + renderer**

Create `src/layout/presets.ts`:
```ts
import type { CSSProperties } from 'react'
import type { LayoutPreset, TileId } from '../store/defaults'

export type Slot = Pick<CSSProperties, 'top' | 'left' | 'right' | 'bottom' | 'width'>

export interface Preset {
  slots: Partial<Record<TileId, Slot>>
}

export const PRESETS: Record<LayoutPreset, Preset> = {
  'photo-first': {
    slots: {
      clock: { top: '5%', left: '4%' },
      weather: { top: '6%', right: '4%' },
      calendar: { bottom: '8%', left: '4%', width: '32%' },
      sunmoon: { bottom: '8%', right: '4%', width: '24%' },
      quote: { bottom: '8%', left: '40%', width: '28%' },
      ticker: { bottom: '2%', left: '4%', right: '4%' },
    },
  },
  // Bento is a future preset (Plan 3+); keep a minimal placeholder arrangement
  // so the type is satisfied and switching does not crash.
  bento: {
    slots: {
      clock: { top: '4%', left: '3%', width: '40%' },
      weather: { top: '4%', right: '3%', width: '48%' },
      calendar: { bottom: '6%', left: '3%', width: '30%' },
      sunmoon: { bottom: '6%', right: '3%', width: '28%' },
      quote: { bottom: '6%', left: '35%', width: '28%' },
      ticker: { bottom: '1%', left: '3%', right: '3%' },
    },
  },
}

export interface ResolvedSlot { id: TileId; slot: Slot }

export function slotsFor(
  preset: LayoutPreset,
  enabled: Record<TileId, boolean>,
): ResolvedSlot[] {
  const def = PRESETS[preset]
  return (Object.keys(def.slots) as TileId[])
    .filter((id) => enabled[id] && def.slots[id])
    .map((id) => ({ id, slot: def.slots[id]! }))
}
```

Create `src/layout/LayoutRenderer.tsx`:
```tsx
import type { ReactNode } from 'react'
import { useSettings } from '../store/settings'
import { slotsFor } from './presets'
import type { TileId } from '../store/defaults'
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'

/** Tiles available in this plan. Plan 2 adds calendar/sunmoon/quote/ticker. */
const TILES: Partial<Record<TileId, () => ReactNode>> = {
  clock: () => <ClockTile />,
  weather: () => <WeatherTile />,
}

export function LayoutRenderer() {
  const layout = useSettings((s) => s.settings.layout)
  const enabledTiles = useSettings((s) => s.settings.enabledTiles)
  const slots = slotsFor(layout, enabledTiles)
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      {slots.map(({ id, slot }) => {
        const render = TILES[id]
        if (!render) return null // tile not implemented until Plan 2
        return (
          <div key={id} style={{ position: 'absolute', ...slot }}>
            {render()}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- presets`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/layout/presets.ts src/layout/LayoutRenderer.tsx src/layout/presets.test.ts
git commit -m "feat: layout presets and tile renderer"
```

---

## Task 19: App wiring — bootstrap, polling, and the live dashboard

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/App.test.tsx`:
```tsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'
import { useSettings } from './store/settings'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    // Avoid real network during the smoke test.
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('no network in test') }) as unknown as typeof fetch)
  })
  afterEach(() => vi.restoreAllMocks())

  it('mounts the background and layout without crashing', () => {
    const { container } = render(<App />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL — App currently renders only the placeholder `<div>Halo</div>`, so there is no `<canvas>`.

- [ ] **Step 3: Implement `App.tsx` with bootstrap + polling**

Replace `src/App.tsx`:
```tsx
import { useEffect } from 'react'
import { useClock } from './hooks/useClock'
import { useSettings } from './store/settings'
import { useAppState } from './store/appState'
import { BackgroundEngine } from './background/BackgroundEngine'
import { LayoutRenderer } from './layout/LayoutRenderer'
import { fetchWithFallback } from './lib/fetchWithFallback'
import { ipLocate } from './data/geo'
import { fetchWeather } from './data/weather'

const WEATHER_INTERVAL = 12 * 60_000 // 12 minutes

export default function App() {
  useClock()
  const performance = useSettings((s) => s.settings.performance)
  const configuredLocation = useSettings((s) => s.settings.location)

  // Load persisted settings once.
  useEffect(() => { useSettings.getState().load() }, [])

  // Resolve location: use configured, else IP-detect (cached).
  useEffect(() => {
    let cancelled = false
    async function resolve() {
      if (configuredLocation) {
        useAppState.getState().setLocation(configuredLocation)
        return
      }
      try {
        const res = await fetchWithFallback('geo', ipLocate)
        if (!cancelled) useAppState.getState().setLocation(res.data)
      } catch {
        // Last resort default so the app still renders a scene.
        if (!cancelled) useAppState.getState().setLocation({ lat: 28.61, lon: 77.21, name: 'Delhi' })
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [configuredLocation])

  // Poll weather whenever the location changes, then on an interval.
  const location = useAppState((s) => s.location)
  useEffect(() => {
    if (!location) return
    let cancelled = false
    async function poll() {
      try {
        const res = await fetchWithFallback('weather', () => fetchWeather(location!))
        if (!cancelled) useAppState.getState().setWeather({ ...res.data, stale: res.stale })
      } catch {
        /* no cache yet and network failed — background shows its default scene */
      }
    }
    poll()
    const id = setInterval(poll, WEATHER_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [location])

  return (
    <div className={performance === 'low' ? 'perf-low' : undefined} style={{ position: 'absolute', inset: 0 }}>
      <BackgroundEngine />
      <LayoutRenderer />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- App`
Expected: PASS.

- [ ] **Step 5: Run the full suite, then verify visually**

Run: `npm test`
Expected: all tests pass.

Run: `npm run dev` and open the printed localhost URL in a browser.
Expected (manual verification):
- A gradient sky fills the screen; after a moment, live weather loads and the scene matches current conditions (rain/snow/stars/etc.).
- The clock ticks every second (top-left) and the weather tile shows current temp + a 7-day row (top-right).
- Resize the window — the canvas still fills the screen on reload.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: wire App with location bootstrap, weather polling, and live dashboard"
```

---

## Self-Review (completed during authoring)

**Spec coverage (Plan 1 portion):**
- Static React + Vite app, no backend, no keys → Tasks 1, 9, 10 (fetch direct from browser to keyless CORS APIs). ✓
- Weather-reactive background (canvas + CSS, no WebGL) → Tasks 11, 15, 16, 17. ✓
- Aurora Glass tiles → Tasks 12–14. ✓
- Per-screen localStorage settings → Tasks 2, 7. ✓
- Last-known-good caching → Tasks 2, 3, used in 19. ✓
- Performance Low/High scaling → particle counts (Task 16) + `.perf-low` blur drop (Tasks 12, 19). ✓
- Photo-first layout as default; Bento as drop-in preset → Task 18. ✓
- **Deferred to later plans (intentional):** calendar/holidays, sun/moon tile, quote, ticker, photo background mode (Plan 2); settings panel, export/import, `?config=`, stale indicator UI polish, nightly reload, deploy (Plan 3). Noted in the plan header.

**Placeholder scan:** No "TBD"/"handle later" steps; every code step shows complete code. The `bento` preset is a real arrangement, not a stub. ✓

**Type consistency:** `Weather`/`DailyForecast`/`GeoLocation` defined in `store/appState.ts` (Task 8) and reused by `weather.ts` (10), `scene.ts` (11), tiles (14), and `App.tsx` (19). `Scene` from `weatherCodes.ts` flows through `scene.ts` → `ParticleCanvas`/`Celestial`/`BackgroundEngine`. `Settings`/`TileId`/`LayoutPreset`/`Performance` from `defaults.ts` used by stores, presets, and App. Function names (`saveCache`/`loadCache`/`isStale`, `fetchWithFallback`, `selectScene`, `slotsFor`, `createRain/Snow/Stars`) are consistent across definition and use. ✓

**Note on `ParticleCanvas` (Task 16, Step 4):** the frame loop throttles to 30fps on Low and 60fps on High via `targetMs`; the unit test drives `system.step` directly, so the rAF loop itself is verified by manual inspection in Task 19's visual check, not by an automated test (rAF/canvas are awkward to assert under jsdom).
