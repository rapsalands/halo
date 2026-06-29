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

Two input formats are supported via `--format`:

```bash
# SimpleMaps CSV (default) — header: zip,lat,lon,timezone,city,state,population
# US is wired as `npm run build:places`:
node scripts/build-places.mjs --code US --label "United States" \
     --in data/places-src/us_zipcodes.csv --out public/places

# GeoNames postal dump (TSV, no header) — download <country>.zip from
# https://download.geonames.org/export/zip/ and point --in at the .txt.
# Rows are de-duplicated to one per postal code.
node scripts/build-places.mjs --code IN --label India --format geonames-zip \
     --in data/places-src/in_postal_geonames.txt --out public/places
```

`places.ts` loads every country in the manifest and searches them together, so a
numeric query matches any country's postal codes (US ZIP, India PIN, …) and a
text query matches city/place names across all bundled countries.

Commit the regenerated `public/places/*.json` and `index.json`.

Currently bundled: **US** (SimpleMaps ZIP/city) and **India** (GeoNames PIN, one
representative locality per pincode).

## Attribution

US data is derived from **SimpleMaps US Zip Codes Database (Basic)**, used under
**CC BY 4.0** — <https://simplemaps.com/data/us-zips>. Per-country additions
sourced from GeoNames are **CC BY 4.0** — <https://www.geonames.org/>.
