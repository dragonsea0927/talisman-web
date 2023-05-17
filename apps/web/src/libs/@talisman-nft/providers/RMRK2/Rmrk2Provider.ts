import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client'
import { encodeAddress } from '@polkadot/util-crypto'

import { type NFTDetail } from '../../types'
import { NFTInterface } from '../NFTInterface'

const QUERY = gql`
  query ($address: String!, $offset: Int) {
    nfts(limit: 10, offset: $offset, where: { owner: { _eq: $address }, burned: { _eq: "" } }) {
      id
      symbol
      metadata
      metadata_name
      metadata_description
      metadata_image
      children {
        id
        metadata_name
        metadata_image
        sn
      }
      resources {
        metadata_content_type
        thumb
        src
      }
      sn
      metadata_properties
      collection {
        id
        metadata_name
        max
      }
    }
  }
`

const QUERY_AGGREGATE = gql`
  query ($address: String!) {
    nfts_aggregate(where: { owner: { _eq: $address }, burned: { _eq: "" } }) {
      aggregate {
        count
      }
    }
  }
`

export class Rmrk2Provider extends NFTInterface {
  override name = 'RMRK2'
  uri = 'https://gql-rmrk2-prod.graphcdn.app'
  platformUri = 'https://singular.app/collectibles/'
  indexUri = 'https://singular.rmrk-api.xyz/api/account/'
  collectionUri = 'https://singular.app/api/stats/collection/'
  storageProvider = ''
  detailedItems: Record<string, any> = {}
  client?: ApolloClient<any>
  override tokenCurrency = 'KSM'

  async getClient() {
    if (this.client) return this.client

    this.client = new ApolloClient({
      link: createHttpLink({ uri: this.uri }),
      cache: new InMemoryCache(),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    })

    return this.client
  }

  override async hydrateNftsByAddress(address: string) {
    this.reset()
    this.isFetching = true

    if (address.startsWith('0x')) {
      this.isFetching = false
      return
    }

    const client = await this.getClient()
    const encodedAddress = encodeAddress(address, 2)

    const queryAggregate = await client.query({ query: QUERY_AGGREGATE, variables: { address: encodedAddress } })

    this.count[address] = queryAggregate.data.nfts_aggregate.aggregate.count

    let offset = 0
    while (true) {
      const { data } = await client.query({ query: QUERY, variables: { address: encodedAddress, offset } })

      if (data.nfts.length === 0) {
        break
      }

      data.nfts.forEach(async (nft: any) => {
        const mediaUri = nft?.resources[0]?.src
          ? this.toIPFSUrl(nft?.resources[0]?.src)
          : nft?.metadata_image
          ? this.toIPFSUrl(nft?.metadata_image)
          : await this.fetchMediaFromMetadata(nft?.metadata)

        const thumb = this.toIPFSUrl(nft?.resources[0]?.thumb) ?? undefined
        const type = nft?.resources[0]?.metadata_content_type
        const collectionInfo = await this.fetchNFTs_CollectionInfo(nft?.collection?.id, this.collectionUri)

        const children = nft?.children?.map((child: any) => ({
          id: child?.id,
          name: child?.metadata_name,
          mediaUri: this.items[child?.id]?.mediaUri ?? this.toIPFSUrl(child?.metadata_image),
          serialNumber: child?.sn.replace(/^0+/, ''),
        }))

        const item = {
          id: nft?.id,
          name: nft?.metadata_name || nft?.symbol,
          thumb,
          description: nft?.metadata_description,
          serialNumber: nft?.sn.replace(/^0+/, ''),
          metadata: nft?.metadata,
          type,
          mediaUri,
          provider: this.name,
          platformUri: this.platformUri + (nft?.id as string),
          attributes: nft?.metadata_properties || [],
          collection: {
            id: nft?.collection?.id,
            name: nft?.collection?.metadata_name,
            totalCount: collectionInfo?.totalNfts,
            floorPrice: collectionInfo?.floor,
          },
          nftSpecificData: {
            children,
          },
          tokenCurrency: this.tokenCurrency,
          address,
        } as NFTDetail

        this.setItem(item)
        this.detailedItems[item.id] = item
      })

      offset += data.nfts.length as number
    }

    this.isFetching = false
  }

  override fetchOneById(id: string) {
    const internalId = id.split('.').slice(1).join('.')
    return this.items[internalId]
  }

  protected override async fetchDetail(id: string): Promise<NFTDetail> {
    const item = this.detailedItems[id]
    return item
  }
}
