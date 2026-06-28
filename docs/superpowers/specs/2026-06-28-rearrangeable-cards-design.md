# Rearrangeable Cards — Design

**Date:** 2026-06-28
**Status:** Approved (pending spec review)
**Repo/base:** `halo`, branch `feat/rearrangeable-cards` off `main` (e5c0bbb)
**Scope:** Let users freely move and resize dashboard tiles in an explicit edit mode, with the layout persisted per screen.

> Reconciled against halo's current `main`, which added offline tile-gating
> (`useOnline` + `NEEDS_NET`), a `timezone` fallback, and an onboarding banner
> after this design was first drafted against an older clone. See
> **Reconciliation with offline gating** below.

---

## Goal

Replace the hardcoded tile placement in `GridLayout.tsx` with a user-editable layout: drag any card anywhere, resize it, remove it, and reset to the curated default. Snapping keeps it tidy; an explicit edit mode keeps the kiosk safe from accidental changes.

## Decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Freedom | Free move **and** resize (not just reorder/swap) |
| Snapping | Snap to the 12-column grid (free feel, clean result, no overlap) |
| Trigger | Explicit **Edit layout** mode; locked otherwise |
| Edit actions | Move, resize, **remove (×)**, re-add from tray, **reset to default** |
| Responsiveness | **One** layout that scales to the viewport (no per-breakpoint layouts) |
| Tile uniformity | **All 9 tiles are equal** — every tile is toggleable, removable, movable, resizable. No special cases for `photo` or `forecast`. |
| Forecast | Fully independent of the weather tile (own toggle) |
| Architecture | A reusable **`TileShell`** owns all edit chrome; tiles stay pure content |

## Library

**`react-grid-layout` v2.2.3** — peer dependency `react >= 16.3.0`, compatible with the project's React 19.2.

Configuration:
- `cols = 12`
- `compactType: null` + `preventCollision: true` → cards stay where dropped, snap to grid, never overlap (the "snappy but free" feel). Also means **offline-hidden tiles leave their gap empty** rather than reflowing — desired for a stable kiosk layout.
- `isDraggable` / `isResizable` bound to edit mode (both `false` in view mode → fully locked).
- `margin` ported from the current `gap` (`0.9rem`), `containerPadding` from the current `padding` (`1.6rem`).
- Width via `WidthProvider`; `rowHeight` computed from viewport height (resize listener) so the grid fills the screen. Fixed vertical resolution of **12 row-units** for predictable snapping.
- `onLayoutChange` persists to `settings.tileLayout` **only while in edit mode** (avoid churn from width/resize recalcs in view mode).

## Data model

New persisted field on `Settings` (`src/store/defaults.ts`):

```ts
type RegionId =
  | 'clock' | 'weather' | 'air' | 'calendar' | 'quote'
  | 'sunmoon' | 'forecast' | 'photo' | 'ticker'

interface LayoutItem { i: RegionId; x: number; y: number; w: number; h: number }

interface Settings {
  // ...existing (incl. timezone, showOnboardingBanner — leave intact)...
  tileLayout: LayoutItem[]
}
```

- `TileId` / `enabledTiles` expands to all 9 ids above (adds `forecast` and `photo`).
- These additions are **purely additive** to halo's current `defaults.ts` — `timezone`, `showOnboardingBanner`, and existing fields are untouched.
- `DEFAULT_SETTINGS.tileLayout` is hand-mapped from the current `PLACEMENT` bento so **first load looks identical to today** (within the uniform-row approximation). Current placement → 12-col / 12-row coordinates:
  - `clock`    `{x:0, y:0, w:7, h:2}`
  - `weather`  `{x:0, y:2, w:4, h:2}`
  - `air`      `{x:4, y:2, w:3, h:2}`
  - `calendar` `{x:0, y:4, w:3, h:4}` (tall)
  - `quote`    `{x:3, y:4, w:4, h:2}`
  - `sunmoon`  `{x:3, y:6, w:4, h:2}`
  - `forecast` `{x:0, y:8, w:7, h:2}`
  - `photo`    `{x:7, y:0, w:5, h:10}` (right column)
  - `ticker`   `{x:0, y:10, w:12, h:2}`
  - (Exact numbers finalized during implementation so the default visually matches; these are the proportional intent.)
- `DEFAULT_SETTINGS.enabledTiles` gets `forecast: true, photo: true`.
- Lives in `Settings`, so it is **automatically persisted to localStorage and carried by the existing config export/import** with no extra work.
- The pre-existing unused `LayoutPreset` (`layout` field) is left untouched — out of scope.
- `src/store/settings.ts` already deep-merges `enabledTiles` against defaults; apply the same merge to `tileLayout` so existing saved screens gain the new field's default rather than booting with an empty layout.

## Reconciliation with offline gating (halo-specific)

Halo's `GridLayout.tsx` hides internet-dependent tiles when offline via `useOnline()` and a `NEEDS_NET` map (`weather, air, sunmoon, forecast, photo, ticker` need net; `clock, calendar, quote` do not). This must be **preserved** alongside the new layout:

- **Visibility rule becomes:** `enabledTiles[id] && (online || !NEEDS_NET[id])`. Both gates apply — user choice AND connectivity.
- `NEEDS_NET` stays as-is and is keyed by the same `RegionId`. `photo` and `forecast` keep their `NEEDS_NET: true` entries.
- The deleted special-cases are only the *structural* ones — the always-on `photo` rule and the `weather→forecast` coupling. The **offline gate is not removed.**
- An offline-hidden tile is still "enabled"; it must **not** appear in the Hidden-tiles tray (the tray reflects user-removed tiles only — `!enabledTiles[id]`). Offline gating and user removal are orthogonal.
- With `compactType: null`, an offline-hidden tile simply leaves its slot empty; the rest of the layout stays put. No reflow churn when connectivity flaps.

