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

const DECIMALS = 18;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, [options.dbreederAbi], {
    blockTag
  });
  addresses.forEach((address) =>
    multi.call(address, options.dbreederAddress, options.dbreederAbi.name, [
      address
    ])
  );
  const result: Record<string, walletInfoInt> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, walletInfo]) => [
      address,
      parseFloat(formatUnits(walletInfo.amount, DECIMALS))
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
//     addresses.map((address: any) => [dbreederAddress, options.dbreederAbi.name, [address]]),
//     { blockTag }
//   );

//   return Object.fromEntries(
//     response.map((value, i) => [
//       addresses[i],
//       parseFloat(formatUnits(value.amount, DECIMALS))
//     ])
//   );
// }
