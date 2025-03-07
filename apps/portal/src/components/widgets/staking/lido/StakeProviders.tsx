import { selectedBalancesState, selectedCurrencyState } from '../../../../domains/balances'
import { type LidoSuite } from '../../../../domains/staking/lido'
import { lidoAprState, lidoSuitesState } from '../../../../domains/staking/lido/recoils'
import StakeProvider from '../../../recipes/StakeProvider'
import AnimatedFiatNumber from '../../AnimatedFiatNumber'
import ErrorBoundary from '../../ErrorBoundary'
import RedactableBalance from '../../RedactableBalance'
import ErrorBoundaryFallback from '../ErrorBoundaryFallback'
import { githubChainLogoUrl } from '@talismn/chaindata-provider'
import { Decimal } from '@talismn/math'
import { useSuspenseQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilValue, waitForAll } from 'recoil'
import { useConfig } from 'wagmi'
import { getTokenQueryOptions } from 'wagmi/query'

const Apr = (props: { lidoSuite: LidoSuite }) => (
  <>
    {useRecoilValue(lidoAprState(props.lidoSuite.apiEndpoint)).toLocaleString(undefined, {
      style: 'percent',
      maximumFractionDigits: 2,
    })}
  </>
)

const useAvailableBalance = (lidoSuite: LidoSuite) => {
  const [balances, currency] = useRecoilValue(waitForAll([selectedBalancesState, selectedCurrencyState]))
  const nativeBalance = balances.find(
    x => x.token?.symbol.toLowerCase() === lidoSuite.chain.nativeCurrency.symbol.toLowerCase()
  )
  return useMemo(
    () => ({
      amount: Decimal.fromPlanck(nativeBalance.sum.planck.transferable ?? 0n, nativeBalance.each.at(0)?.decimals ?? 0, {
        currency: lidoSuite.chain.nativeCurrency.symbol,
      }).toLocaleString(),
      fiatAmount: nativeBalance.sum.fiat(currency).total,
    }),
    [currency, lidoSuite.chain.nativeCurrency.symbol, nativeBalance.each, nativeBalance.sum]
  )
}

const AvailableBalance = (props: { lidoSuite: LidoSuite }) => (
  <RedactableBalance>{useAvailableBalance(props.lidoSuite).amount}</RedactableBalance>
)

const AvailableFiatBalance = (props: { lidoSuite: LidoSuite }) => (
  <AnimatedFiatNumber end={useAvailableBalance(props.lidoSuite).fiatAmount} />
)

const StakePercentage = (props: { lidoSuite: LidoSuite }) => {
  const balances = useRecoilValue(selectedBalancesState)

  const config = useConfig()
  const liquidToken = useSuspenseQuery(
    getTokenQueryOptions(config, {
      chainId: props.lidoSuite.chain.id,
      address: props.lidoSuite.token.address,
    })
  )
  const nativeBalance = useMemo(
    () =>
      balances.find(x => x.token?.symbol.toLowerCase() === props.lidoSuite.chain.nativeCurrency.symbol.toLowerCase()),
    [balances, props.lidoSuite.chain.nativeCurrency.symbol]
  )
  const liquidBalance = useMemo(
    () => balances.find(x => x.token?.symbol.toLowerCase() === liquidToken.data?.symbol?.toLowerCase()),
    [balances, liquidToken.data?.symbol]
  )

  return (
    <StakeProvider.StakePercentage
      percentage={useMemo(
        () =>
          liquidBalance.sum.planck.total === 0n
            ? 0
            : new BigNumber(liquidBalance.sum.planck.total.toString())
                .div((nativeBalance.sum.planck.total + liquidBalance.sum.planck.total).toString())
                .toNumber(),
        [liquidBalance.sum.planck.total, nativeBalance.sum.planck.total]
      )}
    />
  )
}

const StakeProviders = () => {
  const lidoSuites = useRecoilValue(lidoSuitesState)
  return (
    <>
      {lidoSuites.map((lidoSuite, index) => {
        const { symbol } = lidoSuite.chain.nativeCurrency
        const logo = githubChainLogoUrl('1')
        const provider = 'Lido'
        return (
          <ErrorBoundary
            key={index}
            orientation="horizontal"
            renderFallback={() => <ErrorBoundaryFallback logo={logo} symbol={symbol} provider={provider} />}
          >
            <StakeProvider
              symbol={symbol}
              logo={logo}
              chain={lidoSuite.chain.name}
              chainId={lidoSuite.chain.id}
              apr={<Apr lidoSuite={lidoSuite} />}
              type="Liquid staking"
              provider={provider}
              unbondingPeriod="1-5 day(s)"
              availableBalance={<AvailableBalance lidoSuite={lidoSuite} />}
              availableFiatBalance={<AvailableFiatBalance lidoSuite={lidoSuite} />}
              stakePercentage={<StakePercentage lidoSuite={lidoSuite} />}
              stakeButton={
                <StakeProvider.StakeButton
                  as={Link}
                  to={`?action=stake&type=lido&token-address=${lidoSuite.token.address}`}
                />
              }
            />
          </ErrorBoundary>
        )
      })}
    </>
  )
}

export default StakeProviders
