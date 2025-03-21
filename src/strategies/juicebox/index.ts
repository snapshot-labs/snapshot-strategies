import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'drgorillamd';
export const version = '0.2.0';

const JBTokenStore = {
  1: '0xee2eBCcB7CDb34a8A822b589F9E8427C24351bfc',
  2: '0xCBB8e16d998161AdB20465830107ca298995f371',
  3: '0x6FA996581D7edaABE62C15eaE19fEeD4F1DdDfE7'
};
const abi = ['function balanceOf(address, uint256) view returns (uint256)'];

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
      options.protocolVersion
        ? JBTokenStore[options.protocolVersion]
        : JBTokenStore['3'],
      'balanceOf',
      [address, options.projectId]
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
