import { strategy as erc1155BalanceOfIdsWeightedStrategy } from '../erc1155-balance-of-ids-weighted';

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
  const defaultWeight = 1;
  options.address = '0x0762aa185b6ed2dca77945ebe92de705e0c37ae3';
  options.weight = options.weight || defaultWeight;
  const score = await erc1155BalanceOfIdsWeightedStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(Object.entries(score).map((a) => [a[0], a[1]]));
}
