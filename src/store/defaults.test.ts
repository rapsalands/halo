import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS, DEFAULT_LAYOUT, TILE_LABELS, GRID_COLS, GRID_ROWS,
  type RegionId,
} from './defaults'

const ALL_IDS: RegionId[] = [
  'clock', 'weather', 'air', 'calendar', 'quote', 'sunmoon', 'forecast', 'photo', 'ticker',
]

describe('layout defaults', () => {
  it('enables all nine tiles by default', () => {
    for (const id of ALL_IDS) expect(DEFAULT_SETTINGS.enabledTiles[id]).toBe(true)
  })

  it('has exactly one default layout entry per tile', () => {
    expect(DEFAULT_LAYOUT.map((l) => l.i).sort()).toEqual([...ALL_IDS].sort())
    expect(DEFAULT_SETTINGS.tileLayout).toEqual(DEFAULT_LAYOUT)
  })

  it('keeps every default layout item inside the 12x12 grid', () => {
    for (const it of DEFAULT_LAYOUT) {
      expect(it.x).toBeGreaterThanOrEqual(0)
      expect(it.x + it.w).toBeLessThanOrEqual(GRID_COLS)
      expect(it.y + it.h).toBeLessThanOrEqual(GRID_ROWS)
    }
  })

  it('has a human label for every tile', () => {
    for (const id of ALL_IDS) expect(TILE_LABELS[id]).toBeTruthy()
  })
})
