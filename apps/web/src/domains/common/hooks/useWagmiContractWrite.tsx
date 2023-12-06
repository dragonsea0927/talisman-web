import { useContractWrite, useNetwork, type UseContractWriteConfig, useSwitchNetwork } from 'wagmi'
import { type Abi } from 'abitype'
import { type WriteContractMode } from '@wagmi/core'
import { Text, toast } from '@talismn/ui'
import { Maybe } from '@util/monads'
import { usePostHog } from 'posthog-js/react'

export const useWagmiContractWrite = <
  TAbi extends Abi | readonly unknown[],
  TFunctionName extends string,
  TMode extends WriteContractMode = undefined
>({
  etherscanUrl,
  ...config
}: UseContractWriteConfig<TAbi, TFunctionName, TMode> & {
  etherscanUrl: string
}) => {
  const posthog = usePostHog()

  const { switchNetworkAsync } = useSwitchNetwork()
  const { chain } = useNetwork()

  // @ts-expect-error
  const { write: _, ...base } = useContractWrite(config)

  return {
    ...base,
    writeAsync: Maybe.of(base.writeAsync).mapOrUndefined(writeAsync => async (...args: any[]) => {
      if (config.chainId !== undefined && chain?.id !== config.chainId) {
        await switchNetworkAsync?.(config.chainId)
      }

      const promise = writeAsync(...args)
      void toast.promise(promise, {
        loading: (
          <>
            <Text.Body as="div" alpha="high">
              Your transaction is pending...
            </Text.Body>
            <Text.Body as="div">Your transaction has been confirmed</Text.Body>
          </>
        ),
        error: (
          <Text.Body as="div" alpha="high">
            Your transaction was unsuccessful
          </Text.Body>
        ),
        success: result => {
          posthog?.capture('Write to EVM contract', {
            chainId: config.chainId,
            hash: result.hash,
            contractAddress: config.address,
            functionName: config.functionName,
            // @ts-expect-error
            args: config.args,
            // @ts-expect-error
            value: config.value,
          })
          const url = new URL('/tx/' + result.hash, etherscanUrl)
          return (
            <>
              <Text.Body as="div" alpha="high">
                Your transaction was successful
              </Text.Body>
              {etherscanUrl && (
                <Text.Body as="div">
                  View details on{' '}
                  <Text.Body as="a" alpha="high" href={url.toString()} target="_blank">
                    Etherscan
                  </Text.Body>
                </Text.Body>
              )}
            </>
          )
        },
      })
      return await promise
    }) as (typeof base)['writeAsync'],
  }
}
