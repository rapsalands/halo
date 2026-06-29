# Offline-first & commercial-licensing roadmap

Halo ships an **offline** and an **online** build. Policy: **anything that can be
served from bundled/deterministic data should be**, leaving only genuinely live
data on the network. This is also a **commercial** product, so every dependency
must permit commercial use — free "non-commercial" tiers are off-limits.

## Per-source status

| Source | Live data? | Offline plan | Commercial | Status |
|---|---|---|---|---|
| Location (geocoding) | No | Bundled per-country datasets; GeoNames global tier | SimpleMaps/GeoNames CC BY 4.0 ✅ | **US done.** TODO: add global tier, drop Open-Meteo geocoder |
| Photos | No | Bundled `public/photos/<scene>/` + manifest | Curated commercial-licensed ✅ | **Pipeline done.** TODO: add real photos |
| Holidays | No (deterministic) | Bundled per-country JSON (year window) + countries list; Nager fallback online | Open data ✅ | **Done** (see holidays.md) |
| Quotes | No | Already bundled in `src/lib/quotes.ts` | own content ✅ | **Done** |
| "On this day" | No | Bundled `public/onthisday.json` (Wikipedia, **CC BY-SA** — attribute); Wikipedia fallback online | CC BY-SA ⚠️ attribute | **Done** |
| Fonts (Google Fonts) | No | Self-host Inter woff2 (latin+latin-ext) | OFL ✅ | **Done** |
| IP auto-detect (ipapi.co) | — | Kiosk location is fixed → set once via picker, drop ipapi | n/a | TODO |
| Weather forecast | **Yes** | Can't bundle. Self-host Open-Meteo (AGPL) or paid key | needs action ⚠️ | **Decision needed** |
| Air quality | **Yes** | Same as weather (Open-Meteo) | needs action ⚠️ | **Decision needed** |
| Crypto ticker (CoinGecko) | **Yes** | Prices are live; paid/commercial feed, or make tile online-only | needs action ⚠️ | **Decision needed** |

## The big rock: weather + air quality

These are the only *essential* live feeds. The commercial-clean, dependency-free
answer is to **self-host Open-Meteo** (open-source, AGPL) on your own
server/LAN; kiosks hit that instead of `api.open-meteo.com`. That fixes both the
licensing and the third-party-dependency concerns in one move. Alternative: buy
Open-Meteo's commercial API key.

## Suggested order

1. ~~Self-host fonts~~ ✅
2. ~~Bundle holidays~~ ✅
3. ~~Bundle quotes / "on this day"~~ ✅ (on-this-day text is CC BY-SA — keep attribution)
4. Add GeoNames global location tier; drop the Open-Meteo geocoder.
5. Self-hosted photos — add real images to the pipeline.
6. Decide weather/AQI hosting (self-host Open-Meteo vs paid key).
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
