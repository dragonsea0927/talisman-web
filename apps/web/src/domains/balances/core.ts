// TODO: nuke everything and re-write balances lib integration

import {
  accountsState,
  portfolioAccountsState,
  selectedAccountsState,
  writeableAccountsState,
} from '@domains/accounts/recoils'
import { Balances } from '@talismn/balances'
import { useBalances as _useBalances, useSetBalancesAddresses } from '@talismn/balances-react'
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
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const selectedBalancesState = selector({
  key: 'SelectedBalances',
  get: ({ get }) => {
    const accounts = get(selectedAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const selectedBalancesFiatSumState = selector({
  key: 'SelectedBalancesFiatSum',
  get: ({ get }) => get(selectedBalancesState).sum.fiat(get(selectedCurrencyState)),
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const portfolioBalancesState = selector({
  key: 'PortfolioBalances',
  get: ({ get }) => {
    const accounts = get(portfolioAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const portfolioBalancesFiatSumState = selector({
  key: 'PortfolioBalancesFiatSum',
  get: ({ get }) => get(portfolioBalancesState).sum.fiat(get(selectedCurrencyState)),
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const writeableBalancesState = selector({
  key: 'WritableBalances',
  get: ({ get }) => {
    const accounts = get(writeableAccountsState).map(x => x.address)
    return new Balances(get(balancesState).sorted.filter(x => accounts.includes(x.address)))
  },
  dangerouslyAllowMutability: true,
  cachePolicy_UNSTABLE: { eviction: 'most-recent' },
})

export const BalancesWatcher = () => {
  const accounts = useRecoilValue(accountsState)
  const addresses = useMemo(() => accounts.map(x => x.address), [accounts])
  useSetBalancesAddresses(addresses)

  const unfilteredBalances = _useBalances()
  const balances = useMemo(() => unfilteredBalances.filterNonZero('total').filterMirrorTokens(), [unfilteredBalances])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(
    useRecoilCallback(({ set }) => () => {
      set(balancesState, balances)
    }),
    [balances]
  )

  useBalancesReportEffect()

  return null
}
