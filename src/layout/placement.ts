type Rect = { x: number; y: number; w: number; h: number }

/** Do two grid rectangles overlap? (touching edges do not count as overlap.) */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Topmost-leftmost grid cell where a `w`×`h` tile fits without overlapping any
 * of `occupied`. Scans rows downward; if the visible rows are full it returns a
 * slot just below them (the re-added tile then lands at the bottom rather than
 * stacking on top of another tile).
 */
export function findFreeSlot(
  occupied: Rect[],
  w: number,
  h: number,
  cols: number,
): { x: number; y: number } {
  const maxY = occupied.reduce((m, o) => Math.max(m, o.y + o.h), 0) + h + 1
  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x + w <= cols; x++) {
      if (!occupied.some((o) => rectsOverlap({ x, y, w, h }, o))) return { x, y }
    }
  }
  return { x: 0, y: maxY }
}
