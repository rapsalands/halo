export type Units = 'metric' | 'imperial'
export type BackgroundMode = 'weather' | 'photo'
export type Performance = 'low' | 'high'
export type LayoutPreset = 'photo-first' | 'bento'
export type RegionId =
  | 'clock' | 'weather' | 'air' | 'calendar' | 'quote'
  | 'sunmoon' | 'forecast' | 'photo' | 'ticker'

/** All tiles are uniform now — every region is a toggleable tile. */
export type TileId = RegionId

export interface LayoutItem { i: RegionId; x: number; y: number; w: number; h: number }

export const GRID_COLS = 12
export const GRID_ROWS = 12

/** Default bento mapped onto the 12-col × 12-row grid (matches the old PLACEMENT). */
export const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'clock',    x: 0, y: 0,  w: 7,  h: 2 },
  { i: 'weather',  x: 0, y: 2,  w: 4,  h: 2 },
  { i: 'air',      x: 4, y: 2,  w: 3,  h: 2 },
  { i: 'calendar', x: 0, y: 4,  w: 3,  h: 4 },
  { i: 'quote',    x: 3, y: 4,  w: 4,  h: 2 },
  { i: 'sunmoon',  x: 3, y: 6,  w: 4,  h: 2 },
  { i: 'forecast', x: 0, y: 8,  w: 7,  h: 2 },
  { i: 'photo',    x: 7, y: 0,  w: 5,  h: 10 },
  { i: 'ticker',   x: 0, y: 10, w: 12, h: 2 },
]

export const TILE_LABELS: Record<RegionId, string> = {
  clock: 'Clock', weather: 'Weather', air: 'Air quality', calendar: 'Calendar',
  quote: 'Quote', sunmoon: 'Sun & Moon', forecast: 'Forecast', photo: 'Photo',
  ticker: 'Ticker',
}
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
  /** Per-screen tile positions/sizes (react-grid-layout items). */
  tileLayout: LayoutItem[]
  location: { lat: number; lon: number; name: string } | null // null = auto-detect
  /** IANA timezone fallback for the clock when there is no weather feed (offline).
   *  The kiosk injects it via ?config=. Does NOT disable IP auto-detect. */
  timezone: string | null
  preview: Preview
  /** UI accent (hex) — tints tiles, calendar "today" and settings chrome. */
  accent: string
  /** Show a time-of-day greeting on the clock; name is appended if set. */
  greetingName: string
  /** Show seconds on the big clock. */
  showSeconds: boolean
  /** Show the drifting sun/moon "companion" animation in the sky. */
  companion: boolean
  /** Auto-dim the whole panel overnight (kiosk-friendly). */
  nightDim: boolean
  dimStart: number // hour 0–23 the dimming begins
  dimEnd: number // hour 0–23 the dimming ends
  /** Markets ticker: which CoinGecko coin ids and the fiat to price them in. */
  tickerCoins: string[]
  tickerCurrency: string // 'usd' | 'eur' | 'inr' | 'gbp' | ...
  /** Rolling onboarding banner with kiosk setup hints; off once the user dismisses it. */
  showOnboardingBanner: boolean
}

/** Fiat currencies offered for the ticker → display symbol. */
export const TICKER_CURRENCIES: Record<string, string> = {
  usd: '$', eur: '€', inr: '₹', gbp: '£',
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
    clock: true, weather: true, air: true, calendar: true, quote: true,
    sunmoon: true, forecast: true, photo: true, ticker: true,
  },
  tileLayout: DEFAULT_LAYOUT,
  location: null,
  timezone: null,
  preview: 'live',
  accent: '#7fd0ff',
  greetingName: '',
  showSeconds: false,
  companion: true,
  nightDim: false,
  dimStart: 23,
  dimEnd: 6,
  tickerCoins: ['bitcoin', 'ethereum', 'solana'],
  tickerCurrency: 'usd',
  showOnboardingBanner: true,
}
