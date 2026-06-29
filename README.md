# Halo

A beautiful, login-free, database-free **weather-reactive wall dashboard** for an always-on kiosk panel (Raspberry Pi / KickPi). The entire background adapts to live weather and time of day — rain streaks when it rains, lightning in storms, drifting clouds, sun rays, twinkling stars and the real moon phase at night, snow in winter — with frosted **Aurora Glass** tiles floating on top.

All data comes from free, no-key, public APIs. All configuration lives in each device's `localStorage` — no accounts, no server.

## Features

- **Weather-reactive animated background** (canvas + CSS particles, performance Low/High)
- **Tiles:** clock + date, weather + 7-day forecast, calendar + public holidays, sun/moon + UV + air quality, daily quote + on-this-day, crypto ticker
- **Photo background mode** (rotating Picsum photos with weather particles on top)
- **Per-screen settings panel** — tiles, layout, location, units, holiday country, performance
- **Config portability** — export/import or `?config=` URL between screens
- **24/7 resilience** — last-known-good caching, offline indicator, nightly auto-reload

## Data sources

Offline-first: location (bundled US ZIP/city data), holidays, "on this day", and
quotes are bundled and served locally; fonts and photos are self-hosted. Live
feeds — weather + air quality — come from your own self-hosted weather API
(configure `VITE_WEATHER_API_BASE` / `VITE_AIR_API_BASE`; see `.env.example`).
The crypto ticker uses CoinGecko and first-run geolocation uses ipapi.co. See
[docs/offline-first.md](docs/offline-first.md).

## Develop

```
npm install
npm run dev        # http://localhost:5173
npm test           # vitest
npm run build      # static dist/
npm run lint
```

## Deploy

See [DEPLOY.md](./DEPLOY.md). The design and implementation plans live in `docs/superpowers/`.
