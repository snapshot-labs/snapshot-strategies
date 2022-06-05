import fetch from 'cross-fetch';
import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'syedMohib44';
export const version = '0.0.1';

const abi1 = [
  'function getMonsterObj(uint64 _objId) external view returns(uint64 objId, uint32 classId, address trainer, uint32 exp, uint32 createIndex, uint32 lastClaimIndex, uint createTime)',
  'function balanceOf(address owner) external view returns (uint256 balance)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)'
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

  const multi = new Multicaller(network, provider, abi1, { blockTag });
  const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);

  addresses.map((address) => {
    multi.call(address, options.EMON_DATA_ADDRESS, 'balanceOf', [address]);
  });
  const player_addresses: Record<string, BigNumber> = await multi.execute();

  const multi1 = new Multicaller(network, provider, abi1, { blockTag });

  Object.entries(player_addresses).forEach((address) => {
    const balance = clamp(+player_addresses[address[0]].toString(), 0, 200);
    for (let i = 0; i < balance; i++) {
      multi1.call(
        address[0].toString() + '-' + i.toString(),
        options.EMON_DATA_ADDRESS,
        'tokenOfOwnerByIndex',
        [address[0], i]
      );
    }
  });
  const address_tokens: Record<string, BigNumber> = await multi1.execute();
  const multi2 = new Multicaller(network, provider, abi1, { blockTag });

  Object.entries(address_tokens).forEach((address_token) => {
    const address = address_token[0].split('-')[0].toString();
    const token = +address_token[1].toString();
    multi2.call(address + '-' + token, options.EMONA_ADDRESS, 'getMonsterObj', [
      token
    ]);
  });

  const monObject: Record<string, number> = await multi2.execute();

  const response = await fetch(
    'https://storageapi.fleek.co/' + options.tokenWeightIPFS,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  const classIdWeight = await response.json();

  const result: Record<string, number> = {};
  for (const [_address, _obj] of Object.entries(monObject)) {
    const address = _address.split('-')[0];
    const classId = _obj[1];
    if (!result[address]) {
      result[address] = classIdWeight[classId]
        ? classIdWeight[classId].weight
        : 1;
      continue;
    }

    result[address] +=
      +player_addresses[address].toString() > 200
        ? (classIdWeight[classId]
            ? (classIdWeight[classId].weight / 200) *
              +player_addresses[address].toString()
            : 0
          ).toFixed(0)
        : classIdWeight[classId]
        ? classIdWeight[classId].weight
        : 0;
  }
  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [address, balance])
  );
}
