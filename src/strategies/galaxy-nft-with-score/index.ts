import fetch from 'cross-fetch';
import { subgraphRequest } from '../../utils';

export const author = 'alberthaotan';
export const version = '0.3.2';

const Networks: {
  [network: string]: {
    name: string;
    graphql: string;
    subgraph: string;
  };
} = {
  '1': {
    name: 'ETHEREUM',
    graphql: 'https://graphigo.prd.galaxy.eco/query',
    subgraph: 'https://api.thegraph.com/subgraphs/name/alberthaotan/nft-eth'
  },
  '56': {
    name: 'BSC',
    graphql: 'https://graphigo.prd.galaxy.eco/query',
    subgraph: 'https://api.thegraph.com/subgraphs/name/alberthaotan/nft-bsc'
  },
  '137': {
    name: 'MATIC',
    graphql: 'https://graphigo.prd.galaxy.eco/query',
    subgraph: 'https://api.thegraph.com/subgraphs/name/alberthaotan/nft-matic'
  }
};

interface Config {
  name: string;
  votingPower: number;
  cumulative: boolean;
}

interface OwnerWithNfts {
  [owner: string]: {
    [tokenId: string]: string;
  };
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
  const restoreAddress = addresses.reduce((map, address) => {
    map[address.toLowerCase()] = address;
    return map;
  }, {});
  //addresses.map((a) => a.toLowerCase())

  const subgraphParams = {
    nftContracts: {
      __args: {
        where: {
          id_in: options.params.NFTCoreAddress.map((a) => a.toLowerCase())
        }
      },
      id: true,
      nfts: {
        __args: {
          first: 1000
        },
        tokenID: true,
        ownership: {
          owner: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    subgraphParams.nftContracts.__args['block'] = { number: snapshot };
  }

  const graphqlParams = {
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
            nftCore
            {
              contractAddress
            }
          }
        }
      }`,
      variables: {
        option: {
          nftCoreAddresses: options.params.NFTCoreAddress,
          chain: Networks[network].name,
          owners: addresses
        }
      }
    })
  };

  const graphqlPromise = fetch(Networks[network].graphql, graphqlParams);
  const subgraphPromise = subgraphRequest(
    options.params.subgraph
      ? options.params.subgraph
      : Networks[network].subgraph,
    subgraphParams
  );
  const promisesRes = await Promise.all([graphqlPromise, subgraphPromise]);
  const graphqlData = await promisesRes[0].json();
  const subgraphData = promisesRes[1];

  // Initialize objects
  const configs: Config[] = options.params.configs;
  const ownerToNftCount: OwnerToNftCount = Object.fromEntries(
    addresses.map((addr) => [addr.toLowerCase(), {}])
  );

  const ownerToScore: OwnerToScore = {};
  const ownersWithNfts: OwnerWithNfts =
    graphqlData.data.allNFTsByOwnersCoresAndChain.reduce((map, item) => {
      map[item.owner.toLowerCase()] = item.nfts.reduce((m, i) => {
        if (!options.params.blacklistNFTID?.includes(i.id)) {
          m[i.nftCore.contractAddress.toLowerCase() + '-' + i.id] = i.name;
        }
        return m;
      }, {});
      return map;
    }, {});

  const subgraphOwnersWithNfts: OwnerWithNfts = {};
  subgraphData.nftContracts.forEach((nftContract) => {
    nftContract.nfts.forEach((nft) => {
      if (!(nft.ownership[0].owner in subgraphOwnersWithNfts)) {
        subgraphOwnersWithNfts[nft.ownership[0].owner] = {};
      }
      subgraphOwnersWithNfts[nft.ownership[0].owner][
        nftContract.id + '-' + nft.tokenID
      ] = '';
    });
  });

  // Intersect nft holdings of owners from graphql and subgraph returns
  Object.keys(subgraphOwnersWithNfts).forEach((owner) => {
    Object.keys(subgraphOwnersWithNfts[owner]).forEach((tokenId) => {
      if (owner in ownersWithNfts && tokenId in ownersWithNfts[owner]) {
        subgraphOwnersWithNfts[owner][tokenId] = ownersWithNfts[owner][tokenId];
      }
    });
  });

  // Get owners nft counts base on nft name
  Object.keys(subgraphOwnersWithNfts).forEach((owner) => {
    Object.keys(subgraphOwnersWithNfts[owner]).forEach((tokenId) => {
      const nftName = subgraphOwnersWithNfts[owner][tokenId];
      if (nftName != '') {
        if (nftName in ownerToNftCount[owner]) {
          ownerToNftCount[owner][nftName]++;
        } else {
          ownerToNftCount[owner][nftName] = 1;
        }
      }
    });
  });

  // Get owners score base on certain config
  Object.keys(ownerToNftCount).forEach((owner) => {
    ownerToScore[restoreAddress[owner]] = 0;
    configs.forEach((config) => {
      if (config.name in ownerToNftCount[owner]) {
        if (config.cumulative) {
          ownerToScore[restoreAddress[owner]] +=
            config.votingPower * ownerToNftCount[owner][config.name];
        } else {
          ownerToScore[restoreAddress[owner]] += config.votingPower * 1;
        }
      }
    });
  });

  return ownerToScore;
}
