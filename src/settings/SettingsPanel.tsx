import { useState, type ReactNode } from 'react'
import { useSettings, mergeLayout } from '../store/settings'
import {
  ACCENT_SWATCHES, TICKER_CURRENCIES, TILE_LABELS, DEFAULT_LAYOUT, DEFAULT_SETTINGS,
  type TileId, type Units, type Performance, type Preview,
} from '../store/defaults'
import { useAppState } from '../store/appState'
import { DEMO_NAMES } from '../lib/demo'
import { geocodeCity } from '../data/geo'
import { encodeConfig, decodeConfig } from './configIO'
import './settings.css'

const CURRENCY_OPTS = Object.keys(TICKER_CURRENCIES).map((c) => ({ value: c, label: c.toUpperCase() }))
const HOURS = Array.from({ length: 24 }, (_, h) => h)
function hourLabel(h: number): string { return `${h.toString().padStart(2, '0')}:00` }

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

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState('')
  const [importText, setImportText] = useState('')
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const setEditMode = useAppState((s) => s.setEditMode)
  const [coinsText, setCoinsText] = useState(settings.tickerCoins.join(', '))

  async function searchCity() {
    const loc = await geocodeCity(city)
    if (loc) { update({ location: loc }); setCity('') }
  }

  function commitCoins() {
    const ids = coinsText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    if (ids.length) update({ tickerCoins: ids })
  }

  return (
    <>
      <button className="set-gear" aria-label="Settings" onClick={() => setOpen(true)}>⚙</button>

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

            <Section title="Appearance">
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
            </Section>

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

            <Section title="Clock & units">
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

            <Section title="Kiosk">
              <div className="set-row">
                <Toggle label="Onboarding banner" checked={settings.showOnboardingBanner} onChange={(showOnboardingBanner) => update({ showOnboardingBanner })} />
              </div>
            </Section>

            <Section title="Markets ticker">
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
            </Section>

            <Section title="Location">
              <div className="set-col">
                <span className="set-label">Search city</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="set-input"
                    placeholder={settings.location?.name ?? 'Auto-detected'}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') searchCity() }}
                  />
                  <button className="set-btn" onClick={searchCity}>Search</button>
                </div>
              </div>
              <div className="set-col">
                <button className="set-btn block" onClick={() => update({ location: null })}>Use auto-detected location</button>
              </div>
              <div className="set-col">
                <label htmlFor="country" className="set-label">Holiday country (ISO-2)</label>
                <input
                  id="country" className="set-input" value={settings.holidayCountry} maxLength={2}
                  onChange={(e) => update({ holidayCountry: e.target.value.toUpperCase() })}
                />
              </div>
            </Section>

            <Section title="Layout">
              <div className="set-col">
                <button
                  className="set-btn block"
                  onClick={() => { setEditMode(true); setOpen(false) }}
                >
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
            </Section>

            <Section title="Tiles">
              {(Object.keys(TILE_LABELS) as TileId[]).map((id) => (
                <div className="set-row" key={id}>
                  <Toggle
                    label={TILE_LABELS[id]}
                    checked={settings.enabledTiles[id]}
                    onChange={(on) => update({ enabledTiles: { ...settings.enabledTiles, [id]: on } })}
                  />
                </div>
              ))}
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
          </div>
        </div>
      )}
    </>
  )
}
