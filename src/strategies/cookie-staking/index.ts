import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'spaceh3ad';
export const version = '0.1.0';

const abi = [
  'function users(uint256,address) view returns (uint256 shares, uint256 lastDepositedTime, uint256 totalInvested, uint256 totalClaimed)'
];

interface UserData {
  shares: BigNumber;
  lastDepositedTime: BigNumber;
  totalInvested: BigNumber;
  totalClaimed: BigNumber;
}

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

  const poolIds = 11;

  // Prepare multicall
  addresses.forEach((address) => {
    for (let poolId = 0; poolId < poolIds; poolId++) {
      multi.call(`${address}-${poolId}`, options.address, 'users', [
        poolId,
        address
      ]);
    }
  });

  // Typecast result to Record<string, UserData>
  const result = (await multi.execute()) as Record<string, UserData>;

  // Initialize a mapping for user totals
  const userTotals: { [address: string]: BigNumber } = {};

  // Process the result
  for (const [key, userData] of Object.entries(result)) {
    const address = key.split('-')[0];

    const totalInvested = BigNumber.from(userData.totalInvested);
    const totalClaimed = BigNumber.from(userData.totalClaimed);

    if (!userTotals[address]) {
      userTotals[address] = BigNumber.from(0);
    }

    const amount = totalInvested.sub(totalClaimed);

    userTotals[address] = userTotals[address].add(amount);
  }

  const formattedResult = Object.fromEntries(
    addresses.map((address) => [
      address,
      parseFloat(
        formatUnits(
          userTotals[address] || BigNumber.from(0),
          options.decimals || 18
        )
      )
    ])
  );

  return formattedResult;
}
