// import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'bonustrack';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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
  const erc721Response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.erc721Address,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

  const values = <any>[];

  for (let i = 0; i < erc721Response.length; i++) {
    const val = {
      address: addresses[i],
      hasERC721Requirement: false
    };

    if (parseFloat(erc721Response[i]) >= options.minERC721Tokens) {
      val.hasERC721Requirement = true;
    }

    values.push(val);
  }

  const finalObj = {};

  for (let i = 0; i < values.length; i++) {
    finalObj[values[i].address] = values[i].hasERC721Requirement ? 1 : 0;
  }

  return finalObj;
}
