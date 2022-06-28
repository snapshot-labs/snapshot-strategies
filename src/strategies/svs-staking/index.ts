import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'fsjuhl';
export const version = '0.1.0';

const stakingAbi = [
  'function getVampsBuried(address burier) view returns (uint256[])'
];

const tokenAbi = ['function balanceOf(address owner) view returns (uint256)'];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const stakersResponse = await multicall(
    network,
    provider,
    stakingAbi,
    addresses.map((address: any) => [
      options.stakingAddress,
      'getVampsBuried',
      [address]
    ]),
    { blockTag }
  );

  const holdersResponse = await multicall(
    network,
    provider,
    tokenAbi,
    addresses.map((address: any) => [
      options.tokenAddress,
      'balanceOf',
      [address]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    stakersResponse.map((value, i) => [
      addresses[i],
      value[0].length +
        parseFloat(
          formatUnits(holdersResponse[i][0].toString(), options.decimals)
        )
    ])
  );
}
