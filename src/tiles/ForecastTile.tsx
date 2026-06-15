import { TileFrame } from './TileFrame'
import { WeatherIcon } from './WeatherIcon'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'

const toF = (c: number) => Math.round((c * 9) / 5 + 32)

function weekday(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[new Date(dateStr).getDay()]
}

export function ForecastTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  const conv = (c: number) => (units === 'imperial' ? toF(c) : c)
  const daily = weather?.daily ?? []

  return (
    <TileFrame style={{ width: '100%', height: '100%' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 12 }}>
        7-day outlook
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
        {daily.map((d) => (
          <div key={d.date} data-testid="forecast-day" style={{ textAlign: 'center', fontSize: '0.8rem', flex: 1 }}>
            <div style={{ color: 'var(--text-dim)' }}>{weekday(d.date)}</div>
            <WeatherIcon code={d.code} isDay={true} size={28} />
            <div style={{ fontWeight: 600 }}>{conv(d.tempMax)}°</div>
            <div style={{ color: 'var(--text-dim)' }}>{conv(d.tempMin)}°</div>
          </div>
        ))}
      </div>
    </TileFrame>
  )
}
