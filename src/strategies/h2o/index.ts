import { getAddress } from '@ethersproject/address';
import { subgraphRequest } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const SUBGRAPH_URL = {
  '1': 'https://subgrapher.snapshot.org/subgraph/arbitrum/Djs1i3j3XpSqkieuQAULxTp2cA2j4V8wxWo6XUqgJte7'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const params = {
    users: {
      id: true,
      safes: {
        collateralType: {
          __args: {
            where: {
              id: options.collateralTypeId
            }
          }
        },
        collateral: true
      }
    }
  };
  if (snapshot !== 'latest') {
    // @ts-ignore
    params.users.__args = { block: { number: snapshot } };
  }

  const result = await subgraphRequest(SUBGRAPH_URL[network], params);

  return Object.fromEntries(
    result.users.map((user) => [
      getAddress(user.id),
      user.safes.reduce(
        (partialSum, safe) => partialSum + parseFloat(safe.collateral),
        0
      )
    ])
  );
}
