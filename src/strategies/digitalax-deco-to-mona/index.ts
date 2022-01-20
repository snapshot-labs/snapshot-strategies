import { subgraphRequest } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';

export const author = 'onigiri-x';
export const version = '0.1.0';

const QUICKSWAP_SUBGRAPH =
  'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap05';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  // Set up the GraphQL parameters and necessary variables

  const decoEthPair = "0x7ecb3be21714114d912469810aedd34e6fc27736";
  const monaEthPair = "0x3203bf44d434452b4605c7657c51bfeaf2a0847c";

  const holderParams = {
    pair: {
      __args: {
        id: decoEthPair
      },
      token1Price: true
    }
  };

  // Mona to eth
  const holderParams2 = {
    pair: {
      __args: {
        id: monaEthPair
      },
      token0Price: true
    }
  };

  // Query subgraph for the holders and the stakers based on input addresses
  const decoEthReserve = await subgraphRequest(QUICKSWAP_SUBGRAPH, holderParams);
  const monaEthReserve = await subgraphRequest(QUICKSWAP_SUBGRAPH, holderParams2);


  const erc20Balances = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  return Object.fromEntries(
    addresses.map((address) => [
      address,
      (erc20Balances[address] * decoEthReserve.pair.token1Price * monaEthReserve.pair.token0Price)
    ])
  );
}
