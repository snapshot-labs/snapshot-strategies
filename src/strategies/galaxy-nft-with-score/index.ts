import fetch from 'cross-fetch'

export const author = 'alberthaotan'
export const version = '0.1.0'

const GALAXY_GRAPHQL_URL = 'https://graphigo.prd.galaxy.eco/query'

interface Config {
  name: string,
  weight: number,
  cumulative: boolean
}

interface OwnerWithNfts {
  owner: string,
  nfts: {
    id: string,
    name: string
  }[]
}

interface OwnerToNftCount {
  [owner: string]: {
    [name: string]: number
  }
}

interface OwnerToScore {
  [owner: string]: number
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  let fetchRes = await fetch(GALAXY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operationName: 'allNFTsByOwnersCoresAndChain',
      query: `query allNFTsByOwnersCoresAndChain($option: NFTsOptions!) {
        allNFTsByOwnersCoresAndChain(option: $option) {
          owner
          nfts
          {
            id
            name
          }
        }
      }`,
      variables: {
        option: {
          nftCoreAddresses: options.params.nftCoreAddresses,
          chain: options.params.chain,
          owners: addresses
        }
      },
    }),
  })

  let fetchData = await fetchRes.json()
  let ownersWithNfts: OwnerWithNfts[] = fetchData.data.allNFTsByOwnersCoresAndChain
  let configs: Config[] = options.params.configs
  let ownerToNftCount: OwnerToNftCount = Object.fromEntries(addresses.map(addr => [addr, {}]))
  let ownerToScore: OwnerToScore = {}

  ownersWithNfts.forEach(ownerWithNfts => {
    ownerWithNfts.nfts.forEach(nft => {
      if (nft.name in ownerToNftCount[ownerWithNfts.owner]) {
        ownerToNftCount[ownerWithNfts.owner][nft.name]++
      } else {
        ownerToNftCount[ownerWithNfts.owner][nft.name] = 1
      }
    })
  })

  Object.keys(ownerToNftCount).forEach(owner => {
    ownerToScore[owner] = 0
    configs.forEach(config => {
      if (config.name in ownerToNftCount[owner]) {
        if (config.cumulative) {
          ownerToScore[owner] += config.weight * ownerToNftCount[owner][config.name]
        } else {
          ownerToScore[owner] += config.weight * 1
        }
      }
    })
  })

  return ownerToScore
}
