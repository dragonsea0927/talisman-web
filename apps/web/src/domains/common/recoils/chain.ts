// TODO: lots of duplicate type definitions
// but already super burned out, need to de-duplication

import { type ApiPromise } from '@polkadot/api'
import type {
  GenericStorageEntryFunction,
  PromiseResult,
  QueryableStorageEntry,
  StorageEntryPromiseOverloads,
  UnsubscribePromise,
} from '@polkadot/api/types'
import { useContext } from 'react'
import { type RecoilState, type RecoilValueReadOnly, atomFamily, constSelector } from 'recoil'
import { type Observable } from 'rxjs'

import { SubstrateApiContext, substrateApiState } from '..'

export const _chainState = atomFamily({
  key: 'ChainState',
  effects: ([endpoint, typeName, moduleName, sectionName, params]: [string, string, string, string, any[]]) => [
    ({ setSelf, getPromise }) => {
      const apiPromise = getPromise(substrateApiState(endpoint))

      let initialResolve = (_value: unknown) => {}
      let initialReject = (_reason?: any) => {}

      setSelf(
        new Promise((resolve, reject) => {
          initialResolve = resolve
          initialReject = reject
        })
      )

      const unsubscribePromise = apiPromise.then(async api => {
        const [section, multi] = sectionName.split('.')

        const func =
          // @ts-expect-error
          multi === undefined ? api[typeName][moduleName][section] : api[typeName][moduleName][section][multi]

        const parsedParams = multi === undefined ? params : [params]

        const unsubscribePromise: UnsubscribePromise = func(...parsedParams, (result: any) => {
          initialResolve(result)
          setSelf(result)
        }).catch((error: any) => {
          initialReject(error)
        })

        return await unsubscribePromise
      })

      return () => {
        void unsubscribePromise.then(unsubscribe => unsubscribe())
      }
    },
  ],
  dangerouslyAllowMutability: true,
})

export const chainQueryState = <
  TModule extends keyof PickKnownKeys<ApiPromise['query']>,
  TSection extends Extract<keyof PickKnownKeys<ApiPromise['query'][TModule]>, string>,
  TAugmentedSection extends TSection | `${TSection}.multi`,
  TExtractedSection extends TAugmentedSection extends `${infer Section}.multi` ? Section : TAugmentedSection,
  TMethod extends Diverge<
    ApiPromise['query'][TModule][TExtractedSection],
    StorageEntryPromiseOverloads & QueryableStorageEntry<any, any> & PromiseResult<GenericStorageEntryFunction>
  >
>(
  endpoint: string,
  moduleName: TModule,
  sectionName: TAugmentedSection,
  params: TMethod extends (...args: any) => any
    ? TAugmentedSection extends TSection
      ? Leading<Parameters<TMethod>>
      : Leading<Parameters<TMethod>> extends [infer Head]
      ? Head[]
      : Array<Readonly<Leading<Parameters<TMethod>>>>
    : never
) =>
  _chainState([endpoint, 'query', moduleName, sectionName, params]) as RecoilState<
    TMethod extends PromiseResult<(...args: any) => Observable<infer Result>>
      ? TAugmentedSection extends TSection
        ? Result
        : Result[]
      : never
  >

export const chainDeriveState = <
  TModule extends keyof PickKnownKeys<ApiPromise['derive']>,
  TSection extends Extract<keyof PickKnownKeys<ApiPromise['derive'][TModule]>, string>,
  TAugmentedSection extends TSection | `${TSection}.multi`,
  TExtractedSection extends TAugmentedSection extends `${infer Section}.multi` ? Section : TAugmentedSection,
  TMethod extends Diverge<
    // @ts-expect-error
    ApiPromise['derive'][TModule][TExtractedSection],
    StorageEntryPromiseOverloads & QueryableStorageEntry<any, any> & PromiseResult<GenericStorageEntryFunction>
  >
