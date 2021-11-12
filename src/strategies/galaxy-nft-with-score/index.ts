import fetch from 'cross-fetch';
import { subgraphRequest } from '../../utils';

export const author = 'alberthaotan';
export const version = '0.2.0';

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
    subgraph:
      'https://api.thegraph.com/subgraphs/name/alexvorobiov/eip1155subgraph'
  },
  '56': {
    name: 'BSC',
    graphql: 'https://graphigo.prd.galaxy.eco/query',
    subgraph:
      'https://api.thegraph.com/subgraphs/name/nftgalaxy/eip1155-bsc-subgraph'
  }
  // '137': {
  //   name: 'MATIC',
  //   graphql: 'https://graphigo.prd.galaxy.eco/query',
  //   subgraph: ''
  // },
  // '250': {
  //   name: 'FANTOM',
  //   graphql: 'https://graphigo.prd.galaxy.eco/query',
  //   subgraph: ''
  // }
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

  const subgraphParams = {
    accounts: {
      __args: {
        where: {
          id_in: addresses.map((a) => a.toLowerCase())
        }
      },
      id: true,
      balances: {
        token: {
          id: true,
          identifier: true
        }
      }
    }
  };
  if (snapshot !== 'latest') {
    subgraphParams.accounts.__args['block'] = { number: snapshot };
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
    Networks[network].subgraph,
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
  const ownersWithNfts: OwnerWithNfts[] = graphqlData.data.allNFTsByOwnersCoresAndChain.reduce(
    (map, item) => {
      map[item.owner.toLowerCase()] = item.nfts.reduce((m, i) => {
        if (!options.params.blacklistNFTID?.includes(i.id)) {
          m[
            i.nftCore.contractAddress.toLowerCase() +
              '-0x' +
              Number.parseInt(i.id).toString(16)
          ] = i.name;
        }
        return m;
      }, {});
      return map;
    },
    {}
  );
  const subgraphOwnersWithNfts: OwnerWithNfts[] = subgraphData.accounts.reduce(
    (map, item) => {
      map[item.id] = item.balances.reduce((m, i) => {
        m[i.token.id] = '';
        return m;
      }, {});
      return map;
    },
    {}
  );

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
      if (nftName in ownerToNftCount[owner]) {
        ownerToNftCount[owner][nftName]++;
      } else {
        ownerToNftCount[owner][nftName] = 1;
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
