export interface Holiday { date: string; name: string }

export interface Country { code: string; name: string }

/** Offline build: never reach for the Nager network API. */
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'

/**
 * Countries we can show holidays for. Prefer the bundled list (offline);
 * fall back to the Nager API in the online build.
 */
export async function fetchCountries(): Promise<Country[]> {
  try {
    const local = await fetch('/holidays/countries.json')
    if (local.ok) {
      const j = (await local.json()) as Country[]
      if (j.length) return j
    }
  } catch { /* fall through to network */ }
  if (OFFLINE) return []
  const res = await fetch('https://date.nager.at/api/v3/AvailableCountries')
  if (!res.ok) throw new Error(`nager countries ${res.status}`)
  const j = await res.json()
  return (j as Array<{ countryCode: string; name: string }>)
    .map((c) => ({ code: c.countryCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Public holidays for a year+country. Prefer bundled per-country data
 * (`public/holidays/<cc>.json`, keyed by year); fall back to Nager online.
 */
export async function fetchHolidays(year: number, country: string): Promise<Holiday[]> {
  try {
    const local = await fetch(`/holidays/${country.toLowerCase()}.json`)
    if (local.ok) {
      const byYear = (await local.json()) as Record<string, Holiday[]>
      const list = byYear[String(year)]
      if (Array.isArray(list)) return list
    }
  } catch { /* fall through to network */ }
  if (OFFLINE) return []
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
  if (!res.ok) throw new Error(`nager ${res.status}`)
  const j = await res.json()
  return (j as Array<{ date: string; localName?: string; name: string }>).map((h) => ({
    date: h.date,
    name: h.localName ?? h.name,
  }))
}
