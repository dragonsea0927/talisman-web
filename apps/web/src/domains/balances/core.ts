// TODO: nuke everything and re-write balances lib integration

import {
  accountsState,
  portfolioAccountsState,
  selectedAccountsState,
  writeableAccountsState,
} from '@domains/accounts/recoils'
import { Balances } from '@talismn/balances'
import { useBalances as _useBalances, useAllAddresses, useTokenRates, useTokens } from '@talismn/balances-react'
import type { TokenRates } from '@talismn/token-rates'
import { isNil } from 'lodash'
import { useEffect, useMemo } from 'react'
import { atom, selector, useRecoilCallback, useRecoilValue } from 'recoil'
import { selectedCurrencyState } from '.'
import { useBalancesReportEffect } from './analytics'

export const balancesState = atom<Balances>({
  key: 'Balances',
  default: new Balances([]),
  dangerouslyAllowMutability: true,
})

export const fiatBalanceGetterState = selector({
  key: 'FiatBalanceGetter',
  get: ({ get }) => {
    const balances = get(balancesState)
    const currency = get(selectedCurrencyState)
    return (address: string) => balances.find({ address }).sum.fiat(currency)
  },
})

export const selectedBalancesState = selector({
  key: 'SelectedBalances',
  get: ({ get }) => {
    const accounts = get(selectedAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
})

export const selectedBalancesFiatSumState = selector({
  key: 'SelectedBalancesFiatSum',
  get: ({ get }) => get(selectedBalancesState).sum.fiat(get(selectedCurrencyState)),
})

export const portfolioBalancesState = selector({
  key: 'PortfolioBalances',
  get: ({ get }) => {
    const accounts = get(portfolioAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
})

export const portfolioBalancesFiatSumState = selector({
  key: 'PortfolioBalancesFiatSum',
  get: ({ get }) => get(portfolioBalancesState).sum.fiat(get(selectedCurrencyState)),
})

export const writeableBalancesState = selector({
  key: 'WritableBalances',
  get: ({ get }) => {
    const accounts = get(writeableAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
})

export const tokenRatesState = atom<Record<string, TokenRates>>({ key: 'TokenRates' })

export const BalancesWatcher = () => {
  const accounts = useRecoilValue(accountsState)
  const addresses = useMemo(() => accounts.map(x => x.address), [accounts])

  const [, setAllAddresses] = useAllAddresses()
  useEffect(() => setAllAddresses(addresses ?? []), [addresses, setAllAddresses])

  const tokens = useTokens()
  const tokenIds = useMemo(() => Object.values(tokens).map(({ id }) => id), [tokens])

  const addressesByToken = useMemo(
    () => {
      if (isNil(addresses)) return {}
      return Object.fromEntries(tokenIds.map(tokenId => [tokenId, addresses]))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(addresses), JSON.stringify(tokenIds)]
  )

  const unfilteredBalances = _useBalances(addressesByToken)
  const balances = useMemo(
    () =>
      unfilteredBalances
        .filterNonZero('total')
        .filterMirrorTokens()
        // TODO: This is to remove native custom token coming from the extension with newer id
        // remove once we update balances lib
        // @ts-expect-error
        .find(x => !x.tokenId.endsWith('evm-native') && !x.tokenId.endsWith('substrate-native')),
    [unfilteredBalances]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    useRecoilCallback(({ set }) => () => {
      set(balancesState, balances)
    }),
    [balances]
  )

  useBalancesReportEffect()

  const tokenRates = useTokenRates()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    useRecoilCallback(
      ({ set }) =>
        () => {
          set(
            tokenRatesState,
            Object.fromEntries(
              Object.entries(tokenRates)
                .map(([key, value]) => [tokens[key]?.coingeckoId, value] as const)
                .filter(([key]) => key !== undefined)
            )
          )
        },
      [tokenRates, tokens]
    ),
    [tokenRates, tokens]
  )

  return null
}
