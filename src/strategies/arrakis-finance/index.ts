import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'MantisClone';
export const version = '0.1.0';

const abi = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getUnderlyingBalances() external view returns (uint256 amount0Current, uint256 amount1Current)',
  'function totalSupply() public view returns (uint256)',
  ,
  'function balanceOf(address account) public view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('token0', options.poolAddress, 'token0', []);
  multi.call('token1', options.poolAddress, 'token1', []);
  multi.call(
    'underlyingBalances',
    options.poolAddress,
    'getUnderlyingBalances',
    []
  );
  multi.call('lpTokenTotalSupply', options.poolAddress, 'totalSupply', []);
  addresses.forEach((address) =>
    multi.call(`lpTokenBalances.${address}`, options.poolAddress, 'balanceOf', [
      address
    ])
  );
  const result = await multi.execute();

  const token0: string = result.token0;
  const token1: string = result.token1;
  const underlyingBalances: [BigNumber, BigNumber] = result.underlyingBalances;
  const lpTotalSupply: BigNumber = result.lpTokenTotalSupply;
  const lpBalances: Record<string, BigNumber> = result.lpTokenBalances;

  let underlyingBalance: BigNumber;
  if (options.tokenAddress === token0) {
    underlyingBalance = underlyingBalances[0];
  } else if (options.tokenAddress === token1) {
    underlyingBalance = underlyingBalances[1];
  } else {
    throw new Error(
      `token not in pool. poolAddress=${options.poolAddress}, tokenAddress=${options.tokenAddress}`
    );
  }

  return Object.fromEntries(
    Object.entries(lpBalances).map(([address, lpBalance]) => [
      address,
      parseFloat(
        formatUnits(
          underlyingBalance.mul(lpBalance).div(lpTotalSupply),
          options.decimals
        )
      )
    ])
  );
}
