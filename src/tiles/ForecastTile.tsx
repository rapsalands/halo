import { TileFrame } from './TileFrame'
import { TileLabel } from './TileLabel'
import { WeatherIcon } from './WeatherIcon'
import { useAppState } from '../store/appState'
import { useSettings } from '../store/settings'
import { weekdayShort } from '../lib/time'
import { tempIn } from '../lib/units'

export function ForecastTile() {
  const weather = useAppState((s) => s.weather)
  const units = useSettings((s) => s.settings.units)
  const conv = (c: number) => tempIn(c, units)
  const daily = weather?.daily ?? []

  return (
    <TileFrame style={{ width: '100%', height: '100%' }}>
      <TileLabel style={{ marginBottom: 12 }}>7-day outlook</TileLabel>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
        {daily.map((d) => (
          <div key={d.date} data-testid="forecast-day" style={{ textAlign: 'center', fontSize: '0.8rem', flex: 1 }}>
            <div style={{ color: 'var(--text-dim)' }}>{weekdayShort(d.date)}</div>
            <WeatherIcon code={d.code} isDay={true} size={28} />
            <div style={{ fontWeight: 600 }}>{conv(d.tempMax)}°</div>
            <div style={{ color: 'var(--text-dim)' }}>{conv(d.tempMin)}°</div>
          </div>
        ))}
      </div>
    </TileFrame>
  )
}
