# Offline holidays

The calendar shows public holidays **offline-first**: it reads bundled
per-country data and only falls back to the Nager.Date API in the online build.

## How it works

- `public/holidays/<cc>.json` — one file per country, keyed by year:
  `{ "2026": [{ "date": "2026-07-04", "name": "Independence Day" }, ... ], ... }`
- `public/holidays/countries.json` — `[{ code, name }]` for the holiday-country
  dropdown (also offline).
- `public/holidays/index.json` — the list of bundled country codes.
- `src/data/holidays.ts` reads the local file first; if the year/country isn't
  bundled (and `VITE_OFFLINE` isn't set) it falls back to Nager online.

Holiday dates are deterministic facts, so caching a multi-year window is safe.

## Refreshing / extending the window

Re-run the build (needs network once). It pulls the current year forward:

```bash
npm run build:holidays                          # all countries, current year .. +6
node scripts/build-holidays.mjs --years 10      # wider window
node scripts/build-holidays.mjs --countries US,GB,IN   # just a few
```

Commit the regenerated `public/holidays/*.json`.

## Attribution

Data from **Nager.Date** (<https://date.nager.at>, MIT). Holiday dates
themselves are factual and not copyrightable.
