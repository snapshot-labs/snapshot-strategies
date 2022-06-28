import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'chrisjgf';
export const version = '0.0.1';

const abi = ['function getVotes(address account) view returns (uint256)'];

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stkMTAQuery = addresses.map((address: any) => [
    options.stkMTA,
    'getVotes',
    [address]
  ]);

  const stkBPTQuery = addresses.map((address: any) => [
    options.stkBPT,
    'getVotes',
    [address]
  ]);

  const response = await multicall(
    network,
    provider,
    abi,
    [...stkMTAQuery, ...stkBPTQuery],
    { blockTag }
  );

  const chunks = chunk(response, addresses.length);
  const stkMTABalances = chunks[0];
  const stkBPTBalances = chunks[1];

  return Object.fromEntries(
    Array(addresses.length)
      .fill('x')
      .map((_, i) => [
        addresses[i],
        parseFloat(
          formatUnits(
            stkMTABalances[i][0].add(stkBPTBalances[i][0]).toString(),
            18
          )
        )
      ])
  );
}
