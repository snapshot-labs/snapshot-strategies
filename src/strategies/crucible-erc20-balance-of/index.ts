import { BigNumber } from '@ethersproject/bignumber';
import { hexZeroPad } from '@ethersproject/bytes';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'thegostep';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)'
];

// options
// {
//   "crucible_factory": "0x54e0395CFB4f39beF66DBCd5bD93Cca4E9273D56",
//   "erc20_address": "0xCD6bcca48069f8588780dFA274960F15685aEe0e",
//   "erc20_decimals": 18
// }

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // get the number of crucibles owned by the wallet
  // wallet_address => crucible_count

  const callWalletToCrucibleCount = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const walletAddress of addresses) {
    callWalletToCrucibleCount.call(
      walletAddress,
      options.crucible_factory,
      'balanceOf',
      [walletAddress]
    );
  }
  const walletToCrucibleCount: Record<string, BigNumber> =
    await callWalletToCrucibleCount.execute();

  // get the address of each crucible
  // wallet_address : crucible_index => crucible_address

  const callWalletToCrucibleAddresses = new Multicaller(
    network,
    provider,
    abi,
    {
      blockTag
    }
  );
  for (const [walletAddress, crucibleCount] of Object.entries(
    walletToCrucibleCount
  )) {
    for (let index = 0; index < crucibleCount.toNumber(); index++) {
      callWalletToCrucibleAddresses.call(
        walletAddress.toString() + '-' + index.toString(),
        options.crucible_factory,
        'tokenOfOwnerByIndex',
        [walletAddress, index]
      );
    }
  }
  const walletIDToCrucibleAddresses: Record<string, BigNumber> =
    await callWalletToCrucibleAddresses.execute();

  // get the balance of each crucible
  // crucible_address => lp_balance

  const callCrucibleToLpBalance = new Multicaller(network, provider, abi, {
    blockTag
  });
  for (const [walletID, crucibleAddress] of Object.entries(
    walletIDToCrucibleAddresses
  )) {
    callCrucibleToLpBalance.call(walletID, options.erc20_address, 'balanceOf', [
      hexZeroPad(crucibleAddress.toHexString(), 20)
    ]);
  }
  const walletIDToLpBalance: Record<string, BigNumber> =
    await callCrucibleToLpBalance.execute();

  // sum the amount of LP tokens held across all crucibles
  // wallet_address => lp_balance

  const walletToLpBalance = {} as Record<string, BigNumber>;
  for (const [walletID, lpBalance] of Object.entries(walletIDToLpBalance)) {
    const address = walletID.split('-')[0];
    walletToLpBalance[address] = walletToLpBalance[address]
      ? walletToLpBalance[address].add(lpBalance)
      : lpBalance;
  }

  return Object.fromEntries(
    Object.entries(walletToLpBalance).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.erc20_decimals))
    ])
  );
}
