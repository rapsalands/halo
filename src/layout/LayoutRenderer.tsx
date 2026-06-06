import type { ReactNode } from 'react'
import { useSettings } from '../store/settings'
import { slotsFor } from './presets'
import type { TileId } from '../store/defaults'
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'

/** Tiles available in this plan. Plan 2 adds calendar/sunmoon/quote/ticker. */
const TILES: Partial<Record<TileId, () => ReactNode>> = {
  clock: () => <ClockTile />,
  weather: () => <WeatherTile />,
}

export function LayoutRenderer() {
  const layout = useSettings((s) => s.settings.layout)
  const enabledTiles = useSettings((s) => s.settings.enabledTiles)
  const slots = slotsFor(layout, enabledTiles)
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
      {slots.map(({ id, slot }) => {
        const render = TILES[id]
        if (!render) return null // tile not implemented until Plan 2
        return (
          <div key={id} style={{ position: 'absolute', ...slot }}>
            {render()}
          </div>
        )
      })}
    </div>
  )
}
