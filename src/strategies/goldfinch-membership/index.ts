import { multicall } from '../../utils';
import { strategy as erc1155AllBalancesOf } from '../erc1155-all-balances-of';

export const author = 'sanjayprabhu';
export const version = '0.1.0';

const goListAbi = ['function goList(address) view returns (bool)'];

const LEGACY_GOLDFINCH_CONFIG = '0x4eb844Ff521B4A964011ac8ecd42d500725C95CC';
const UID = '0xba0439088dc1e75F58e0A7C107627942C15cbb41';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const uidResult: { [address: string]: number } = await erc1155AllBalancesOf(
    space,
    network,
    provider,
    addresses,
    {
      address: UID,
      symbol: 'UID'
    },
    snapshot
  );

  const goListResult: [[boolean]] = await multicall(
    network,
    provider,
    goListAbi,
    addresses.map((address: any) => [
      LEGACY_GOLDFINCH_CONFIG,
      'goList',
      [address]
    ]),
    { blockTag }
  );

  // If you don't have a UID, but are on the goList, that's OK.
  addresses.forEach((address, index) => {
    if (!uidResult[address] && goListResult[index][0]) {
      uidResult[address] = 1;
    }
  });

  return uidResult;
}
