import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'publu';
export const version = '0.0.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
  'function vaultCollateral(uint256 vaultId) external view returns (uint256)'
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

  const multi1 = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    multi1.call(address, options.address, 'balanceOf', [address])
  );
  const result: Record<string, BigNumberish> = await multi1.execute();

  // get the vault number owned by each user.
  const multi2 = new Multicaller(network, provider, abi, { blockTag });
  const tokenIds: Record<string, BigNumberish[]> = Object.fromEntries(
    addresses.map((address) => [address, []])
  );
  for (const address of addresses) {
    const balance = result[address];
    for (let i = 0; i < balance; i++) {
      multi2.call(`${address}_${i}`, options.address, 'tokenOfOwnerByIndex', [
        address,
        i
      ]);
    }
  }
  const tokenIdsResult = await multi2.execute();

  for (const key in tokenIdsResult) {
    const [address] = key.split('_');
    tokenIds[address].push(tokenIdsResult[key]);
  }

  // get the vaultCollateral by the tokenIds and store that as the amount held by the address
  const multi3 = new Multicaller(network, provider, abi, { blockTag });
  for (const address in tokenIds) {
    for (const tokenId of tokenIds[address]) {
      multi3.call(address, options.address, 'vaultCollateral', [tokenId]);
    }
  }
  const collaterals: Record<string, BigNumberish> = await multi3.execute();

  const resultWithDefault = {};
  for (const address of addresses) {
    const balance = collaterals[address] || 0;
    resultWithDefault[address] = parseFloat(
      formatUnits(balance, options.decimals)
    );
  }

  // Convert addresses to checksum format before returning
  const resultWithChecksum = {};
  for (const address in resultWithDefault) {
    resultWithChecksum[getAddress(address)] = resultWithDefault[address];
  }

  // Check that at least one object with an address is returned
  if (Object.keys(resultWithChecksum).length === 0) {
    resultWithChecksum[getAddress(addresses[0])] = 0;
  }

  return resultWithChecksum;
}
