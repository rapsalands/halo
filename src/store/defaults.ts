export type Units = 'metric' | 'imperial'
export type BackgroundMode = 'weather' | 'photo'
export type Performance = 'low' | 'high'
export type LayoutPreset = 'photo-first' | 'bento'
export type TileId = 'clock' | 'weather' | 'calendar' | 'sunmoon' | 'quote' | 'ticker'
/** Preview scene override: 'live' uses real weather; others force a demo scene. */
export type Preview =
  | 'live' | 'rain' | 'thunder' | 'snow' | 'clear' | 'night' | 'cloudy' | 'fog'
  | 'night-rain' | 'night-thunder'

export interface Settings {
  layout: LayoutPreset
  backgroundMode: BackgroundMode
  performance: Performance
  units: Units
  hour12: boolean
  holidayCountry: string // ISO-3166 alpha-2, e.g. 'IN'
  enabledTiles: Record<TileId, boolean>
  location: { lat: number; lon: number; name: string } | null // null = auto-detect
  preview: Preview
  /** UI accent (hex) — tints tiles, calendar "today" and settings chrome. */
  accent: string
}

/** Curated accent swatches shown in settings; first is the default. */
export const ACCENT_SWATCHES = [
  '#7fd0ff', '#9db4ff', '#7cf5c0', '#ffd56b', '#ff9e6d', '#ff8fb1', '#c9a7ff',
] as const

export const DEFAULT_SETTINGS: Settings = {
  layout: 'photo-first',
  backgroundMode: 'weather',
  performance: 'high',
  units: 'metric',
  hour12: false,
  holidayCountry: 'IN',
  enabledTiles: {
    clock: true, weather: true, calendar: true,
    sunmoon: true, quote: true, ticker: true,
  },
  location: null,
  preview: 'live',
  accent: '#7fd0ff',
}
