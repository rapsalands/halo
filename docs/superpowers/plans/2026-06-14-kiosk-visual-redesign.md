# Kiosk Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sparse absolute-positioned dashboard with a filled, aligned 12-column grid; frosted/flat glass tinted to the weather mood; a toned-down clear-day sky; and full-screen rain/thunder/snow effects — leaving a placeholder photo panel on the right for Plan 2.

**Architecture:** A single `GridLayout` (CSS Grid, named placements) replaces `LayoutRenderer`/`presets`. Weather particles + lightning move out of `BackgroundEngine` into a top-level full-screen `WeatherEffectsOverlay`. A new `resolveScene` helper centralizes scene+fallback resolution (DRY) and feeds a `--mood` CSS variable that tints the glass. The 7-day strip is split out of `WeatherTile` into a `ForecastTile` so it can occupy its own grid region. The right column shows an opaque `PhotoPanel` placeholder (the iris slideshow lands here in Plan 2).

**Tech Stack:** React 19 + TypeScript, Vite 8, Zustand, Framer Motion, Vitest + React Testing Library (jsdom). Tests: `npm test`. Single test file: `npx vitest run src/path/file.test.tsx`.

---

## File Structure

**Create:**
- `src/background/WeatherEffectsOverlay.tsx` — full-screen particles + lightning, above the grid.
- `src/background/WeatherEffectsOverlay.test.tsx`
- `src/tiles/ForecastTile.tsx` — the 7-day daily strip extracted from `WeatherTile`.
- `src/tiles/ForecastTile.test.tsx`
- `src/tiles/PhotoPanel.tsx` — opaque placeholder image for the right column (replaced by the slideshow in Plan 2).
- `src/tiles/PhotoPanel.test.tsx`
- `src/layout/GridLayout.tsx` — CSS-Grid layout, replaces `LayoutRenderer`.
- `src/layout/GridLayout.test.tsx`

**Modify:**
- `src/background/scene.ts` — add `resolveScene`/`ResolvedScene`; tone the clear-day palette.
- `src/background/scene.test.ts` — add `resolveScene` tests.
- `src/background/BackgroundEngine.tsx` — use `resolveScene`; drop particles + lightning.
- `src/background/BackgroundEngine.test.tsx` — no longer expects a canvas.
- `src/tiles/WeatherTile.tsx` — remove the daily strip (kept: current + hourly).
- `src/tiles/WeatherTile.test.tsx` — drop the forecast-row assertion.
- `src/App.tsx` — render `GridLayout` + `WeatherEffectsOverlay`; set `--mood`.
- `src/styles/theme.css` — frosted/flat glass + mood tint + new `--mood` var.

**Delete:**
- `src/layout/LayoutRenderer.tsx`, `src/layout/presets.ts`, `src/layout/presets.test.ts`.

---

## Task 1: `resolveScene` helper (centralize scene + fallback)

**Files:**
- Modify: `src/background/scene.ts`
- Test: `src/background/scene.test.ts`

- [ ] **Step 1: Write the failing test** — append inside `src/background/scene.test.ts` (after the existing `describe('selectScene', …)` block), and add `resolveScene` to the import on line 2 (`import { selectScene, resolveScene } from './scene'`):

```ts
describe('resolveScene', () => {
  it('falls back to a cloudy daytime scene when weather is null', () => {
    const r = resolveScene(null, new Date('2026-06-06T12:00:00'))
    expect(r.scene).toBe('cloudy')
    expect(r.night).toBe(false)
    expect(r.sky).toHaveLength(2)
    expect(r.accent).toMatch(/^#|rgb/)
  })

  it('derives scene, accent and night flag from real weather', () => {
    const r = resolveScene(weather({ code: 0, isDay: false }), new Date('2026-06-06T23:00:00'))
    expect(r.scene).toBe('clear-night')
    expect(r.night).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/background/scene.test.ts`
Expected: FAIL — `resolveScene is not a function` / not exported.

- [ ] **Step 3: Implement `resolveScene`** — append to `src/background/scene.ts`. Add the `Weather` type is already imported on line 3:

