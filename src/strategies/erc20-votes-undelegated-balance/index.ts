import { formatUnits } from '@ethersproject/units';
import { getAddress, isAddress } from '@ethersproject/address';
import { multicall } from '../../utils';

export const author = 'snapshot-labs';
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

  // Combine both delegates and balanceOf calls in a single multicall
  const calls = addresses.flatMap((address: any) => [
    [options.address, 'delegates', [address.toLowerCase()]],
    [options.address, 'balanceOf', [address.toLowerCase()]]
  ]);

  const response = await multicall(network, provider, abi, calls, { blockTag });

  return Object.fromEntries(
    addresses.map((address, i) => {
      const delegatesIndex = i * 2;
      const balanceOfIndex = i * 2 + 1;

      const delegateTo = response[delegatesIndex]?.toString().toLowerCase();
      const balance = parseFloat(
        formatUnits(response[balanceOfIndex].toString(), options.decimals || 18)
      );

      // If user has delegated their voting power (to anyone, including themselves), their voting power is 0
      // Otherwise, they get their balance as voting power
      const hasDelegated = hasDelegateAddress(delegateTo);
      const totalVotingPower = hasDelegated ? 0 : balance;

      return [getAddress(address), totalVotingPower];
    })
  );
}

function hasDelegateAddress(delegateAddress: string | undefined): boolean {
  return (
    !!delegateAddress &&
    isAddress(delegateAddress) &&
    delegateAddress !== '0x0000000000000000000000000000000000000000'
  );
}
