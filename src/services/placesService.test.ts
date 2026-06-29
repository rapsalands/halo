import { describe, it, expect, beforeEach } from 'vitest'
import { ingestPlaces, searchPlaces, placesReady, resetPlaces, type CompactRow } from './placesService'

const US: CompactRow[] = [
  ['10001', 'New York', 'NY', 40.7506, -73.9971, 21102, 'America/New_York'],
  ['62701', 'Springfield', 'IL', 39.7989, -89.6442, 114000],
  ['01103', 'Springfield', 'MA', 42.1015, -72.5898, 153000],
  ['97477', 'Springfield', 'OR', 44.0462, -123.0220, 47000],
  ['60616', 'Chicago', 'IL', 41.8486, -87.6321, 35000],
  ['60601', 'Chicago', 'IL', 41.8857, -87.6225, 5000],
]

describe('places search', () => {
  beforeEach(() => { resetPlaces(); ingestPlaces('US', 'United States', US) })

  it('is ready once data is ingested', () => {
    expect(placesReady()).toBe(true)
  })

  it('matches cities by name prefix and carries the timezone', () => {
    const r = searchPlaces('new')
    expect(r[0]).toMatchObject({ name: 'New York', admin1: 'NY', countryCode: 'US', country: 'United States', timezone: 'America/New_York' })
    expect(r[0].lat).toBeCloseTo(40.7506)
  })

  it('dedupes a city to one entry per state, ranked by population', () => {
    const r = searchPlaces('springfield')
    const labels = r.map((x) => `${x.name},${x.admin1}`)
    expect(labels).toEqual(['Springfield,MA', 'Springfield,IL', 'Springfield,OR']) // 153k > 114k > 47k
  })

  it('collapses many ZIPs of one city into a single city result', () => {
    const r = searchPlaces('chicago')
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ name: 'Chicago', admin1: 'IL' })
    expect(r[0].lat).toBeCloseTo(41.8486) // the higher-population ZIP's coords
  })

  it('matches ZIP code by prefix', () => {
    const r = searchPlaces('606')
    expect(r.map((x) => x.name).sort()).toEqual(['Chicago', 'Chicago'])
  })

  it('respects the limit', () => {
    expect(searchPlaces('s', 10)).toEqual([]) // single char ignored
    expect(searchPlaces('springfield', 2)).toHaveLength(2)
  })

  it('returns nothing for an unknown place', () => {
    expect(searchPlaces('paris')).toEqual([])
  })
})

describe('places search — multiple countries', () => {
  const IN: CompactRow[] = [
    ['400008', 'Mumbai Central', 'Maharashtra', 18.9712, 72.8194, 0],
    ['110001', 'New Delhi G.P.O.', 'Delhi', 28.6139, 77.209, 0],
  ]
  beforeEach(() => {
    resetPlaces()
    ingestPlaces('US', 'United States', US)
    ingestPlaces('IN', 'India', IN)
  })

  it('matches a city in either country with the right country label', () => {
    const r = searchPlaces('mumbai')
    expect(r[0]).toMatchObject({ name: 'Mumbai Central', admin1: 'Maharashtra', country: 'India', countryCode: 'IN' })
  })

  it('matches a 6-digit India PIN as well as a 5-digit US ZIP', () => {
    expect(searchPlaces('110001')[0]).toMatchObject({ name: 'New Delhi G.P.O.', countryCode: 'IN' })
    expect(searchPlaces('10001')[0]).toMatchObject({ name: 'New York', countryCode: 'US' })
  })
})
