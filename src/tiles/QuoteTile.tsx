import { useMemo } from 'react'
import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { useToday } from '../hooks/useNow'
import { useOnThisDay } from '../hooks/useOnThisDay'
import { pickDailyQuote } from '../lib/quotes'

export function QuoteTile() {
  // The quote and "on this day" entry only change once a day — in the clock's zone.
  const weatherTz = useAppState((s) => s.weather?.timezone)
  const fallbackTz = useSettings((s) => s.settings.timezone)
  const today = useToday(weatherTz ?? fallbackTz ?? undefined)
  const date = useMemo(() => new Date(today.year, today.month, today.day), [today])
  const quote = pickDailyQuote(date)
  const { data: otd } = useOnThisDay(date)

  return (
    <TileFrame>
      <div style={{ fontSize: '1.15rem', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.35 }}>
        “{quote.text}”
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 8 }}>
        — {quote.author}
      </div>
      {otd && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8 }}>
          <strong>{otd.year}</strong> · {otd.text}
        </div>
      )}
    </TileFrame>
  )
}
