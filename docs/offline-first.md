# Offline-first & commercial-licensing roadmap

Halo ships an **offline** and an **online** build. Policy: **anything that can be
served from bundled/deterministic data should be**, leaving only genuinely live
data on the network. This is also a **commercial** product, so every dependency
must permit commercial use — free "non-commercial" tiers are off-limits.

## Per-source status

| Source | Live data? | Offline plan | Commercial | Status |
|---|---|---|---|---|
| Location | No | Bundled per-country datasets (US ZIP/city); no network geocoder | SimpleMaps CC BY 4.0 ✅ | **Done — US only.** Add a country by dropping a CSV (places.md) |
| Photos | No | Bundled `public/photos/<scene>/` + manifest | Curated commercial-licensed ✅ | **Pipeline done.** TODO: add real photos |
| Holidays | No (deterministic) | Bundled per-country JSON (year window) + countries list | Open data ✅ | **Done** (see holidays.md) |
| Quotes | No | Already bundled in `src/lib/quotes.ts` | own content ✅ | **Done** |
| "On this day" | No | Bundled `public/onthisday.json` (Wikipedia, **CC BY-SA** — attribute) | CC BY-SA ⚠️ attribute | **Done** |
| Fonts (Google Fonts) | No | Self-host Inter woff2 (latin+latin-ext) | OFL ✅ | **Done** |
| Weather forecast | **Yes** | Point at your self-hosted weather API via `VITE_WEATHER_API_BASE` | self-hosted ✅ | **Done** — configure base URL |
| Air quality | **Yes** | Same, via `VITE_AIR_API_BASE` | self-hosted ✅ | **Done** — configure base URL |
| IP auto-detect (ipapi.co) | — | Online-only convenience; kiosk location is normally set once via the picker | online ⚠️ | Kept as-is |
| Crypto ticker (CoinGecko) | **Yes** | Prices are live; paid/commercial feed, or make tile online-only | needs action ⚠️ | **Decision needed** |

## Live weather + air quality

These are the only *essential* live feeds and can't be bundled. The app no longer
references any public provider: the base URLs come from `VITE_WEATHER_API_BASE`
and `VITE_AIR_API_BASE` (see `.env.example`), so you point them at your own
self-hosted weather server (same `/v1/forecast` and `/v1/air-quality` paths).
Default is same-origin, so a reverse proxy that exposes the API under the kiosk's
origin needs no config.

## Suggested order

1. ~~Self-host fonts~~ ✅
2. ~~Bundle holidays~~ ✅
3. ~~Bundle quotes / "on this day"~~ ✅ (on-this-day text is CC BY-SA — keep attribution)
4. ~~Location offline (US)~~ ✅ — add more countries via CSV when shipping there
5. ~~Weather/AQI base URLs externalized~~ ✅ — set them to your self-hosted server
6. Self-hosted photos — add real images to the pipeline.
7. Decide ticker (paid feed vs online-only tile).

## Attribution to keep

- Location: SimpleMaps / GeoNames (CC BY 4.0)
- Holidays: Nager.Date (MIT); dates are facts
- On this day: Wikipedia (**CC BY-SA** — attribution + share-alike on that text)
- Fonts: Inter (OFL)
- Photos: per-image commercial licenses (see photos.md)

Note: ipapi "Detect my location" is kept as an online-only convenience (the
kiosk's location is normally configured once via the picker).

See also: [places.md](places.md), [photos.md](photos.md).
