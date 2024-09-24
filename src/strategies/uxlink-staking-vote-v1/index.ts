import { formatUnits } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';

import { Multicaller } from '../../utils';
import { BigNumberish } from '@ethersproject/bignumber';

export const author = 'lessthanno';
export const version = '0.1.0';

// ABI 定义，包含要调用的合约函数
const abi = [
  'function getUserStakeInfo(address user) external view returns (uint256, uint256, uint256, uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) =>
    multi.call(address, options.address, 'getUserStakeInfo', [address])
  );

  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, userStakeInfo]) => {
      const checksum = getAddress(address);
      return [
        checksum,
        parseFloat(formatUnits(userStakeInfo[1], options.decimals))
      ];
    })
  );
}