## Edit mode

- New **transient** flag `editMode` in `appState` (`src/store/appState.ts`) — never persisted, always boots `false` (view mode).
- Toggled from a new **"Layout"** section in the settings panel:
  - **Edit layout** toggle → on enable, closes the settings drawer so the user can interact with the dashboard.
  - **Reset to default layout** button → restores `DEFAULT_SETTINGS.tileLayout` (and re-enables the default tile set).
- In edit mode each card (via `TileShell`):
  - is draggable and shows RGL's resize grip (themed to the glass aesthetic),
  - shows a dashed accent outline + grip cursor as an affordance,
  - shows a **× remove** button → sets `enabledTiles[id] = false`.
- Removed tiles appear in a **"Hidden tiles" tray** (a small bottom dock visible only in edit mode) with a `+` to re-add. Re-adding restores the tile to its default-layout slot. The tray lists `!enabledTiles[id]` tiles only (never offline-gated ones).

## Reusable card shell — `TileShell`

A single component that owns **all** common card chrome, so behavior changes happen in one place:

- Responsibilities: resize handle, × remove button, edit-mode outline/affordances, drag wiring, and establishing the scaling container (see below).
- Renders the actual tile content as `children` (driven by the existing `RENDER` map in `GridLayout`).
- Tiles (`ClockTile`, `WeatherTile`, …) remain pure content components, unaware of editing or layout.
- `TileFrame` keeps the inner glass styling; `TileShell` is the outer editable wrapper. (Implementation may merge the two if cleaner, but the content/chrome separation is the requirement.)

## Component changes

- **`src/layout/GridLayout.tsx`**: render `WidthProvider(ReactGridLayout)`; delete the `PLACEMENT` map and the *structural* special-case visibility logic (`weather→forecast`, always-on `photo`); **keep** the `useOnline()` + `NEEDS_NET` offline gate. Visibility becomes `enabledTiles[id] && (online || !NEEDS_NET[id])`. Keep the `RENDER` map. Wrap each rendered tile in `TileShell`. Wire `layout={settings.tileLayout}`, `onLayoutChange`, edit-mode props, `rowHeight` from viewport height.
- **`src/tiles/TileShell.tsx`** (new): the reusable shell described above.
- **`src/store/defaults.ts`**: add `tileLayout`, expand `TileId`/`enabledTiles` with `forecast` + `photo`, add their default layout entries. (Additive; leave `timezone`/`showOnboardingBanner` intact.)
- **`src/store/settings.ts`**: deep-merge `tileLayout` on load.
- **`src/store/appState.ts`**: add transient `editMode` + setter.
- **`src/settings/SettingsPanel.tsx`**: new "Layout" section (Edit toggle + Reset); add `forecast` + `photo` to the tile-toggle list labels (`TILE_LABELS`).
- **CSS**: import RGL's base stylesheet; restyle drag/resize handles to match the glass cards (new `src/layout/layout.css` or extend `settings.css`). Port `gap`/`padding` to RGL `margin`/`containerPadding`.

## Responsive content scaling (foundation now, conversion later)

**Known issue, captured deliberately.** Today `global.css` sets `html { font-size: clamp(11px, 1.5vh, 19px) }` and tiles size content in `rem` — so **content scales to the viewport, not to the card**. Resizing a card does not rescale its content (text overflows when small, looks lost when large).

- **Foundation (in scope):** `TileShell` declares `container-type: size`, making each card a containment context immediately. Non-breaking; default sizes unchanged.
- **Conversion (out of scope — separate, per-tile effort):** convert each tile's typography/spacing from viewport-driven `rem` to container units (`cqi` / `cqh` / `cqmin`) so content scales with the card. Done one tile at a time, each independently reviewable. Tracked as a follow-up.
- Until conversion lands, resizing works mechanically; content simply does not rescale proportionally yet. No regression versus today.

## Testing

- **Store:** `DEFAULT_SETTINGS.tileLayout` has an entry for every enabled tile; `tileLayout` deep-merges on load; reset restores defaults; removing a tile flips `enabledTiles`; `editMode` toggles.
- **GridLayout:** renders only enabled tiles; offline gate still hides `NEEDS_NET` tiles when `useOnline()` is false (mock the hook); `forecast` shows independently of `weather`; passes `isDraggable`/`isResizable` per edit mode.
- **TileShell:** renders children; shows × and handles only in edit mode; × calls the remove handler.
- **Risk / caveat:** `react-grid-layout` needs a measured container width, which jsdom does not provide. Grid-geometry tests mock `WidthProvider`/width — they verify our wiring and props, not RGL's internal drag/resize math (covered by the library itself). State note in the test files.
- Update halo's existing `GridLayout.test.tsx` (it asserts `data-col` from the old `PLACEMENT`) and `ClockTile`/related tests as needed.

## Out of scope

- Settings panel redesign (tabbed/wider modal) — separate spec.
- New offline tiles (moon phase, world clocks, countdown, timer, etc.) — separate spec.
- Per-tile responsive-content conversion to container units — separate, per-tile effort (foundation laid here).
- Per-breakpoint layouts — single scaling layout only.
- Offline gating behavior itself (the `NEEDS_NET` policy) — inherited from `main` unchanged.
- Onboarding banner — unrelated overlay, untouched.
