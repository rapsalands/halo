import { TileFrame } from './TileFrame'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { describeCode } from '../lib/weatherCodes'

const toF = (c: number) => Math.round((c * 9) / 5 + 32)

function weekday(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

export function WeatherTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  if (!weather) {
    return <TileFrame><div style={{ color: 'var(--text-dim)' }}>Weather unavailable</div></TileFrame>
  }
  const temp = units === 'imperial' ? toF(weather.temp) : weather.temp
  const { label } = describeCode(weather.code)
  return (
    <TileFrame>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: '3.6rem', fontWeight: 800 }}>{temp}°</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)' }}>{label}</span>
      </div>
      {weather.stale && (
        <div style={{ fontSize: '0.7rem', color: '#ffd27e', marginTop: 2 }}>· stale</div>
      )}
      <div style={{ display: 'flex', gap: 18, marginTop: 16 }}>
        {weather.daily.map((d) => (
          <div key={d.date} data-testid="forecast-day" style={{ textAlign: 'center', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-dim)' }}>{weekday(d.date)}</div>
            <div style={{ fontWeight: 600 }}>
              {units === 'imperial' ? toF(d.tempMax) : d.tempMax}°
            </div>
            <div style={{ color: 'var(--text-dim)' }}>
              {units === 'imperial' ? toF(d.tempMin) : d.tempMin}°
            </div>
          </div>
        ))}
      </div>
    </TileFrame>
  )
}
