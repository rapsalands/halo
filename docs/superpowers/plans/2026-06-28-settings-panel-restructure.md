# Settings Panel Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 10-section, 392px right-side Settings scroll with a wider (~640px) **left** drawer organized into 6 horizontal tabs (Display · Clock · Location · Tiles · Ticker · Advanced).

**Architecture:** Pure UI reorganization of `src/settings/SettingsPanel.tsx`. The panel owns `open` + active-tab state, renders a `role="tablist"` header and one category component per tab. Each category component subscribes to the store directly (`useSettings`) exactly like the current monolith does — no store, type, or behavior changes. CSS flips the drawer to the left, widens it, and styles the tab row.

**Tech Stack:** React + TypeScript, Zustand (`useSettings`, `useAppState`), Vitest + Testing Library, plain CSS.

## Global Constraints

- No change to the `Settings` shape in `src/store/defaults.ts` or to `src/store/settings.ts`. Reorg only.
- Every control still reads `useSettings((s) => s.settings)` and writes via `update(patch)`. No new settings, none deleted.
- Keep existing control primitives and CSS classes: `Segmented`, `Toggle`, `Section`, `.seg`, `.switch`, `.set-input`, `.set-btn`, `.swatch`, `.scene-chip`.
- Keep `data-testid="settings-overlay"` on the scrim and the gear's accessible name "Settings".
- Gear trigger stays top-right (unchanged). Drawer opens to the **Display** tab every time (tab state not persisted).
- Tab → contents mapping is fixed:
  - **Display**: Performance, Companion, Accent color
  - **Clock**: Units, 12-hour clock, Show seconds, Greeting name
  - **Location**: City search, Use auto-detected, Holiday country
  - **Tiles**: 9 tile toggles, Edit layout, Reset to default layout, Onboarding banner
  - **Ticker**: Coins, Currency
  - **Advanced**: Live scene, Overnight dimming, Backup (export/import)

---

### Task 1: Restructure SettingsPanel into 6 tabs

**Files:**
- Modify: `src/settings/SettingsPanel.tsx` (full rewrite of the component; helpers/primitives kept)
- Test: `src/settings/SettingsPanel.test.tsx` (rewrite to navigate tabs)

**Interfaces:**
- Consumes: `useSettings` (`s.settings`, `s.update`), `useAppState` (`s.setEditMode`), `geocodeCity`, `encodeConfig`/`decodeConfig`, `mergeLayout`, and constants from `../store/defaults` — all already imported in the current file.
- Produces: `SettingsPanel` (default export unchanged — still `export function SettingsPanel()`). New internal-only `TabId` union and per-tab components; nothing else imports them.

- [ ] **Step 1: Rewrite the test file to navigate tabs (write the failing tests)**

Replace the entire contents of `src/settings/SettingsPanel.test.tsx` with:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { DEFAULT_LAYOUT, DEFAULT_SETTINGS } from '../store/defaults'

async function openPanel() {
  render(<SettingsPanel />)
  await userEvent.click(screen.getByRole('button', { name: /settings/i }))
}
async function selectTab(name: RegExp) {
  await userEvent.click(screen.getByRole('tab', { name }))
}

