export type Condition =
  | 'clear' | 'partly' | 'cloudy' | 'overcast' | 'fog'
  | 'drizzle' | 'rain' | 'snow' | 'thunder'

export type Scene =
  | 'clear-day' | 'clear-night' | 'cloudy' | 'fog' | 'rain' | 'thunder' | 'snow'

interface CodeInfo { condition: Condition; label: string }

const TABLE: Record<number, CodeInfo> = {
  0: { condition: 'clear', label: 'Clear sky' },
  1: { condition: 'clear', label: 'Mainly clear' },
  2: { condition: 'partly', label: 'Partly cloudy' },
  3: { condition: 'overcast', label: 'Overcast' },
  45: { condition: 'fog', label: 'Fog' },
  48: { condition: 'fog', label: 'Rime fog' },
  51: { condition: 'drizzle', label: 'Light drizzle' },
  53: { condition: 'drizzle', label: 'Drizzle' },
  55: { condition: 'drizzle', label: 'Dense drizzle' },
  56: { condition: 'drizzle', label: 'Freezing drizzle' },
  57: { condition: 'drizzle', label: 'Freezing drizzle' },
  61: { condition: 'rain', label: 'Light rain' },
  63: { condition: 'rain', label: 'Rain' },
  65: { condition: 'rain', label: 'Heavy rain' },
  66: { condition: 'rain', label: 'Freezing rain' },
  67: { condition: 'rain', label: 'Freezing rain' },
  71: { condition: 'snow', label: 'Light snow' },
  73: { condition: 'snow', label: 'Snow' },
  75: { condition: 'snow', label: 'Heavy snow' },
  77: { condition: 'snow', label: 'Snow grains' },
  80: { condition: 'rain', label: 'Rain showers' },
  81: { condition: 'rain', label: 'Rain showers' },
  82: { condition: 'rain', label: 'Violent showers' },
  85: { condition: 'snow', label: 'Snow showers' },
  86: { condition: 'snow', label: 'Snow showers' },
  95: { condition: 'thunder', label: 'Thunderstorm' },
  96: { condition: 'thunder', label: 'Thunderstorm, hail' },
  99: { condition: 'thunder', label: 'Thunderstorm, hail' },
}

export function describeCode(code: number): CodeInfo {
  return TABLE[code] ?? { condition: 'cloudy', label: 'Unknown' }
}

export function sceneFor(code: number, isDay: boolean): Scene {
  const { condition } = describeCode(code)
  switch (condition) {
    case 'thunder': return 'thunder'
    case 'snow': return 'snow'
    case 'rain':
    case 'drizzle': return 'rain'
    case 'fog': return 'fog'
    case 'partly':
    case 'overcast':
    case 'cloudy': return 'cloudy'
    case 'clear':
    default: return isDay ? 'clear-day' : 'clear-night'
  }
}
