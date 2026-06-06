export interface OnThisDay { year: number; text: string }

export async function fetchOnThisDay(date: Date): Promise<OnThisDay | null> {
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`)
  if (!res.ok) throw new Error(`onthisday ${res.status}`)
  const j = await res.json()
  const first = j.events?.[0]
  if (!first) return null
  return { year: first.year, text: first.text }
}
