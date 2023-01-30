import { BigNumberish } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';

export const author = 'ppoliani';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function balanceOf(address account, uint256 tokenId) external view returns (uint256)'
];

type Balance = {
  erc721: number;
  erc1155: number;
};

const JBAS_ADDRESS = '0x2120d19431e0dd49411e5412629f8e41a72cfabd';
const JAFS_ADDRESS = '0x56cA59ab1b3c7086b3c4aF417593fDeE566A3320';

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
  const erc1155TokenId = options.jafsTokensId;

  // get the both ERC721 and ERC1155 balances
  addresses.forEach((address) => {
    const checksum = getAddress(address);
    multi.call(`${checksum}-721`, JBAS_ADDRESS, 'balanceOf(address)', [
      checksum
    ]);

    multi.call(
      `${checksum}-1155`,
      JAFS_ADDRESS,
      'balanceOf(address, uint256)',
      [checksum, erc1155TokenId]
    );
  });

  const result: Record<string, BigNumberish> = await multi.execute();

  const balances: Record<string, Balance> = Object.entries(result).reduce(
    (acc, [path, balance]) => {
      const parts = path.split('-');
      const address = parts[0];
      const nftType = parts[1];

      const accountBalances = acc[address] || {
        erc721: 0,
        erc1155: 0
      };

      let newErc721Bal;
      let newErc1155Bal;

      switch (nftType) {
        case '721':
          newErc721Bal = accountBalances.erc721 + balance;
          newErc1155Bal = accountBalances.erc1155;
          acc[address] = {
            erc721: newErc721Bal,
            erc1155: newErc1155Bal
          };
          break;
        case '1155':
          newErc721Bal = accountBalances.erc721;
          newErc1155Bal = accountBalances.erc1155 + balance;
          acc[address] = {
            erc721: newErc721Bal,
            erc1155: newErc1155Bal
          };

          break;
      }

      return acc;
    },
    {}
  );

  return Object.fromEntries(
    Object.entries(balances).map(([address, balance]) => [
      address,
      Math.min(balance.erc721, balance.erc1155)
    ])
  );
}
