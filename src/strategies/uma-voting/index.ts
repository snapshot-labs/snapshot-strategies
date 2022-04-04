import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'abg4';
export const version = '0.1.0';

const designatedVotingContractAbi = [
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'designatedVotingContracts',
    outputs: [
      { internalType: 'contract DesignatedVoting', name: '', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

function getArgs(options, address: string) {
  const args: Array<string | number> = options.args || ['%{address}'];
  return args.map((arg) =>
    typeof arg === 'string' ? arg.replace(/%{address}/g, address) : arg
  );
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

  const votingAddress = await multicall(
    network,
    provider,
    designatedVotingContractAbi,
    addresses.map((address: any) => [
      options.votingFactoryAddress,
      'designatedVotingContracts',
      getArgs(options, address)
    ]),
    { blockTag }
  );

  const response = await multicall(
    network,
    provider,
    [options.methodABI],
    votingAddress.map((address: any) => [
      options.address,
      options.methodABI.name,
      getArgs(options, address)
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(
        formatUnits(
          options?.output ? value[options.output].toString() : value.toString(),
          options.decimals
        )
      )
    ])
  );
}
