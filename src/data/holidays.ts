export interface Holiday { date: string; name: string }

export interface Country { code: string; name: string }

/** Countries Nager.Date can serve public holidays for (ISO-2 code + name). */
export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch('https://date.nager.at/api/v3/AvailableCountries')
  if (!res.ok) throw new Error(`nager countries ${res.status}`)
  const j = await res.json()
  return (j as Array<{ countryCode: string; name: string }>)
    .map((c) => ({ code: c.countryCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchHolidays(year: number, country: string): Promise<Holiday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
  if (!res.ok) throw new Error(`nager ${res.status}`)
  const j = await res.json()
  return (j as Array<{ date: string; localName?: string; name: string }>).map((h) => ({
    date: h.date,
    name: h.localName ?? h.name,
  }))
}
