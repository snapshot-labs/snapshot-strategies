import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { getAddress } from '@ethersproject/address';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'blockzerolabs';
export const version = '0.1.0';

const abi = [
  'function totalSupply() external view returns (uint256)',
  'function exists(uint256) external view returns (bool)',
  'function ownerOf(uint256) external view returns (address)',
  'function balanceOf(uint256) external view returns (uint256)'
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

  // Step 1. Retrieve the total supply of Cryptonauts
  const totalSupply = options.totalSupply;

  // Step 2. Determine which ones still exist (i.e not burned)
  const nftExistsMulti = new Multicaller(network, provider, abi, { blockTag });
  for (let _nftId = 0; _nftId < totalSupply; _nftId++) {
    nftExistsMulti.call(
      _nftId,
      options._nftTokenAddress, // This is a static address
      'exists',
      [_nftId]
    );
  }
  const nftExists: Record<number, boolean> = await nftExistsMulti.execute();

  // Step 3. Determine owners for NFTs that still exist
  const nftOwnersMulti = new Multicaller(network, provider, abi, { blockTag });
  for (let _nftId = 0; _nftId < totalSupply; _nftId++) {
    // If the NFT exists, get the owner
    if (nftExists[_nftId]) {
      nftOwnersMulti.call(_nftId, options._nftTokenAddress, 'ownerOf', [
        _nftId
      ]);
    }
  }
  const nftOwners: Record<number, string> = await nftOwnersMulti.execute();

  // Step 4. Get the balance of each NFT from the Vault
  const vaultBalanceMulti = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (let _nftId = 0; _nftId < totalSupply; _nftId++) {
    // If the NFT exists, get the owner
    if (nftExists[_nftId]) {
      vaultBalanceMulti.call(_nftId, options._vaultAddress, 'balanceOf', [
        _nftId
      ]);
    }
  }
  const vaultBalance: Record<number, BigNumberish> =
    await vaultBalanceMulti.execute();

  // Iterate over each address provided
  const balances: Record<string, number> = {};
  addresses.forEach((address) => {
    let totalBalance = BigNumber.from(0);
    // Iterate over each NFT
    for (let _nftId = 0; _nftId < totalSupply; _nftId++) {
      // Ensure the NFT Exists before continuing to add balance
      if (nftExists[_nftId]) {
        // Ensure this address is the owner before continuing to add balance
        if (nftOwners[_nftId] == getAddress(address)) {
          // Add the balance
          totalBalance = totalBalance.add(vaultBalance[_nftId]);
        }
      }
    }
    // Format the balance with 18 decimals (fixed)
    balances[address] = parseFloat(formatUnits(totalBalance, options.decimals));
  });

  return balances;
}
