import { formatUnits, parseUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'manes-codes';
export const version = '1.0.0';

const abi = [
  'function sharesOf(address account) view returns (uint256)',
  'function getPricePerFullShare() view returns (uint256)'
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

  const queries: any[] = [];

  addresses.forEach((voter) => {
    queries.push([options.address, 'sharesOf', [voter]]);
  });
  queries.push([options.address, 'getPricePerFullShare']);

  const response = (
    await multicall(network, provider, abi, queries, { blockTag })
  ).map((r) => r[0]);
  const sharePrice = response[response.length - 1];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => {
        const balanceBN = response[i].mul(sharePrice).div(parseUnits('1', 18));
        return [addresses[i], parseFloat(formatUnits(balanceBN, 18))];
      })
  );
}
