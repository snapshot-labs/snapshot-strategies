import { keccak256 } from '@ethersproject/keccak256';
import { pack } from '@ethersproject/solidity';
import { Multicaller, call } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'gardenfi';
export const version = '0.0.1';

const abi = [
  'function delegateNonce(address) external view returns (uint256)',
  'function stakes(bytes32) external view returns (address owner, uint256 stake, uint256 units, uint256 votes, address filler, uint256 expiry)'
];

type Vote = {
  votes: { _hex: string; _isBigNumber: boolean };
};

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
  for (const address of addresses) {
    const nonce = await getNonce(
      provider,
      address,
      options.gardenStakerAddress
    );
    for (let i = 0; i < nonce; i++) {
      const stakeId = keccak256(pack(['address', 'uint256'], [address, i]));
      // Append i to address to avoid collisions from multiple stakes
      multi.call(address + i, options.gardenStakerAddress, 'stakes', [stakeId]);
    }
  }

  const stakes: Record<string, Vote> = await multi.execute();

  const usersToVotes: Record<string, number> = {};

  for (const userAddrWithStakeNumber of Object.keys(stakes)) {
    // remove the appended number from the address
    const address = userAddrWithStakeNumber.substring(0, 42);
    usersToVotes[address] = calculateVotes(
      stakes[userAddrWithStakeNumber],
      usersToVotes[address]
    );
  }

  return usersToVotes;
}

async function getNonce(
  provider: any,
  address: string,
  contractAddress: string
) {
  const nonceBn = await call(provider, abi, [
    contractAddress,
    'delegateNonce',
    [address]
  ]);
  return BigNumber.from(nonceBn._hex).toNumber();
}
/**
 * Calculate the total votes for a user given their stake and existing votes
 */
function calculateVotes(stake: Vote, existingVotes: number | undefined) {
  return (
    (existingVotes ?? 0) + (BigNumber.from(stake.votes._hex).toNumber() ?? 0)
  );
}
