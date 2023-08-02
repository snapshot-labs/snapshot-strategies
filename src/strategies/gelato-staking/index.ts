import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'alxdca';
export const version = '0.1.0';

const abi = [
  'function stakers() external view returns (address[])',
  'function getStake(address) public view returns (uint256)',
  'function manager(address) public view returns (address)'
];

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
  multi.call('stakers', options.address, 'stakers', []);
  const stakersResults: Record<string, string[]> = await multi.execute();

  const stakers = stakersResults.stakers;
  stakers.forEach((staker) => {
    multi.call(`${staker}.stake`, options.address, 'getStake', [staker]);
    multi.call(`${staker}.manager`, options.address, 'manager', [staker]);
  });
  const results: Record<string, { stake: BigNumber; manager: string }> =
    await multi.execute();

  return Object.entries(results).reduce((prev, [staker, result]) => {
    prev[result.manager !== ZERO_ADDRESS ? result.manager : staker] =
      parseFloat(formatUnits(result.stake, options.decimals));
    return prev;
  }, {});
}
