import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'scottrepreneur';
export const version = '0.1.0';

const abi = [
  'function memberAddressByDelegateKey(address) view returns (address)',
  'function members(address) view returns (address delegateKey, uint256 shares, uint256 loot, bool exists, uint256 highestIndexYesVote, uint256 jailed)'
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
  const memberAddresses = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'memberAddressByDelegateKey',
      [address]
    ]),
    { blockTag }
  );

  const response = await multicall(
    network,
    provider,
    abi,
    memberAddresses
      .filter(
        (addr) =>
          addr.toString() !== '0x0000000000000000000000000000000000000000'
      )
      .map((addr: any) => [options.address, 'members', [addr.toString()]]),
    { blockTag }
  );

  const addressesWithMemberAddress = addresses.filter(
    (addr, i) =>
      memberAddresses[i].toString() !==
      '0x0000000000000000000000000000000000000000'
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addressesWithMemberAddress[i],
      parseFloat(formatUnits(value.shares.toString(), options.decimals)) +
        parseFloat(formatUnits(value.loot.toString(), options.decimals))
    ])
  );
}
