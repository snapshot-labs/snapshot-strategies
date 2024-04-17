import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier', // mainnet
  '3': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-ropsten', // ropsten
  '4': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-rinkeby', // rinkeby
  '5': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-goerli', // goerli
  '10': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-optimism', // optimism
  '42': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-kovan', // kovan
  '56': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-bsc', // bsc
  '137': 'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-matic', // polygon
  '42161':
    'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-arbitrum', // arbitrum
  '43114':
    'https://api.thegraph.com/subgraphs/name/sablier-labs/sablier-avalanche' // avalanche
};

export const author = 'sablier-labs';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const params = {
    streams: {
      __args: {
        limit: 1000,
        where: {
          recipient_in: addresses.map((address) => address.toLowerCase()),
          sender: options.sender.toLowerCase(),
          token: options.token.toLowerCase(),
          cancellation: null
        }
      },
      recipient: true,
      deposit: true,
      token: {
        decimals: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.streams.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(SUBGRAPH_URL[network], params);
  const score = Object.fromEntries(
    addresses.map((address) => [getAddress(address), 0])
  );
  if (result && result.streams) {
    result.streams.forEach((stream) => {
      const userAddress = getAddress(stream.recipient);
      const userScore = parseFloat(
        formatUnits(stream.deposit, stream.token.decimals)
      );

      score[userAddress] = score[userAddress] + userScore;
    });
  }
  return score;
}
