import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';
import snapshots from '@snapshot-labs/snapshot.js';

export const author = 'allmysmarts';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)'
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

  // 1st, get all metadata values from the source
  const metadata = await snapshots.utils.getJSON(options.metadataSrc);

  // 2nd, get the balance of the token
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

  // 3rd, get tokenIds for each address, and index
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
  const walletIdToTokenID: Record<string, BigNumber> =
    await callWalletIdToTokenID.execute();

  // 4th, sum up metadata value for each address
  const walletToAttributeValue = {} as Record<string, number>;
  for (const [walletId, tokenID] of Object.entries(walletIdToTokenID)) {
    const walletAddress = walletId.split('-')[0];
    const tokenData = metadata.find((x) => x[tokenID.toString()]);
    walletToAttributeValue[walletAddress] =
      (walletToAttributeValue[walletAddress] || 0) +
      tokenData[tokenID.toString()];
  }

  return Object.fromEntries(
    Object.entries(walletToAttributeValue).map(([address, value]) => [
      address,
      value
    ])
  );
}
