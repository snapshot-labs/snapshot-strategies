
import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'gregegan';
export const version = '0.1.0';

const abi = [
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

  // First, get the balance of the token
  const callWalletToBalanceOf = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    callWalletToBalanceOf.call(walletAddress, options.address, 'balanceOf', [
      walletAddress
    ]);
  }
  const walletToBalanceOf: Record<
    string,
    BigNumber
  > = await callWalletToBalanceOf.execute();

  // Second, get the tokenId's for each token
  const callWalletToAddresses = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletAddress, count] of Object.entries(walletToBalanceOf)) {
    for (let index = 0; index < count.toNumber(); index++) {
      callWalletToAddresses.call(
        walletAddress.toString() + '-' + index.toString(),
        options.address,
        'tokenOfOwnerByIndex',
        [walletAddress, index]
      );
    }
  }
  const walletIDToAddresses: Record<
    string,
    BigNumber
  > = await callWalletToAddresses.execute();

  // Third, sum the weights for each tokenId by finding it's range
  const walletToLpBalance = {} as Record<string, BigNumber>;
  for (const [walletID, tokenId] of Object.entries(walletIDToAddresses)) {
    const address = walletID.split('-')[0];

    let tokenIdValue = options.tokenIdWeight[tokenId.toNumber()];

    walletToLpBalance[address] = walletToLpBalance[address]
      ? walletToLpBalance[address].add(BigNumber.from(tokenIdValue))
      : BigNumber.from(tokenIdValue);
  }

  return Object.fromEntries(
    Object.entries(walletToLpBalance).map(([address, balance]) => [
      address,
      balance.toNumber()
    ])
  );
}
