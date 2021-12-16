import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'alfonsocarbono';
export const version = '1.0.0';

const abi = [
  'function userStakes(address) external view returns(uint256)',
  'function totalUserStake(address) external view returns(uint256)',
  'function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
  'function totalSupply() public view returns (uint256)'
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

  const _formatUnits = (value) =>
    parseFloat(formatUnits(value, options.decimals));

  const multiLiquidityProvider = new Multicaller(network, provider, abi, {
    blockTag
  });
  multiLiquidityProvider.call(
    'reserves',
    options.liquidityAddress,
    'getReserves'
  );
  multiLiquidityProvider.call(
    'totalSupply',
    options.liquidityAddress,
    'totalSupply'
  );

  const multiBalances = new Multicaller(network, provider, abi, {
    blockTag
  });
  addresses.forEach((address) => {
    multiBalances.call(
      address + '-stakedBotto',
      options.stakingAddress,
      'userStakes',
      [address]
    );
    multiBalances.call(
      address + '-stakedLPs',
      options.miningAddress,
      'totalUserStake',
      [address]
    );
  });

  const { reserves, totalSupply } = await multiLiquidityProvider.execute();
  const balances: Record<string, BigNumberish> = await multiBalances.execute();

  return Object.fromEntries(
    addresses.map((adr) => {
      const stakedBotto = _formatUnits(balances[adr + '-stakedBotto']);
      const stakedLPsBottos =
        (_formatUnits(balances[adr + '-stakedLPs']) *
          _formatUnits(reserves['_reserve0'])) /
        _formatUnits(totalSupply);
      return [adr, stakedBotto + stakedLPsBottos];
    })
  );
}
