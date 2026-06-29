export interface AqiBand { label: string; color: string }

/** EPA PM2.5 (µg/m³) → US-AQI breakpoints: [Clo, Chi, Ilo, Ihi]. */
const PM25_BANDS: [number, number, number, number][] = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 350.4, 301, 400],
  [350.5, 500.4, 401, 500],
]

/** US AQI from a PM2.5 concentration (µg/m³), via the EPA piecewise formula. */
export function aqiFromPm25(c: number): number {
  if (!(c > 0)) return 0
  for (const [clo, chi, ilo, ihi] of PM25_BANDS) {
    if (c <= chi) return Math.round(((ihi - ilo) / (chi - clo)) * (c - clo) + ilo)
  }
  return 500
}

/** Inverse: estimate PM2.5 concentration (µg/m³) from a US AQI value. */
export function pm25FromAqi(aqi: number): number {
  if (!(aqi > 0)) return 0
  for (const [clo, chi, ilo, ihi] of PM25_BANDS) {
    if (aqi <= ihi) return Math.round((((chi - clo) / (ihi - ilo)) * (aqi - ilo) + clo) * 10) / 10
  }
  return PM25_BANDS[PM25_BANDS.length - 1][1]
}

/** US-AQI value → human band + color, per the EPA scale. */
export function aqiCategory(aqi: number): AqiBand {
  if (aqi <= 50) return { label: 'Good', color: '#5fd38a' }
  if (aqi <= 100) return { label: 'Moderate', color: '#ffd56b' }
  if (aqi <= 150) return { label: 'Sensitive', color: '#ff9e6d' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ff7e7e' }
  if (aqi <= 300) return { label: 'Very unhealthy', color: '#c982ff' }
  return { label: 'Hazardous', color: '#ff5f7e' }
}
