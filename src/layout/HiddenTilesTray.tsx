import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { TILE_LABELS, DEFAULT_LAYOUT, GRID_COLS, type RegionId, type LayoutItem } from '../store/defaults'
import { rectsOverlap, findFreeSlot } from './placement'

const ALL_IDS = Object.keys(TILE_LABELS) as RegionId[]

/** Edit-mode bar: a Done button plus re-add buttons for user-hidden tiles. */
export function HiddenTilesTray() {
  const enabledTiles = useSettings((s) => s.settings.enabledTiles)
  const tileLayout = useSettings((s) => s.settings.tileLayout)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)

  const hidden = ALL_IDS.filter((id) => !enabledTiles[id])

  /** Re-enable a tile, relocating it to a free slot if its saved spot is now
   *  taken (e.g. a neighbour was resized into it) so it never re-appears on top
   *  of another card. */
  function readd(id: RegionId) {
    const me = tileLayout.find((l) => l.i === id) ?? DEFAULT_LAYOUT.find((l) => l.i === id)!
    const occupied = tileLayout.filter((l) => l.i !== id && enabledTiles[l.i])
    let placed: LayoutItem = me
    if (occupied.some((o) => rectsOverlap(me, o))) {
      const slot = findFreeSlot(occupied, me.w, me.h, GRID_COLS)
      placed = { ...me, x: slot.x, y: slot.y }
    }
    update({
      enabledTiles: { ...enabledTiles, [id]: true },
      tileLayout: tileLayout.map((l) => (l.i === id ? placed : l)),
    })
  }

  return (
    <div className="tile-tray" data-testid="tile-tray">
      <button type="button" className="tile-tray__done" onClick={() => setEditMode(false)}>
        Done
      </button>
      {hidden.length > 0 && <span className="tile-tray__label">Hidden:</span>}
      {hidden.map((id) => (
        <button key={id} type="button" className="tile-tray__add" onClick={() => readd(id)}>
          + {TILE_LABELS[id]}
        </button>
      ))}
    </div>
  )
}
