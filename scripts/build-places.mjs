#!/usr/bin/env node
// Distill a country's place CSV into a compact JSON the kiosk lazy-loads for
// offline location search, and upsert it into the places manifest.
//
// Usage:
//   node scripts/build-places.mjs --code US --label "United States" \
//        --in data/places-src/us_zipcodes.csv --out public/places
//
// Compact row written: [zip, city, state, lat, lon, pop, timezone]
//
// --format simplemaps (default): CSV with header zip,lat,lon,timezone,city,state,population
//   node scripts/build-places.mjs --code US --label "United States" --in data/places-src/us_zipcodes.csv
// --format geonames-zip: GeoNames postal TSV (no header, no population)
//   country,postal,place,admin1,code1,admin2,code2,admin3,code3,lat,lon,accuracy
//   node scripts/build-places.mjs --code IN --label India --in data/places-src/in_postal.txt --format geonames-zip
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const code = (arg('code') || '').toUpperCase()
const label = arg('label')
const inPath = arg('in')
const outDir = arg('out', 'public/places')
const format = arg('format', 'simplemaps')
// IANA timezone to use when the source has no per-row timezone (e.g. a
// single-timezone country like India: --tz Asia/Kolkata).
const tzDefault = arg('tz', '')
if (!code || !label || !inPath) {
  console.error('Missing required args: --code, --label, --in (see file header).')
  process.exit(1)
}

const round4 = (n) => Math.round(n * 1e4) / 1e4
const text = readFileSync(inPath, 'utf8')
const lines = text.split(/\r?\n/).filter(Boolean)
const rows = []

if (format === 'geonames-zip') {
  // Tab-separated, no header. GeoNames lists many post-office rows per postal
  // code; one per code is the right granularity for weather, so keep the first
  // row for each unique postal code.
  const seen = new Set()
  for (const line of lines) {
    const f = line.split('\t')
    const zip = f[1], city = f[2], state = f[3]
    const lat = Number(f[9]), lon = Number(f[10])
    if (!zip || !city || Number.isNaN(lat) || Number.isNaN(lon)) continue
    if (seen.has(zip)) continue
    seen.add(zip)
    rows.push([zip, city, state, round4(lat), round4(lon), 0, tzDefault])
  }
} else {
  // SimpleMaps CSV (clean — no quoted fields / embedded commas).
  const header = lines.shift().split(',')
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]))
  for (const required of ['zip', 'lat', 'lon', 'city', 'state', 'population']) {
    if (!(required in col)) { console.error(`CSV missing column: ${required}`); process.exit(1) }
  }
  for (const line of lines) {
    const f = line.split(',')
    const zip = f[col.zip], city = f[col.city], state = f[col.state]
    const lat = Number(f[col.lat]), lon = Number(f[col.lon])
    const pop = Math.round(Number(f[col.population] || 0))
    const tz = ('timezone' in col ? f[col.timezone] : '') || tzDefault
    if (!zip || !city || Number.isNaN(lat) || Number.isNaN(lon)) continue
    rows.push([zip, city, state, round4(lat), round4(lon), pop, tz])
  }
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
const file = `${code.toLowerCase()}.json`
const dataPath = join(outDir, file)
writeFileSync(dataPath, JSON.stringify(rows))

// Upsert the manifest so the loader knows which countries are available.
const manifestPath = join(outDir, 'index.json')
let manifest = []
if (existsSync(manifestPath)) {
  try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) } catch { manifest = [] }
}
manifest = manifest.filter((e) => e.code !== code)
manifest.push({ code, label, file, count: rows.length })
manifest.sort((a, b) => a.label.localeCompare(b.label))
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

console.log(`Wrote ${rows.length} rows -> ${dataPath} (${(JSON.stringify(rows).length / 1e6).toFixed(2)} MB)`)
console.log(`Manifest: ${manifest.map((e) => `${e.code}(${e.count})`).join(', ')}`)
