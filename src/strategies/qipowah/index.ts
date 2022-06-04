import { getProvider, getSnapshots } from '../../utils';
import strategies from '..';

export const author = 'royalaid';
export const version = '1.0.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const promises: any = [];
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.ERC20s.map((s) => s.network || network)
  );

  for (const ERC20 of options.ERC20s) {
    if (
      options.startBlocks &&
      blocks[ERC20.network] < options.startBlocks[ERC20.network]
    ) {
      continue;
    }

    promises.push(
      strategies['pagination'].strategy(
        space,
        ERC20.network,
        getProvider(ERC20.network),
        addresses,
        {
          limit: 120,
          strategy: {
            symbol: 'QiPowah',
            name: 'erc20-balance-of',
            params: {
              symbol: 'QiPowah',
              address: ERC20.address,
              decimals: ERC20.decimals
            }
          }
        },
        blocks[ERC20.network]
      )
    );
  }

  const results = await Promise.all(promises);
  return results.reduce((finalResults: any, strategyResult: any) => {
    for (const [address, value] of Object.entries(strategyResult)) {
      if (!finalResults[address]) {
        finalResults[address] = 0;
      }
      finalResults[address] += value;
    }
    return finalResults;
  }, {});
}
