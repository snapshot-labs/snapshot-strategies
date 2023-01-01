import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
// import { multicall } from '../../utils';

export const author = 'TheKdev9';
export const version = '0.1.0';

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

  const multi = new Multicaller(network, provider, [options.dbreeder.abi], {
    blockTag
  });
  addresses.forEach((address) =>
    multi.call(address, options.dbreeder.address, 'stakeInfo', [address])
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
//     addresses.map((address: any) => [options.dbreeder.address, abi.name, [address]]),
//     { blockTag }
//   );

//   return Object.fromEntries(
//     response.map((value, i) => [
//       addresses[i],
//       parseFloat(formatUnits(value.amount, options.decimals))
//     ])
//   );
// }
