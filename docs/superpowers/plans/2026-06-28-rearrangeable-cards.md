# Rearrangeable Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users freely move, resize, remove, and re-add dashboard tiles in an explicit edit mode, with the layout persisted per screen.

**Architecture:** Replace the hardcoded `PLACEMENT` map in `GridLayout.tsx` with `react-grid-layout` driven by a persisted `tileLayout` in the settings store. A transient `editMode` flag gates dragging/resizing. A reusable `TileShell` wraps every tile with the common edit chrome (× remove button, edit outline, size container) while tiles stay pure content. Offline tile-gating (`useOnline` + `NEEDS_NET`) is preserved.

**Tech Stack:** React 19.2, TypeScript, Zustand, `react-grid-layout` v2.2.3, Vite/Vitest, Testing Library.

## Global Constraints

- `react-grid-layout` must be **v2.2.3** (peer `react >= 16.3.0`; bundles its own TS types — do **not** add `@types/react-grid-layout`).
- Grid is **12 columns × 12 row-units**; `compactType: null` + `preventCollision: true` (snap, no overlap, no reflow).
- One layout that scales to the viewport — **no per-breakpoint layouts**.
- All 9 tiles are uniform: `clock, weather, air, calendar, quote, sunmoon, forecast, photo, ticker` — each toggleable, removable, movable, resizable.
- Offline gating is **kept**: visibility = `enabledTiles[id] && (online || !NEEDS_NET[id])`. `NEEDS_NET` true for `weather, air, sunmoon, forecast, photo, ticker`.
- `editMode` is **transient** (in `appState`, never persisted, always boots `false`).
- Settings storage key prefix is `halo:` (so `localStorage` key is `halo:settings`).
- TDD: write the failing test first, watch it fail, implement minimally, watch it pass, commit. Run the full suite with `npm test` before each commit.

---

## File Structure

