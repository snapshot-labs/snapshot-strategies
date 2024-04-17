import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'thlynn';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function balanceOfNFT(uint256 _tokenId) external view returns (uint256)'
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

  const multiCallBalanceOf = new Multicaller(network, provider, abi, {
    blockTag
  });
  addresses.forEach((address) =>
    multiCallBalanceOf.call(address, options.address, 'balanceOf', [address])
  );
  const walletBalanceOf: Record<string, BigNumber> =
    await multiCallBalanceOf.execute();

  const multiCallTokenOfOwner = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletAddress, count] of Object.entries(walletBalanceOf)) {
    for (let index = 0; index < count.toNumber(); index++) {
      multiCallTokenOfOwner.call(
        walletAddress.toString() + '-' + index.toString(),
        options.address,
        'tokenOfOwnerByIndex',
        [walletAddress, index]
      );
    }
  }
  const walletIDToAddresses: Record<string, BigNumber> =
    await multiCallTokenOfOwner.execute();

  // Third, get voting power for each tokenId
  const multiCallBalanceOfNFT = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletID, tokenId] of Object.entries(walletIDToAddresses)) {
    multiCallBalanceOfNFT.call(walletID, options.address, 'balanceOfNFT', [
      tokenId
    ]);
  }
  const walletVotingPower: Record<string, BigNumber> =
    await multiCallBalanceOfNFT.execute();

  const result = {} as Record<string, number>;
  for (const [walletID, value] of Object.entries(walletVotingPower)) {
    const address = walletID.split('-')[0];
    result[address] =
      (result[address] || 0) + parseFloat(formatUnits(value, options.decimals));
  }

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [address, balance])
  );
}
