import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import fetch from 'cross-fetch';

export const author = 'allmysmarts';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string uri)'
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

  // 1st, get the balance of the token
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

  // 2nd, get tokenIds for each address, and index
  const callWalletIdToTokenID = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletAddress, count] of Object.entries(walletToBalanceOf)) {
    if (count.toNumber() > 0) {
      for (let index = 0; index < count.toNumber(); index++) {
        callWalletIdToTokenID.call(
          walletAddress.toString() + '-' + index.toString(),
          options.address,
          'tokenOfOwnerByIndex',
          [walletAddress, index]
        );
      }
    }
  }
  const walletIdToTokenID: Record<
    string,
    BigNumber
  > = await callWalletIdToTokenID.execute();

  // 3rd, get the tokenURI for each token
  const callWalletIdToTokenURI = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletId, tokenId] of Object.entries(walletIdToTokenID)) {   
    callWalletIdToTokenURI.call(
      walletId.toString(),
      options.address,
      'tokenURI',
      [tokenId]
    );
  }
  const walletIdToTokenURI: Record<
    string, // address + index
    string  // tokenURI
  > = await callWalletIdToTokenURI.execute();

  // 4th, get the attributes, and parse the specified field from tokenURI
  const walletToAttributeValue = {} as Record<string, number>;
  for (const [walletId, tokenURI] of Object.entries(walletIdToTokenURI)) {
    const response = await fetch(tokenURI, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    let attributeValue = 0
    for (const attribute of data.attributes) {
      if (attribute.trait_type === options.attributeName) {
        attributeValue = Number(attribute.value)
      }
    }

    const walletAddress = walletId.split('-')[0];
    walletToAttributeValue[walletAddress] = (walletToAttributeValue[walletAddress] || 0) + attributeValue;
  }

  return Object.fromEntries(
    Object.entries(walletToAttributeValue).map(([address, value]) => [
      address,
      value
    ])
  );
}
