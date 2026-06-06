export interface Holiday { date: string; name: string }

export async function fetchHolidays(year: number, country: string): Promise<Holiday[]> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`)
  if (!res.ok) throw new Error(`nager ${res.status}`)
  const j = await res.json()
  return (j as Array<{ date: string; localName?: string; name: string }>).map((h) => ({
    date: h.date,
    name: h.localName ?? h.name,
  }))
}
