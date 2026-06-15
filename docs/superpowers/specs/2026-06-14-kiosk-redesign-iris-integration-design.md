# Halo Kiosk — Redesign & iris Slideshow Integration

**Date:** 2026-06-14
**Status:** Approved for planning

## Problem

The current kiosk uses an absolute-positioned, sparse "bento" layout. It reads as empty: small islands of content with a large void in the middle, and clear/sunny weather washes the entire screen bright. The owner wants:

1. A **filled, aligned, balanced** composition (the warm, atmospheric "Claude Design" look they liked, not a sparse grid).
2. Clear/sunny days to feel like a **soft mood**, not a full-bright wash — mood carried in the widgets and a localized sky, with the lively procedural sky retained.
3. **Full-screen** rain / thunder / snow effects (overlays over everything).
4. Their separate **iris** photo-slideshow project given real space on the screen — **without maintaining the slideshow logic in two places**.

## Goals

- Replace the sparse absolute-positioned layout with a single **aligned 12-column grid** that fills the screen.
- Adopt **frosted-glass** widgets (quiet background, flat — no emboss — generously padded) that tint subtly to the weather/time mood.
- Keep the **procedural weather sky** as the backdrop, toned down for clear conditions.
- Keep rain / thunder / snow as **full-screen overlays** above the grid and photo.
- Integrate the iris slideshow as a native React panel via a **shared, published `iris-core` package** (single source of truth), with all photo settings unified into the kiosk's existing settings panel (no iframe, no second settings UI).

## Non-Goals

- Mobile/portrait responsive design. Target is a landscape kiosk (~16:9); only minimal graceful degradation.
- Reworking weather/AQI/markets/holidays/quotes data sources.
- Keeping the old `photo-first` / `bento` layout presets or the standalone `PhotoBackdrop` (both are superseded — see below).
- New weather data or new tiles beyond what exists today.

---

## Part 1 — Visual Redesign (weather repo)

### 1.1 Layout: aligned 12-column grid

Replace the absolute-positioned slot system (`src/layout/presets.ts` + `LayoutRenderer.tsx`) with a **CSS Grid** layout component. One layout, near full-bleed (outer padding ~24px), tight gaps (~16px) so the backdrop shows only through the seams.

Grid: `grid-template-columns: repeat(12, 1fr)`, rows sized by content band.

Placement (columns are 1-indexed, end-exclusive):

| Region | Columns | Row band |
|---|---|---|
| Clock hero (time, greeting, date, place) | 1–8 | 1 (tall) |
| Weather now | 1–5 | 2 |
| Air quality | 5–8 | 2 |
| Calendar | 1–3 | 3 |
| Quote / on-this-day | 3–6 | 3 |
| Sun / Moon | 6–8 | 3 |
| 7-day outlook | 1–8 | 4 |
| **iris photo panel** | 8–13 | 1–4 (full content height, above ticker) |
| Markets ticker | 1–13 | 5 (bottom, full width) |

Everything in the left column shares the same left/right edges (cols 1–8) — fixing the earlier "7-day spills past the clock" misalignment. The photo panel (cols 8–13 ≈ 40% width) is a tall feature down the right, balancing the large serif clock hero on the left. The ticker spans the full width beneath both.

Row heights (approx, tunable): clock `1.5fr`, weather/AQ `1fr`, cards `1.1fr`, 7-day `0.85fr`, ticker `auto`.

**Files:** new `src/layout/GridLayout.tsx` (replaces `LayoutRenderer.tsx`); retire `presets.ts` slot maps. Tiles render into named grid areas. The existing per-tile components (`ClockTile`, `WeatherTile`, `CalendarTile`, `SunMoonTile`, `QuoteTile`, `TickerTile`, `AirQualityTile`) are reused; only their wrapper/placement changes.

### 1.2 Frosted glass widgets

Update `TileFrame.tsx` + `src/styles/theme.css`:

