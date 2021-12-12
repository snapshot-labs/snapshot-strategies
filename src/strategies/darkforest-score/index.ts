import { multicall } from '../../utils';

export const author = 'cha0sg0d';
export const version = '0.1.0';

const SCORE_INDEX = 5;
const abi = [
  'function players(address key) public view returns (bool, address, uint256, uint256, uint256, uint256)'
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

  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.address,
      'players',
      [address.toLowerCase()]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((playerStruct, i) => [
      addresses[i],
      Math.floor(Math.sqrt(playerStruct[SCORE_INDEX].toNumber()))
    ])
  );
}
