import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'nginnever';
export const version = '0.1.1';

export async function strategy(
  _space,
  network,
  _provider,
  addresses,
  options,
  snapshot
) {
  const adds = addresses.map((element) => {
    return element.toLowerCase();
  });

  const params = {
    users: {
      __args: {
        where: { id_in: adds },
        first: 1000
      },
      id: true,
      voteWeight: true
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args.block = { number: snapshot };
  }
  const result = await subgraphRequest(options.SUBGRAPH_URL, params);
  const score = {};
  result.users.map((user) => {
    score[getAddress(user.id)] = parseFloat(formatUnits(user.voteWeight, 18));
  });
  return score || {};
}
