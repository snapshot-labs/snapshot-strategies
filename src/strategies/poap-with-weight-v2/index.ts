import { subgraphRequest } from '../../utils';
import examplesFile from './examples.json';

export const author = 'gawainb';
export const version = '2.0.0';
export const examples = examplesFile;

const POAP_API_ENDPOINT_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap',
  '100': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai'
};

const getTokenSupply = {
  tokens: {
    __args: {
      where: {
        event_: {
          id_in: undefined
        }
      }
    },
    event: {
      id: true,
      tokenCount: true
    },
    id: true,
    owner: {
      id: true
    }
  }
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  snapshot
) {
  // Set eventIds as arguments for GQL query
  getTokenSupply.tokens.__args.where.event_.id_in = options.eventIds.map(
    (eventId) => eventId.id
  );
  const supplyResponse = await subgraphRequest(
    POAP_API_ENDPOINT_URL[network],
    getTokenSupply
  );
  const addressesMap = addresses.reduce((map, address) => {
    map[address.toLowerCase()] = 0;
    return map;
  }, {});

  if (supplyResponse && supplyResponse.tokens) {
    const eventIdsWeightMap = options.eventIds.reduce((map, { id, weight }) => {
      map[id] = weight;
      return map;
    }, {});

    supplyResponse.tokens.forEach((token) => {
      const tokenOwnerId = token.owner.id.toLowerCase();

      if (addressesMap[tokenOwnerId] === undefined) return;

      addressesMap[tokenOwnerId] +=
        eventIdsWeightMap[token.event.id] * parseInt(token.event.tokenCount);
    });
  }

  return addressesMap;
}
