import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { usePolledData } from '../hooks/usePolledData'
import { pickDailyQuote } from '../lib/quotes'
import { fetchOnThisDay, type OnThisDay } from '../data/onThisDay'

const SIX_H = 6 * 60 * 60_000

export function QuoteTile() {
  const now = useAppState((s) => s.now)
  const quote = pickDailyQuote(now)
  const mm = (now.getMonth() + 1).toString().padStart(2, '0')
  const dd = now.getDate().toString().padStart(2, '0')
  const { data: otd } = usePolledData<OnThisDay | null>(
    `onthisday:${mm}-${dd}`,
    () => fetchOnThisDay(now),
    SIX_H,
  )

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
