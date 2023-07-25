import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'otomarukanta';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function getStakingDuration(uint256 tokenId) public view returns(uint256)'
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

  // get token balance by address
  const balances = await multicall(
    network,
    provider,
    abi,
    addresses.map((address) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );
  const addressWithIndexes = addresses.flatMap((address, index) =>
    Array.from(Array(Number(balances[index].toString())).keys()).map((_, i) => [
      address,
      i
    ])
  );

  // get token id by address and index
  const tokenIds = await multicall(
    network,
    provider,
    abi,
    addressWithIndexes.map(([address, i]) => [
      options.address,
      'tokenOfOwnerByIndex',
      [address, i]
    ]),
    { blockTag }
  );

  // get staking duraion by token id
  const stakingDurations = await multicall(
    network,
    provider,
    abi,
    tokenIds.map(([tokenId]) => [
      options.address,
      'getStakingDuration',
      [tokenId]
    ]),
    { blockTag }
  );

  // aggregate
  const ret = addressWithIndexes
    .map(([address, _], index) => {
      return {
        address: address,
        vp: stakingDurations[index][0]
      };
    })
    .reduce((result, current) => {
      const element = result.find((p) => p.address === current.address);
      if (element) {
        element.vp += current.vp;
      } else {
        result.push(current);
      }
      return result;
    }, []);

  return ret.reduce(
    (obj, item) =>
      Object.assign(obj, {
        [item.address]: parseFloat(formatUnits(item.vp, options.decimals))
      }),
    {}
  );
}
