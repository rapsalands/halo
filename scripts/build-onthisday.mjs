#!/usr/bin/env node
// Pre-fetch Wikipedia "on this day" events into one bundled JSON so the quote
// tile's history line works offline.
//
//   npm run build:onthisday
//
// Output: public/onthisday.json = { "MM-DD": [{ year, text }, ...], ... }
// Text is Wikipedia content (CC BY-SA) — see docs/offline-first.md.
import { writeFileSync } from 'node:fs'

const PER_DAY = Number((() => { const i = process.argv.indexOf('--per-day'); return i >= 0 ? process.argv[i + 1] : '5' })())

// Wikimedia requires a descriptive User-Agent; anonymous bulk requests are
// throttled/blocked. https://meta.wikimedia.org/wiki/User-Agent_policy
const HEADERS = { 'User-Agent': 'halo-kiosk/1.0 (https://github.com/rapsalands/halo; build-onthisday)' }

async function fetchDay(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: HEADERS })
    if (res.status === 429 && attempt < 4) throw new Error('429')
    return res
  } catch (e) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
      return fetchDay(url, attempt + 1)
    }
    throw e
  }
}

async function pool(items, size, fn) {
  let i = 0
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const n = i++; await fn(items[n]) }
  }))
}

// 2024 is a leap year, so iterating it covers Feb 29 too.
const days = []
for (let m = 0; m < 12; m++) {
  const dim = new Date(Date.UTC(2024, m + 1, 0)).getUTCDate()
  for (let d = 1; d <= dim; d++) {
    days.push([String(m + 1).padStart(2, '0'), String(d).padStart(2, '0')])
  }
}

const out = {}
let done = 0
await pool(days, 4, async ([mm, dd]) => {
  try {
    const res = await fetchDay(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`)
    if (!res.ok) throw new Error(`${res.status}`)
    const j = await res.json()
    const events = (j.events ?? []).slice(0, PER_DAY).map((e) => ({ year: e.year, text: e.text }))
    if (events.length) out[`${mm}-${dd}`] = events
  } catch { /* skip a day that fails; tile falls back online for it */ }
  if (++done % 30 === 0) process.stdout.write(`${done} `)
})

writeFileSync('public/onthisday.json', JSON.stringify(out))
const bytes = JSON.stringify(out).length
console.log(`\nWrote ${Object.keys(out).length} days -> public/onthisday.json (${(bytes / 1e3).toFixed(0)} KB)`)
