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

## Routing

| Country | Weather | Air quality |
|---|---|---|
| **US** | `nws` (api.weather.gov, no key) | `airnow` (EPA AirNow, `VITE_AIRNOW_KEY`) |
| **India** | `openweather` (fallback — IMD needs IP-whitelisting) | `cpcb` (data.gov.in, `VITE_DATA_GOV_IN_KEY`) |
| **everything else** | `openweather` (`VITE_OPENWEATHER_KEY`) | `openweather` |

## Providers

- **`openweather`** (global default) — `api.openweathermap.org`. Weather via One
  Call 3.0 (`units=metric`; wind m/s→km/h; OWM condition id→WMO via `owmToWmo`);
  AQI via the Air Pollution API (returns PM2.5 → US AQI via `aqi.ts#aqiFromPm25`).
  Free tier is commercial-OK **with attribution** (One Call 3.0 needs a free
  account; ~1000 calls/day).
- **`nws`** (US weather) — free, no key, public domain. Two-step (`/points` →
  forecast + hourly), `units=si` for Celsius, text→WMO (`textToWmo`),
  sunrise/sunset via `sun.ts#sunTimes`. UV/feels-like absent in NWS basic feed
  (UV→0, feels-like→temp).
- **`airnow`** (US AQI) — reports US AQI per pollutant; overall = max, PM2.5
  concentration derived via `aqi.ts#pm25FromAqi`.
- **`cpcb`** (India AQI) — nearest station's PM2.5 from data.gov.in (NDSAP),
  expressed on the US-AQI scale the UI uses.
- **`openMeteo`** — self-hosted Open-Meteo-compatible adapter, available for
  self-hosting (not registered by default; swap it into the selectors to use it).

> Adapters other than `openMeteo`/`nws` are tested against representative sample
> payloads, not live APIs — verify field names against a real key before relying
> on them in production. IMD (India weather) is a future government adapter
> (its API needs IP-whitelisting).
