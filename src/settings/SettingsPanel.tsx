import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useSettings, mergeLayout } from '../store/settings'
import {
  ACCENT_SWATCHES, TICKER_CURRENCIES, TILE_LABELS, DEFAULT_LAYOUT, DEFAULT_SETTINGS,
  type TileId, type Units, type Performance, type Preview,
} from '../store/defaults'
import { useAppState } from '../store/appState'
import { DEMO_NAMES } from '../lib/demo'
import { ipLocate, type GeoResult } from '../data/geo'
import { loadPlaces, searchPlaces } from '../data/places'
import { fetchCountries, type Country } from '../data/holidays'
import { usePolledData } from '../hooks/usePolledData'
import { fetchWithFallback } from '../lib/fetchWithFallback'
import { encodeConfig, decodeConfig } from './configIO'
import './settings.css'

const CURRENCY_OPTS = Object.keys(TICKER_CURRENCIES).map((c) => ({ value: c, label: c.toUpperCase() }))
const HOURS = Array.from({ length: 24 }, (_, h) => h)
function hourLabel(h: number): string { return `${h.toString().padStart(2, '0')}:00` }
const DAY_MS = 24 * 60 * 60_000

/** Shown before Nager's country list loads (and as an offline floor). */
const FALLBACK_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' }, { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' }, { code: 'JP', name: 'Japan' },
]

/** A place suggestion as one human-readable line, e.g. "Paris, Île-de-France, France". */
function placeLabel(r: GeoResult): string {
  return [r.name, r.admin1, r.country].filter(Boolean).join(', ')
}

/** Preview selector chips → friendly label + glyph. */
const SCENE_META: Record<Preview, { label: string; ico: string }> = {
  live: { label: 'Live', ico: '📡' },
  clear: { label: 'Clear', ico: '☀️' },
  cloudy: { label: 'Cloudy', ico: '☁️' },
  fog: { label: 'Fog', ico: '🌫️' },
  rain: { label: 'Rain', ico: '🌧️' },
  thunder: { label: 'Thunder', ico: '⛈️' },
  snow: { label: 'Snow', ico: '❄️' },
  night: { label: 'Clear night', ico: '🌙' },
  'night-rain': { label: 'Night rain', ico: '🌧️' },
  'night-thunder': { label: 'Night storm', ico: '⛈️' },
}
const SCENE_ORDER: Preview[] = ['live', ...DEMO_NAMES]

interface SegOption<T extends string> { value: T; label: string }

