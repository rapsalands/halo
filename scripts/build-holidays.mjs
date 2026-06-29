#!/usr/bin/env node
// Pre-fetch public holidays from Nager.Date into bundled per-country JSON so the
// calendar works offline. Holiday dates are deterministic facts; we cache a
// window of years and refresh by re-running this.
//
//   npm run build:holidays            # all countries, current year .. +6
//   node scripts/build-holidays.mjs --years 8 --countries US,GB,IN
//
// Output: public/holidays/<cc>.json = { "<year>": [{date,name}], ... }
//         public/holidays/index.json = ["US","GB",...]
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

function arg(name, fb) { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fb }

const API = 'https://date.nager.at/api/v3'
const span = Number(arg('years', '7'))
const startYear = new Date().getFullYear()
const years = Array.from({ length: span }, (_, i) => startYear + i)
const outDir = 'public/holidays'

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

// Small concurrency limiter so we don't hammer the API.
async function pool(items, size, fn) {
  const out = []
  let i = 0
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const n = i++; out[n] = await fn(items[n], n) }
  }))
  return out
}

const countriesArg = arg('countries')
let countries
if (countriesArg) {
  countries = countriesArg.split(',').map((c) => ({ countryCode: c.toUpperCase().trim() }))
} else {
  countries = await getJson(`${API}/AvailableCountries`)
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// Bundle the code+name list too so the holiday-country dropdown works offline.
if (!countriesArg) {
  const list = countries
    .map((c) => ({ code: c.countryCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  writeFileSync(join(outDir, 'countries.json'), JSON.stringify(list))
}

const available = []

await pool(countries, 8, async (c) => {
  const cc = c.countryCode
  const byYear = {}
  let any = false
  for (const y of years) {
    try {
      const raw = await getJson(`${API}/PublicHolidays/${y}/${cc}`)
      byYear[y] = raw.map((h) => ({ date: h.date, name: h.localName ?? h.name }))
      any = true
    } catch { /* a missing year is fine; skip it */ }
  }
  if (any) {
    writeFileSync(join(outDir, `${cc.toLowerCase()}.json`), JSON.stringify(byYear))
    available.push(cc)
    process.stdout.write(`${cc} `)
  }
})

available.sort()
writeFileSync(join(outDir, 'index.json'), JSON.stringify(available))
console.log(`\nWrote ${available.length} countries × years ${years[0]}–${years.at(-1)} -> ${outDir}`)
