import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/sablierhq/sablier',
  '5': 'https://api.thegraph.com/subgraphs/name/sablierhq/sablier-goerli',
  '137': 'https://api.thegraph.com/subgraphs/name/sablierhq/sablier-matic'
};

export const author = 'dan13ram';
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
  const result = await subgraphRequest(
    SUBGRAPH_URL[network],
    params
  );
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
