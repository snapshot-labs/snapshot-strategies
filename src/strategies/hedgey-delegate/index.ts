import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'hedgey';
export const version = '0.0.1';

const abi = [
  'function getDelegatedVotesFromNFT(address token, address delegate, address hedgeyNFT) public view returns (uint256 lockedBalance)'
];

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
    multi.call(address, options.delegateContract, 'getDelegatedVotesFromNFT', [
      options.token,
      address,
      options.hedgeyNFT
    ])
  );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, votes]) => [
      address,
      BigNumber.from(votes).toNumber()
    ])
  );
}
