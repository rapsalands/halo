import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { TILE_LABELS, type RegionId } from '../store/defaults'

const ALL_IDS = Object.keys(TILE_LABELS) as RegionId[]

/** Edit-mode bar: a Done button plus re-add buttons for user-hidden tiles. */
export function HiddenTilesTray() {
  const enabledTiles = useSettings((s) => s.settings.enabledTiles)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)

  const hidden = ALL_IDS.filter((id) => !enabledTiles[id])

  return (
    <div className="tile-tray" data-testid="tile-tray">
      <button type="button" className="tile-tray__done" onClick={() => setEditMode(false)}>
        Done
      </button>
      {hidden.length > 0 && <span className="tile-tray__label">Hidden:</span>}
      {hidden.map((id) => (
        <button
          key={id}
          type="button"
          className="tile-tray__add"
          onClick={() => update({ enabledTiles: { ...enabledTiles, [id]: true } })}
        >
          + {TILE_LABELS[id]}
        </button>
      ))}
    </div>
  )
}
