import type { CSSProperties } from 'react'
import type { LayoutPreset, TileId } from '../store/defaults'

export type Slot = Pick<CSSProperties, 'top' | 'left' | 'right' | 'bottom' | 'width'>

export interface Preset {
  slots: Partial<Record<TileId, Slot>>
}

export const PRESETS: Record<LayoutPreset, Preset> = {
  'photo-first': {
    slots: {
      clock: { top: '5%', left: '4%' },
      weather: { top: '6%', right: '4%' },
      calendar: { bottom: '8%', left: '4%', width: '32%' },
      sunmoon: { bottom: '8%', right: '4%', width: '24%' },
      quote: { bottom: '8%', left: '40%', width: '28%' },
      ticker: { bottom: '2%', left: '4%', right: '4%' },
    },
  },
  // Bento is a future preset (Plan 3+); keep a minimal placeholder arrangement
  // so the type is satisfied and switching does not crash.
  bento: {
    slots: {
      clock: { top: '4%', left: '3%', width: '40%' },
      weather: { top: '4%', right: '3%', width: '48%' },
      calendar: { bottom: '6%', left: '3%', width: '30%' },
      sunmoon: { bottom: '6%', right: '3%', width: '28%' },
      quote: { bottom: '6%', left: '35%', width: '28%' },
      ticker: { bottom: '1%', left: '3%', right: '3%' },
    },
  },
}

export interface ResolvedSlot { id: TileId; slot: Slot }

export function slotsFor(
  preset: LayoutPreset,
  enabled: Record<TileId, boolean>,
): ResolvedSlot[] {
  const def = PRESETS[preset]
  return (Object.keys(def.slots) as TileId[])
    .filter((id) => enabled[id] && def.slots[id])
    .map((id) => ({ id, slot: def.slots[id]! }))
}
