import fetch from 'cross-fetch';

export const author = 'alberthaotan';
export const version = '0.1.0';

const GALAXY_GRAPHQL_URL = 'https://graphigo.prd.galaxy.eco/query';

interface Config {
  name: string;
  weight: number;
  cumulative: boolean;
}

interface OwnerWithNfts {
  owner: string;
  nfts: {
    id: string;
    name: string;
  }[];
}

interface OwnerToNftCount {
  [owner: string]: {
    [name: string]: number;
  };
}

interface OwnerToScore {
  [owner: string]: number;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const fetchRes = await fetch(GALAXY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
      }
    })
  });

  const fetchData = await fetchRes.json();
  const ownersWithNfts: OwnerWithNfts[] =
    fetchData.data.allNFTsByOwnersCoresAndChain;
  const configs: Config[] = options.params.configs;
  const ownerToNftCount: OwnerToNftCount = Object.fromEntries(
    addresses.map((addr) => [addr, {}])
  );
  const ownerToScore: OwnerToScore = {};

  ownersWithNfts.forEach((ownerWithNfts) => {
    ownerWithNfts.nfts.forEach((nft) => {
      if (nft.name in ownerToNftCount[ownerWithNfts.owner]) {
        ownerToNftCount[ownerWithNfts.owner][nft.name]++;
      } else {
        ownerToNftCount[ownerWithNfts.owner][nft.name] = 1;
      }
    });
  });

  Object.keys(ownerToNftCount).forEach((owner) => {
    ownerToScore[owner] = 0;
    configs.forEach((config) => {
      if (config.name in ownerToNftCount[owner]) {
        if (config.cumulative) {
          ownerToScore[owner] +=
            config.weight * ownerToNftCount[owner][config.name];
        } else {
          ownerToScore[owner] += config.weight * 1;
        }
      }
    });
  });

  return ownerToScore;
}