```ts
export interface ResolvedScene {
  sky: [string, string]
  scene: Scene
  accent: string
  night: boolean
}

/**
 * Resolve the full background context, including a sensible default before the
 * first weather load. Shared by BackgroundEngine and WeatherEffectsOverlay so
 * the sky and the effects always agree on the active scene.
 */
export function resolveScene(weather: Weather | null, now: Date): ResolvedScene {
  if (!weather) {
    return { sky: ['#1a2238', '#2a3658'], scene: 'cloudy', accent: '#7fd0ff', night: false }
  }
  const r = selectScene(weather, now)
  return { sky: r.palette.sky, scene: r.scene, accent: r.palette.accent, night: r.dayPart === 'night' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/background/scene.test.ts`
Expected: PASS (all selectScene + resolveScene tests).

- [ ] **Step 5: Commit**

```bash
git add src/background/scene.ts src/background/scene.test.ts
git commit -m "refactor(scene): add resolveScene helper with fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Full-screen `WeatherEffectsOverlay`

Move particles + lightning out of the background layer so rain/thunder/snow render over the whole screen (cards and photo panel included).

**Files:**
- Create: `src/background/WeatherEffectsOverlay.tsx`
- Test: `src/background/WeatherEffectsOverlay.test.tsx`
- Modify: `src/background/BackgroundEngine.tsx`, `src/background/BackgroundEngine.test.tsx`

- [ ] **Step 1: Write the failing test** — create `src/background/WeatherEffectsOverlay.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { WeatherEffectsOverlay } from './WeatherEffectsOverlay'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const base: Weather = {
  code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], hourly: [], stale: false,
}

