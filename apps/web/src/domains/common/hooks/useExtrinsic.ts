import { ApiPromise } from '@polkadot/api'
import { AddressOrPair } from '@polkadot/api/types'
import { web3FromAddress } from '@polkadot/extension-dapp'
import { ISubmittableResult } from '@polkadot/types/types'
import { useCallback, useContext, useState } from 'react'
import { useRecoilCallback } from 'recoil'

import { ChainContext } from '@domains/chains'
import { SubstrateApiContext, substrateApiState } from '..'
import { extrinsicMiddleware } from '../extrinsicMiddleware'
import { toastExtrinsic } from '../utils'

export const useExtrinsic = <
  TModule extends keyof PickKnownKeys<ApiPromise['tx']>,
  TSection extends keyof PickKnownKeys<ApiPromise['tx'][TModule]>
>(
  module: TModule,
  section: TSection
) => {
  type TExtrinsic = ApiPromise['tx'][TModule][TSection]

  const chain = useContext(ChainContext)
  const apiEndpoint = useContext(SubstrateApiContext).endpoint

  const [loadable, setLoadable] = useState<
    | { state: 'idle'; contents: undefined }
    | { state: 'loading'; contents: ISubmittableResult | undefined }
    | { state: 'hasValue'; contents: ISubmittableResult }
    | { state: 'hasError'; contents: any }
  >({ state: 'idle', contents: undefined })

  const [parameters, setParameters] = useState<[AddressOrPair, ...Parameters<TExtrinsic>]>()

  const reset = useCallback(() => setLoadable({ state: 'idle', contents: undefined }), [])

  const signAndSend = useRecoilCallback(
    callbackInterface =>
      async (account: AddressOrPair, ...params: Parameters<TExtrinsic>) => {
        const { snapshot } = callbackInterface

        setParameters([account, ...params])

        const promiseFunc = async () => {
          const [api, extension] = await Promise.all([
            snapshot.getPromise(substrateApiState(apiEndpoint)),
            web3FromAddress(account.toString()),
          ])

          let resolve = (value: ISubmittableResult) => {}
          let reject = (value: unknown) => {}

          const deferred = new Promise<ISubmittableResult>((_resolve, _reject) => {
            resolve = _resolve
            reject = _reject
          })

          try {
            const extrinsic = api.tx[module]?.[section]?.(...params)
            const unsubscribe = await extrinsic?.signAndSend(account, { signer: extension?.signer }, result => {
              extrinsicMiddleware(chain.id, extrinsic, result, callbackInterface)

              if (result.isError) {
                unsubscribe?.()
                reject(result)
              } else if (result.isFinalized) {
                unsubscribe?.()

                if (result.dispatchError !== undefined) {
                  reject(result)
                } else {
                  resolve(result)
                }
              } else {
                setLoadable({ state: 'loading', contents: result })
              }
            })
          } catch (error) {
            reject(error)
          }

          return deferred
        }

        const promise = promiseFunc()

        setLoadable(loadable => ({
          state: 'loading',
          contents: loadable.state === 'loading' ? loadable.contents : undefined,
        }))

        toastExtrinsic([[module, String(section)]], promise, chain.subscanUrl)

        try {
          const result = await promise
          setLoadable({ state: 'hasValue', contents: result })
          return result
        } catch (error) {
          setLoadable({ state: 'hasError', contents: error })
        }
      },
    [apiEndpoint, chain, module, section]
  )

  return { ...loadable, parameters, signAndSend, reset }
}

export default useExtrinsic
