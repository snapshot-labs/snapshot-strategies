import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

const SUBGRAPH_URL = {
  '1': 'https://subgrapher.snapshot.org/subgraph/arbitrum/4RGbQCKV1NNoEJcK3shwgTvn65zsHaFdqG9RPvv28qJU',
  '137':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/HHNWub5axWTGR1no6yrqVurT8Ak9skEFAwnw3YcqkD8G'
};

export const author = 'weizard';
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
    users: {
      __args: {
        where: {
          id_in: addresses.map((address) => address.toLowerCase()),
          amount_gt: 0
        }
      },
      id: true,
      amount: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(
    options.subGraphURL ? options.subGraphURL : SUBGRAPH_URL[network],
    params
  );
  const score = {};
  if (result && result.users) {
    result.users.forEach((user) => {
      const userAddress = getAddress(user.id);
      let userScore = Number(user.amount);

      if (options.scoreMultiplier) {
        userScore = userScore * options.scoreMultiplier;
      }
      if (!score[userAddress]) score[userAddress] = 0;
      score[userAddress] = score[userAddress] + userScore;
    });
  }
  return score || {};
}
