import { useState } from 'react'
import { useSettings } from '../store/settings'
import type { TileId, Units, Performance, BackgroundMode, LayoutPreset, Preview } from '../store/defaults'
import { DEMO_NAMES } from '../lib/demo'
import { geocodeCity } from '../data/geo'
import { encodeConfig, decodeConfig } from './configIO'

const TILE_LABELS: Record<TileId, string> = {
  clock: 'Clock', weather: 'Weather', calendar: 'Calendar',
  sunmoon: 'Sun & Moon', quote: 'Quote', ticker: 'Ticker',
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState('')
  const [importText, setImportText] = useState('')
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)

  async function searchCity() {
    const loc = await geocodeCity(city)
    if (loc) update({ location: loc })
  }

  const field = { display: 'block', margin: '12px 0 4px', fontSize: '0.8rem', color: 'var(--text-dim)' } as const

  return (
    <>
      <button
        aria-label="Settings"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 20, width: 40, height: 40,
          borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer', fontSize: '1.1rem',
        }}
      >
        ⚙
      </button>

      {open && (
        <div
          data-testid="settings-overlay"
          style={{
            position: 'absolute', inset: 0, zIndex: 30, display: 'flex',
            justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="glass" style={{ width: 360, height: '100%', overflowY: 'auto', borderRadius: 0, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem' }}>Settings</h2>
              <button aria-label="Close" onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            <label htmlFor="layout" style={field}>Layout</label>
            <select id="layout" value={settings.layout}
              onChange={(e) => update({ layout: e.target.value as LayoutPreset })}>
              <option value="photo-first">Photo-first</option>
              <option value="bento">Bento</option>
            </select>

            <label htmlFor="background" style={field}>Background</label>
            <select id="background" value={settings.backgroundMode}
              onChange={(e) => update({ backgroundMode: e.target.value as BackgroundMode })}>
              <option value="weather">Weather sky</option>
              <option value="photo">Photo gallery</option>
            </select>

            <label htmlFor="preview" style={field}>Preview scene</label>
            <select id="preview" value={settings.preview}
              onChange={(e) => update({ preview: e.target.value as Preview })}>
              <option value="live">Live (real weather)</option>
              {DEMO_NAMES.map((n) => (
                <option key={n} value={n}>{n[0].toUpperCase() + n.slice(1)}</option>
              ))}
            </select>

            <label htmlFor="performance" style={field}>Performance</label>
            <select id="performance" value={settings.performance}
              onChange={(e) => update({ performance: e.target.value as Performance })}>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>

            <label htmlFor="units" style={field}>Units</label>
            <select id="units" value={settings.units}
              onChange={(e) => update({ units: e.target.value as Units })}>
              <option value="metric">Metric (°C)</option>
              <option value="imperial">Imperial (°F)</option>
            </select>

            <label style={{ ...field, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={settings.hour12}
                onChange={(e) => update({ hour12: e.target.checked })} />
              12-hour clock
            </label>

            <label htmlFor="country" style={field}>Holiday country (ISO-2)</label>
            <input id="country" value={settings.holidayCountry} maxLength={2}
              onChange={(e) => update({ holidayCountry: e.target.value.toUpperCase() })} />

            <label htmlFor="city" style={field}>Location</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input id="city" placeholder={settings.location?.name ?? 'Auto-detected'}
                value={city} onChange={(e) => setCity(e.target.value)} />
              <button onClick={searchCity}>Search</button>
            </div>
            <button style={{ marginTop: 6 }} onClick={() => update({ location: null })}>Auto-detect</button>

            <div style={field}>Tiles</div>
            {(Object.keys(TILE_LABELS) as TileId[]).map((id) => (
              <label key={id} style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '4px 0' }}>
                <input type="checkbox" checked={settings.enabledTiles[id]}
                  onChange={(e) => update({ enabledTiles: { ...settings.enabledTiles, [id]: e.target.checked } })} />
                {TILE_LABELS[id]}
              </label>
            ))}

            <div style={field}>Export / Import config</div>
            <textarea readOnly value={encodeConfig(settings)} rows={3}
              style={{ width: '100%', fontSize: '0.7rem' }} />
            <textarea placeholder="Paste config to import" rows={3} value={importText}
              onChange={(e) => setImportText(e.target.value)} style={{ width: '100%', fontSize: '0.7rem', marginTop: 6 }} />
            <button style={{ marginTop: 6 }} onClick={() => { const c = decodeConfig(importText); if (c) update(c) }}>
              Apply imported config
            </button>
          </div>
        </div>
      )}
    </>
  )
}
