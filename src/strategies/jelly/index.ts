import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'profwobble';
export const version = '0.1.0';

const Jelly = '0xf5f06fFa53Ad7F5914F493F16E57B56C8dd2eA80';
const abi = ['function balanceOf(address) view returns (uint256)'];

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
    addresses.map((address: any) => [
      Jelly,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), 18))
    ])
  );
}
