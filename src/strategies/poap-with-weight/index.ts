import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';
import examplesFile from './examples.json';

export const author = 'gawainb';
export const version = '1.1.0';
export const examples = examplesFile;

const POAP_API_ENDPOINT_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap',
  '100': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai'
};

const getTokenSupply = {
  tokens: {
    __args: {
      block: undefined as undefined | { number: number },
      where: {
        id_in: undefined
      }
    },
    event: {
      tokenCount: true
    },
    id: true,
    owner: {
      id: true
    }
  }
};

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const addressesMap = addresses.reduce((map, address) => {
    map[getAddress(address)] = 0;
    return map;
  }, {});
  // Set TokenIds as arguments for GQL query
  getTokenSupply.tokens.__args.where.id_in = options.tokenIds.map(
    (token) => token.id
  );
  if (snapshot !== 'latest') {
    getTokenSupply.tokens.__args.block = { number: snapshot };
  }
  const supplyResponse = await subgraphRequest(
    POAP_API_ENDPOINT_URL[network],
    getTokenSupply
  );

  if (supplyResponse && supplyResponse.tokens) {
    const tokenIdsWeightMap = options.tokenIds.reduce((map, { id, weight }) => {
      map[id] = weight;
      return map;
    }, {});
    supplyResponse.tokens.forEach((token: any) => {
      const checksumAddress = getAddress(token.owner.id);
      if (!addressesMap[checksumAddress]) addressesMap[checksumAddress] = 0;
      addressesMap[checksumAddress] +=
        tokenIdsWeightMap[token.id] * parseInt(token.event.tokenCount);
    });
  }

  return addressesMap;
}
