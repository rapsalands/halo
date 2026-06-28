import { describe, it, expect } from 'vitest'
import { rectsOverlap, findFreeSlot } from './placement'

describe('rectsOverlap', () => {
  it('detects overlap and treats touching edges as non-overlap', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 1, y: 1, w: 2, h: 2 })).toBe(true)
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 2, y: 0, w: 2, h: 2 })).toBe(false) // edge-to-edge
    expect(rectsOverlap({ x: 0, y: 0, w: 2, h: 2 }, { x: 5, y: 5, w: 2, h: 2 })).toBe(false)
  })
})

describe('findFreeSlot', () => {
  it('returns the origin when the grid is empty', () => {
    expect(findFreeSlot([], 4, 2, 12)).toEqual({ x: 0, y: 0 })
  })

  it('skips an occupied region and finds the next free column on the same row', () => {
    const occupied = [{ x: 0, y: 0, w: 4, h: 2 }]
    expect(findFreeSlot(occupied, 3, 2, 12)).toEqual({ x: 4, y: 0 })
  })

  it('drops to a new row below everything when the visible rows are full', () => {
    // a full 12-wide band at rows 0-1 leaves no room on row 0
    const occupied = [{ x: 0, y: 0, w: 12, h: 2 }]
    expect(findFreeSlot(occupied, 4, 2, 12)).toEqual({ x: 0, y: 2 })
  })

  it('never returns a slot that overlaps an occupied tile', () => {
    const occupied = [
      { x: 0, y: 0, w: 7, h: 2 },
      { x: 7, y: 0, w: 5, h: 4 },
      { x: 0, y: 2, w: 7, h: 2 },
    ]
    const slot = findFreeSlot(occupied, 4, 2, 12)
    expect(occupied.some((o) => rectsOverlap({ ...slot, w: 4, h: 2 }, o))).toBe(false)
  })
})
