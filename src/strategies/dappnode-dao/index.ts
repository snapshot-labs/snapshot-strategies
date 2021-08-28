import { strategy as unipoolUniv2LpStrategy } from '../unipool-univ2-lp';
import { strategy as unipoolSameTokenStrategy } from '../unipool-same-token';

export const author = 'dapplion';
export const version = '0.1.0';

export async function strategy(
  _space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  // 4 Unipool contracts, 3 in target network 1 in XDAI
  // - Eth mainnet - Uniswap v2 LP (ETH-NODE)
  // - Eth mainnet - Sushiswap LP (ETH-NODE)
  // - Eth mainnet - Only NODE (NODE)
  // - xDAI - Only NODE (NODE)

  const unipoolLp1 = await unipoolUniv2LpStrategy(
    _space,
    network,
    provider,
    addresses,
    {
      lpTokenAddress: options.lpTokenAddress1,
      unipoolAddress: options.unipoolAddress1,
      tokenAddress: options.tokenAddress,
      decimals: options.decimal
    },
    snapshot
  ).catch((e) => {
    e.message = 'Error in unipoolLp1: ' + e.message;
    throw e;
  });

  const unipoolLp2 = await unipoolUniv2LpStrategy(
    _space,
    network,
    provider,
    addresses,
    {
      lpTokenAddress: options.lpTokenAddress2,
      unipoolAddress: options.unipoolAddress2,
      tokenAddress: options.tokenAddress,
      decimals: options.decimal
    },
    snapshot
  ).catch((e) => {
    e.message = 'Error in unipoolLp2: ' + e.message;
    throw e;
  });

  const unipoolSameToken = await unipoolSameTokenStrategy(
    _space,
    network,
    provider,
    addresses,
    {
      unipoolAddress: options.unipoolSameToken,
      decimals: options.decimal
    },
    snapshot
  ).catch((e) => {
    e.message = 'Error in unipoolSameToken: ' + e.message;
    throw e;
  });

  const unipoolSameTokenXdai = await unipoolSameTokenStrategy(
    _space,
    '100', // xDAI
    provider,
    addresses,
    {
      unipoolAddress: options.unipoolSameTokenXdai,
      decimals: options.decimal
    },
    options.snapshotXdai
  ).catch((e) => {
    e.message = 'Error in unipoolSameTokenXdai: ' + e.message;
    throw e;
  });

  const balanceByAddress = new Map<string, number>();

  function mergeBalances(balances: Record<string, number>): void {
    for (const [address, balance] of Object.entries(balances)) {
      balanceByAddress.set(
        address,
        balance + (balanceByAddress.get(address) ?? 0)
      );
    }
  }

  mergeBalances(unipoolLp1);
  mergeBalances(unipoolLp2);
  mergeBalances(unipoolSameToken);
  mergeBalances(unipoolSameTokenXdai);

  return Object.fromEntries(balanceByAddress.entries());
}
