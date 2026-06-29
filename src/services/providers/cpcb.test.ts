import { describe, it, expect, vi, afterEach } from 'vitest'
import { cpcbAir } from './cpcb'

afterEach(() => vi.restoreAllMocks())

describe('cpcb air adapter', () => {
  it('picks the nearest station PM2.5 and converts to US AQI', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        records: [
          { pollutant_id: 'PM2.5', latitude: '28.61', longitude: '77.20', pollutant_avg: '40' }, // Delhi (far)
          { pollutant_id: 'PM2.5', latitude: '19.08', longitude: '72.88', pollutant_avg: '12' }, // Mumbai (near)
          { pollutant_id: 'PM10', latitude: '19.08', longitude: '72.88', pollutant_avg: '90' },
        ],
      }),
    })) as unknown as typeof fetch)
    const aq = await cpcbAir.fetchAirQuality({ lat: 19.07, lon: 72.87, name: 'Mumbai', countryCode: 'IN' })
    expect(aq.pm25).toBe(12) // nearest = Mumbai station
    expect(aq.usAqi).toBe(50) // 12 µg/m³ → AQI 50
  })

  it('throws when there are no PM2.5 records', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ records: [] }) })) as unknown as typeof fetch)
    await expect(cpcbAir.fetchAirQuality({ lat: 0, lon: 0, name: 'x' })).rejects.toThrow()
  })
})
