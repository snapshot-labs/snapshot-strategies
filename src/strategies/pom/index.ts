import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'beastdao';
export const version = '0.1.0';

const namesRegistryAddress = '0xaCeE2CB8Cf92D0d6DC7eB80bEF7dDecf75482819';
const abi = [
  'function getNameInCommunityByAddress(address userAddress,string memory community_) public view returns (uint256) '
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
    multi.call(address, namesRegistryAddress, 'getNameInCommunityByAddress', [
      address,
      options.community
    ])
  );
  const result: Record<string, BigNumber> = await multi.execute();
  return Object.fromEntries(
    Object.entries(result).map(([address, id]) => [
      address,
      id.isZero() ? 0 : 1
    ])
  );
}
