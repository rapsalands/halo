# Weather-Reactive Wall Dashboard — Design

**Date:** 2026-06-05
**Status:** Approved (design), pending implementation plan
**Working name:** TBD (referred to here as "the dashboard")

## Summary

A login-free, database-free **static React app** that runs full-screen in a kiosk
browser on a Raspberry-Pi-class wall panel (RPi / KickPi), always on. Its signature
feature is a **living, weather-reactive background**: the entire scene continuously
adapts to live weather and time of day — rain streaks when it rains, lightning during
storms, drifting clouds when overcast, sun rays when clear, stars and the real moon
phase at night, snow in winter. Frosted **Aurora Glass** tiles (clock, weather,
calendar, etc.) float on top.

All data comes from free, no-login, no-API-key public sources. All configuration lives
in each device's `localStorage` — there is no backend and no shared state between
screens; every screen configures itself.

## Goals

- Beautiful, dynamic, "eye-catchy" — premium DAKboard-class aesthetic.
- Weather-reactive animated background is the centerpiece.
- Pack in as much free, publicly-available information as possible.
- Runs smoothly 24/7 on a Pi-class GPU; never blanks on a failed request.
- Per-screen configurable, no login, no database, fully static deployment.

## Non-Goals (v1)

- No authentication, no accounts, no server-side persistence.
- No cross-device sync (config is per-device; manual export/import only).
- No 3D/WebGL skies in v1 (canvas + CSS only; revisit later).
- No "Bento" layout build-out in v1 beyond making it a future drop-in preset.

## Architecture

Three independent subsystems sharing a single app state (current weather, time,
location, settings). Tiles never communicate with each other.

```
┌─────────────────────────────────────────────┐
│  BackgroundEngine  (full-screen, behind all) │  ← weather sky + particles
│   ┌───────────┐        ┌──────────────────┐  │
│   │ Clock/Date│        │   Weather + fc   │  │  ← Aurora Glass tiles
│   └───────────┘        └──────────────────┘  │     (modular widgets)
│   ┌──────────────┐  ┌──────────┐ ┌────────┐  │
│   │  Calendar    │  │ News     │ │ Sun/   │  │
│   │  + holidays  │  │          │ │ Moon   │  │
│   └──────────────┘  └──────────┘ └────────┘  │
│   ────────── ticker · quote · AQI ─────────  │
└─────────────────────────────────────────────┘
   Layout = swappable preset (Photo-first ▸ Bento)
   Settings panel  →  localStorage  (per device)
```

1. **Background Engine** — full-screen layer that renders the current weather/time scene.
2. **Tile widgets** — self-contained modules, each with its own fetch + cache + fallback.
3. **Config/Layout store** — reads/writes `localStorage`, drives which tiles show, the
   layout preset, location, units, theme, photo mode, and performance level.

### Data flow

- A central **store** (e.g. Zustand or React context) holds: `now` (ticking clock),
  `weather` (current + forecast + codes + isDay), `location`, and `settings`.
- A **data layer** fetches each source on its own cadence and writes results into the
  store; everything is cached to `localStorage` with a timestamp.
- The **Background Engine** derives its scene purely from `weather` + `now`.
- **Tiles** read only the slice of store they need; they re-render on store changes.

## The Weather Background Engine

Maps Open-Meteo's WMO weather code + day/night flag + clock to a **scene**:

| Scene | Trigger | Visual treatment |
|---|---|---|
| Clear day | clear/mostly-clear, isDay | time-driven sky gradient, sun, soft light rays, a drifting cloud |
| Clear night | clear/mostly-clear, night | deep gradient, twinkling stars, **moon at real phase**, rare shooting star |
| Cloudy / overcast | partly cloudy → overcast | layered parallax clouds drifting |
| Fog | fog codes | soft rolling fog layers |
| Rain | drizzle/rain/showers | canvas rain streaks + droplets on glass, darkened sky |
| Thunderstorm | thunderstorm codes | rain + lightning flashes + heavy clouds |
| Snow | snow/snow-grains/showers | falling snowflakes, soft glow |
| Dawn / dusk | sun position near sunrise/sunset | gradient warms/cools with the real sun |