>(
  endpoint: string,
  moduleName: TModule,
  sectionName: TAugmentedSection,
  params: TMethod extends (...args: any) => any
    ? TAugmentedSection extends TSection
      ? Leading<Parameters<TMethod>>
      : Leading<Parameters<TMethod>> extends [infer Head]
      ? Head[]
      : Array<Readonly<Leading<Parameters<TMethod>>>>
    : never
) => _chainState([endpoint, 'derive', moduleName, sectionName, params])

export const useChainQueryState = <
  TModule extends keyof PickKnownKeys<ApiPromise['query']>,
  TSection extends Extract<keyof PickKnownKeys<ApiPromise['query'][TModule]>, string>,
  TAugmentedSection extends TSection | `${TSection}.multi`,
  TExtractedSection extends TAugmentedSection extends `${infer Section}.multi` ? Section : TAugmentedSection,
  TMethod extends Diverge<
    ApiPromise['query'][TModule][TExtractedSection],
    StorageEntryPromiseOverloads & QueryableStorageEntry<any, any> & PromiseResult<GenericStorageEntryFunction>
  >,
  TEnabled = void
>(
  moduleName: TModule,
  sectionName: TAugmentedSection,
  params: TMethod extends (...args: any) => any
    ? TAugmentedSection extends TSection
      ? Leading<Parameters<TMethod>>
      : Leading<Parameters<TMethod>> extends [infer Head]
      ? Head[]
      : Array<Readonly<Leading<Parameters<TMethod>>>>
    : never,
  options: { enabled?: TEnabled } = { enabled: true as TEnabled }
) => {
  type TResult = RecoilState<
    TMethod extends PromiseResult<(...args: any) => Observable<infer Result>>
      ? TAugmentedSection extends TSection
        ? Result
        : Result[]
      : never
  >

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  type TReturn = TEnabled extends true | void ? TResult : TResult | RecoilState<undefined>

  const endpoint = useContext(SubstrateApiContext).endpoint

  if (!options.enabled) {
    return constSelector(undefined) as TReturn
  }

  return _chainState([endpoint, 'query', String(moduleName), sectionName, params]) as TReturn
}

export const useChainDeriveState = <
  TModule extends keyof PickKnownKeys<ApiPromise['derive']>,
  TSection extends Extract<keyof PickKnownKeys<ApiPromise['derive'][TModule]>, string>,
  TAugmentedSection extends TSection | `${TSection}.multi`,
  TExtractedSection extends TAugmentedSection extends `${infer Section}.multi` ? Section : TAugmentedSection,
  TMethod extends Diverge<
    // @ts-expect-error
    ApiPromise['derive'][TModule][TExtractedSection],
    StorageEntryPromiseOverloads & QueryableStorageEntry<any, any> & PromiseResult<GenericStorageEntryFunction>
  >,
  TEnabled = void
>(
  moduleName: TModule,
  sectionName: TAugmentedSection,
  params: TMethod extends (...args: any) => any
    ? TAugmentedSection extends TSection
      ? Leading<Parameters<TMethod>>
      : Leading<Parameters<TMethod>> extends [infer Head]
      ? Head[]
      : Array<Readonly<Leading<Parameters<TMethod>>>>
    : never,
  options: { enabled?: TEnabled } = { enabled: true as TEnabled }
) => {
  type TResult = RecoilValueReadOnly<
    TMethod extends PromiseResult<(...args: any) => Observable<infer Result>>
      ? TAugmentedSection extends TSection
        ? Result
        : Result[]
      : never
  >

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  type TReturn = TEnabled extends true | void ? TResult : TResult | RecoilValueReadOnly<undefined>

  const endpoint = useContext(SubstrateApiContext).endpoint

  if (!options.enabled) {
    return constSelector(undefined) as TReturn
  }

  return _chainState([endpoint, 'derive', String(moduleName), sectionName, params]) as any as TReturn
}
