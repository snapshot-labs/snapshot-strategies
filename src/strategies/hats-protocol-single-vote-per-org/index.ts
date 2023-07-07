// import { formatUnits } from '@ethersproject/units';
// import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'hotmanics';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address _wearer, uint256 _hatId) public view returns (uint256 balance)'
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

  const myObj = {};
  addresses.forEach(async (address) => {
    myObj[address] = 0;
  });

  for (let i = 0; i < options.hats.length; i++) {
    const multi = new Multicaller(network, provider, abi, { blockTag });

    addresses.forEach(async (address) => {
      multi.call(address, options.address, 'balanceOf', [
        address,
        options.hats[i]
      ]);
    });

    const result = await multi.execute();

    addresses.forEach(async (address) => {
      myObj[address] += parseFloat(result[address]);
    });
  }

  return Object.fromEntries(
    Object.entries(myObj).map(([address, totalScore]) => [
      address,
      (totalScore as number) >= 1 ? 1 : 0
    ])
  );
}
