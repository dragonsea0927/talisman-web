import { storageEffect } from '@domains/common/effects'
import type { InjectedAccount } from '@polkadot/extension-inject/types'
import { array, jsonParser, object, optional, string } from '@recoiljs/refine'
import { Maybe } from '@util/monads'
import { uniqBy } from 'lodash'
import { atom, selector, waitForAll } from 'recoil'
import { isAddress as isEvmAddress } from 'viem'

type AccountWithOrigin = InjectedAccount & { origin?: 'injected' | 'local' }

type AccountWithReadonlyInfo = InjectedAccount & ({ readonly?: false } | { readonly: true; partOfPortfolio: boolean })

export type Account = AccountWithOrigin & AccountWithReadonlyInfo & { canSignEvm?: boolean }

export type ReadonlyAccount = Pick<Account, 'address' | 'name'>

const _substrateInjectedAccountsState = atom<AccountWithReadonlyInfo[]>({
  key: '_SubstrateInjectedAccounts',
  default: [],
})

export const substrateInjectedAccountsState = selector<Account[]>({
  key: 'SubstrateInjectedAccounts',
  get: ({ get }) => get(_substrateInjectedAccountsState).map(x => ({ ...x, origin: 'injected' })),
  set: ({ set }, newValue) => set(_substrateInjectedAccountsState, newValue),
})

const _readonlyAccountsState = atom<ReadonlyAccount[]>({
  key: 'readonly_accounts',
  default: [],
  effects: [
    storageEffect(localStorage, {
      parser: jsonParser(
        array(
          object({
            address: string(),
            name: optional(string()),
          })
        )
      ),
    }),
  ],
})

export const readOnlyAccountsState = selector<Account[]>({
  key: 'ReadonlyAccounts',
  get: ({ get }) => {
    const injectedAccounts = get(substrateInjectedAccountsState)
    const injectedAddresses = injectedAccounts.map(x => x.address)
    return [
      ...injectedAccounts.filter(x => x.readonly && !x.partOfPortfolio),
      ...get(_readonlyAccountsState)
        .filter(x => !injectedAddresses.includes(x.address))
        .map(x => ({
          ...x,
          origin: 'local' as const,
          readonly: true,
          partOfPortfolio: false,
          type: isEvmAddress(x.address) ? ('ethereum' as const) : undefined,
        })),
    ]
  },
  set: ({ set }, newValue) => set(_readonlyAccountsState, newValue),
})

export const wagmiAccountsState = atom<Account[]>({
  key: 'WagmiAccounts',
  default: [],
})

export const accountsState = selector({
  key: 'Accounts',
  get: ({ get }) => {
    const substrateInjecteds = get(substrateInjectedAccountsState)
    // Hack to retrieve name from that is only available from substrate injected accounts
    const wagmiInjected = get(wagmiAccountsState).map(x => ({
      ...x,
      name: substrateInjecteds.find(y => y.address === x.address)?.name,
    }))

    return uniqBy([...wagmiInjected, ...substrateInjecteds, ...get(readOnlyAccountsState)], x => x.address)
  },
})

export const portfolioAccountsState = selector({
  key: 'PortfolioAccounts',
  get: ({ get }) => get(accountsState).filter(x => !x.readonly || x.partOfPortfolio),
})

export const writeableAccountsState = selector({
  key: 'WriteableAccounts',
  get: ({ get }) => get(accountsState).filter(x => !x.readonly),
})

export const writeableSubstrateAccountsState = selector({
  key: 'WriteableSubstrateAccounts',
  get: ({ get }) => get(writeableAccountsState).filter(x => x.type !== 'ethereum'),
})

export const writeableEvmAccountsState = selector({
  key: 'WriteableEvmAccounts',
  get: ({ get }) => get(writeableAccountsState).filter(x => x.type === 'ethereum'),
})

export const evmSignableAccountsState = selector({
  key: 'EvmSignableAccounts',
  get: ({ get }) => get(writeableAccountsState).filter(x => x.type === 'ethereum' && x.canSignEvm),
})

export const substrateAccountsState = selector({
  key: 'SubstrateAccounts',
  get: ({ get }) => {
    const accounts = get(accountsState)
    return accounts.filter(x => x.type !== 'ethereum')
  },
})

export const evmAccountsState = selector({
  key: 'EvmAccountsState',
  get: ({ get }) => {
    const accounts = get(accountsState)
    return accounts.filter(x => x.type === 'ethereum')
  },
})

export const selectedAccountAddressesState = atom<string[] | undefined>({
  key: 'SelectedAccountAddresses',
  default: undefined,
})

// TODO: either clean this up or add some tests
export const selectedAccountsState = selector({
  key: 'SelectedAccounts',
  get: ({ get }) => {
    const [accounts, portfolioAccounts, readOnlyAccounts, selectedAddresses] = get(
      waitForAll([accountsState, portfolioAccountsState, readOnlyAccountsState, selectedAccountAddressesState])
    )

    const onlyHasReadonlyAccounts = portfolioAccounts.length === 0 && readOnlyAccounts.length > 0
    const defaultDisplayedAccounts = onlyHasReadonlyAccounts
      ? Maybe.of(readOnlyAccounts[0]).mapOr([], x => [x])
      : portfolioAccounts

    if (selectedAddresses === undefined) {
      return defaultDisplayedAccounts
    }

    const selectedAccounts = accounts.filter(({ address }) => selectedAddresses.includes(address))

    // TODO: clean this up
    return selectedAccounts.length === 0 ? defaultDisplayedAccounts : selectedAccounts
  },
})

// For legacy components that only support single account selection
export const legacySelectedAccountState = selector({
  key: 'LegacySelectedAccounts',
  get: ({ get }) => {
    const [accounts, selectedAddresses] = get(waitForAll([accountsState, selectedAccountAddressesState]))

    if (selectedAddresses === undefined) return undefined

    return accounts.filter(({ address }) => selectedAddresses.includes(address))[0]
  },
})

export const selectedSubstrateAccountsState = selector({
  key: 'SelectedSubstrateAccounts',
  get: ({ get }) => {
    return get(selectedAccountsState).filter(x => x.type !== 'ethereum')
  },
})

export const selectedEvmAccountsState = selector({
  key: 'SelectedEvmAccountsState',
  get: ({ get }) => {
    const accounts = get(selectedAccountsState)
    return accounts.filter(x => x.type === 'ethereum')
  },
})
