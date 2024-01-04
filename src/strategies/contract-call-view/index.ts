import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'tkowalczyk';
export const version = '0.1.0';

function parseOutput(options, value) {
  return value.toString().includes(',')
    ? parseFloat(formatUnits(value.toString().split(',')[options.outputIndexToReturn], options.decimals))
    : parseFloat(formatUnits(value.toString(), options.decimals))
}

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
    [options.methodABI],
    addresses.map((address: any) => [
      options.address,
      options.methodABI.name,
      [address]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseOutput(options, value)
    ])
  );
}
