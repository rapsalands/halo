# Halo — Plan 3: Settings, Config Portability & 24/7 Resilience

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Add the on-screen settings panel, per-screen config export/import (+ `?config=` URL), a stale-data indicator, nightly auto-reload, and a static deployment setup.

**Architecture:** Settings already live in the Plan 1 `useSettings` store (localStorage). This plan adds the UI to edit them, pure helpers to (de)serialize a config blob, a helper to compute the next nightly-reload delay, and small App wiring. No new data sources.

**Tech Stack:** Same as Plans 1–2.

**Prereq:** Plans 1 & 2 complete (branch `auto/halo-plan-1`, all green).

---

## File Structure (added)

```
src/
  settings/
    configIO.ts            encode/decode config + read ?config= (pure)
    SettingsPanel.tsx      gear button + settings overlay
  lib/
    reload.ts              msUntilNextReload helper (pure)
  hooks/
    useNightlyReload.ts    schedules a page reload each night
  tiles/
    StaleBadge.tsx         "showing last update" indicator
DEPLOY.md                  hosting instructions
netlify.toml               SPA hosting config
```

Modified: `src/App.tsx` (mount panel, badge, nightly reload, apply `?config=`).

---

## Task 1: Config serialization

**Files:** Create `src/settings/configIO.ts`, `src/settings/configIO.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig, readConfigFromSearch } from './configIO'
import { DEFAULT_SETTINGS } from '../store/defaults'

describe('configIO', () => {
  it('round-trips settings through encode/decode', () => {
    const enc = encodeConfig({ ...DEFAULT_SETTINGS, units: 'imperial', hour12: true })
    const dec = decodeConfig(enc)
    expect(dec?.units).toBe('imperial')
    expect(dec?.hour12).toBe(true)
  })

  it('returns null for garbage input', () => {
    expect(decodeConfig('!!!not-base64!!!')).toBeNull()
  })

  it('reads a config query param', () => {
    const enc = encodeConfig({ ...DEFAULT_SETTINGS, performance: 'low' })
    const got = readConfigFromSearch(`?config=${encodeURIComponent(enc)}`)
    expect(got?.performance).toBe('low')
  })

  it('returns null when there is no config param', () => {
    expect(readConfigFromSearch('?foo=bar')).toBeNull()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/settings/configIO.ts`
```ts
import type { Settings } from '../store/defaults'

export function encodeConfig(settings: Settings): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(settings))))
}

export function decodeConfig(blob: string): Partial<Settings> | null {
  try {
    const json = decodeURIComponent(escape(atob(blob)))
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object') return parsed as Partial<Settings>
    return null
  } catch {
    return null
  }
}

export function readConfigFromSearch(search: string): Partial<Settings> | null {
  const param = new URLSearchParams(search).get('config')
  if (!param) return null
  return decodeConfig(param)
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: config encode/decode and ?config= reader"`

---

## Task 2: Nightly reload timing

**Files:** Create `src/lib/reload.ts`, `src/lib/reload.test.ts`, `src/hooks/useNightlyReload.ts`

