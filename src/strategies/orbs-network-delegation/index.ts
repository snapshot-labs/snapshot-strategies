import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from "@ethersproject/address";

export const author = 'gadcl';
export const version = '0.1.1';

const abi = [
  'function getDelegatedStake(address addr) external view returns (uint256)',
  'function getDelegationInfo(address addr) external view returns (address delegation, uint256 delegatorStake)'
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
  addresses.forEach((address) =>
    multi.call(address, options.address, 'getDelegatedStake', [address])
  );
  const delegations: Record<string, BigNumberish> = await multi.execute();

  Object.entries(delegations)
    .filter(([, delegatedStake]) => BigNumber.from(0).eq(delegatedStake))
    .forEach(([address]) =>
      multi.call(address, options.address, 'getDelegationInfo', [address])
    );
  const override: Record<string, [string, BigNumberish]> =
    await multi.execute();

  Object.entries(override).forEach(
    ([address, [delegation, delegatorStake]]) => {
      const from = getAddress(address);
      const to = getAddress(delegation);
      delegations[from] = delegatorStake;
      if (delegations[to]) {
        delegations[to] = BigNumber.from(delegations[to]).sub(delegatorStake);
      }
    }
  );

  return Object.fromEntries(
    Object.entries(delegations).map(([address, delegatedStake]) => [
      getAddress(address),
      parseFloat(formatUnits(delegatedStake, options.decimals))
    ])
  );
}