- `src/store/defaults.ts` — **modify**: add `RegionId`, `LayoutItem`, `GRID_COLS`/`GRID_ROWS`, `DEFAULT_LAYOUT`, `TILE_LABELS`; widen `TileId` to all 9; add `tileLayout` to `Settings`/`DEFAULT_SETTINGS`; enable `photo`+`forecast`.
- `src/store/settings.ts` — **modify**: merge persisted `tileLayout` against the default so newly-added tiles always have a slot.
- `src/store/appState.ts` — **modify**: add transient `editMode` + `setEditMode`.
- `src/setupTests.ts` — **modify**: polyfill `ResizeObserver` (RGL's `WidthProvider` needs it under jsdom).
- `src/tiles/TileShell.tsx` — **create**: reusable RGL-compatible card shell (forwards RGL props, renders × in edit mode, establishes size container).
- `src/layout/HiddenTilesTray.tsx` — **create**: edit-mode bar with a Done button + re-add buttons for user-hidden tiles.
- `src/layout/layout.css` — **create**: glass-themed RGL handle/placeholder styling + shell/tray styling.
- `src/layout/GridLayout.tsx` — **modify** (rewrite): render `react-grid-layout`, preserve offline gate, wire layout persistence + edit mode + remove + tray.
- `package.json` — **modify**: add `react-grid-layout` dependency.
- Test files alongside each.

---

### Task 1: Data model — types, default layout, labels

**Files:**
- Modify: `src/store/defaults.ts`
- Test: `src/store/defaults.test.ts` (create)

**Interfaces:**
- Produces:
  - `type RegionId = 'clock'|'weather'|'air'|'calendar'|'quote'|'sunmoon'|'forecast'|'photo'|'ticker'`
  - `type TileId = RegionId`
  - `interface LayoutItem { i: RegionId; x: number; y: number; w: number; h: number }`
  - `const GRID_COLS = 12`, `const GRID_ROWS = 12`
  - `const DEFAULT_LAYOUT: LayoutItem[]` (one entry per RegionId)
  - `const TILE_LABELS: Record<RegionId, string>`
  - `DEFAULT_SETTINGS.tileLayout` (= `DEFAULT_LAYOUT`) and `enabledTiles` with all 9 true.

- [ ] **Step 1: Write the failing test**

Create `src/store/defaults.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS, DEFAULT_LAYOUT, TILE_LABELS, GRID_COLS, GRID_ROWS,
  type RegionId,
} from './defaults'

const ALL_IDS: RegionId[] = [
  'clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'forecast', 'photo', 'ticker',
]

describe('layout defaults', () => {
  it('enables all nine tiles by default', () => {
    for (const id of ALL_IDS) expect(DEFAULT_SETTINGS.enabledTiles[id]).toBe(true)
  })

  it('has exactly one default layout entry per tile', () => {
    expect(DEFAULT_LAYOUT.map((l) => l.i).sort()).toEqual([...ALL_IDS].sort())
    expect(DEFAULT_SETTINGS.tileLayout).toEqual(DEFAULT_LAYOUT)
  })

  it('keeps every default layout item inside the 12x12 grid', () => {
    for (const it of DEFAULT_LAYOUT) {
      expect(it.x).toBeGreaterThanOrEqual(0)
      expect(it.x + it.w).toBeLessThanOrEqual(GRID_COLS)
      expect(it.y + it.h).toBeLessThanOrEqual(GRID_ROWS)
    }
  })

  it('has a human label for every tile', () => {
    for (const id of ALL_IDS) expect(TILE_LABELS[id]).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/store/defaults.test.ts`
Expected: FAIL — `DEFAULT_LAYOUT`/`TILE_LABELS`/`GRID_COLS` not exported.

- [ ] **Step 3: Edit `src/store/defaults.ts`**

Replace the `TileId` line:

```ts
export type TileId = 'clock' | 'weather' | 'calendar' | 'sunmoon' | 'quote' | 'ticker' | 'air'
```

with:

```ts
export type RegionId =
  | 'clock' | 'weather' | 'air' | 'calendar' | 'quote'
  | 'sunmoon' | 'forecast' | 'photo' | 'ticker'

/** All tiles are uniform now — every region is a toggleable tile. */
export type TileId = RegionId

export interface LayoutItem { i: RegionId; x: number; y: number; w: number; h: number }

export const GRID_COLS = 12
export const GRID_ROWS = 12

/** Default bento mapped onto the 12-col × 12-row grid (matches the old PLACEMENT). */
export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'clock',    x: 0, y: 0,  w: 7,  h: 2 },
  { i: 'weather',  x: 0, y: 2,  w: 4,  h: 2 },
  { i: 'air',      x: 4, y: 2,  w: 3,  h: 2 },
  { i: 'calendar', x: 0, y: 4,  w: 3,  h: 4 },
  { i: 'quote',    x: 3, y: 4,  w: 4,  h: 2 },
  { i: 'sunmoon',  x: 3, y: 6,  w: 4,  h: 2 },
  { i: 'forecast', x: 0, y: 8,  w: 7,  h: 2 },
  { i: 'photo',    x: 7, y: 0,  w: 5,  h: 10 },
  { i: 'ticker',   x: 0, y: 10, w: 12, h: 2 },
]

export const TILE_LABELS: Record<RegionId, string> = {
  clock: 'Clock', weather: 'Weather', air: 'Air quality', calendar: 'Calendar',
  quote: 'Quote', sunmoon: 'Sun & Moon', forecast: 'Forecast', photo: 'Photo',
  ticker: 'Ticker',
}
```

Add `tileLayout: LayoutItem[]` to the `Settings` interface (right after `enabledTiles`):

```ts
  enabledTiles: Record<TileId, boolean>
  /** Per-screen tile positions/sizes (react-grid-layout items). */
  tileLayout: LayoutItem[]
```

In `DEFAULT_SETTINGS`, replace the `enabledTiles` block and add `tileLayout`:

```ts
  enabledTiles: {
    clock: true, weather: true, air: true, calendar: true, quote: true,
    sunmoon: true, forecast: true, photo: true, ticker: true,
  },
  tileLayout: DEFAULT_LAYOUT,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/store/defaults.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/defaults.ts src/store/defaults.test.ts
git commit -m "feat(layout): tile layout data model, default layout, labels"
```

---

### Task 2: Merge persisted layout on load

**Files:**
- Modify: `src/store/settings.ts`
- Test: `src/store/settings.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LAYOUT`, `LayoutItem`, `RegionId` from `defaults.ts` (Task 1).
- Produces: `useSettings.load()` guarantees `settings.tileLayout` contains an entry for every tile in `DEFAULT_LAYOUT`, preferring saved positions.

- [ ] **Step 1: Write the failing test**

Append to `src/store/settings.test.ts` (inside the existing `describe('settings store', ...)`):

```ts
  it('keeps saved tile positions but backfills any missing tile from defaults', () => {
    localStorage.setItem('halo:settings', JSON.stringify({
      value: { tileLayout: [{ i: 'clock', x: 5, y: 5, w: 2, h: 2 }] },
      ts: 1,
    }))
    useSettings.getState().load()
    const layout = useSettings.getState().settings.tileLayout
    // saved clock position is preserved
    expect(layout.find((l) => l.i === 'clock')).toEqual({ i: 'clock', x: 5, y: 5, w: 2, h: 2 })
    // every default tile still has an entry (e.g. photo, which was not saved)
    expect(layout.find((l) => l.i === 'photo')).toBeTruthy()
    expect(layout).toHaveLength(9)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/store/settings.test.ts`
Expected: FAIL — `photo` missing / length is 1 (saved layout used as-is).

- [ ] **Step 3: Edit `src/store/settings.ts`**

Add the import and a merge helper, and use it in `load`. Replace the file body with:

```ts
import { create } from 'zustand'
import { DEFAULT_SETTINGS, DEFAULT_LAYOUT, type Settings, type LayoutItem } from './defaults'
import { saveCache, loadCache } from '../lib/storage'

const KEY = 'settings'

/** Prefer saved positions, but guarantee every default tile has an entry. */
function mergeLayout(saved: LayoutItem[] | undefined): LayoutItem[] {
  if (!saved?.length) return DEFAULT_LAYOUT
  const byId = new Map(saved.map((it) => [it.i, it]))
  return DEFAULT_LAYOUT.map((def) => byId.get(def.i) ?? def)
}

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
    if (cached) {
      set({
        settings: {
          ...DEFAULT_SETTINGS,
          ...cached.value,
          // Deep-merge tiles so newly-added tiles inherit their default rather
          // than being absent (and therefore hidden) for existing screens.
          enabledTiles: { ...DEFAULT_SETTINGS.enabledTiles, ...cached.value.enabledTiles },
          tileLayout: mergeLayout(cached.value.tileLayout),
        },
      })
    }
  },
  update: (patch) => {
    const next = { ...get().settings, ...patch }
    saveCache(KEY, next)
    set({ settings: next })
  },
  reset: () => set({ settings: DEFAULT_SETTINGS }),
}))
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/store/settings.test.ts`
Expected: PASS (existing tests + the new one).

- [ ] **Step 5: Commit**

```bash
git add src/store/settings.ts src/store/settings.test.ts
git commit -m "feat(layout): backfill missing tiles when loading saved layout"
```

---

### Task 3: Transient edit-mode flag

**Files:**
- Modify: `src/store/appState.ts`
- Test: `src/store/appState.test.ts`

**Interfaces:**
- Produces: `useAppState` gains `editMode: boolean` (default `false`) and `setEditMode(v: boolean): void`.

- [ ] **Step 1: Write the failing test**

Append to `src/store/appState.test.ts` (inside the existing `describe`):

```ts
  it('defaults editMode off and toggles it', () => {
    expect(useAppState.getState().editMode).toBe(false)
    useAppState.getState().setEditMode(true)
    expect(useAppState.getState().editMode).toBe(true)
    useAppState.getState().setEditMode(false)
    expect(useAppState.getState().editMode).toBe(false)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/store/appState.test.ts`
Expected: FAIL — `editMode`/`setEditMode` undefined.

- [ ] **Step 3: Edit `src/store/appState.ts`**

In the `AppState` interface add:

```ts
  editMode: boolean
  setEditMode: (v: boolean) => void
```

In the `create<AppState>` initializer add (after `location: null,`):

```ts
  editMode: false,
  setEditMode: (editMode) => set({ editMode }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/store/appState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/appState.ts src/store/appState.test.ts
git commit -m "feat(layout): transient editMode flag in app state"
```

---

### Task 4: Add react-grid-layout + jsdom ResizeObserver polyfill

**Files:**
- Modify: `package.json` (via npm), `package-lock.json`
- Modify: `src/setupTests.ts`

**Interfaces:**
- Produces: `react-grid-layout` importable; `globalThis.ResizeObserver` defined under jsdom so RGL's `WidthProvider` does not throw in tests.

- [ ] **Step 1: Install the dependency**

Run: `npm install react-grid-layout@^2.2.3`
Expected: adds `react-grid-layout` to `dependencies`; no peer-dep errors (peer is `react >= 16.3.0`). Do **not** install `@types/react-grid-layout` — v2 bundles its own types.

- [ ] **Step 2: Verify it resolves**

Run: `npm ls react-grid-layout`
Expected: shows `react-grid-layout@2.2.3` (or 2.2.x).

- [ ] **Step 3: Add the ResizeObserver polyfill to test setup**

Replace `src/setupTests.ts` with:

```ts
import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-grid-layout's WidthProvider observes the
// container. A no-op stub is enough — tests assert presence, not geometry.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)
```

- [ ] **Step 4: Verify the suite still passes**

Run: `npm test`
Expected: PASS (no behavioral change yet; suite is green).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/setupTests.ts
git commit -m "build(layout): add react-grid-layout + jsdom ResizeObserver stub"
```

---

### Task 5: Reusable `TileShell`

**Files:**
- Create: `src/tiles/TileShell.tsx`
- Test: `src/tiles/TileShell.test.tsx`

**Interfaces:**
- Consumes: `RegionId` from `defaults.ts`.
- Produces: `TileShell` — a `forwardRef<HTMLDivElement>` component.
  Props: `{ id: RegionId; editMode: boolean; onRemove: (id: RegionId) => void; children?: ReactNode }` **plus** any extra props (RGL injects `className`, `style`, mouse/touch handlers, and appends a resize-handle child — all forwarded to the root `div`). Root carries `data-region={id}`.

- [ ] **Step 1: Write the failing test**

Create `src/tiles/TileShell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TileShell } from './TileShell'

