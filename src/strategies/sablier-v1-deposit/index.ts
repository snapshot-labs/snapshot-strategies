import { getAddress } from '@ethersproject/address';
import { formatUnits } from '@ethersproject/units';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://subgrapher.snapshot.org/subgraph/arbitrum/DkSXWkgJD5qVqfsrfzkLC5WELVX3Dbj3ByWcYjDJieCh', // mainnet
  '10': 'https://subgrapher.snapshot.org/subgraph/arbitrum/BEnQbvBdXnohC1DpM9rSb47C1FbowK39HfPNCEHjgrBt', // optimism
  '56': 'https://subgrapher.snapshot.org/subgraph/arbitrum/3Gyy7of99oBRqHcCMGJXpHw2xxxZgXxVmFPFR1vL6YhT', // bsc
  '137':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/6UMNQfMeh3pV5Qmn2NDX2UKNeUk9kh4oZhzzzn5e8rSz', // polygon
  '42161':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/94SP9QVcxmGV9e2fxuTxUGcZfcv4tjpPCGyyPVyMfLP', // arbitrum
  '43114':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/DK2gHCprwVaytwzwb5fUrkFS9xy7wh66NX6AFcDzMyF9' // avalanche
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
