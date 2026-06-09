export interface AqiBand { label: string; color: string }

/** US-AQI value → human band + color, per the EPA scale. */
export function aqiCategory(aqi: number): AqiBand {
  if (aqi <= 50) return { label: 'Good', color: '#5fd38a' }
  if (aqi <= 100) return { label: 'Moderate', color: '#ffd56b' }
  if (aqi <= 150) return { label: 'Sensitive', color: '#ff9e6d' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ff7e7e' }
  if (aqi <= 300) return { label: 'Very unhealthy', color: '#c982ff' }
  return { label: 'Hazardous', color: '#ff5f7e' }
}