describe('SettingsPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  it('opens when the gear button is clicked', async () => {
    render(<SettingsPanel />)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.getByTestId('settings-overlay')).toBeInTheDocument()
  })

  it('shows six category tabs and opens on Display', async () => {
    await openPanel()
    expect(screen.getAllByRole('tab')).toHaveLength(6)
    expect(screen.getByRole('tab', { name: /display/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('changes the accent color (Display tab)', async () => {
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /accent #9db4ff/i }))
    expect(useSettings.getState().settings.accent).toBe('#9db4ff')
  })

  it('changes units (Clock tab)', async () => {
    await openPanel()
    await selectTab(/clock/i)
    await userEvent.click(screen.getByRole('button', { name: /imperial/i }))
    expect(useSettings.getState().settings.units).toBe('imperial')
  })

  it('toggles a tile and persists it (Tiles tab)', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByLabelText(/^ticker$/i))
    expect(useSettings.getState().settings.enabledTiles.ticker).toBe(false)
  })

  it('changes ticker currency (Ticker tab)', async () => {
    await openPanel()
    await selectTab(/ticker/i)
    await userEvent.click(screen.getByRole('button', { name: /^eur$/i }))
    expect(useSettings.getState().settings.tickerCurrency).toBe('eur')
  })

  it('shows the live scene chips on the Advanced tab', async () => {
    await openPanel()
    await selectTab(/advanced/i)
    expect(screen.getByRole('button', { name: /live/i })).toBeInTheDocument()
  })

  it('arrow keys move between tabs', async () => {
    await openPanel()
    screen.getByRole('tab', { name: /display/i }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /clock/i })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('SettingsPanel — Tiles tab layout controls', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  it('lists Photo and Forecast among the tile toggles', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
  })

  it('Edit layout enters edit mode and closes the drawer', async () => {
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByRole('button', { name: /edit layout/i }))
    expect(useAppState.getState().editMode).toBe(true)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
  })

  it('Reset to default layout restores the default layout', async () => {
    useSettings.getState().update({ tileLayout: [{ i: 'clock', x: 9, y: 9, w: 1, h: 1 }] })
    await openPanel()
    await selectTab(/tiles/i)
    await userEvent.click(screen.getByRole('button', { name: /reset to default layout/i }))
    expect(useSettings.getState().settings.tileLayout).toEqual(DEFAULT_LAYOUT)
    expect(useSettings.getState().settings.enabledTiles).toEqual(DEFAULT_SETTINGS.enabledTiles)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/settings/SettingsPanel.test.tsx`
Expected: FAIL — no elements with `role="tab"` exist yet (e.g. "Unable to find an accessible element with the role 'tab'").

- [ ] **Step 3: Rewrite `src/settings/SettingsPanel.tsx`**

Replace the entire file with:

```tsx
import { useState, type ReactNode } from 'react'
import { useSettings, mergeLayout } from '../store/settings'
import {
  ACCENT_SWATCHES, TICKER_CURRENCIES, TILE_LABELS, DEFAULT_LAYOUT, DEFAULT_SETTINGS,
  type TileId, type Units, type Performance, type Preview,
} from '../store/defaults'
import { useAppState } from '../store/appState'
import { DEMO_NAMES } from '../lib/demo'
import { geocodeCity } from '../data/geo'
import { encodeConfig, decodeConfig } from './configIO'
import './settings.css'

const CURRENCY_OPTS = Object.keys(TICKER_CURRENCIES).map((c) => ({ value: c, label: c.toUpperCase() }))
const HOURS = Array.from({ length: 24 }, (_, h) => h)
function hourLabel(h: number): string { return `${h.toString().padStart(2, '0')}:00` }

/** Preview selector chips → friendly label + glyph. */
const SCENE_META: Record<Preview, { label: string; ico: string }> = {
  live: { label: 'Live', ico: '📡' },
  clear: { label: 'Clear', ico: '☀️' },
  cloudy: { label: 'Cloudy', ico: '☁️' },
  fog: { label: 'Fog', ico: '🌫️' },
  rain: { label: 'Rain', ico: '🌧️' },
  thunder: { label: 'Thunder', ico: '⛈️' },
  snow: { label: 'Snow', ico: '❄️' },
  night: { label: 'Clear night', ico: '🌙' },
  'night-rain': { label: 'Night rain', ico: '🌧️' },
  'night-thunder': { label: 'Night storm', ico: '⛈️' },
}
const SCENE_ORDER: Preview[] = ['live', ...DEMO_NAMES]

interface SegOption<T extends string> { value: T; label: string }

function Segmented<T extends string>(
  { value, options, onChange, wide }: { value: T; options: SegOption<T>[]; onChange: (v: T) => void; wide?: boolean },
) {
  return (
    <div className={wide ? 'seg seg-wide' : 'seg'}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="set-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/* ---- Tabs ---------------------------------------------------------- */

type TabId = 'display' | 'clock' | 'location' | 'tiles' | 'ticker' | 'advanced'
const TABS: { id: TabId; label: string; ico: string }[] = [
  { id: 'display', label: 'Display', ico: '◐' },
  { id: 'clock', label: 'Clock', ico: '🕐' },
  { id: 'location', label: 'Location', ico: '📍' },
  { id: 'tiles', label: 'Tiles', ico: '▦' },
  { id: 'ticker', label: 'Ticker', ico: '📈' },
  { id: 'advanced', label: 'Advanced', ico: '⚙' },
]

/* ---- Category panes ------------------------------------------------ */

function DisplayTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  return (
    <>
      <div className="set-col">
        <span className="set-label">Performance</span>
        <Segmented<Performance>
          wide value={settings.performance}
          options={[{ value: 'high', label: 'High' }, { value: 'low', label: 'Low' }]}
          onChange={(performance) => update({ performance })}
        />
      </div>
      <div className="set-row">
        <Toggle label="Companion (sun / moon)" checked={settings.companion} onChange={(companion) => update({ companion })} />
      </div>
      <div className="set-col">
        <span className="set-label">Accent color</span>
        <div className="swatches">
          {ACCENT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              className={settings.accent === c ? 'swatch active' : 'swatch'}
              style={{ background: c, color: c }}
              onClick={() => update({ accent: c })}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function ClockTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  return (
    <>
      <div className="set-col">
        <span id="units-label" className="set-label">Units</span>
        <div role="group" aria-labelledby="units-label">
          <Segmented<Units>
            wide value={settings.units}
            options={[{ value: 'metric', label: 'Metric °C' }, { value: 'imperial', label: 'Imperial °F' }]}
            onChange={(units) => update({ units })}
          />
        </div>
      </div>
      <div className="set-row">
        <Toggle label="12-hour clock" checked={settings.hour12} onChange={(hour12) => update({ hour12 })} />
      </div>
      <div className="set-row">
        <Toggle label="Show seconds" checked={settings.showSeconds} onChange={(showSeconds) => update({ showSeconds })} />
      </div>
      <div className="set-col">
        <label htmlFor="greet" className="set-label">Greeting name</label>
        <input
          id="greet" className="set-input" placeholder="eg: Marsh Mellow"
          value={settings.greetingName} maxLength={24}
          onChange={(e) => update({ greetingName: e.target.value })}
        />
      </div>
    </>
  )
}

function LocationTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [city, setCity] = useState('')

  async function searchCity() {
    const loc = await geocodeCity(city)
    if (loc) { update({ location: loc }); setCity('') }
  }

  return (
    <>
      <div className="set-col">
        <span className="set-label">Search city</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="set-input"
            placeholder={settings.location?.name ?? 'Auto-detected'}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') searchCity() }}
          />
          <button className="set-btn" onClick={searchCity}>Search</button>
        </div>
      </div>
      <div className="set-col">
        <button className="set-btn block" onClick={() => update({ location: null })}>Use auto-detected location</button>
      </div>
      <div className="set-col">
        <label htmlFor="country" className="set-label">Holiday country (ISO-2)</label>
        <input
          id="country" className="set-input" value={settings.holidayCountry} maxLength={2}
          onChange={(e) => update({ holidayCountry: e.target.value.toUpperCase() })}
        />
      </div>
    </>
  )
}

function TilesTab({ onClose }: { onClose: () => void }) {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)
  return (
    <>
      <div className="set-col">
        <button className="set-btn block" onClick={() => { setEditMode(true); onClose() }}>
          Edit layout
        </button>
      </div>
      <div className="set-col">
        <button
          className="set-btn block"
          onClick={() => update({ tileLayout: DEFAULT_LAYOUT, enabledTiles: DEFAULT_SETTINGS.enabledTiles })}
        >
          Reset to default layout
        </button>
      </div>
      <Section title="Show tiles">
        {(Object.keys(TILE_LABELS) as TileId[]).map((id) => (
          <div className="set-row" key={id}>
            <Toggle
              label={TILE_LABELS[id]}
              checked={settings.enabledTiles[id]}
              onChange={(on) => update({ enabledTiles: { ...settings.enabledTiles, [id]: on } })}
            />
          </div>
        ))}
      </Section>
      <Section title="Onboarding">
        <div className="set-row">
          <Toggle label="Onboarding banner" checked={settings.showOnboardingBanner} onChange={(showOnboardingBanner) => update({ showOnboardingBanner })} />
        </div>
      </Section>
    </>
  )
}

function TickerTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [coinsText, setCoinsText] = useState(settings.tickerCoins.join(', '))

  function commitCoins() {
    const ids = coinsText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (ids.length) update({ tickerCoins: ids })
  }

  return (
    <>
      <div className="set-col">
        <label htmlFor="coins" className="set-label">Coins (CoinGecko ids, comma-separated)</label>
        <input
          id="coins" className="set-input" placeholder="bitcoin, ethereum, solana"
          value={coinsText}
          onChange={(e) => setCoinsText(e.target.value)}
          onBlur={commitCoins}
          onKeyDown={(e) => { if (e.key === 'Enter') commitCoins() }}
        />
      </div>
      <div className="set-col">
        <span className="set-label">Currency</span>
        <Segmented<string>
          wide value={settings.tickerCurrency}
          options={CURRENCY_OPTS}
          onChange={(tickerCurrency) => update({ tickerCurrency })}
        />
      </div>
    </>
  )
}

function AdvancedTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [importText, setImportText] = useState('')
  return (
    <>
      <Section title="Live scene">
        <div className="scene-grid">
          {SCENE_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={settings.preview === p ? 'scene-chip active' : 'scene-chip'}
              onClick={() => update({ preview: p })}
            >
              <span className="ico">{SCENE_META[p].ico}</span>
              {SCENE_META[p].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Overnight dimming">
        <div className="set-row">
          <Toggle label="Auto-dim at night" checked={settings.nightDim} onChange={(nightDim) => update({ nightDim })} />
        </div>
        <div className="set-row">
          <span>From</span>
          <select className="set-input" style={{ width: 110 }} value={settings.dimStart}
            onChange={(e) => update({ dimStart: Number(e.target.value) })}>
            {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
        <div className="set-row">
          <span>To</span>
          <select className="set-input" style={{ width: 110 }} value={settings.dimEnd}
            onChange={(e) => update({ dimEnd: Number(e.target.value) })}>
            {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
      </Section>

      <Section title="Backup">
        <div className="set-col">
          <span className="set-label">Export this screen's config</span>
          <textarea className="set-input" readOnly value={encodeConfig(settings)} rows={3} />
        </div>
        <div className="set-col">
          <span className="set-label">Import config</span>
          <textarea
            className="set-input" placeholder="Paste config here" rows={3}
            value={importText} onChange={(e) => setImportText(e.target.value)}
          />
          <button
            className="set-btn primary block" style={{ marginTop: 8 }}
            onClick={() => { const c = decodeConfig(importText); if (c) { update(c.tileLayout ? { ...c, tileLayout: mergeLayout(c.tileLayout) } : c); setImportText('') } }}
          >
            Apply imported config
          </button>
        </div>
      </Section>
    </>
  )
}

/* ---- Panel shell --------------------------------------------------- */

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('display')

  function moveTab(dir: 1 | -1) {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(i + dir + TABS.length) % TABS.length]
    setTab(next.id)
  }

  return (
    <>
      <button className="set-gear" aria-label="Settings" onClick={() => { setTab('display'); setOpen(true) }}>⚙</button>

      {open && (
        <div
          data-testid="settings-overlay"
          className="set-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="set-panel">
            <div className="set-head">
              <h2>Settings</h2>
              <button className="set-x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </div>

            <div
              className="set-tabs"
              role="tablist"
              aria-label="Settings categories"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') { e.preventDefault(); moveTab(1) }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); moveTab(-1) }
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`set-tab-${t.id}`}
                  aria-controls="set-tabpanel"
                  aria-selected={tab === t.id}
                  tabIndex={tab === t.id ? 0 : -1}
                  className="set-tab"
                  onClick={() => setTab(t.id)}
                >
                  <span className="ico" aria-hidden="true">{t.ico}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="set-tabpanel" id="set-tabpanel" role="tabpanel" aria-labelledby={`set-tab-${tab}`}>
              {tab === 'display' && <DisplayTab />}
              {tab === 'clock' && <ClockTab />}
              {tab === 'location' && <LocationTab />}
              {tab === 'tiles' && <TilesTab onClose={() => setOpen(false)} />}
              {tab === 'ticker' && <TickerTab />}
              {tab === 'advanced' && <AdvancedTab />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/settings/SettingsPanel.test.tsx`
Expected: PASS (all tests in both describe blocks).

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc -p tsconfig.app.json --noEmit && npx eslint src/settings/SettingsPanel.tsx src/settings/SettingsPanel.test.tsx`
Expected: no errors. (`ReactNode` is still used by `Section`; `mergeLayout`, `encodeConfig`, `decodeConfig`, all constants are still referenced.)

- [ ] **Step 6: Commit**

```bash
git add src/settings/SettingsPanel.tsx src/settings/SettingsPanel.test.tsx
git commit -m "feat(settings): reorganize panel into 6 category tabs"
```

---

### Task 2: Left drawer + tab-row styling

**Files:**
- Modify: `src/settings/settings.css` (scrim alignment, panel side/width/animation; add tab styles)

**Interfaces:**
- Consumes: the class names emitted by Task 1 — `.set-tabs`, `.set-tab`, `.set-tabpanel`, plus existing `.set-scrim`, `.set-panel`.
- Produces: nothing consumed by other tasks (final task).

- [ ] **Step 1: Flip the scrim to the left**

In `src/settings/settings.css`, in the `.set-scrim` rule, change:

```css
  justify-content: flex-end;
```

to:

```css
  justify-content: flex-start;
```

- [ ] **Step 2: Widen the panel and move it to the left edge**

In the `.set-panel` rule, change:

```css
  width: 392px;
  max-width: 92vw;
  height: 100%;
  overflow-y: auto;
  border-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
```

to:

```css
  width: 640px;
  max-width: 92vw;
  height: 100%;
  overflow-y: auto;
  border-radius: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.18);
```

- [ ] **Step 3: Flip the slide-in animation to come from the left**

Change the keyframes:

```css
@keyframes set-slide { from { transform: translateX(28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
```

to:

```css
@keyframes set-slide { from { transform: translateX(-28px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
```

- [ ] **Step 4: Add the tab-row styles**

Append to the end of `src/settings/settings.css`:

```css
/* Category tabs ------------------------------------------------------- */
.set-tabs {
  display: flex;
  gap: 4px;
  margin: 14px 0 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.set-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 10px 4px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.set-tab .ico { font-size: 1.2rem; line-height: 1; }
.set-tab:hover { color: #fff; }
.set-tab[aria-selected='true'] { color: #fff; border-bottom-color: var(--accent); }
.set-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; border-radius: 6px; }

.set-tabpanel { padding-top: 4px; }
/* First section inside a pane shouldn't add a big top gap under the tabs. */
.set-tabpanel > .set-section:first-child { margin-top: 14px; }
```

- [ ] **Step 5: Build to verify the CSS compiles and the app bundles**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS (no regressions across the suite).

- [ ] **Step 7: Commit**

```bash
git add src/settings/settings.css
git commit -m "style(settings): left-side 640px drawer with tab row"
```

---

## Self-Review

**Spec coverage:**
- Wider ~640px panel → Task 2 Step 2. ✓
- Left slide-in drawer → Task 2 Steps 1–3. ✓
- Gear stays top-right → unchanged (`.set-gear` untouched); drawer opens to Display via `setTab('display')` on open → Task 1 Step 3. ✓
- Horizontal tab row (not side rail), 6 tabs, icon + label → Task 1 Step 3 (`set-tabs`/`TABS`) + Task 2 Step 4. ✓
- Category mapping (Display/Clock/Location/Tiles/Ticker/Advanced) → Task 1 Step 3 components match the Global Constraints table. ✓
- Live scene, Overnight dimming, Backup → Advanced → `AdvancedTab`. ✓
- Layout buttons + onboarding banner → Tiles → `TilesTab`. ✓
- No store/Settings changes → only `SettingsPanel.tsx`, its test, and `settings.css` touched. ✓
- Accessibility (tablist/tab/tabpanel, aria-selected, arrow keys) → Task 1 Step 3 + test in Step 1. ✓
- Tests: tab navigation, a control per tab, drawer open/close, keyboard → Task 1 Step 1. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete file/edit content. ✓

**Type consistency:** `TabId` union matches `TABS[].id` and the `tab === '…'` checks and `aria-labelledby`/`id` template strings. `TilesTab` takes `{ onClose: () => void }` and is rendered with `onClose={() => setOpen(false)}`. Primitives (`Segmented`, `Toggle`, `Section`) and helpers (`hourLabel`, `SCENE_META`, `SCENE_ORDER`, `CURRENCY_OPTS`, `HOURS`) are defined once and reused. All imports from the original file remain used. ✓
