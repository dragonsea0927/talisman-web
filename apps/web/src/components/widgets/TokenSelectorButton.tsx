import Cryptoticon from '@components/recipes/Cryptoticon/Cryptoticon'
import TokenSelectorDialog from '@components/recipes/TokenSelectorDialog'
import type { Account } from '@domains/accounts'
import { selectedBalancesState, selectedCurrencyState } from '@domains/balances'
import type { IToken } from '@talismn/chaindata-provider'
import { Decimal } from '@talismn/math'
import { Button } from '@talismn/ui'
import { useMemo, useState } from 'react'
import { useRecoilValue, waitForAll } from 'recoil'

export type TokenSelectorProps<T extends IToken | string> = {
  account?: Account
  tokens: T[]
  selectedToken: T | undefined
  onChangeToken: (token: T) => unknown
}

const TokenSelectorButton = <T extends IToken | string>(props: TokenSelectorProps<T>) => {
  const [tokenSelectorDialogOpen, setTokenSelectorDialogOpen] = useState(false)
  const [balances, currency] = useRecoilValue(waitForAll([selectedBalancesState, selectedCurrencyState]))

  const filteredBalances = useMemo(
    () => (props.account === undefined ? balances : balances.find({ address: props.account.address })),
    [balances, props.account]
  )

  const tokensWithBalance = useMemo(
    () =>
      props.tokens.map(x => {
        const balance = filteredBalances.find(
          typeof x === 'string' ? y => y.token?.symbol.toLowerCase() === x.toLowerCase() : { id: x.id }
        )
        const transferable = Decimal.fromPlanck(balance.sum.planck.transferable, balance.each.at(0)?.decimals ?? 9)
        const symbol = typeof x === 'string' ? x : x.symbol

        return {
          token: x,
          symbol,
          logo:
            balance.each.at(0)?.token?.logo ?? `https://token-resources.vercel.app/tokens/${symbol.toUpperCase()}.png`,
          transferable,
          fiatTransferable: balance.sum.fiat(currency).transferable,
        }
      }),
    [filteredBalances, currency, props.tokens]
  )
  const selectedToken = useMemo<{ symbol: string; logo?: string }>(
    () =>
      typeof props.selectedToken === 'string'
        ? filteredBalances
            .find(x => x.token?.symbol.toLowerCase() === props.selectedToken?.toString().toLowerCase())
            .each.at(0)?.token ?? { symbol: props.selectedToken, logo: undefined }
        : (props.selectedToken as IToken),
    [filteredBalances, props.selectedToken]
  )

  return (
    <>
      {selectedToken === undefined ? (
        <Button variant="surface" onClick={() => setTokenSelectorDialogOpen(true)}>
          Select token
        </Button>
      ) : (
        <Button
          variant="surface"
          onClick={() => setTokenSelectorDialogOpen(true)}
          leadingIcon={<Cryptoticon src={selectedToken.logo} />}
        >
          {selectedToken.symbol}
        </Button>
      )}
      {tokenSelectorDialogOpen && (
        <TokenSelectorDialog onRequestDismiss={() => setTokenSelectorDialogOpen(false)}>
          {tokensWithBalance
            .sort((a, b) => b.fiatTransferable - a.fiatTransferable || b.transferable.planck.cmp(a.transferable.planck))
            .map((x, index) => (
              <TokenSelectorDialog.Item
                key={index}
                logoSrc={x.logo}
                name={x.symbol}
                amount={x.transferable.toHuman()}
                fiatAmount={x.fiatTransferable.toLocaleString(undefined, {
                  style: 'currency',
                  currency,
                  compactDisplay: 'short',
                })}
                onClick={() => {
                  props.onChangeToken(x.token)
                  setTokenSelectorDialogOpen(false)
                }}
              />
            ))}
        </TokenSelectorDialog>
      )}
    </>
  )
}

export default TokenSelectorButton