describe('WeatherEffectsOverlay', () => {
  beforeEach(() => { useSettings.getState().reset() })

  it('always renders a particle canvas', () => {
    useAppState.setState({ weather: base, now: new Date('2026-06-06T12:00:00') })
    const { container } = render(<WeatherEffectsOverlay />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders a lightning bolt only for the thunder scene', () => {
    useAppState.setState({ weather: { ...base, code: 95 }, now: new Date('2026-06-06T12:00:00') })
    const thunder = render(<WeatherEffectsOverlay />)
    expect(thunder.container.querySelector('svg polygon')).toBeInTheDocument()

    useAppState.setState({ weather: base, now: new Date('2026-06-06T12:00:00') })
    const clear = render(<WeatherEffectsOverlay />)
    expect(clear.container.querySelector('svg polygon')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/background/WeatherEffectsOverlay.test.tsx`
Expected: FAIL — cannot find module `./WeatherEffectsOverlay`.

- [ ] **Step 3: Implement the overlay** — create `src/background/WeatherEffectsOverlay.tsx`:

```tsx
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { resolveScene } from './scene'
import { ParticleCanvas } from './ParticleCanvas'
import { Lightning } from './Lightning'

/** Full-screen weather effects rendered above the grid (rain/snow/stars + thunder). */
export function WeatherEffectsOverlay() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const performance = useSettings((s) => s.settings.performance)
  const { scene } = resolveScene(weather, now)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
      <ParticleCanvas scene={scene} performance={performance} />
      {scene === 'thunder' && <Lightning />}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/background/WeatherEffectsOverlay.test.tsx`
Expected: PASS.

- [ ] **Step 5: Remove particles/lightning from `BackgroundEngine`** — replace the whole body of `src/background/BackgroundEngine.tsx` with:

```tsx
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { resolveScene } from './scene'
import { SkyGradient } from './SkyGradient'
import { Celestial } from './Celestial'
import { Clouds } from './Clouds'
import { AuroraGlow } from './AuroraGlow'
import { PhotoBackdrop } from './PhotoBackdrop'

export function BackgroundEngine() {
  const weather = useAppState((s) => s.weather)
  const now = useAppState((s) => s.now)
  const backgroundMode = useSettings((s) => s.settings.backgroundMode)
  const { sky, scene, accent, night } = resolveScene(weather, now)
  const photoMode = backgroundMode === 'photo'

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {photoMode ? (
        <PhotoBackdrop />
      ) : (
        <>
          <SkyGradient sky={sky} accent={accent} />
          <AuroraGlow accent={accent} />
          <Celestial scene={scene} now={now} night={night} />
          <Clouds scene={scene} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Update `BackgroundEngine.test.tsx`** — replace the first `it(...)` (the "renders a sky layer and a canvas" case) with:

```tsx
  it('renders a sky layer and no longer owns the effects canvas', () => {
    const { container } = render(<BackgroundEngine />)
    expect(container.querySelector('canvas')).toBeNull()
    expect(container.firstChild).toBeTruthy()
  })
```

- [ ] **Step 7: Run the affected tests**

Run: `npx vitest run src/background/BackgroundEngine.test.tsx src/background/WeatherEffectsOverlay.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/background/WeatherEffectsOverlay.tsx src/background/WeatherEffectsOverlay.test.tsx src/background/BackgroundEngine.tsx src/background/BackgroundEngine.test.tsx
git commit -m "feat(background): full-screen weather effects overlay

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Split the 7-day strip into `ForecastTile`

**Files:**
- Create: `src/tiles/ForecastTile.tsx`, `src/tiles/ForecastTile.test.tsx`
- Modify: `src/tiles/WeatherTile.tsx`, `src/tiles/WeatherTile.test.tsx`

- [ ] **Step 1: Write the failing test** — create `src/tiles/ForecastTile.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastTile } from './ForecastTile'
import { useAppState, type Weather } from '../store/appState'
import { useSettings } from '../store/settings'

const W: Weather = {
  code: 3, isDay: true, temp: 24, feelsLike: 23, humidity: 40, windSpeed: 12,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30',
  daily: [
    { date: '2026-06-06', code: 3, tempMax: 27, tempMin: 18, sunrise: '', sunset: '', uvMax: 6 },
    { date: '2026-06-07', code: 0, tempMax: 29, tempMin: 19, sunrise: '', sunset: '', uvMax: 7 },
  ],
  hourly: [], stale: false,
}

describe('ForecastTile', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: W })
  })

  it('renders one column per forecast day', () => {
    render(<ForecastTile />)
    expect(screen.getAllByTestId('forecast-day')).toHaveLength(2)
  })

  it('converts highs to Fahrenheit in imperial mode', () => {
    useSettings.getState().update({ units: 'imperial' })
    render(<ForecastTile />)
    expect(screen.getByText('81°')).toBeInTheDocument() // 27C → 81F
  })

  it('renders nothing when there is no weather', () => {
    useAppState.setState({ weather: null })
    const { container } = render(<ForecastTile />)
    expect(container.querySelector('[data-testid="forecast-day"]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tiles/ForecastTile.test.tsx`
Expected: FAIL — cannot find module `./ForecastTile`.

- [ ] **Step 3: Implement `ForecastTile`** — create `src/tiles/ForecastTile.tsx`:

```tsx
import { TileFrame } from './TileFrame'
import { WeatherIcon } from './WeatherIcon'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'

const toF = (c: number) => Math.round((c * 9) / 5 + 32)

function weekday(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

export function ForecastTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  const conv = (c: number) => (units === 'imperial' ? toF(c) : c)
  const daily = weather?.daily ?? []

  return (
    <TileFrame style={{ width: '100%', height: '100%' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 12 }}>
        7-day outlook
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
        {daily.map((d) => (
          <div key={d.date} data-testid="forecast-day" style={{ textAlign: 'center', fontSize: '0.8rem', flex: 1 }}>
            <div style={{ color: 'var(--text-dim)' }}>{weekday(d.date)}</div>
            <WeatherIcon code={d.code} isDay={true} size={28} />
            <div style={{ fontWeight: 600 }}>{conv(d.tempMax)}°</div>
            <div style={{ color: 'var(--text-dim)' }}>{conv(d.tempMin)}°</div>
          </div>
        ))}
      </div>
    </TileFrame>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tiles/ForecastTile.test.tsx`
Expected: PASS.

- [ ] **Step 5: Remove the daily strip from `WeatherTile`** — in `src/tiles/WeatherTile.tsx`, delete the entire final `<div>` block that maps `daily` (lines 61-70, the block beginning `<div style={{ display: 'flex', gap: 16, marginTop: 14, borderTop: …`). Also delete the now-unused `weekday` helper (lines 10-13) and the `const today = daily[0]` line stays (still used for H/L); keep `const daily = weather.daily ?? []`. Verify no other reference to `weekday` remains.

- [ ] **Step 6: Update `WeatherTile.test.tsx`** — delete the `it('renders a forecast row per day', …)` test (lines 36-39); the forecast assertion now lives in `ForecastTile.test.tsx`.

- [ ] **Step 7: Run the affected tests**

Run: `npx vitest run src/tiles/WeatherTile.test.tsx src/tiles/ForecastTile.test.tsx`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tiles/ForecastTile.tsx src/tiles/ForecastTile.test.tsx src/tiles/WeatherTile.tsx src/tiles/WeatherTile.test.tsx
git commit -m "refactor(tiles): split 7-day forecast into ForecastTile

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `PhotoPanel` placeholder (opaque right column)

**Files:**
- Create: `src/tiles/PhotoPanel.tsx`, `src/tiles/PhotoPanel.test.tsx`

- [ ] **Step 1: Write the failing test** — create `src/tiles/PhotoPanel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PhotoPanel } from './PhotoPanel'

describe('PhotoPanel', () => {
  it('renders an opaque cover image filling the panel', () => {
    const { container } = render(<PhotoPanel />)
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img!.style.objectFit).toBe('cover')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tiles/PhotoPanel.test.tsx`
Expected: FAIL — cannot find module `./PhotoPanel`.

- [ ] **Step 3: Implement `PhotoPanel`** — create `src/tiles/PhotoPanel.tsx` (uses the existing `src/assets/hero.png`; the iris slideshow replaces the inner content in Plan 2):

```tsx
import hero from '../assets/hero.png'

/** Opaque photo feature panel for the right column. Placeholder until the iris
 *  slideshow is wired in (Plan 2 swaps the inner <img> for <PhotoSlideshow/>). */
export function PhotoPanel() {
  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 18, overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
      }}
    >
      <img src={hero} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tiles/PhotoPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tiles/PhotoPanel.tsx src/tiles/PhotoPanel.test.tsx
git commit -m "feat(tiles): opaque PhotoPanel placeholder for right column

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `GridLayout` (aligned 12-column grid)

Replaces `LayoutRenderer`. Left regions all end at column 8; the photo panel runs columns 8-13 full height; the ticker spans the full width.

**Files:**
- Create: `src/layout/GridLayout.tsx`, `src/layout/GridLayout.test.tsx`
- Delete: `src/layout/LayoutRenderer.tsx`, `src/layout/presets.ts`, `src/layout/presets.test.ts`

- [ ] **Step 1: Write the failing test** — create `src/layout/GridLayout.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { GridLayout } from './GridLayout'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

function region(c: HTMLElement, id: string): HTMLElement | null {
  return c.querySelector(`[data-region="${id}"]`)
}

describe('GridLayout', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00') })
  })

  it('places the clock and photo panel so their column edges meet at line 8', () => {
    const { container } = render(<GridLayout />)
    expect(region(container, 'clock')!.getAttribute('data-col')).toBe('1 / 8')
    expect(region(container, 'photo')!.getAttribute('data-col')).toBe('8 / 13')
  })

  it('aligns the left-column regions to the same right edge (line 8)', () => {
    const { container } = render(<GridLayout />)
    for (const id of ['clock', 'air', 'sunmoon', 'forecast']) {
      expect(region(container, id)!.getAttribute('data-col')!.endsWith('/ 8')).toBe(true)
    }
  })

  it('always renders the photo panel and omits disabled tiles', () => {
    useSettings.getState().update({
      enabledTiles: { clock: true, weather: false, calendar: true, sunmoon: true, quote: true, ticker: true, air: true },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'photo')).toBeInTheDocument()
    expect(region(container, 'weather')).toBeNull()
    expect(region(container, 'forecast')).toBeNull() // forecast follows the weather toggle
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/layout/GridLayout.test.tsx`
Expected: FAIL — cannot find module `./GridLayout`.

- [ ] **Step 3: Implement `GridLayout`** — create `src/layout/GridLayout.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
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
  calendar: { gridColumn: '1 / 3',  gridRow: '3 / 4' },
  quote:    { gridColumn: '3 / 6',  gridRow: '3 / 4' },
  sunmoon:  { gridColumn: '6 / 8',  gridRow: '3 / 4' },
  forecast: { gridColumn: '1 / 8',  gridRow: '4 / 5' },
  photo:    { gridColumn: '8 / 13', gridRow: '1 / 5' },
  ticker:   { gridColumn: '1 / 13', gridRow: '5 / 6' },
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

export function GridLayout() {
  const enabled = useSettings((s) => s.settings.enabledTiles)

  // Which regions are visible. The photo panel is always on; the forecast band
  // follows the weather toggle (it is the same data source).
  const visible: RegionId[] = ([
    'clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'ticker',
  ] as const).filter((id) => enabled[id])
  if (enabled.weather) visible.push('forecast')
  visible.push('photo')

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: '1.5fr 1fr 1.1fr 0.85fr auto',
        gap: 16,
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      {visible.map((id) => (
        <Cell key={id} id={id}>{RENDER[id]()}</Cell>
      ))}
    </div>
  )
}
```

Note: `enabled[id]` is typed against `TileId`; `'clock' | 'weather' | …` in the filter list are all valid `TileId`s, so no cast is needed. `forecast`/`photo` are pushed separately and never indexed into `enabled`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/layout/GridLayout.test.tsx`
Expected: PASS.

- [ ] **Step 5: Delete the old layout system**

```bash
git rm src/layout/LayoutRenderer.tsx src/layout/presets.ts src/layout/presets.test.ts
```

- [ ] **Step 6: Point `App` at `GridLayout`** — in `src/App.tsx`, change the import on line 7 from:

```tsx
import { LayoutRenderer } from './layout/LayoutRenderer'
```
to:
```tsx
import { GridLayout } from './layout/GridLayout'
```
and in the returned JSX replace `<LayoutRenderer />` (line 100) with `<GridLayout />`.

- [ ] **Step 7: Run the full suite to confirm nothing references the deleted files**

Run: `npm test`
Expected: PASS (the deleted `presets.test.ts` is gone; no import errors). If a failure mentions `LayoutRenderer`/`presets`, fix the stray import before continuing.

- [ ] **Step 8: Commit**

```bash
git add src/layout/GridLayout.tsx src/layout/GridLayout.test.tsx src/App.tsx
git commit -m "feat(layout): aligned 12-column GridLayout, retire absolute presets

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Mount the effects overlay + drive the `--mood` variable

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the overlay import + mood plumbing to `App.tsx`.** Add these imports near the other background imports (after line 7):

```tsx
import { WeatherEffectsOverlay } from './background/WeatherEffectsOverlay'
import { resolveScene } from './background/scene'
```

Inside the `App` component, after the existing `const location = useAppState((s) => s.location)` line (line 75), add:

```tsx
  const weatherForMood = useAppState((s) => s.weather)
  const nowForMood = useAppState((s) => s.now)
  const mood = resolveScene(weatherForMood, nowForMood).accent
```

Then update the root `<div>` style (line 97) to include `--mood`, and add `<WeatherEffectsOverlay />` to the JSX after `<GridLayout />`:

```tsx
    <div
      className={performance === 'low' ? 'perf-low' : undefined}
      style={{ position: 'absolute', inset: 0, '--accent': accent, '--mood': mood } as CSSProperties}
    >
      <BackgroundEngine />
      <GridLayout />
      <WeatherEffectsOverlay />
      <NightDim />
      <StaleBadge />
      <SettingsPanel />
    </div>
```

- [ ] **Step 2: Run the smoke test**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS — App still renders a canvas (now from the overlay) and does not crash.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): mount full-screen effects overlay and --mood tint var

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Frosted/flat glass + mood tint (CSS)

CSS-only visual change. Verified by build + manual inspection (jsdom does not apply external stylesheets, so there is no unit assertion here); the guard is that the full suite stays green.

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Replace the contents of `src/styles/theme.css`** with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');

:root {
  --glass-bg: rgba(24, 28, 42, 0.34);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-blur: 16px;
  --accent: #7fd0ff;
  --mood: #7fd0ff;
  --text: #ffffff;
  --text-dim: rgba(255, 255, 255, 0.7);
}

.glass {
  position: relative;
  /* Frosted base + a quiet mood tint pulled from the active scene accent. */
  background-color: var(--glass-bg);
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--mood) 16%, transparent) 0%,
    transparent 62%
  );
  backdrop-filter: blur(var(--glass-blur)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(120%);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  /* Flat: drop shadow only, no inset emboss/bevel. */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.22);
  color: var(--text);
  padding: 24px 28px;
}

/* Low performance mode disables the expensive blur and leans opaque. */
.perf-low .glass {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background-color: rgba(20, 26, 40, 0.6);
}
```

- [ ] **Step 2: Confirm the build compiles and tests stay green**

Run: `npm run build && npm test`
Expected: build succeeds; tests PASS.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open the served URL. Confirm: cards are frosted (background quiet, not see-through), flat (no glossy bevel/emboss), generously padded, and carry a faint color matching the time/weather. Switch scenes with the settings preview chips (rain/snow/thunder/night) and confirm the tint shifts.

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css
git commit -m "style(glass): frosted flat cards with scene mood tint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Tone down the clear-day sky

Clear/sunny should read as a soft mood, not a bright wash. The localized glow already lives in `SkyGradient` (the upper radial); here we just deepen the clear-day daytime gradient so the canvas stops blasting bright blue.

**Files:**
- Modify: `src/background/scene.ts`

- [ ] **Step 1: Deepen the clear-day daytime palette** — in `src/background/scene.ts`, in the `SKIES` map, replace the `'clear-day'` entry's `day` stop:

```ts
  'clear-day': {
    dawn: ['#ff9a76', '#ffd9a0'], day: ['#3a6390', '#7ba7cf'],
    dusk: ['#ff7e5f', '#feb47b'], night: ['#0d1c44', '#16306a'],
  },
```

(Was `day: ['#4a90e2', '#a7d3ff']` — a brighter, more washed blue.)

- [ ] **Step 2: Confirm scene tests still pass** (they assert scene + accent shape, not exact hex)

Run: `npx vitest run src/background/scene.test.ts`
Expected: PASS.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`. With the preview chip on `clear` (clear-day), confirm the backdrop is a calm, deeper blue with the brightness concentrated as a soft glow near the top rather than a full bright wash, and the frosted cards read comfortably against it.

- [ ] **Step 4: Commit**

```bash
git add src/background/scene.ts
git commit -m "style(scene): tone down clear-day sky to a soft mood

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final Verification

- [ ] **Run the full suite:** `npm test` → all PASS.
- [ ] **Build:** `npm run build` → succeeds (tsc + vite).
- [ ] **Manual kiosk pass** (`npm run dev`): aligned grid with no ragged left edge; clock hero top-left, weather + AQ row, calendar + quote + sun/moon row, 7-day band, opaque photo panel down the right, ticker full-width; tight gaps; frosted flat cards with mood tint; clear-day is a soft mood; rain/thunder/snow (via preview chips) fall full-screen over cards and photo.

---

## Notes / Deferred to Plan 2

- The `layout` setting (`photo-first`/`bento`) and its toggle in `SettingsPanel` become a no-op with the single grid. Left in place intentionally; Plan 2 removes or repurposes it alongside the photo-settings work.
- `PhotoPanel` shows `hero.png`. Plan 2 replaces its inner `<img>` with the `<PhotoSlideshow>` wrapper around the published `iris-core`, and adds the unified photo settings.
- `backgroundMode: 'photo'` (full-screen `PhotoBackdrop`) is untouched here; Plan 2 reconciles it with the new photo panel.
```