- **Frosted, quiet:** `background: rgba(24, 28, 42, 0.34)`, `backdrop-filter: blur(16px) saturate(120%)`. Backdrop reduced to a soft color wash behind the glass (the "B" option from review).
- **Flat — no emboss:** remove the inset top highlight / bevel sheen. Keep a hairline border `1px solid rgba(255,255,255,0.18)` and a soft drop shadow `0 8px 30px rgba(0,0,0,0.22)` (drop shadow only, not an inset emboss).
- **More padding:** inner padding ~18–22px; `border-radius: 18px`.
- **Mood tint:** an optional low-opacity gradient overlay per card, keyed to the active scene/day-part accent (reuse `ACCENTS` from `scene.ts`), so clear days glow gently and nights cool down — without a bright full-screen wash.
- **Low-perf fallback:** keep the existing `.perf-low` path (drop `backdrop-filter`, raise fill opacity).

The **iris photo panel is opaque** — a solid image surface, not frosted glass: same `border-radius` and hairline border, no blur, `object-fit: cover`.

### 1.3 Backdrop: toned procedural sky

Keep the layered procedural background (`BackgroundEngine` → `SkyGradient`, `AuroraGlow`, `Celestial`, `Clouds`). Adjust for the "soft mood, not bright wash" requirement:

- In `scene.ts`, **desaturate/darken the `clear-day` palette** so the backdrop is a gentle gradient rather than a bright blue wash. Concentrate brightness as a **localized sun/horizon glow** near the weather corner (top-right) instead of flooding the whole canvas.
- Other scenes (cloudy, fog, night, etc.) retain their palettes; verify they read well behind frosted glass.

### 1.4 Full-screen weather effects

Today particles (`ParticleCanvas`) and `Lightning` render inside the background layer (low z-index). Move them to a **dedicated full-screen overlay above the grid** (z-index above tiles, below the settings panel) so rain / thunder / snow visibly fall over the cards *and* the photo panel.

- New `src/background/WeatherEffectsOverlay.tsx` (or re-parent existing components): full-viewport, `pointer-events: none`, renders `ParticleCanvas` (rain/snow/stars) and `Lightning` for the active scene.
- Stars (clear-night) and gentle effects can stay subtle; rain/thunder/snow are the prominent full-screen ones.

---

## Part 2 — iris Integration

### 2.1 Extract `iris-core` (shared, published package)

iris's slideshow logic is already cleanly separated (`Slideshow`, `SlideshowEngine`, `Renderer`, resolvers, config codec/schema) with no coupling to its page beyond the app entry. Extract these into a standalone published package — the **single source of truth** for both apps.

- **Package:** `iris-core` (scoped, e.g. `@<scope>/iris-core`), published to the **public npm registry** (installs in GitHub Pages CI with no auth; GitHub Packages is the alternative if private publishing is preferred — would require a CI token).
- **Contents:** `slideshow/*` (slideshow, engine, renderer), `resolvers/*` (generic, gdrive, picsum, registry), `config/*` (schema, codec). **Excluded:** the iris app shell (`app/main.ts`, `app/iris.ts`), its settings UI, and DOM-id wiring.
- **Public API:** the `Slideshow` class (constructed with a stage `HTMLElement` + `IrisConfig`), `loadPlaylist`, the resolver registry, and the config `schema` + `codec`.
- **Versioning:** semver; a bug fix = patch publish, then bump the dependency in both consumers.

### 2.2 Refactor iris to consume `iris-core`

The iris repo keeps its app shell and settings page but imports the slideshow logic from `iris-core` instead of local `src/slideshow/*`. This guarantees both apps run the *same* code, so a fix lands once.

### 2.3 `<PhotoSlideshow>` React wrapper (weather repo)

A thin React component renders the slideshow into the photo panel — **no iframe**:

