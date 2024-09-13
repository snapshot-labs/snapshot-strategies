import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc4626BalanceOfStrategy } from '../erc4626-assets-of';

export const author = 'hats-finance';
export const version = '0.1.0';

const abi = [
  'function getVotes(address account) view returns (uint256)',
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

  // Get the voting power, delegate addresses, and original balances
  addresses.forEach((address) => {
    multi.call(`votes.${address}`, options.address, 'getVotes', [address]);
    multi.call(`delegates.${address}`, options.address, 'delegates', [address]);
    multi.call(`balances.${address}`, options.address, 'balanceOf', [address]);
  });

  const response = await multi.execute();

  const adjustedBalances: Record<string, BigNumber> = {};

  for (const address of addresses) {
    const votes = BigNumber.from(response.votes[address] || 0);
    const delegate = response.delegates[address];
    const balance = BigNumber.from(response.balances[address] || 0);

    if (delegate === '0x0000000000000000000000000000000000000000') {
      adjustedBalances[address] = votes.add(balance);
    } else {
      adjustedBalances[address] = votes;
    }
  }

  // If ERC4626 vault is provided, calculate the balances and apply multiplier
  let vaultBalances: Record<string, BigNumber> = {};
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
      vaultBalances[address] = BigNumber.from(parseUnits(balance.toString(), options.decimals)).mul(options.vaultMultiplier || 3);
    }
  }

  // Add vault balances to adjusted balances
  for (const address of addresses) {
    const vaultBalance = vaultBalances[address] || BigNumber.from(0);
    adjustedBalances[address] = (adjustedBalances[address] || BigNumber.from(0)).add(vaultBalance);
  }

  const finalBalances: Record<string, number> = {};
   
  Object.keys(adjustedBalances).forEach((address) => {
    finalBalances[address] = parseFloat(formatUnits(adjustedBalances[address] || BigNumber.from(0), options.decimals));
  });

  return finalBalances;
}