- [ ] **Step 1: Failing test** — `src/lib/reload.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { msUntilNextReload } from './reload'

describe('msUntilNextReload', () => {
  it('targets later today when the hour has not passed', () => {
    const now = new Date(2026, 5, 6, 1, 0, 0) // 01:00
    expect(msUntilNextReload(now, 3)).toBe(2 * 60 * 60_000) // 2h to 03:00
  })
  it('targets tomorrow when the hour has passed', () => {
    const now = new Date(2026, 5, 6, 4, 0, 0) // 04:00
    expect(msUntilNextReload(now, 3)).toBe(23 * 60 * 60_000) // 23h to 03:00 next day
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement**

`src/lib/reload.ts`
```ts
/** Milliseconds from `now` until the next local `hour`:00:00. */
export function msUntilNextReload(now: Date, hour: number): number {
  const target = new Date(now)
  target.setHours(hour, 0, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}
```

`src/hooks/useNightlyReload.ts`
```ts
import { useEffect } from 'react'
import { msUntilNextReload } from '../lib/reload'

/** Reloads the page once at the next local `hour`:00 to avoid memory creep. */
export function useNightlyReload(hour = 3) {
  useEffect(() => {
    const delay = msUntilNextReload(new Date(), hour)
    const id = setTimeout(() => window.location.reload(), delay)
    return () => clearTimeout(id)
  }, [hour])
}
```

- [ ] **Step 4: Run, expect PASS** — `npm test -- reload`
- [ ] **Step 5: Commit** — `git commit -m "feat: nightly reload timing helper and hook"`

---

## Task 3: Stale badge

**Files:** Create `src/tiles/StaleBadge.tsx`, `src/tiles/StaleBadge.test.tsx`

- [ ] **Step 1: Failing test**
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StaleBadge } from './StaleBadge'
import { useAppState, type Weather } from '../store/appState'

const W = (stale: boolean): Weather => ({
  code: 0, isDay: true, temp: 20, feelsLike: 20, humidity: 30, windSpeed: 5,
  sunriseToday: '2026-06-06T05:30', sunsetToday: '2026-06-06T19:30', daily: [], stale,
})

describe('StaleBadge', () => {
  beforeEach(() => useAppState.setState({ weather: null }))

  it('renders nothing when data is fresh', () => {
    useAppState.setState({ weather: W(false) })
    const { container } = render(<StaleBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('warns when weather data is stale', () => {
    useAppState.setState({ weather: W(true) })
    render(<StaleBadge />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/tiles/StaleBadge.tsx`
```tsx
import { useAppState } from '../store/appState'

export function StaleBadge() {
  const weather = useAppState((s) => s.weather)
  if (!weather?.stale) return null
  return (
    <div style={{
      position: 'absolute', bottom: 10, right: 14, zIndex: 5,
      fontSize: '0.72rem', color: '#ffd27e', opacity: 0.8,
      background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: 12,
    }}>
      ⚠ Offline — showing last update
    </div>
  )
}
```

- [ ] **Step 4: Run, expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "feat: stale/offline indicator badge"`

---

## Task 4: Settings panel

**Files:** Create `src/settings/SettingsPanel.tsx`, `src/settings/SettingsPanel.test.tsx`

- [ ] **Step 1: Failing test**
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'

describe('SettingsPanel', () => {
  beforeEach(() => { localStorage.clear(); useSettings.getState().reset() })

  it('opens when the gear button is clicked', async () => {
    render(<SettingsPanel />)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument()
  })

  it('toggles a tile and persists it', async () => {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    const ticker = screen.getByLabelText(/ticker/i)
    await userEvent.click(ticker)
    expect(useSettings.getState().settings.enabledTiles.ticker).toBe(false)
  })

  it('changes units', async () => {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    await userEvent.selectOptions(screen.getByLabelText(/units/i), 'imperial')
    expect(useSettings.getState().settings.units).toBe('imperial')
  })
})
```

- [ ] **Step 2: Run, expect FAIL**
- [ ] **Step 3: Implement** — `src/settings/SettingsPanel.tsx`
```tsx
import { useState } from 'react'
import { useSettings } from '../store/settings'
import type { TileId, Units, Performance, BackgroundMode, LayoutPreset } from '../store/defaults'
import { geocodeCity } from '../data/geo'
import { encodeConfig, decodeConfig } from './configIO'

const TILE_LABELS: Record<TileId, string> = {
  clock: 'Clock', weather: 'Weather', calendar: 'Calendar',
  sunmoon: 'Sun & Moon', quote: 'Quote', ticker: 'Ticker',
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState('')
  const [importText, setImportText] = useState('')
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)

  async function searchCity() {
    const loc = await geocodeCity(city)
    if (loc) update({ location: loc })
  }

  const field = { display: 'block', margin: '12px 0 4px', fontSize: '0.8rem', color: 'var(--text-dim)' } as const

  return (
    <>
      <button
        aria-label="Settings"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 20, width: 40, height: 40,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
        }}
      >
        ⚙
      </button>

      {open && (
        <div
          data-testid="settings-overlay"
          style={{
            position: 'absolute', inset: 0, zIndex: 30, display: 'flex',
            justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="glass" style={{ width: 360, height: '100%', overflowY: 'auto', borderRadius: 0, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Settings</h2>
              <button aria-label="Close" onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <label htmlFor="layout" style={field}>Layout</label>
            <select id="layout" value={settings.layout}
              onChange={(e) => update({ layout: e.target.value as LayoutPreset })}>
              <option value="photo-first">Photo-first</option>
              <option value="bento">Bento</option>
            </select>

            <label htmlFor="background" style={field}>Background</label>
            <select id="background" value={settings.backgroundMode}
              onChange={(e) => update({ backgroundMode: e.target.value as BackgroundMode })}>
              <option value="weather">Weather sky</option>
              <option value="photo">Photo gallery</option>
            </select>

            <label htmlFor="performance" style={field}>Performance</label>
            <select id="performance" value={settings.performance}
              onChange={(e) => update({ performance: e.target.value as Performance })}>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>

            <label htmlFor="units" style={field}>Units</label>
            <select id="units" value={settings.units}
              onChange={(e) => update({ units: e.target.value as Units })}>
              <option value="metric">Metric (°C)</option>
              <option value="imperial">Imperial (°F)</option>
            </select>

            <label style={{ ...field, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={settings.hour12}
                onChange={(e) => update({ hour12: e.target.checked })} />
              12-hour clock
            </label>

            <label htmlFor="country" style={field}>Holiday country (ISO-2)</label>
            <input id="country" value={settings.holidayCountry} maxLength={2}
              onChange={(e) => update({ holidayCountry: e.target.value.toUpperCase() })} />

            <label htmlFor="city" style={field}>Location</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input id="city" placeholder={settings.location?.name ?? 'Auto-detected'}
                value={city} onChange={(e) => setCity(e.target.value)} />
              <button onClick={searchCity}>Search</button>
            </div>
            <button style={{ marginTop: 6 }} onClick={() => update({ location: null })}>Auto-detect</button>

            <div style={field}>Tiles</div>
            {(Object.keys(TILE_LABELS) as TileId[]).map((id) => (
              <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0' }}>
                <input type="checkbox" checked={settings.enabledTiles[id]}
                  onChange={(e) => update({ enabledTiles: { ...settings.enabledTiles, [id]: e.target.checked } })} />
                {TILE_LABELS[id]}
              </label>
            ))}

            <div style={field}>Export / Import config</div>
            <textarea readOnly value={encodeConfig(settings)} rows={3}
              style={{ width: '100%', fontSize: '0.7rem' }} />
            <textarea placeholder="Paste config to import" rows={3} value={importText}
              onChange={(e) => setImportText(e.target.value)} style={{ width: '100%', fontSize: '0.7rem', marginTop: 6 }} />
            <button style={{ marginTop: 6 }} onClick={() => { const c = decodeConfig(importText); if (c) update(c) }}>
              Apply imported config
            </button>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run, expect PASS** — `npm test -- SettingsPanel`
- [ ] **Step 5: Commit** — `git commit -m "feat: settings panel with tiles, units, location, export/import"`

---

## Task 5: Wire App + apply ?config= + verify

**Files:** Modify `src/App.tsx`

- [ ] **Step 1: Update App**

Add imports:
```tsx
import { SettingsPanel } from './settings/SettingsPanel'
import { StaleBadge } from './tiles/StaleBadge'
import { useNightlyReload } from './hooks/useNightlyReload'
import { readConfigFromSearch } from './settings/configIO'
```

Inside `App`, after `useClock()` add:
```tsx
useNightlyReload(3)
```

Change the settings-load effect to also apply a `?config=` param (it overrides stored settings for this screen):
```tsx
useEffect(() => {
  useSettings.getState().load()
  const fromUrl = readConfigFromSearch(window.location.search)
  if (fromUrl) useSettings.getState().update(fromUrl)
}, [])
```

Add `<SettingsPanel />` and `<StaleBadge />` to the returned tree (siblings of BackgroundEngine/LayoutRenderer):
```tsx
return (
  <div className={performance === 'low' ? 'perf-low' : undefined} style={{ position: 'absolute', inset: 0 }}>
    <BackgroundEngine />
    <LayoutRenderer />
    <StaleBadge />
    <SettingsPanel />
  </div>
)
```

- [ ] **Step 2: Confirm App smoke test still passes** — `npm test -- App`
The existing test stubs `fetch` to throw and only asserts a `<canvas>` renders; SettingsPanel renders a gear button and StaleBadge renders null — no change needed.

- [ ] **Step 3: Full suite + build + lint** — `npm test && npm run build && npm run lint`
Expected: all green.

- [ ] **Step 4: Commit** — `git commit -m "feat: mount settings panel, stale badge, nightly reload, ?config= apply"`

---

## Task 6: Deployment setup

**Files:** Create `netlify.toml`, `DEPLOY.md`

- [ ] **Step 1: Add Netlify SPA config** — `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Add deployment instructions** — `DEPLOY.md`
```markdown
# Deploying Halo

Halo builds to static files (`dist/`) — host it anywhere and point the kiosk browser at the URL.

## Build
```
npm install
npm run build      # outputs dist/
```
The Vite `base` is `./` (relative), so `dist/` works from any path or `file://`.

## Hosting options

### Netlify (drag-and-drop or Git)
`netlify.toml` is included. Connect the repo or drag `dist/` into Netlify. The SPA redirect keeps `?config=` URLs working.

### GitHub Pages
```
npm run build
npx gh-pages -d dist     # or push dist/ to the gh-pages branch
```

### Serve locally on the Pi
```
npm run build
npx serve dist -l 8080   # then open http://localhost:8080 in kiosk mode
```

## Kiosk launch (Raspberry Pi / KickPi)
Chromium full-screen kiosk:
```
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --check-for-update-interval=31536000 http://localhost:8080
```

## Per-screen configuration
- Open the ⚙ panel on the device to set location, units, tiles, layout, performance.
- Settings persist in that device's `localStorage`.
- To clone a config: open settings, copy the export blob, and on another screen either paste it into "Import" or append `?config=<blob>` to the URL.
```

- [ ] **Step 3: Commit** — `git commit -m "docs: add Netlify config and deployment guide"`

---

## Self-Review

**Spec coverage (Plan 3 portion):**
- Settings panel (toggle tiles, layout, location, units, hour, country, theme/background, performance) → Task 4. ✓
- Config portability (export/import + `?config=`) → Tasks 1, 4, 5. ✓
- Stale indicator → Task 3. ✓
- Nightly auto-reload → Task 2. ✓
- Performance Low/High already wired in Plan 1; selectable here. ✓
- Static deployment → Task 6. ✓

**Placeholder scan:** No TODO/TBD; all code complete. ✓

**Type consistency:** `Settings`/`TileId`/`Units`/`Performance`/`BackgroundMode`/`LayoutPreset` from `store/defaults.ts` reused across configIO and SettingsPanel. `encodeConfig`/`decodeConfig`/`readConfigFromSearch` consistent across definition and use. `msUntilNextReload` shared by hook and test. ✓
