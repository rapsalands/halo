import { usePolledData, type PolledState } from './usePolledData'
import { POLL } from '../lib/intervals'
import { fetchMarkets, type Coin } from '../services/marketsService'

/** Crypto ticker prices for the configured coins + fiat. */
export function useMarkets(coins: string[], currency: string): PolledState<Coin[]> {
  return usePolledData<Coin[]>(
    `markets:${currency}:${coins.join(',')}`,
    () => fetchMarkets(coins, currency),
    POLL.markets,
  )
}
