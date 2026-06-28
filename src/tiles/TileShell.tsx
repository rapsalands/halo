import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import { TILE_LABELS, type RegionId } from '../store/defaults'

interface TileShellProps {
  id: RegionId
  editMode: boolean
  onRemove: (id: RegionId) => void
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * The reusable outer shell for every dashboard tile. Owns the edit chrome
 * (× remove button, edit outline, size container) so individual tiles stay
 * pure content. react-grid-layout clones this element and injects positioning
 * `style`, a `className`, drag handlers, and an appended resize-handle child —
 * all of which are spread onto the root div, so the shell stays RGL-compatible.
 */
export const TileShell = forwardRef<HTMLDivElement, TileShellProps>(function TileShell(
  { id, editMode, onRemove, children, className, style, ...rest }, ref,
) {
  return (
    <div
      ref={ref}
      data-region={id}
      className={`tile-shell${editMode ? ' tile-shell--editing' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      {editMode && (
        <button
          type="button"
          className="tile-shell__remove"
          aria-label={`Remove ${TILE_LABELS[id]}`}
          // Stop the press from starting an RGL drag before the click lands.
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={() => onRemove(id)}
        >
          ×
        </button>
      )}
      {children}
    </div>
  )
})
