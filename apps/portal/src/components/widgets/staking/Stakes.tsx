import { ChainProvider, nominationPoolsEnabledChainsState } from '../../../domains/chains'
import { useTotalStaked } from '../../../domains/staking'
import SectionHeader from '../../molecules/SectionHeader'
import AnimatedFiatNumber from '../AnimatedFiatNumber'
import ErrorBoundary from '../ErrorBoundary'
import DappStakes from './dappStaking/Stakes'
import LidoStakes from './lido/Stakes'
import SlpxStakes from './slpx/Stakes'
import SlpxSubstrateStakes from './slpxSubstrate/SlpxSubstrateStakes'
import PoolStakes from './substrate/PoolStakes'
import ValidatorStakes from './substrate/ValidatorStakes'
import SubtensorStakes from './subtensor/Stakes'
import StakePosition, { StakePositionList } from '@/components/recipes/StakePosition'
import { Button, HiddenDetails, Text } from '@talismn/ui'
import { useState } from 'react'
import { Fragment, Suspense, type PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'

const NoStakePrompt = (props: { className?: string }) => (
  <div className={props.className}>
    <HiddenDetails
      hidden
      overlay={
        <div
          css={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '3.2rem',
          }}
        >
          <Text.Body>You have no staked assets yet...</Text.Body>
          <Button as={Link} variant="outlined" to="/staking">
            Get started
          </Button>
        </div>
      }
    >
      <section css={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
        <StakePosition.Skeleton animate={false} />
        <StakePosition.Skeleton animate={false} />
      </section>
    </HiddenDetails>
  </div>
)

const StakeTotal = () => <AnimatedFiatNumber end={useTotalStaked()} />

const StakeHeader = () => {
  return (
    <SectionHeader
      headlineContent="Staking"
      supportingContent={
        <ErrorBoundary fallback={<></>}>
          <Suspense>
            <StakeTotal />
          </Suspense>
        </ErrorBoundary>
      }
    />
  )
}

const skellyClassName = 'staking-skeleton'

const SuspenseSkeleton = (props: PropsWithChildren) => (
  <Suspense fallback={<StakePosition.Skeleton className={skellyClassName} css={{ order: 1 }} />} {...props} />
)

const Stakes = (props: { hideHeader?: boolean }) => {
  const chains = useRecoilValue(nominationPoolsEnabledChainsState)
  const [shouldRenderLoadingSkeleton, setShouldRenderLoadingSkeleton] = useState<boolean>(true)

  return (
    <div id="staking">
      {!props.hideHeader && <StakeHeader />}
      <StakePositionList
        css={{
          [`[class~=${skellyClassName}]:not(:nth-last-child(1 of [class~=${skellyClassName}]))`]: { display: 'none' },
        }}
      >
        {shouldRenderLoadingSkeleton && <StakePosition.Skeleton className={skellyClassName} css={{ order: 1 }} />}

        {chains.map((chain, index) => {
          return (
            <Fragment key={index}>
              <ChainProvider chain={chain}>
                <ErrorBoundary orientation="horizontal">
                  <SuspenseSkeleton>
                    <PoolStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
                  </SuspenseSkeleton>
                </ErrorBoundary>
                <ErrorBoundary orientation="horizontal">
                  <SuspenseSkeleton>
                    <ValidatorStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
                  </SuspenseSkeleton>
                </ErrorBoundary>
              </ChainProvider>
            </Fragment>
          )
        })}
        <ErrorBoundary orientation="horizontal">
          <SuspenseSkeleton>
            <SlpxStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
          </SuspenseSkeleton>
          <ErrorBoundary orientation="horizontal"></ErrorBoundary>
          <SuspenseSkeleton>
            <SlpxSubstrateStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
          </SuspenseSkeleton>
        </ErrorBoundary>
        <ErrorBoundary orientation="horizontal">
          <SuspenseSkeleton>
            <SubtensorStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
          </SuspenseSkeleton>
        </ErrorBoundary>
        <ErrorBoundary orientation="horizontal">
          <SuspenseSkeleton>
            <DappStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
          </SuspenseSkeleton>
        </ErrorBoundary>
        <ErrorBoundary orientation="horizontal">
          <SuspenseSkeleton>
            <LidoStakes setShouldRenderLoadingSkeleton={setShouldRenderLoadingSkeleton} />
          </SuspenseSkeleton>
        </ErrorBoundary>
        <NoStakePrompt css={{ display: 'none', ':only-child': { display: 'revert' } }} />
      </StakePositionList>
    </div>
  )
}

export default Stakes
