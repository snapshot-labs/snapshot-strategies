import fetch from 'cross-fetch';
import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'ethantddavis';
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

  // get token balance
  const callWalletToBalanceOf = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    callWalletToBalanceOf.call(walletAddress, options.address, 'balanceOf', [
      walletAddress
    ]);
  }
  const walletToBalanceOf: Record<string, BigNumber> =
    await callWalletToBalanceOf.execute();

  // get tokenIds
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
  const walletIDToAddresses: Record<string, BigNumber> =
    await callWalletToAddresses.execute();

  // fetch ipfs tier weights
  const response = await fetch(
    'https://ipfs.io/ipfs/' + options.tokenWeightIPFS,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );
  const weights = await response.json();

  // sum the weights for each token ID
  const walletToLpBalance = {} as Record<string, BigNumber>;
  for (const [walletID, tokenId] of Object.entries(walletIDToAddresses)) {
    const address = walletID.split('-')[0];

    const tokenIdValue = weights[tokenId.toString()];

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
