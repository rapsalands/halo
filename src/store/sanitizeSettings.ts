import {
  DEFAULT_SETTINGS,
  type Settings,
  type LayoutItem,
  type RegionId,
  type GeoLocationSetting,
} from './defaults'

/**
 * Coerce an untrusted value (decoded `?config=`, a pasted import, or a corrupt
 * `localStorage` blob) into a safe `Partial<Settings>`: every known key is
 * type/enum/range-checked and anything else is dropped. Unknown keys never pass
 * through, so this is also the guard against persisting a shape that later
 * crashes the kiosk (e.g. a non-array `tileLayout`) and against CSS-value
 * injection via `accent`. Invalid fields are omitted, so the caller's defaults
 * (or current values) stand.
 */
export function sanitizeSettings(input: unknown): Partial<Settings> {
  if (!isObj(input)) return {}
  const out: Partial<Settings> = {}

  // Enums
  if (inEnum(input.performance, PERFORMANCES)) out.performance = input.performance
  if (inEnum(input.units, UNITS)) out.units = input.units
  if (inEnum(input.preview, PREVIEWS)) out.preview = input.preview

  // Booleans
  if (isBool(input.hour12)) out.hour12 = input.hour12
  if (isBool(input.showSeconds)) out.showSeconds = input.showSeconds
  if (isBool(input.companion)) out.companion = input.companion
  if (isBool(input.nightDim)) out.nightDim = input.nightDim
  if (isBool(input.showInformationBanner)) out.showInformationBanner = input.showInformationBanner

  // Constrained strings
  if (isStr(input.greetingName)) out.greetingName = input.greetingName.slice(0, 24)
  if (matches(input.holidayCountry, /^[A-Za-z]{2}$/)) out.holidayCountry = input.holidayCountry
  if (matches(input.tickerCurrency, /^[A-Za-z]{3}$/)) out.tickerCurrency = input.tickerCurrency
  // accent: a hex colour only — never an arbitrary CSS value such as `url(...)`.
  if (matches(input.accent, HEX)) out.accent = input.accent
  // timezone is null (offline fallback unset) or an IANA-ish string; lib/time
  // already degrades gracefully on an unknown zone, so just bound the length.
  if (input.timezone === null) out.timezone = null
  else if (isStr(input.timezone)) out.timezone = input.timezone.slice(0, 64)

  // Integer ranges
  if (isIntInRange(input.dimStart, 0, 23)) out.dimStart = input.dimStart
  if (isIntInRange(input.dimEnd, 0, 23)) out.dimEnd = input.dimEnd
  if (Number.isInteger(input.layoutVersion)) out.layoutVersion = input.layoutVersion as number

  // Collections
  if ('enabledTiles' in input && isObj(input.enabledTiles)) {
    // Partial by design: load()/update() apply this patch over the full defaults,
    // so only the valid entries need to survive here.
    out.enabledTiles = sanitizeEnabledTiles(input.enabledTiles) as Settings['enabledTiles']
  }
  if (Array.isArray(input.tileLayout)) {
    out.tileLayout = input.tileLayout.filter(isLayoutItem).map(toLayoutItem)
  }
  if ('location' in input) {
    const loc = sanitizeLocation(input.location)
    if (loc !== INVALID) out.location = loc
  }
  if (Array.isArray(input.tickerCoins)) {
    out.tickerCoins = input.tickerCoins
      .filter((c): c is string => matches(c, SLUG) && c.length <= 40)
      .slice(0, 30)
  }

  return out
}

/* ---- field helpers ---- */

const TILE_IDS = Object.keys(DEFAULT_SETTINGS.enabledTiles) as RegionId[]

const PERFORMANCES = ['low', 'high'] as const
const UNITS = ['metric', 'imperial'] as const
const PREVIEWS = [
  'live', 'rain', 'thunder', 'snow', 'clear', 'night', 'cloudy', 'fog',
  'night-rain', 'night-thunder',
] as const

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const SLUG = /^[a-z0-9-]+$/i

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const matches = (v: unknown, re: RegExp): v is string => typeof v === 'string' && re.test(v)
const isIntInRange = (v: unknown, lo: number, hi: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
const inEnum = <T extends string>(v: unknown, vals: readonly T[]): v is T =>
  typeof v === 'string' && (vals as readonly string[]).includes(v)

function sanitizeEnabledTiles(src: Record<string, unknown>): Partial<Record<RegionId, boolean>> {
  const tiles: Partial<Record<RegionId, boolean>> = {}
  for (const id of TILE_IDS) {
    if (isBool(src[id])) tiles[id] = src[id]
  }
  return tiles
}

function isLayoutItem(v: unknown): v is LayoutItem {
  return (
    isObj(v) &&
    (TILE_IDS as string[]).includes(v.i as string) &&
    isNum(v.x) && isNum(v.y) && isNum(v.w) && isNum(v.h)
  )
}

// Re-shape to exactly the LayoutItem fields so nothing extra rides along.
function toLayoutItem(v: LayoutItem): LayoutItem {
  return { i: v.i, x: v.x, y: v.y, w: v.w, h: v.h }
}

/** Sentinel meaning "the location field was present but invalid → drop it". */
const INVALID = Symbol('invalid-location')

function sanitizeLocation(v: unknown): GeoLocationSetting | null | typeof INVALID {
  if (v === null) return null
  if (!isObj(v)) return INVALID
  if (!isNum(v.lat) || !isNum(v.lon)) return INVALID
  if (v.lat < -90 || v.lat > 90 || v.lon < -180 || v.lon > 180) return INVALID
  const name = isStr(v.name) ? v.name.slice(0, 80) : ''
  const loc: GeoLocationSetting = { lat: v.lat, lon: v.lon, name }
  if (matches(v.countryCode, /^[A-Za-z]{2}$/)) loc.countryCode = v.countryCode
  return loc
}