- **Composition:** CSS gradient sky (driven by time of day) + one `<canvas>` particle
  layer (rain/snow/stars) + a few CSS/SVG elements (sun, moon, cloud sprites).
- **Accent color** of the Aurora Glass tiles shifts with the scene (warm at sunset,
  cool blue when raining) so tiles feel embedded in the world.
- **Performance setting (Low / High)** scales particle counts and disables expensive
  blur on Low so a base Pi stays smooth; KickPi can run High.
- **Photo mode:** rotating photos become the backdrop; subtle weather particles still
  drift on top for cohesion.

## Tiles & Free Data Sources

Each tile is an independent module with its own fetch cadence, `localStorage` cache,
and **last-known-good fallback** so a failed request never blanks the wall.

| Tile | Source | Cadence | Notes |
|---|---|---|---|
| Clock + date | local | 1 s | anchor element |
| Weather + 7-day forecast | **Open-Meteo** | ~10–15 min | no key, CORS-friendly |
| Calendar + holidays | **Nager.Date / OpenHolidays** | daily | no key |
| Sun/moon, UV, air quality | **Open-Meteo** (forecast + air-quality) | ~15–30 min | sunrise/sunset, moon phase, UV, AQI |
| Photo gallery | **Picsum** (+ optional curated Unsplash URL list) | rotate every few min | keyless by default |
| Quote / On this day | free no-key APIs | daily | |
| Markets ticker | **CoinGecko** (crypto) | ~5–10 min | CORS-friendly; keyless stocks are limited |
| News headlines | RSS via free RSS-to-JSON service | ~30 min | see caveat |

### Known constraints / honesty flags

- **News (CORS):** Raw RSS feeds typically block browser fetches. To stay backend-free,
  v1 uses a free, no-login RSS-to-JSON service and accepts its rate limits. If that
  proves too flaky, News is the single tile that may later warrant a tiny fetch helper
  running on the Pi. Acceptable trade-off for v1.
- **Location:** First run auto-detects via free IP geolocation; the user can then search
  any city (Open-Meteo geocoding, no key) and the choice is saved to `localStorage`.
- **Stocks:** Reliable keyless stock data is scarce; v1 ticker is crypto-first, with
  stocks best-effort/optional.

## Configuration, Layout & Settings

- **Settings panel** — hidden gear icon (revealed on tap/hover), opens an overlay to:
  toggle each tile, pick layout preset (Photo-first / Bento), set location, units
  (°C/°F, 12/24h, wind units), holiday country, theme/accent, background mode
  (Weather sky / Photo), and performance (Low / High). All persisted to `localStorage`.
- **Config portability** — an export/import button (and/or `?config=` URL param) copies
  a configuration between screens without any server.
- **Layout presets** — arrangement configs over the same tile set. "Photo-first" ships
  as default; "Bento" is a future drop-in preset (data, not a rewrite). Tiles are
  position-agnostic and read their slot from the active preset.

## Tech Stack

- **React + Vite** — modular tiles and settings.
- **Framer Motion** — tile entrance/transition polish.
- **Canvas + CSS** — weather particle effects (no WebGL in v1).
- **Store** — Zustand (or React context) for shared app state.
- Builds to **plain static files** → host free on GitHub Pages / Netlify, or serve
  locally on the Pi; the kiosk just opens the URL.

## Resilience for 24/7 Kiosk Operation

- Every fetch cached with timestamp + **last-known-good fallback** rendered on failure.
- Visible "stale" indicator when displayed data is older than a threshold.
- **Nightly auto-reload** of the page to avoid memory creep in a long-running browser.
- Animations honor the performance setting; Low mode caps particles and drops blur.
- Graceful degradation: a tile that can't load shows a quiet placeholder, never a crash.

## Open Questions / Future

- Working name for the product.
- Bento layout preset build-out.
- Optional WebGL "ultra" background mode for capable devices.
- Optional Pi-side micro-helper for News if the RSS-to-JSON route is too limited.
