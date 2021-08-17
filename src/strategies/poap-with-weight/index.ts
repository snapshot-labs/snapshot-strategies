import { subgraphRequest } from '../../utils';
import examplesFile from './examples.json';

export const author = 'gawainb';
export const version = '1.0.0';
export const examples = examplesFile;

const POAP_API_ENDPOINT_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap',
  '100': 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai'
};

const getTokenSupply = {
  tokens: {
    __args: {
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
  space,
  network,
  provider,
  addresses,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  snapshot
) {
  // Set TokenIds as arguments for GQL query
  getTokenSupply.tokens.__args.where.id_in = options.tokenIds.map(
    (token) => token.id
  );
  const poapWeights = {};
  const supplyResponse = await subgraphRequest(
    POAP_API_ENDPOINT_URL[network],
    getTokenSupply
  );

  if (supplyResponse && supplyResponse.tokens) {
    supplyResponse.tokens.forEach((token: any) => {
      if (!poapWeights[token.owner.id.toLowerCase()])
        poapWeights[token.owner.id.toLowerCase()] = 0;
      poapWeights[token.owner.id.toLowerCase()] +=
        options.tokenIds.find((a) => a.id === token.id).weight *
        parseInt(token.event.tokenCount);
    });
  }

  return Object.fromEntries(
    addresses.map((address: any) => [
      address,
      poapWeights[address.toLowerCase()] || 0
    ])
  );
}
