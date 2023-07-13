import { multicall } from '../../utils';
import snapshotjs from '@snapshot-labs/snapshot.js';

export const author = 'hotmanics';
export const version = '0.1.0';

const abi721 = [
  'function balanceOf(address account) external view returns (uint256)'
];

const abi1155 = [
  'function balanceOf(address _owner, uint256 _id) external view returns (uint256)',
  'function owner() public view returns (address)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const erc1155Response = await multicall(
    options.erc1155NetworkId,
    snapshotjs.utils.getProvider(options.erc1155NetworkId),
    abi1155,
    addresses.map((address: any) => [
      options.erc1155Address,
      'balanceOf',
      [address, 1]
    ]),
    { blockTag: options.erc1155BlockTag }
  );

  const erc721Response = await multicall(
    options.erc721NetworkId,
    snapshotjs.utils.getProvider(options.erc721NetworkId),
    abi721,
    addresses.map((address: any) => [
      options.erc721Address,
      'balanceOf',
      [address]
    ]),
    { blockTag: options.erc721BlockTag }
  );

  const values = <any>[];

  for (let i = 0; i < addresses.length; i++) {
    const val = {
      address: addresses[i],
      hasERC721Requirement: false,
      hasERC1155Requirement: false
    };

    if (erc1155Response[i] >= options.erc1155MinTokens) {
      val.hasERC1155Requirement = true;
    }

    if (parseFloat(erc721Response[i]) >= options.erc721MinTokens) {
      val.hasERC721Requirement = true;
    }

    values.push(val);
  }

  const finalObj = {};

  for (let i = 0; i < values.length; i++) {
    finalObj[values[i].address] =
      values[i].hasERC721Requirement && values[i].hasERC1155Requirement ? 1 : 0;
  }

  return finalObj;
}