function Segmented<T extends string>(
  { value, options, onChange, wide }: { value: T; options: SegOption<T>[]; onChange: (v: T) => void; wide?: boolean },
) {
  return (
    <div className={wide ? 'seg seg-wide' : 'seg'}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'active' : undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="set-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

/* ---- Tabs ---------------------------------------------------------- */

type TabId = 'display' | 'clock' | 'location' | 'tiles' | 'ticker' | 'advanced'
const TABS: { id: TabId; label: string; ico: string }[] = [
  { id: 'display', label: 'Display', ico: '◐' },
  { id: 'clock', label: 'Clock', ico: '🕐' },
  { id: 'location', label: 'Location', ico: '📍' },
  { id: 'tiles', label: 'Tiles', ico: '▦' },
  { id: 'ticker', label: 'Ticker', ico: '📈' },
  { id: 'advanced', label: 'Advanced', ico: '⚙' },
]

/* ---- Category panes ------------------------------------------------ */

function DisplayTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  return (
    <>
      <div className="set-col">
        <span className="set-label">Performance</span>
        <Segmented<Performance>
          wide value={settings.performance}
          options={[{ value: 'high', label: 'High' }, { value: 'low', label: 'Low' }]}
          onChange={(performance) => update({ performance })}
        />
      </div>
      <div className="set-row">
        <Toggle label="Companion (sun / moon)" checked={settings.companion} onChange={(companion) => update({ companion })} />
      </div>
      <div className="set-col">
        <span className="set-label">Accent color</span>
        <div className="swatches">
          {ACCENT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              className={settings.accent === c ? 'swatch active' : 'swatch'}
              style={{ background: c, color: c }}
              onClick={() => update({ accent: c })}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function ClockTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  return (
    <>
      <div className="set-col">
        <span id="units-label" className="set-label">Units</span>
        <div role="group" aria-labelledby="units-label">
          <Segmented<Units>
            wide value={settings.units}
            options={[{ value: 'metric', label: 'Metric °C' }, { value: 'imperial', label: 'Imperial °F' }]}
            onChange={(units) => update({ units })}
          />
        </div>
      </div>
      <div className="set-row">
        <Toggle label="12-hour clock" checked={settings.hour12} onChange={(hour12) => update({ hour12 })} />
      </div>
      <div className="set-row">
        <Toggle label="Show seconds" checked={settings.showSeconds} onChange={(showSeconds) => update({ showSeconds })} />
      </div>
      <div className="set-col">
        <label htmlFor="greet" className="set-label">Greeting name</label>
        <input
          id="greet" className="set-input" placeholder="eg: Marsh Mellow"
          value={settings.greetingName} maxLength={24}
          onChange={(e) => update({ greetingName: e.target.value })}
        />
      </div>
    </>
  )
}

/** Debounced place search with a tap-to-pick suggestion list. */
function CityAutocomplete() {
  const location = useSettings((s) => s.settings.location)
  const update = useSettings((s) => s.update)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  // When we fill the box programmatically (auto-detect), skip the next search
  // so it doesn't pop a results dropdown for the value we just inserted.
  const suppressSearch = useRef(false)

  // Warm the offline place data once the location field is in use.
  useEffect(() => { loadPlaces().catch(() => { /* offline / no manifest — fallback covers it */ }) }, [])

  // Debounce the search over the bundled offline dataset (US today; add more
  // countries by dropping a CSV and running `npm run build:places`).
  useEffect(() => {
    if (suppressSearch.current) { suppressSearch.current = false; return }
    const q = query.trim()
    let cancelled = false
    const id = setTimeout(async () => {
      if (q.length < 2) { if (!cancelled) { setResults([]); setOpen(false) } return }
      try { await loadPlaces() } catch { /* no bundled data available */ }
      if (cancelled) return
      const found = searchPlaces(q)
      setResults(found); setOpen(found.length > 0)
    }, 250)
    return () => { cancelled = true; clearTimeout(id) }
  }, [query])

  // Detect via IP, pin the result, and show its name in the box for confirmation.
  async function detect() {
    setDetecting(true)
    try {
      const res = await fetchWithFallback('geo', ipLocate)
      update({ location: res.data })
      suppressSearch.current = true
      setQuery(res.data.name)
      setResults([]); setOpen(false)
    } catch { /* no network and no cache — leave the box as-is */ }
    finally { setDetecting(false) }
  }

  // Dismiss the dropdown when a click lands outside the widget.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function pick(r: GeoResult) {
    update({ location: { lat: r.lat, lon: r.lon, name: r.name } })
    setQuery(''); setResults([]); setOpen(false)
  }

  return (
    <div className="set-col">
      <span className="set-label">Location</span>
      <div className="set-ac" ref={boxRef}>
        <input
          className="set-input"
          placeholder={location?.name ?? 'Auto-detected — type a city'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          aria-label="Search location"
          aria-expanded={open}
          aria-controls="set-ac-list"
        />
        {open && results.length > 0 && (
          <ul className="set-ac-list" id="set-ac-list" role="listbox">
            {results.map((r, i) => (
              <li key={`${r.lat},${r.lon},${i}`}>
                <button type="button" className="set-ac-item" onClick={() => pick(r)}>
                  {placeLabel(r)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="set-btn block" style={{ marginTop: 8 }} onClick={detect} disabled={detecting}>
        {detecting ? 'Detecting…' : 'Detect my location'}
      </button>
      <span className="set-hint">Type a city or postal code — US ZIP or India PIN (offline).</span>
    </div>
  )
}

/** Native dropdown of the countries Nager.Date supports (cached for offline). */
function CountrySelect() {
  const holidayCountry = useSettings((s) => s.settings.holidayCountry)
  const update = useSettings((s) => s.update)
  const { data } = usePolledData<Country[]>('countries', fetchCountries, DAY_MS)

  // Merge the cached list with the offline fallback (and the current value if
  // it isn't in either), deduped by code and sorted by name.
  const byCode = new Map<string, Country>()
  for (const c of [...FALLBACK_COUNTRIES, ...(data ?? [])]) byCode.set(c.code, c)
  if (holidayCountry && !byCode.has(holidayCountry)) {
    byCode.set(holidayCountry, { code: holidayCountry, name: holidayCountry })
  }
  const countries = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="set-col">
      <label htmlFor="country" className="set-label">Holiday country</label>
      <select
        id="country" className="set-input"
        value={holidayCountry}
        onChange={(e) => update({ holidayCountry: e.target.value })}
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
        ))}
      </select>
    </div>
  )
}

function LocationTab() {
  return (
    <>
      <CityAutocomplete />
      <CountrySelect />
    </>
  )
}

function TilesTab({ onClose }: { onClose: () => void }) {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)
  return (
    <>
      <div className="set-col">
        <button className="set-btn block" onClick={() => { setEditMode(true); onClose() }}>
          Edit layout
        </button>
      </div>
      <div className="set-col">
        <button
          className="set-btn block"
          onClick={() => update({ tileLayout: DEFAULT_LAYOUT, enabledTiles: DEFAULT_SETTINGS.enabledTiles })}
        >
          Reset to default layout
        </button>
      </div>
      <Section title="Show tiles">
        {(Object.keys(TILE_LABELS) as TileId[]).map((id) => (
          <div className="set-row" key={id}>
            <Toggle
              label={TILE_LABELS[id]}
              checked={settings.enabledTiles[id]}
              onChange={(on) => update({ enabledTiles: { ...settings.enabledTiles, [id]: on } })}
            />
          </div>
        ))}
        <div className="set-row">
          <Toggle label="Information Banner" checked={settings.showOnboardingBanner} onChange={(showOnboardingBanner) => update({ showOnboardingBanner })} />
        </div>
      </Section>
    </>
  )
}

function TickerTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [coinsText, setCoinsText] = useState(settings.tickerCoins.join(', '))

  function commitCoins() {
    const ids = coinsText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (ids.length) update({ tickerCoins: ids })
  }

  return (
    <>
      <div className="set-col">
        <label htmlFor="coins" className="set-label">Coins (CoinGecko ids, comma-separated)</label>
        <input
          id="coins" className="set-input" placeholder="bitcoin, ethereum, solana"
          value={coinsText}
          onChange={(e) => setCoinsText(e.target.value)}
          onBlur={commitCoins}
          onKeyDown={(e) => { if (e.key === 'Enter') commitCoins() }}
        />
      </div>
      <div className="set-col">
        <span className="set-label">Currency</span>
        <Segmented<string>
          wide value={settings.tickerCurrency}
          options={CURRENCY_OPTS}
          onChange={(tickerCurrency) => update({ tickerCurrency })}
        />
      </div>
    </>
  )
}

function AdvancedTab() {
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [importText, setImportText] = useState('')
  return (
    <>
      <Section title="Live scene">
        <div className="scene-grid">
          {SCENE_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              className={settings.preview === p ? 'scene-chip active' : 'scene-chip'}
              onClick={() => update({ preview: p })}
            >
              <span className="ico">{SCENE_META[p].ico}</span>
              {SCENE_META[p].label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Overnight dimming">
        <div className="set-row">
          <Toggle label="Auto-dim at night" checked={settings.nightDim} onChange={(nightDim) => update({ nightDim })} />
        </div>
        <div className="set-row">
          <span>From</span>
          <select className="set-input" style={{ width: 110 }} value={settings.dimStart}
            onChange={(e) => update({ dimStart: Number(e.target.value) })}>
            {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
        <div className="set-row">
          <span>To</span>
          <select className="set-input" style={{ width: 110 }} value={settings.dimEnd}
            onChange={(e) => update({ dimEnd: Number(e.target.value) })}>
            {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </div>
      </Section>

      <Section title="Backup">
        <div className="set-col">
          <span className="set-label">Export this screen's config</span>
          <textarea className="set-input" readOnly value={encodeConfig(settings)} rows={3} />
        </div>
        <div className="set-col">
          <span className="set-label">Import config</span>
          <textarea
            className="set-input" placeholder="Paste config here" rows={3}
            value={importText} onChange={(e) => setImportText(e.target.value)}
          />
          <button
            className="set-btn primary block" style={{ marginTop: 8 }}
            onClick={() => { const c = decodeConfig(importText); if (c) { update(c.tileLayout ? { ...c, tileLayout: mergeLayout(c.tileLayout) } : c); setImportText('') } }}
          >
            Apply imported config
          </button>
        </div>
      </Section>
    </>
  )
}

/* ---- Panel shell --------------------------------------------------- */

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('display')

  function moveTab(dir: 1 | -1) {
    const i = TABS.findIndex((t) => t.id === tab)
    const next = TABS[(i + dir + TABS.length) % TABS.length]
    setTab(next.id)
    // Keep DOM focus in step with the roving-tabindex selection so the
    // keyboard user lands on the tab they just selected.
    document.getElementById(`set-tab-${next.id}`)?.focus()
  }

  return (
    <>
      <button className="set-gear" aria-label="Settings" onClick={() => { setTab('display'); setOpen(true) }}>⚙</button>

      {open && (
        <div
          data-testid="settings-overlay"
          className="set-scrim"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="set-panel">
            <div className="set-head">
              <h2>Settings</h2>
              <button className="set-x" aria-label="Close" onClick={() => setOpen(false)}>×</button>
            </div>

            <div
              className="set-tabs"
              role="tablist"
              aria-label="Settings categories"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') { e.preventDefault(); moveTab(1) }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); moveTab(-1) }
              }}
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`set-tab-${t.id}`}
                  aria-controls="set-tabpanel"
                  aria-selected={tab === t.id}
                  tabIndex={tab === t.id ? 0 : -1}
                  className="set-tab"
                  onClick={() => setTab(t.id)}
                >
                  <span className="ico" aria-hidden="true">{t.ico}</span>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="set-tabpanel" id="set-tabpanel" role="tabpanel" aria-labelledby={`set-tab-${tab}`}>
              {tab === 'display' && <DisplayTab />}
              {tab === 'clock' && <ClockTab />}
              {tab === 'location' && <LocationTab />}
              {tab === 'tiles' && <TilesTab onClose={() => setOpen(false)} />}
              {tab === 'ticker' && <TickerTab />}
              {tab === 'advanced' && <AdvancedTab />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
