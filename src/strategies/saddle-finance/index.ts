import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'ug02fast';
export const version = '0.1.0';

const SDLTokenAddress = '0xf1Dc500FdE233A4055e25e5BbF516372BC4F6871';
const abi = [
  'function balanceOf(address) external view returns (uint256)',
  'function '
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

  const balanceOfResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [SDLTokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );

  const retroactiveResponse = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [SDLTokenAddress, 'balanceOf', [address]]),
    { blockTag }
  );

  return Object.fromEntries(
    balanceOfResponse.map((value, i) => {
      console.log({ value });
      return [addresses[i], parseFloat(formatUnits(value.toString(), 18))];
    })
  );
}
