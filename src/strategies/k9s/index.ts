import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'eeekkoo';
export const version = '0.1.0';

// Holding 1-2 vote weight = 1
// Holding 3-5 vote weight = 2
// Holding 6-10 vote weight = 3
// Holding 11+ vote weight = 4
const findWeight = (balance) => {
  balance = Number(balance);
  if (balance <= 0) {
    return 0;
  } else if (balance >= 1 && balance <= 2) {
    return 1;
  } else if (balance >= 3 && balance <= 5) {
    return 2;
  } else if (balance >= 6 && balance <= 10) {
    return 3;
  } else {
    return 4;
  }
};

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      findWeight(parseFloat(formatUnits(value.toString(), 0)))
    ])
  );
}
