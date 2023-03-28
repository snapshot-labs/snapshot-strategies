import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'chuddster';
export const version = '0.1.0';

const BALANCER_VAULT = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';

const abi = [
  'function asset() external view returns (address)',
  'function getPoolId() external view returns (bytes32)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function getPoolTokens(bytes32 poolId) external view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)'
];

interface Params {
  auraVaultDeposit: string;
  tokenIndex: string;
  decimals: string;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  multi.call('bptAsset', options.auraVaultDeposit, 'asset', []);

  const bptAssetResult: Record<string, string> = await multi.execute();

  multi.call('poolId', bptAssetResult.bptAsset, 'getPoolId', []);

  const poolIdResult: Record<string, string> = await multi.execute();

  multi.call('underlyingBalance', BALANCER_VAULT, 'getPoolTokens', [
    poolIdResult.poolId
  ]);

  const underlyingBalanceResult = await multi.execute();
  const underlyingBalance =
    underlyingBalanceResult.underlyingBalance.balances[
      parseInt(options.tokenIndex)
    ];

  multi.call('bptTotalSupply', bptAssetResult.bptAsset, 'totalSupply', []);

  const bptTotalSupply: Record<string, BigNumberish> = await multi.execute();

  addresses.forEach((address) =>
    multi.call(address, options.auraVaultDeposit, 'balanceOf', [address])
  );
  const result: Record<string, BigNumber> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          balance.mul(underlyingBalance).div(bptTotalSupply.bptTotalSupply),
          parseInt(options.decimals)
        )
      )
    ])
  );
}
