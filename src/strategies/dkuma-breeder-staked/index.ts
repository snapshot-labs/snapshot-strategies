import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
// import { multicall } from '../../utils';

export const author = 'TheKdev9';
export const version = '0.1.0';

const dbreederAddress = '0x82a3D73B983396154Cff07101E84d7d339C4f0E3';
const abi = {
  inputs: [{ internalType: 'address', name: '', type: 'address' }],
  name: 'stakeInfo',
  outputs: [
    { internalType: 'uint256', name: 'amount', type: 'uint256' },
    { internalType: 'uint256', name: 'enteredAt', type: 'uint256' },
    { internalType: 'uint256', name: 'rewardTaken', type: 'uint256' },
    { internalType: 'uint256', name: 'rewardTakenActual', type: 'uint256' },
    { internalType: 'uint256', name: 'bag', type: 'uint256' }
  ],
  stateMutability: 'view',
  type: 'function'
};

interface walletInfoInt {
  amount: BigNumberish;
  enteredAt: BigNumberish;
  rewardTaken: BigNumberish;
  rewardTakenActual: BigNumberish;
  bag: BigNumberish;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, [abi], { blockTag });
  addresses.forEach((address) =>
    multi.call(address, dbreederAddress, 'stakeInfo', [address])
  );
  const result: Record<string, walletInfoInt> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, walletInfo]) => [
      address,
      parseFloat(formatUnits(walletInfo.amount, options.decimals))
    ])
  );
}

// export async function strategy(
//   space,
//   network,
//   provider,
//   addresses,
//   options,
//   snapshot
// ): Promise<Record<string, number>> {
//   const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

//   const response: walletInfoInt[] = await multicall(
//     network,
//     provider,
//     [abi],
//     addresses.map((address: any) => [dbreederAddress, abi.name, [address]]),
//     { blockTag }
//   );

//   return Object.fromEntries(
//     response.map((value, i) => [
//       addresses[i],
//       parseFloat(formatUnits(value.amount, options.decimals))
//     ])
//   );
// }
