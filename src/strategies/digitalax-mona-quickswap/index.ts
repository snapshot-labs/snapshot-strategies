import { subgraphRequest } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'onigiri-x';
export const version = '0.1.0';

const QUICKSWAP_SUBGRAPH = 'https://api.fura.org/subgraphs/name/quickswap';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Set up the GraphQL parameters and necessary variables
  if (options.strategyType) {
    if (options.strategyType == 'monausd') {
      options.address = '0x856ad56defbb685db8392d9e54441df609bc5ce1';
    }
  }
  const holderParams = {
    pair: {
      __args: {
        id: options.address
      },
      reserve0: true,
      totalSupply: true
    }
  };

  // Query subgraph for the holders and the stakers based on input addresses
  const monaReserve = await subgraphRequest(QUICKSWAP_SUBGRAPH, holderParams);

  const erc20Balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const totalLPSupply =
    monaReserve.pair.totalSupply < 0
      ? monaReserve.pair.totalSupply * -1
      : monaReserve.pair.totalSupply;

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      (erc20Balances[address] * monaReserve.pair.reserve0) / totalLPSupply
    ])
  );
}
