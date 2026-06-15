import { TileFrame } from './TileFrame'
import { WeatherIcon } from './WeatherIcon'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { describeCode } from '../lib/weatherCodes'
import { formatClock } from '../lib/time'

const toF = (c: number) => Math.round((c * 9) / 5 + 32)

export function WeatherTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  const hour12 = useSettings((s) => s.settings.hour12)
  if (!weather) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Weather unavailable</div></TileFrame>
  }
  const conv = (c: number) => (units === 'imperial' ? toF(c) : c)
  const { label } = describeCode(weather.code)
  // Defensive: cached weather from an older app version may lack these arrays.
  const daily = weather.daily ?? []
  const today = daily[0]
  const hours = (weather.hourly ?? []).slice(0, 8)

  return (
    <TileFrame style={{ minWidth: 320 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <WeatherIcon code={weather.code} isDay={weather.isDay} size={60} />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1 }}>{conv(weather.temp)}°</span>
            <span style={{ fontSize: '1.05rem', color: 'var(--text-dim)' }}>{label}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Feels {conv(weather.feelsLike)}°
            {today && <> · H {conv(today.tempMax)}° L {conv(today.tempMin)}°</>}
          </div>
        </div>
      </div>

      {weather.stale && (
        <div style={{ fontSize: '0.7rem', color: '#ffd27e', marginTop: 4 }}>· offline, last update</div>
      )}

      {hours.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 8 }}>
          {hours.map((h) => (
            <div key={h.time} style={{ textAlign: 'center', fontSize: '0.72rem' }}>
              <div style={{ color: 'var(--text-dim)' }}>{formatClock(new Date(h.time), hour12)}</div>
              <WeatherIcon code={h.code} isDay={weather.isDay} size={26} />
              <div style={{ fontWeight: 600 }}>{conv(h.temp)}°</div>
            </div>
          ))}
        </div>
      )}
    </TileFrame>
  )
}
