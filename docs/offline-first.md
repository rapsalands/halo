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
| Holidays | No (deterministic) | Bundle/precompute per country+year; drop Nager call | Open data ✅ | TODO |
| Quotes / "on this day" | No | Bundle a curated dataset; drop Wikipedia call | CC content ✅ | TODO |
| Fonts (Google Fonts) | No | Self-host woff2 locally | OFL ✅ | TODO |
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

1. Self-host fonts (quick, removes a Google dependency).
2. Drop ipapi auto-detect (location is configured via the picker now).
3. Bundle holidays + quotes (deterministic, removes two API calls).
4. Add GeoNames global location tier; drop the Open-Meteo geocoder.
5. Decide weather/AQI hosting (self-host Open-Meteo vs paid key).
6. Decide ticker (paid feed vs online-only tile).

See also: [places.md](places.md), [photos.md](photos.md).
