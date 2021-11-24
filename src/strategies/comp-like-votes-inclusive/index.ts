import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { call } from '../../utils';

export const author = 'd1ll0nk';
export const version = '0.1.0';

const abi = [
  'function getMultipleVotesInclusive(address token, address[] accounts) external view returns (uint256[] scores)'
];

const CompLikeVotesInclusive = '0x95Cb39a64390994dd8C1cC5D8a29dFfDE4212298';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const response: BigNumberish[] = await call(
    provider,
    abi,
    [
      CompLikeVotesInclusive,
      'getMultipleVotesInclusive',
      [options.address, addresses]
    ],
    { blockTag }
  );
  return response.reduce(
    (obj, value, i) => ({
      ...obj,
      [addresses[i]]: parseFloat(formatUnits(value, options.decimals))
    }),
    {} as Record<string, number>
  );
}
