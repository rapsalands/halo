# Weather & air-quality providers

Live feeds use a **viewmodel + adapter** design so we can pull from different
sources (including different sources per country) without the UI knowing:

```
location (carries countryCode)
   → selector picks a provider by country (else the global default)
   → provider adapter: fetch raw API → transform → our viewmodel
   → store → components   (provider-agnostic)
```

## The pieces

- **Viewmodels** (the single internal contract): `Weather` (`src/store/appState.ts`)
  and `AirQuality` (`src/data/providers/types.ts`). Components only ever see these.
- **Provider interfaces**: `WeatherProvider` / `AirQualityProvider` in
  `src/data/providers/types.ts` — each has an `id` and a `fetch…` that returns a
  viewmodel.
- **Adapters**: one file per source under `src/data/providers/`. The default is
  `openMeteo.ts` (Open-Meteo-compatible, self-hosted via `VITE_WEATHER_API_BASE`
  / `VITE_AIR_API_BASE`).
- **Selectors**: `src/data/weather.ts` and `src/data/airQuality.ts` map a
  location's `countryCode` to a provider (`WEATHER_BY_COUNTRY` / `AIR_BY_COUNTRY`),
  falling back to the global default. The app calls `fetchWeather(loc)` /
  `fetchAirQuality(loc)` exactly as before.

`countryCode` rides along on the picked/`GeoLocation` (set by the place picker and
IP detect), so routing needs no extra lookup.

## Adding a provider

1. Create `src/data/providers/<name>.ts` exporting a `WeatherProvider` and/or
   `AirQualityProvider`. Inside, fetch the source's API and map its fields onto
   the viewmodel (`Weather` / `AirQuality`). Keep all source-specific quirks here.
2. Register it for the countries it serves in `weather.ts` / `airQuality.ts`
   (e.g. `US: nwsWeather`).
3. Add a small adapter test that feeds a sample raw payload and asserts the
   viewmodel mapping.

Planned providers (commercial-OK, free): **NWS** (US weather, no key) + **EPA
AirNow** (US AQI); **IMD** (India weather) + **CPCB/data.gov.in** (India AQI);
**OpenWeather** as a global fallback (weather + Air Pollution, all countries).
See [offline-first.md](offline-first.md).
