import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'trebel-defiplaza';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function rewardsQuote(address stakerAddress) external view returns (uint256 rewards)'
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
  addresses.forEach((address) => {
    // request balance
    multi.call(`balanceOf:${address}`, options.address, 'balanceOf', [address]);

    // request balance of unclaimed staking rewards
    multi.call(`rewardsQuote:${address}`, options.address, 'rewardsQuote', [
      address
    ]);
  });
  const result: Record<string, BigNumberish> = await multi.execute();

  const returnObject = {};

  Object.entries(result).map(([path, balance]) => {
    const address = path.split(':')[1];

    if (!returnObject.hasOwnProperty(address)) {
      returnObject[address] = 0;
    }

    returnObject[address] += parseFloat(formatUnits(balance, options.decimals));
  });

  return returnObject;
}
