#!/usr/bin/env node
// Distill a country's place CSV into a compact JSON the kiosk lazy-loads for
// offline location search, and upsert it into the places manifest.
//
// Usage:
//   node scripts/build-places.mjs --code US --label "United States" \
//        --in data/places-src/us_zipcodes.csv --out public/places
//
// US CSV columns (header): zip,lat,lon,timezone,city,state,population
// Compact row written:     [zip, city, state, lat, lon, pop]
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
if (!code || !label || !inPath) {
  console.error('Missing required args: --code, --label, --in (see file header).')
  process.exit(1)
}

// The source CSV is clean (no quoted fields / embedded commas), so a plain
// split is safe here. Guard anyway by skipping malformed rows.
const text = readFileSync(inPath, 'utf8')
const lines = text.split(/\r?\n/).filter(Boolean)
const header = lines.shift().split(',')
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]))
for (const required of ['zip', 'lat', 'lon', 'city', 'state', 'population']) {
  if (!(required in col)) { console.error(`CSV missing column: ${required}`); process.exit(1) }
}

const round4 = (n) => Math.round(n * 1e4) / 1e4
const rows = []
for (const line of lines) {
  const f = line.split(',')
  const zip = f[col.zip]
  const city = f[col.city]
  const state = f[col.state]
  const lat = Number(f[col.lat])
  const lon = Number(f[col.lon])
  const pop = Math.round(Number(f[col.population] || 0))
  if (!zip || !city || Number.isNaN(lat) || Number.isNaN(lon)) continue
  rows.push([zip, city, state, round4(lat), round4(lon), pop])
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
