import { BigNumber } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'nedao';
export const version = '0.1.0';

const abi = [
  'function litProclamation(address validateur,address sujet, bytes32 typeValidation) public view returns (bytes32) '
];

function bytes32ToBool(bytes32) {
  const hex = bytes32.startsWith('0x') ? bytes32.slice(2) : bytes32;
  return (hex != 0) ? 1 : 0;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const multi = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) =>
    multi.call(address, options.contractAddress, 'litProclamation', [
      options.validateur,
      address,
      options.typeValidation
    ])
  );
  const result: Record<string, BigNumber> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, id]) => [
      address,
      bytes32ToBool(id),
    ])
  );
}
