import { TileFrame } from './TileFrame'

/** The shared "no data yet / unavailable" state for a tile — one dim line on a
 *  glass card, so every tile's empty state looks and reads the same. */
export function TilePlaceholder({ children }: { children: string }) {
  return (
    <TileFrame>
      <div style={{ color: 'var(--text-dim)' }}>{children}</div>
    </TileFrame>
  )
}
