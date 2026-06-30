import type { CSSProperties } from 'react'

const LABEL: CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'var(--text-dim)',
}

/** The small uppercased section heading shared by several tiles. `stale` shows
 *  a subtle marker when the tile is displaying last-known-good data. */
export function TileLabel({ children, stale, style }: { children: string; stale?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ ...LABEL, ...style }}>
      {children}
      {stale && <span title="Showing last known data" style={{ color: '#ffd27e' }}> · stale</span>}
    </div>
  )
}
