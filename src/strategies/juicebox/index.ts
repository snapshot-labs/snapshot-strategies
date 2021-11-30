import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'drgorillamd';
export const version = '1.0';

const JBTicketBooth = "0xee2eBCcB7CDb34a8A822b589F9E8427C24351bfc";
const abi = [
  {
	name: 'balanceOf',
	type: 'function',
	inputs: [
		{
			name: '',
			type: 'address',
			internalType: 'address'
		},
		{
			name: '',
			type: 'uint256',
			internalType: 'uint256'
		}
	],
	outputs: [
		{
			name: '',
			type: 'uint256',
			internalType: 'uint256'
		}
	],
	stateMutability: 'view'
	}
]

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
      JBTicketBooth,
      'balanceOf',
      [address, options.projectId]
    ]),
    { blockTag }
  );

  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), '18'))
    ])
  );
}
