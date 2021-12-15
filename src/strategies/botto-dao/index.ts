import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'carbonocom';
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

  const multiLiquidityProvider = new Multicaller(network, provider, abi, { blockTag });

  multiLiquidityProvider.call('reserves', options.liquidityAddress, 'getReserves');
  multiLiquidityProvider.call('totalSupply', options.liquidityAddress, 'totalSupply');

  const _formatUnits = (value, decimals) => parseFloat(formatUnits(value, decimals));

  const result: {reserves: Object, totalSupply: number} = await multiLiquidityProvider.execute();
  const { reserves } = result;
  const reserveBOTTO = _formatUnits(reserves['_reserve0'], options.decimals);
  const totalSupply = _formatUnits(result.totalSupply, options.decimals);

  const multiBalances = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) => {
    multiBalances.call(address + '-stakedBotto', options.stakingAddress, 'userStakes', [address]);
    multiBalances.call(address + '-stakedLPs', options.miningAddress, 'totalUserStake', [address]);
  });

  const balances = await multiBalances.execute();

  return Object.fromEntries(
    addresses.map((adr) => {
      let stakedBotto = _formatUnits(balances[adr + '-stakedBotto'], options.decimals);
      let stakedLPsBottos = _formatUnits(balances[adr + '-stakedLPs'], options.decimals) * reserveBOTTO / totalSupply;
      return [adr, stakedBotto + stakedLPsBottos];
    })
  );
}