describe('TileShell', () => {
  it('renders content with a data-region marker', () => {
    const { container } = render(
      <TileShell id="clock" editMode={false} onRemove={() => {}}>
        <span>hello</span>
      </TileShell>,
    )
    expect(container.querySelector('[data-region="clock"]')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('shows no remove button outside edit mode', () => {
    render(<TileShell id="clock" editMode={false} onRemove={() => {}}><span>x</span></TileShell>)
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull()
  })

  it('removes the tile when the × is clicked in edit mode', async () => {
    const onRemove = vi.fn()
    render(<TileShell id="quote" editMode onRemove={onRemove}><span>x</span></TileShell>)
    await userEvent.click(screen.getByRole('button', { name: /remove quote/i }))
    expect(onRemove).toHaveBeenCalledWith('quote')
  })

  it('forwards injected className/style/props to the root (RGL compatibility)', () => {
    const { container } = render(
      <TileShell id="air" editMode={false} onRemove={() => {}} className="react-grid-item" style={{ width: 120 }}>
        <span>x</span>
      </TileShell>,
    )
    const root = container.querySelector('[data-region="air"]') as HTMLElement
    expect(root.className).toContain('react-grid-item')
    expect(root.style.width).toBe('120px')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/tiles/TileShell.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/tiles/TileShell.tsx`**

```tsx
import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { RegionId } from '../store/defaults'

interface TileShellProps {
  id: RegionId
  editMode: boolean
  onRemove: (id: RegionId) => void
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * The reusable outer shell for every dashboard tile. Owns the edit chrome
 * (× remove button, edit outline, size container) so individual tiles stay
 * pure content. react-grid-layout clones this element and injects positioning
 * `style`, a `className`, drag handlers, and an appended resize-handle child —
 * all of which are spread onto the root div, so the shell stays RGL-compatible.
 */
export const TileShell = forwardRef<HTMLDivElement, TileShellProps>(function TileShell(
  { id, editMode, onRemove, children, className, style, ...rest }, ref,
) {
  return (
    <div
      ref={ref}
      data-region={id}
      className={`tile-shell${editMode ? ' tile-shell--editing' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      {editMode && (
        <button
          type="button"
          className="tile-shell__remove"
          aria-label={`Remove ${id}`}
          // Stop the press from starting an RGL drag before the click lands.
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={() => onRemove(id)}
        >
          ×
        </button>
      )}
      {children}
    </div>
  )
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/tiles/TileShell.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tiles/TileShell.tsx src/tiles/TileShell.test.tsx
git commit -m "feat(layout): reusable TileShell with edit-mode remove chrome"
```

---

### Task 6: Hidden-tiles / edit bar

**Files:**
- Create: `src/layout/HiddenTilesTray.tsx`
- Test: `src/layout/HiddenTilesTray.test.tsx`

**Interfaces:**
- Consumes: `useSettings` (`settings.enabledTiles`, `update`), `useAppState` (`setEditMode`), `TILE_LABELS`, `RegionId`.
- Produces: `HiddenTilesTray` — renders an edit bar (`data-testid="tile-tray"`) with a **Done** button (exits edit mode) and a `+ <label>` button per user-hidden tile (`!enabledTiles[id]`). Re-add buttons set `enabledTiles[id] = true`. Offline-gated tiles are NOT listed (this component only knows `enabledTiles`).

- [ ] **Step 1: Write the failing test**

Create `src/layout/HiddenTilesTray.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HiddenTilesTray } from './HiddenTilesTray'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

describe('HiddenTilesTray', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ editMode: true })
  })

  it('shows a Done button that exits edit mode', async () => {
    render(<HiddenTilesTray />)
    await userEvent.click(screen.getByRole('button', { name: /done/i }))
    expect(useAppState.getState().editMode).toBe(false)
  })

  it('lists a re-add button only for user-hidden tiles', async () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, quote: false },
    })
    render(<HiddenTilesTray />)
    const addBtn = screen.getByRole('button', { name: /quote/i })
    await userEvent.click(addBtn)
    expect(useSettings.getState().settings.enabledTiles.quote).toBe(true)
  })

  it('lists nothing to re-add when all tiles are enabled', () => {
    render(<HiddenTilesTray />)
    // Done is present, but no "+ Clock" style buttons
    expect(screen.queryByRole('button', { name: /^\+/ })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/layout/HiddenTilesTray.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/layout/HiddenTilesTray.tsx`**

```tsx
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { TILE_LABELS, type RegionId } from '../store/defaults'

const ALL_IDS = Object.keys(TILE_LABELS) as RegionId[]

/** Edit-mode bar: a Done button plus re-add buttons for user-hidden tiles. */
export function HiddenTilesTray() {
  const enabledTiles = useSettings((s) => s.settings.enabledTiles)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)

  const hidden = ALL_IDS.filter((id) => !enabledTiles[id])

  return (
    <div className="tile-tray" data-testid="tile-tray">
      <button type="button" className="tile-tray__done" onClick={() => setEditMode(false)}>
        Done
      </button>
      {hidden.length > 0 && <span className="tile-tray__label">Hidden:</span>}
      {hidden.map((id) => (
        <button
          key={id}
          type="button"
          className="tile-tray__add"
          onClick={() => update({ enabledTiles: { ...enabledTiles, [id]: true } })}
        >
          + {TILE_LABELS[id]}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/layout/HiddenTilesTray.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/layout/HiddenTilesTray.tsx src/layout/HiddenTilesTray.test.tsx
git commit -m "feat(layout): edit-mode tray with Done and re-add controls"
```

---

### Task 7: Layout CSS (RGL theming + shell/tray)

**Files:**
- Create: `src/layout/layout.css`

**Interfaces:**
- Produces: styles for `.tile-shell`, `.tile-shell--editing`, `.tile-shell__remove`, `.tile-tray*`, and themed RGL placeholder/resize-handle classes. Imported by `GridLayout.tsx` in Task 8 (alongside `react-grid-layout/css/styles.css`).

This task is CSS only (no unit test). Verification is a successful build in Task 8.

- [ ] **Step 1: Create `src/layout/layout.css`**

```css
/* ------------------------------------------------------------------ *
 *  Rearrangeable tile grid — shell chrome, edit affordances, tray.
 *  Pairs with react-grid-layout/css/styles.css (imported in GridLayout).
 * ------------------------------------------------------------------ */

.tile-grid { position: absolute; inset: 0; z-index: 1; }

/* Each tile is its own size container, so content can later scale to the card
   (cqi/cqh) instead of the viewport. Non-breaking until tiles adopt cq units. */
.tile-shell {
  position: relative;
  container-type: size;
  display: grid;
  min-width: 0;
  min-height: 0;
}

/* Edit affordances */
.tile-shell--editing {
  outline: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
  outline-offset: -2px;
  border-radius: 16px;
  cursor: grab;
}
.tile-shell--editing:active { cursor: grabbing; }

.tile-shell__remove {
  position: absolute;
  top: 6px; right: 6px;
  z-index: 5;
  width: 26px; height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 14, 26, 0.7);
  color: #fff;
  font-size: 1.05rem; line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.tile-shell__remove:hover { background: rgba(220, 60, 60, 0.85); }

/* RGL drag placeholder — match the glass accent instead of the default red */
.react-grid-item.react-grid-placeholder {
  background: color-mix(in srgb, var(--accent) 28%, transparent);
  border: 1px dashed var(--accent);
  border-radius: 16px;
  opacity: 0.6;
}

/* RGL resize handle — only visible while editing */
.tile-shell .react-resizable-handle { display: none; }
.tile-shell--editing .react-resizable-handle { display: block; opacity: 0.8; }

/* Edit-mode tray / bar */
.tile-tray {
  position: absolute;
  left: 50%; bottom: 18px;
  transform: translateX(-50%);
  z-index: 40;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  max-width: 92vw;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(14, 18, 30, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
.tile-tray__label { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); }
.tile-tray__done,
.tile-tray__add {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.8rem; font-weight: 600;
  padding: 7px 12px;
  border-radius: 9px;
  cursor: pointer;
}
.tile-tray__done { background: var(--accent); border-color: transparent; color: #0b0f1a; }
.tile-tray__add:hover { background: rgba(255, 255, 255, 0.16); }
```

- [ ] **Step 2: Commit**

```bash
git add src/layout/layout.css
git commit -m "style(layout): glass-themed RGL handles, shell chrome, edit tray"
```

---

### Task 8: Rewrite GridLayout on react-grid-layout

**Files:**
- Modify: `src/layout/GridLayout.tsx` (rewrite)
- Test: `src/layout/GridLayout.test.tsx` (rewrite)

**Interfaces:**
- Consumes: `react-grid-layout` (`WidthProvider`, `Layout`), `TileShell`, `HiddenTilesTray`, `useOnline`, `useSettings`, `useAppState`, `GRID_COLS`, `GRID_ROWS`, `RegionId`, `LayoutItem`, the tile components.
- Produces: `GridLayout` — renders enabled+online-permitted tiles via RGL; persists moves to `settings.tileLayout` only in edit mode; renders the tray in edit mode.

- [ ] **Step 1: Rewrite the test `src/layout/GridLayout.test.tsx`**

Replace the entire file with:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GridLayout } from './GridLayout'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'

function region(c: HTMLElement, id: string): HTMLElement | null {
  return c.querySelector(`[data-region="${id}"]`)
}
function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

describe('GridLayout', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00'), editMode: false })
    setOnline(true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders every enabled tile', () => {
    const { container } = render(<GridLayout />)
    for (const id of ['clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'forecast', 'photo', 'ticker']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })

  it('omits a disabled tile', () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, weather: false },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'weather')).toBeNull()
  })

  it('shows forecast independently of the weather tile', () => {
    useSettings.getState().update({
      enabledTiles: { ...useSettings.getState().settings.enabledTiles, weather: false, forecast: true },
    })
    const { container } = render(<GridLayout />)
    expect(region(container, 'weather')).toBeNull()
    expect(region(container, 'forecast')).toBeInTheDocument()
  })

  it('shows remove buttons and the tray only in edit mode', () => {
    const { container, rerender } = render(<GridLayout />)
    expect(container.querySelectorAll('.tile-shell__remove')).toHaveLength(0)
    expect(container.querySelector('[data-testid="tile-tray"]')).toBeNull()

    useAppState.setState({ editMode: true })
    rerender(<GridLayout />)
    expect(container.querySelectorAll('.tile-shell__remove').length).toBeGreaterThan(0)
    expect(container.querySelector('[data-testid="tile-tray"]')).toBeInTheDocument()
  })
})

describe('GridLayout offline gating', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ weather: null, now: new Date('2026-06-06T12:00:00'), editMode: false })
  })
  afterEach(() => vi.restoreAllMocks())

  it('hides internet-dependent tiles when offline, keeps offline-capable ones', () => {
    setOnline(false)
    const { container } = render(<GridLayout />)
    for (const id of ['weather', 'air', 'forecast', 'photo', 'ticker', 'sunmoon']) {
      expect(region(container, id)).toBeNull()
    }
    for (const id of ['clock', 'calendar', 'quote']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })

  it('shows the internet-dependent tiles when online', () => {
    setOnline(true)
    const { container } = render(<GridLayout />)
    for (const id of ['weather', 'air', 'forecast', 'photo', 'ticker', 'sunmoon']) {
      expect(region(container, id)).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/layout/GridLayout.test.tsx`
Expected: FAIL — old `GridLayout` still renders `data-col`/structural logic; new assertions (tray, edit removes, independent forecast) fail or it errors on the missing RGL wiring.

- [ ] **Step 3: Rewrite `src/layout/GridLayout.tsx`**

```tsx
import type { ReactNode } from 'react'
import GridLayoutBase, { WidthProvider, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './layout.css'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { useOnline } from '../hooks/useOnline'
import { TileShell } from '../tiles/TileShell'
import { HiddenTilesTray } from './HiddenTilesTray'
import { GRID_COLS, GRID_ROWS, type RegionId, type LayoutItem } from '../store/defaults'
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'
import { ForecastTile } from '../tiles/ForecastTile'
import { CalendarTile } from '../tiles/CalendarTile'
import { SunMoonTile } from '../tiles/SunMoonTile'
import { QuoteTile } from '../tiles/QuoteTile'
import { TickerTile } from '../tiles/TickerTile'
import { AirQualityTile } from '../tiles/AirQualityTile'
import { PhotoPanel } from '../tiles/PhotoPanel'

const ResponsiveGrid = WidthProvider(GridLayoutBase)

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

// Regions that need the internet. When offline they are hidden so they never
// show a spinner or error; they reappear automatically once the link is back.
const NEEDS_NET: Record<RegionId, boolean> = {
  clock: false, weather: true, air: true, calendar: false, quote: false,
  sunmoon: true, forecast: true, photo: true, ticker: true,
}

const MARGIN = 14 // ~0.9rem gap
const PADDING = 26 // ~1.6rem padding

function rowHeight(): number {
  const h = typeof window !== 'undefined' ? window.innerHeight : 768
  return Math.max(24, Math.floor((h - PADDING * 2 - MARGIN * (GRID_ROWS - 1)) / GRID_ROWS))
}

export function GridLayout() {
  const enabled = useSettings((s) => s.settings.enabledTiles)
  const tileLayout = useSettings((s) => s.settings.tileLayout)
  const update = useSettings((s) => s.update)
  const editMode = useAppState((s) => s.editMode)
  const online = useOnline()

  const show = (id: RegionId) => !!enabled[id] && (online || !NEEDS_NET[id])
  const visibleIds = (Object.keys(RENDER) as RegionId[]).filter(show)

  // RGL layout for the currently-rendered children only.
  const layout: Layout[] = tileLayout.filter((it) => visibleIds.includes(it.i))

  function onLayoutChange(next: Layout[]) {
    if (!editMode) return // ignore width/mount recalcs in view mode
    const moved = new Map(next.map((n) => [n.i, n]))
    const merged: LayoutItem[] = tileLayout.map((it) => {
      const n = moved.get(it.i)
      return n ? { i: it.i, x: n.x, y: n.y, w: n.w, h: n.h } : it
    })
    update({ tileLayout: merged })
  }

  function removeTile(id: RegionId) {
    update({ enabledTiles: { ...enabled, [id]: false } })
  }

  return (
    <>
      <ResponsiveGrid
        className="tile-grid"
        layout={layout}
        cols={GRID_COLS}
        maxRows={GRID_ROWS}
        rowHeight={rowHeight()}
        margin={[MARGIN, MARGIN]}
        containerPadding={[PADDING, PADDING]}
        compactType={null}
        preventCollision
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={onLayoutChange}
      >
        {visibleIds.map((id) => (
          <TileShell key={id} id={id} editMode={editMode} onRemove={removeTile}>
            {RENDER[id]()}
          </TileShell>
        ))}
      </ResponsiveGrid>
      {editMode && <HiddenTilesTray />}
    </>
  )
}
```

Note: `react-resizable` ships with `react-grid-layout`; if the `react-resizable/css/styles.css` import fails to resolve at build, drop that line (the `.react-resizable-handle` rules in `layout.css` already cover appearance).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/layout/GridLayout.test.tsx`
Expected: PASS (both describe blocks).

- [ ] **Step 5: Run the full suite + typecheck/build**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: succeeds (tsc + vite). If `react-resizable/css/styles.css` errors, remove that import line and rebuild.

- [ ] **Step 6: Commit**

```bash
git add src/layout/GridLayout.tsx src/layout/GridLayout.test.tsx
git commit -m "feat(layout): render tiles via react-grid-layout with edit mode"
```

---

### Task 9: Settings panel — Layout section + shared labels

**Files:**
- Modify: `src/settings/SettingsPanel.tsx`
- Test: `src/settings/SettingsPanel.test.tsx`

**Interfaces:**
- Consumes: `TILE_LABELS`, `DEFAULT_LAYOUT`, `DEFAULT_SETTINGS` from `defaults.ts`; `useAppState` `setEditMode`.
- Produces: a "Layout" section with **Edit layout** (enters edit mode + closes the drawer) and **Reset to default layout**; the Tiles section now iterates all 9 `TILE_LABELS` (so Photo + Forecast appear).

- [ ] **Step 1: Write the failing test**

Append to `src/settings/SettingsPanel.test.tsx` a new block (keep existing tests). First, check the existing imports at the top of that file; ensure these are present (add any missing):

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from './SettingsPanel'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { DEFAULT_LAYOUT } from '../store/defaults'
```

Then add:

```tsx
describe('SettingsPanel — layout controls', () => {
  beforeEach(() => {
    useSettings.getState().reset()
    useAppState.setState({ editMode: false })
  })

  async function openPanel() {
    render(<SettingsPanel />)
    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
  }

  it('lists Photo and Forecast among the tile toggles', async () => {
    await openPanel()
    expect(screen.getByText('Photo')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
  })

  it('Edit layout enters edit mode and closes the drawer', async () => {
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /edit layout/i }))
    expect(useAppState.getState().editMode).toBe(true)
    expect(screen.queryByTestId('settings-overlay')).toBeNull()
  })

  it('Reset to default layout restores the default layout', async () => {
    useSettings.getState().update({ tileLayout: [{ i: 'clock', x: 9, y: 9, w: 1, h: 1 }] })
    await openPanel()
    await userEvent.click(screen.getByRole('button', { name: /reset to default layout/i }))
    expect(useSettings.getState().settings.tileLayout).toEqual(DEFAULT_LAYOUT)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/settings/SettingsPanel.test.tsx`
Expected: FAIL — no "Layout" section / Photo label / edit-layout button.

- [ ] **Step 3: Edit `src/settings/SettingsPanel.tsx`**

(a) Remove the local `TILE_LABELS` constant near the top:

```tsx
const TILE_LABELS: Record<TileId, string> = {
  clock: 'Clock', weather: 'Weather', calendar: 'Calendar',
  sunmoon: 'Sun & Moon', quote: 'Quote', ticker: 'Ticker', air: 'Air quality',
}
```

(b) Update the imports to pull shared labels/defaults and app state. Change the `defaults` import to include `TILE_LABELS`, `DEFAULT_LAYOUT`, `DEFAULT_SETTINGS`:

```tsx
import {
  ACCENT_SWATCHES, TICKER_CURRENCIES, TILE_LABELS, DEFAULT_LAYOUT, DEFAULT_SETTINGS,
  type TileId, type Units, type Performance, type Preview,
} from '../store/defaults'
import { useAppState } from '../store/appState'
```

(c) Inside the `SettingsPanel` component body, near the other store hooks, add:

```tsx
  const setEditMode = useAppState((s) => s.setEditMode)
```

(d) Add a new "Layout" section. Place it directly **above** the existing `<Section title="Tiles">`:

```tsx
            <Section title="Layout">
              <div className="set-col">
                <button
                  className="set-btn block"
                  onClick={() => { setEditMode(true); setOpen(false) }}
                >
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
            </Section>
```

The existing Tiles section already maps `Object.keys(TILE_LABELS)`, so Photo and Forecast appear automatically now that `TILE_LABELS` has 9 entries.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/settings/SettingsPanel.test.tsx`
Expected: PASS (existing + 3 new).

- [ ] **Step 5: Full suite + build**

Run: `npm test`
Expected: PASS.
Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/settings/SettingsPanel.tsx src/settings/SettingsPanel.test.tsx
git commit -m "feat(layout): settings Layout section + shared tile labels"
```

---

### Task 10: Manual verification & cleanup

**Files:** none (verification only)

- [ ] **Step 1: Run dev server and sanity-check**

Run: `npm run dev` and open the app.
Verify:
- Default view looks the same as before (clock top-left, photo right column, ticker footer).
- Settings → Layout → **Edit layout**: drawer closes, cards show dashed outline + × + resize grip, the bottom tray with **Done** appears.
- Drag a card to a new cell — it snaps to the grid and stays put; reload the page — the new position persists.
- Resize a card by its corner — it snaps; persists on reload.
- Click × on a tile — it disappears and a `+ <label>` appears in the tray; click it — the tile returns.
- **Done** exits edit mode; cards are locked (not draggable).
- Settings → Layout → **Reset to default layout** restores the original arrangement and re-enables all tiles.
- Toggle the machine offline (or stub) — net-dependent tiles vanish without leaving × buttons or spinners; offline tiles (clock/calendar/quote) remain.

- [ ] **Step 2: Final full suite + build + lint**

Run: `npm test` → PASS
Run: `npm run build` → succeeds
Run: `npm run lint` → no new errors

- [ ] **Step 3: Commit any cleanup**

```bash
git add -A
git commit -m "chore(layout): rearrangeable cards manual verification pass"
```

(If nothing changed, skip the commit.)

---

## Self-Review Notes

- **Spec coverage:** library/config (Task 4, 8), `tileLayout` data model + default mapping (Task 1), merge-on-load (Task 2), transient `editMode` (Task 3), `TileShell` reusable shell + size-container foundation (Task 5, 7), edit-mode move/resize/remove + reset (Tasks 5, 8, 9), Hidden-tiles tray with re-add and Done (Task 6), offline gate preserved (Task 8 tests), all-9-tiles-uniform incl. independent forecast & photo (Tasks 1, 8, 9), export/import auto-carry (no task needed — `configIO` serializes whole `Settings`). Container-query content conversion is explicitly out of scope (foundation only, Task 7).
- **Type consistency:** `RegionId`/`TileId`/`LayoutItem`/`DEFAULT_LAYOUT`/`TILE_LABELS`/`GRID_COLS`/`GRID_ROWS` defined in Task 1 and consumed unchanged in Tasks 2/5/6/8/9. `editMode`/`setEditMode` defined in Task 3, used in 6/8/9. `removeTile(id: RegionId)` / `onRemove` signatures match across Task 5 and Task 8.
- **jsdom caveat:** RGL geometry is not asserted (no measured width); tests assert tile presence, edit chrome, tray, and offline gating only. `ResizeObserver` stubbed in Task 4.
```
