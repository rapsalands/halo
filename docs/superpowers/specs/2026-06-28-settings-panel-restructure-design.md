# Settings Panel Restructure — Design

**Date:** 2026-06-28
**Status:** Approved (design) — pending implementation plan

## Problem

The current Settings panel (`src/settings/SettingsPanel.tsx`) is a 392px right-side
drawer with **10 sections stacked in one long scroll**: Layout, Appearance, Live
scene, Clock & units, Overnight dimming, Kiosk, Markets ticker, Location, Tiles,
Backup.

On the touch kiosk this is painful:

- **Too narrow** — 392px cramps every control.
- **Too many settings, hard to find** — 10 sections, no grouping or navigation.
- **Lots of scrolling** — everything is one vertical column.

## Goals

- Wider, touch-friendly panel with large tap targets.
- Grouped, navigable categories so each view is short and scannable.
- Minimal scrolling — each category fits (or nearly fits) without scrolling.
- Preserve **live feedback**: most settings (accent, scene, tiles, dimming) have
  an immediate visual effect, so the bulk of the canvas must stay visible while
  the panel is open.
- Nothing is deleted; rarely-used settings are demoted to an **Advanced** tab.

## Non-Goals

- No change to *what* any setting does or to the underlying `Settings` shape in
  `src/store/defaults.ts`. This is a pure reorganization of the UI.
- No change to the tile system, grid layout, or edit-mode behavior.
- No new settings.

## Form Factor

- **Left slide-in drawer**, ~640px wide, full height, over a dimmed scrim.
  - Slides from the **left** (changed from the current right) so the right
    ~1280px of a 1920px kiosk stays live for visual feedback while tapping.
  - Cap width ~640px so the live canvas stays generous.
- **Gear trigger stays top-right** (unchanged). Trigger and drawer on opposite
  sides is intentional: top-left would collide with the clock/greeting tile, and
  keeping the gear right keeps the tapping hand off the live-preview area.
- Header: "Settings" title + close ×.
- **Horizontal tab row** under the header (NOT a side rail — a side rail would
  eat ~150px of the scarce 640px width). 6 tabs across ~640px ≈ ~105px each, a
  comfortable touch target. Icon + short label per tab.
- Below the tabs: a **content pane** showing only the active category. Each
  category page is short enough to avoid scrolling on the kiosk; the pane may
  still scroll as a fallback on small viewports.

## Categories

Six tabs replace the ten stacked sections. Mapping from old → new:

| Tab | Icon | Contains | From old section(s) |
|-----|------|----------|---------------------|
| **Display** | ◐ | Accent color, Performance (Hi/Lo), Companion toggle | Appearance |
| **Clock** | 🕐 | Units (°C/°F), 12-hour clock, Show seconds, Greeting name | Clock & units |
| **Location** | 📍 | City search, Use auto-detected, Holiday country (ISO-2) | Location |
| **Tiles** | ▦ | 9 tile on/off toggles, Edit layout, Reset to default layout, Onboarding banner toggle | Tiles + Layout + Kiosk |
| **Ticker** | 📈 | Coins (CoinGecko ids), Currency | Markets ticker |
| **Advanced** | ⚙ | Live scene chips, Overnight dimming (auto-dim + from/to), Backup (export/import) | Live scene + Overnight dimming + Backup |

### Rationale for placements

- **Live scene → Advanced.** It forces a fake weather scene; on a kiosk you
  almost always want "Live". Out of the everyday flow.
- **Overnight dimming → Advanced.** Set once, rarely touched.
- **Backup → Advanced.** Export/import config; post-setup only.
- **Layout buttons → Tiles.** "Edit layout" and "Reset to default layout" belong
  with the tile on/off toggles ("everything about what's shown and where").
- **Onboarding banner → Tiles.** It's a show/hide toggle for a UI element, same
  family as the tile visibility switches.
- **Ticker stays its own tab.** Folding its 2 controls into Tiles would overload
  that page (9 toggles + 2 layout buttons + ticker config + banner), working
  against the short-page goal. A thin dedicated tab keeps every page light.

## Component Structure

Refactor `SettingsPanel.tsx` so the panel owns tab state and renders one of six
category components. Keep the existing small primitives (`Segmented`, `Toggle`,
`Section`) and reuse them.

- `SettingsPanel` — owns `open` state, active-tab state, scrim + drawer chrome,
  header, the tab row, and renders the active category.
- One component per category (`DisplayTab`, `ClockTab`, `LocationTab`,
  `TilesTab`, `TickerTab`, `AdvancedTab`), each receiving `settings` + `update`
  (and the few local pieces of state they need, e.g. city/coins/import text).
  - Local input state currently held in `SettingsPanel` (`city`, `coinsText`,
    `importText`) moves into the owning category component.
  - `searchCity`, `commitCoins`, and the import/export handlers move with their
    category.
- The `Section` heading style is retained for sub-grouping *within* a tab where
  useful (e.g. Advanced has three distinct blocks), but tabs replace the old
  one-section-per-topic stacking.

### Files touched

- `src/settings/SettingsPanel.tsx` — restructure into tabs + category components.
  May split category components into a `src/settings/tabs/` folder if the single
  file grows too large; otherwise keep co-located.
- `src/settings/settings.css` — new drawer side/width, tab row styles; keep the
  existing control styles (`.seg`, `.switch`, `.set-input`, `.set-btn`,
  swatches, scene chips). Drawer animation flips from translateX(+) to (−) for
  the left side.
- `src/settings/SettingsPanel.test.tsx` — update for the new structure; tabs are
  now the navigation. Existing assertions that a control is visible must first
  select the owning tab.

## Data Flow

Unchanged. Every control still reads from `useSettings((s) => s.settings)` and
writes via `update(patch)`. No store changes. Tab state is local UI state in
`SettingsPanel` and is **not** persisted (panel always opens to the first tab,
Display).

## Accessibility

- Tab row uses `role="tablist"` / `role="tab"` / `role="tabpanel"` with
  `aria-selected` and arrow-key navigation between tabs.
- Each tab is a real button with an accessible name (icon is decorative; label
  is the accessible text).
- Existing control labels/`aria` (units group, swatches, toggles) are preserved.

## Testing

- **Tab navigation:** clicking each tab shows that category's controls and hides
  the others. Default open state shows Display.
- **Controls still work:** a representative control in each tab still calls
  `update` with the right patch (e.g. accent swatch, units, a tile toggle,
  ticker currency, import config). Reuse/adapt existing assertions, wrapped in a
  "select the tab first" step.
- **Drawer open/close:** gear opens it, × and scrim-click close it (existing
  behavior, retained).
- **Keyboard:** arrow keys move between tabs; controls remain reachable.

## Open Questions

None blocking. Possible future iteration: if categories grow past ~7, revisit
top-tabs vs. a rail.
