export interface OnThisDay { year: number; text: string }

/** Offline build: never reach for Wikipedia. */
const OFFLINE = import.meta.env.VITE_OFFLINE === 'true'

/**
 * A notable "on this day" event. Prefer the bundled dataset
 * (`public/onthisday.json`, keyed by "MM-DD"); fall back to Wikipedia online.
 */
export async function fetchOnThisDay(date: Date): Promise<OnThisDay | null> {
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')

  try {
    const local = await fetch('/onthisday.json')
    if (local.ok) {
      const byDay = (await local.json()) as Record<string, OnThisDay[]>
      const events = byDay[`${mm}-${dd}`]
      if (events?.length) return events[0]
    }
  } catch { /* fall through to network */ }

  if (OFFLINE) return null
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`)
  if (!res.ok) throw new Error(`onthisday ${res.status}`)
  const j = await res.json()
  const first = j.events?.[0]
  if (!first) return null
  return { year: first.year, text: first.text }
}
