import { strategy as withDelegationStrategy } from '../with-delegation';

export const author = 'snapshot-labs';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  return await withDelegationStrategy(
    space,
    network,
    provider,
    addresses,
    {
      ...options,
      strategies: [
        {
          name: 'erc20-balance-of',
          params: {
            address: options.address,
            decimals: options.decimals
          }
        }
      ]
    },
    snapshot
  );
}
