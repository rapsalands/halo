import { useEffect, useState, type ReactNode } from 'react'
// `/legacy` exposes the v1-compatible default-grid + WidthProvider API; the root export has a different shape in v2.
import GridLayoutBase, { WidthProvider, type Layout } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './layout.css'
import { useSettings } from '../store/settings'
import { useAppState } from '../store/appState'
import { useOnline } from '../hooks/useOnline'
import { TileShell } from '../tiles/TileShell'
import { HiddenTilesTray } from './HiddenTilesTray'
import { GRID_COLS, GRID_ROWS, type RegionId, type LayoutItem } from '../store/defaults'
import { ClockTile } from '../tiles/ClockTile'
import { WeatherTile } from '../tiles/WeatherTile'
import { ForecastTile } from '../tiles/ForecastTile'
import { CalendarTile } from '../tiles/CalendarTile'
import { SunMoonTile } from '../tiles/SunMoonTile'
import { QuoteTile } from '../tiles/QuoteTile'
import { TickerTile } from '../tiles/TickerTile'
import { AirQualityTile } from '../tiles/AirQualityTile'
import { PhotoPanel } from '../tiles/PhotoPanel'

const ResponsiveGrid = WidthProvider(GridLayoutBase)

const RENDER: Record<RegionId, () => ReactNode> = {
  clock: () => <ClockTile />,
  weather: () => <WeatherTile />,
  air: () => <AirQualityTile />,
  calendar: () => <CalendarTile />,
  quote: () => <QuoteTile />,
  sunmoon: () => <SunMoonTile />,
  forecast: () => <ForecastTile />,
  photo: () => <PhotoPanel />,
  ticker: () => <TickerTile />,
}

// Regions that need the internet. When offline they are hidden so they never
// show a spinner or error; they reappear automatically once the link is back.
const NEEDS_NET: Record<RegionId, boolean> = {
  clock: false, weather: true, air: true, calendar: false, quote: false,
  sunmoon: true, forecast: true, photo: true, ticker: true,
}

const MARGIN = 10 // gap between tiles
const PADDING = 18 // outer grid padding

function computeRowHeight(h: number): number {
  return Math.max(24, Math.floor((h - PADDING * 2 - MARGIN * (GRID_ROWS - 1)) / GRID_ROWS))
}

/** Row height that fills the viewport, recomputed on window resize so the grid
 *  never latches a stale/early height (which left it half-filled). */
function useRowHeight(): number {
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 768))
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight)
    onResize() // correct any value read before the window settled
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return computeRowHeight(vh)
}

export function GridLayout() {
  const enabled = useSettings((s) => s.settings.enabledTiles)
  const tileLayout = useSettings((s) => s.settings.tileLayout)
  const update = useSettings((s) => s.update)
  const editMode = useAppState((s) => s.editMode)
  const online = useOnline()
  const rh = useRowHeight()

  const show = (id: RegionId) => !!enabled[id] && (online || !NEEDS_NET[id])
  const visibleIds = (Object.keys(RENDER) as RegionId[]).filter(show)

  // RGL layout for the currently-rendered children only.
  // Layout = readonly RGL-LayoutItem[]; our LayoutItem is structurally compatible.
  const layout: Layout = tileLayout.filter((it) => visibleIds.includes(it.i))

  function onLayoutChange(next: Layout) {
    if (!editMode) return // ignore width/mount recalcs in view mode
    const moved = new Map(next.map((n) => [n.i, n]))
    const merged: LayoutItem[] = tileLayout.map((it) => {
      const n = moved.get(it.i)
      return n ? { i: it.i, x: n.x, y: n.y, w: n.w, h: n.h } : it
    })
    update({ tileLayout: merged })
  }

  function removeTile(id: RegionId) {
    update({ enabledTiles: { ...enabled, [id]: false } })
  }

  return (
    <>
      <ResponsiveGrid
        className="tile-grid"
        layout={layout}
        cols={GRID_COLS}
        maxRows={GRID_ROWS}
        rowHeight={rh}
        margin={[MARGIN, MARGIN]}
        containerPadding={[PADDING, PADDING]}
        compactType={null}
        preventCollision={false}
        isBounded
        isDraggable={editMode}
        isResizable={editMode}
        onLayoutChange={onLayoutChange}
      >
        {visibleIds.map((id) => (
          <TileShell key={id} id={id} editMode={editMode} onRemove={removeTile}>
            {RENDER[id]()}
          </TileShell>
        ))}
      </ResponsiveGrid>
      {editMode && <HiddenTilesTray />}
    </>
  )
}