- Holds a `ref` to a stage `<div>` filling the panel.
- On mount, constructs `iris-core`'s `Slideshow(stageEl, config)` from settings-derived `IrisConfig`; starts playback.
- On config change, updates/recreates the slideshow; on unmount, tears down timers and DOM cleanly.
- iris-core handles its own listing cache (localStorage) and periodic re-list — independent of the kiosk's weather polling.
- Errors are contained: on a failed source, fall back to iris-core's picsum/demo resolver or a calm placeholder; the dashboard never breaks because of the photo panel.

Supersedes the existing `PhotoBackdrop` (Picsum) component, which is removed.

### 2.4 Unified settings (no second settings UI)

Because it's a native component, the panel has **no embedded gear**. All photo controls become a **"Photos" section in the kiosk's existing `SettingsPanel.tsx`**, persisted in the Zustand `settings` store and mapped to an `IrisConfig`:

- **Source:** Google Drive folder link, or comma-separated image URLs (reuses iris resolvers); picsum demo fallback.
- **Dwell** (seconds), **transition** (fade / cut), **fit** (cover / contain), **shuffle** (on/off), **re-list interval** (minutes), optional **caption**.
- If a Drive source is used, a **Google API key** is required (build-time env var / config); documented as a setup step. Repo-committed image URLs need no key.

---

## Data Flow

```
kiosk settings (Zustand)
   ├─ weather/location/units/tiles ─→ existing tiles + BackgroundEngine + WeatherEffectsOverlay
   └─ photo settings ─→ derive IrisConfig ─→ <PhotoSlideshow> ─→ iris-core Slideshow
                                                                    └─ resolvers + listing cache (localStorage)
```

The photo panel is self-contained: its data lifecycle (listing, caching, re-list timer) is owned by iris-core and runs independently of weather data fetches.

## Error Handling

- **Photo source failure:** iris-core falls back (picsum/demo) or the panel shows a calm placeholder; rest of the dashboard is unaffected.
- **Backdrop/effects:** unchanged by photo errors; existing stale-badge behavior for weather data is retained.
- **Low performance:** `.perf-low` path drops `backdrop-filter`; effects particle counts already scale with the performance setting.

## Testing

- **`iris-core`:** keep its existing Vitest suite; it now ships with the package.
- **`<PhotoSlideshow>` wrapper:** RTL + jsdom — mounts, passes config, recreates on config change, and tears down timers/DOM on unmount without leaks.
- **GridLayout:** renders each region into the expected grid area; left-column regions share edges (alignment regression guard).
- **Effects overlay:** renders above tiles/photo for rain/thunder/snow; absent for clear-day.
- **Manual (kiosk):** clear day reads as soft mood (not bright wash); frosted text legible; photo panel opaque; rain/snow/thunder cover the full screen including the photo; settings drive the slideshow.

## Suggested Implementation Phases

1. **`iris-core` extraction + publish**, and refactor the iris app to consume it (single source of truth established first).
2. **Grid layout + frosted glass + backdrop toning + full-screen effects** in the weather app (pure visual; can proceed in parallel with 1).
3. **`<PhotoSlideshow>` wrapper + unified photo settings**, consuming the published `iris-core` (depends on 1 and 2).

## Key Files

**weather repo**
- `src/layout/GridLayout.tsx` (new) — replaces `LayoutRenderer.tsx`; retire `presets.ts` slot maps.
- `src/tiles/TileFrame.tsx`, `src/styles/theme.css` — frosted/flat glass + mood tint.
- `src/background/scene.ts` — tone clear-day palette + localized glow.
- `src/background/WeatherEffectsOverlay.tsx` (new/re-parented) — full-screen effects.
- `src/tiles/PhotoSlideshow.tsx` (new) — iris-core React wrapper; removes `PhotoBackdrop`.
- `src/settings/SettingsPanel.tsx`, `src/store/settings.ts` — "Photos" settings section + IrisConfig mapping.

**iris repo**
- New `iris-core` package extracted from `src/slideshow/*`, `src/resolvers/*`, `src/config/*`; app shell refactored to import it.
