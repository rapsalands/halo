# Offline location data

The location search in Settings is **fully offline**: it searches bundled
per-country datasets only — there is no network geocoder. Today only the US is
bundled; a query with no local match simply returns no results until another
country is added (see below).

## How it works

- Each country is a compact JSON at `public/places/<cc>.json`, an array of
  `[zip, city, state, lat, lon, population]` rows.
- `public/places/index.json` lists the available countries.
- At runtime (`src/data/places.ts`) the kiosk lazy-loads every listed country
  once, indexes it in memory, and searches it: numeric queries match ZIP
  prefixes, text queries match city names (prefix then substring), ranked by
  population. Many ZIPs of one city collapse to a single result.
- ~34k US rows search in well under a frame, so adding more countries stays
  cheap.

## Adding / refreshing a country

Drop the source CSV in `data/places-src/` and run the build script. The script
distills the CSV and upserts the manifest:

```bash
# US (already wired as `npm run build:places`)
node scripts/build-places.mjs --code US --label "United States" \
     --in data/places-src/us_zipcodes.csv --out public/places

# Another country (GeoNames per-country dumps work well — map their columns
# into a zip,lat,lon,...,city,state,population CSV first):
node scripts/build-places.mjs --code GB --label "United Kingdom" \
     --in data/places-src/gb.csv --out public/places
```

Commit the regenerated `public/places/*.json` and `index.json`.

## Attribution

US data is derived from **SimpleMaps US Zip Codes Database (Basic)**, used under
**CC BY 4.0** — <https://simplemaps.com/data/us-zips>. Per-country additions
sourced from GeoNames are **CC BY 4.0** — <https://www.geonames.org/>.
