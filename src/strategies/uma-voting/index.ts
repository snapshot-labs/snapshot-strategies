import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'abg4';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function designatedVotingContracts(address) view returns (address)'
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
    abi,
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
    abi,
    votingAddress.map((address: any) => [
      options.address,
      'balanceOf',
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
