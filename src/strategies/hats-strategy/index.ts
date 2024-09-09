import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc4626BalanceOfStrategy } from '../erc4626-assets-of';

export const author = 'hats-finance';
export const version = '0.1.0';

const abi = [
  'function delegates(address account) view returns (address)',
  'function balanceOf(address account) view returns (uint256)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });

  // Get the delegate addresses and original balances
  addresses.forEach((address) => {
    multi.call(`delegates.${address}`, options.address, 'delegates', [address]);
    multi.call(`balances.${address}`, options.address, 'balanceOf', [address]);
  });

  const response = await multi.execute();

  const delegates: Record<string, string> = {};
  const tokenBalances: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const delegate = response.delegates[address];
    const balance = BigNumber.from(response.balances[address] || 0);
    tokenBalances[address] = balance;
    if (
      delegate !== '0x0000000000000000000000000000000000000000' &&
      delegate !== address
    ) {
      delegates[address] = delegate;
    }
  }

  // If ERC4626 vault is provided, calculate the balances and apply multiplier
  const vaultBalances: Record<string, BigNumber> = {};
  if (options.vaultAddress) {
    const rawVaultBalances = await erc4626BalanceOfStrategy(
      space,
      network,
      provider,
      addresses,
      { address: options.vaultAddress, decimals: options.decimals },
      snapshot
    );

    // Apply multiplier to vault balances
    for (const [address, balance] of Object.entries(rawVaultBalances)) {
      vaultBalances[address] = BigNumber.from(
        parseUnits(balance.toString(), options.decimals)
      ).mul(options.vaultMultiplier || 3);
    }
  }

  // Handle delegation: add both token and vault balances to the delegate if delegation exists
  const adjustedBalances: Record<string, BigNumber> = {};
  for (const address of addresses) {
    const tokenBalance = tokenBalances[address] || BigNumber.from(0);
    const vaultBalance = vaultBalances[address] || BigNumber.from(0);
    const totalBalance = tokenBalance.add(vaultBalance);

    const delegate = delegates[address];
    if (delegate) {
      adjustedBalances[delegate] = (
        adjustedBalances[delegate] || BigNumber.from(0)
      ).add(totalBalance);
      adjustedBalances[address] = BigNumber.from(0); // Zero out original balance to avoid double-counting
    } else {
      adjustedBalances[address] = totalBalance;
    }
  }

  const finalBalances: Record<string, number> = {};

  Object.keys(adjustedBalances).forEach((address) => {
    finalBalances[address] = parseFloat(
      formatUnits(
        adjustedBalances[address] || BigNumber.from(0),
        options.decimals
      )
    );
  });

  return finalBalances;
}
