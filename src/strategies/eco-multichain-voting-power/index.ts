import { formatEther } from '@ethersproject/units';
import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

import { getBlockNumber, getProvider, Multicaller } from '../../utils';

export const author = 'carlosfebres';
export const version = '1.0.0';

const contracts = {
  eco: '0x8dBF9A4c99580fC7Fd4024ee08f3994420035727',
  ecox: '0xcccD1Ba9f7acD6117834E0D28F25645dECb1736a',
  opEco: '0xe7BC9b3A936F122f08AAC3b1fac3C3eC29A78874',
  opEcox: '0xf805b07ee64f03f0aeb963883f70d0ac0d0fe242',
  stakedEcox: '0x3a16f2Fee32827a9E476d0c87E454aB7C75C92D7'
};

const abi = [
  'function balanceOf(address user) public view returns (uint256)',
  'function voteBalanceOf(address account) public view returns (uint256)',
  'function votingECOx(address _voter, uint256 _blockNumber) public view returns (uint256)'
];

/**
 * Prefixes to be used for grouping results by token and voting power type
 */
const prefixes = {
  ecoVp: (address) => `${address}-ecoVp`,
  ecoxVp: (address) => `${address}-ecoxVp`,
  opEcoVp: (address) => `${address}-opEcoVp`,
  opEcoxVp: (address) => `${address}-opEcoxVp`,
  stakedEcoxVp: (address) => `${address}-stakedEcoxVp`
};

/**
 * Calculate the combined voting power of ECO and staked ECOx tokens.
 * ECO voting power is divided by 10 and added to staked ECOx voting power.
 * @param ecoVotingPower The voting power of ECO tokens
 * @param stakedEcoXVotingPower The voting power of staked ECOx tokens
 * @returns The combined voting power
 */
function calculateVotingPower(
  ecoVotingPower: BigNumber,
  stakedEcoXVotingPower: BigNumberish
): BigNumber {
  return ecoVotingPower.div(10).add(stakedEcoXVotingPower);
}

// Get block number from 'snapshot' (or fetch latest block number if it's not provided)
async function getBlockNumberFromSnapshot(
  snapshot: number | 'latest',
  provider: StaticJsonRpcProvider
) {
  if (typeof snapshot !== 'number') {
    // Can't use latest block since the votingECOx can only get value from the past
    return (await getBlockNumber(provider)) - 100;
  }
  return snapshot;
}

/**
 * Strategy function that fetch token balances and calculate voting power
 * for each addresses provided
 */
export async function strategy(
  _: string,
  network: string,
  provider: StaticJsonRpcProvider,
  addresses: string[],
  options: { opSnapshot: number },
  snapshot: number | 'latest'
): Promise<Record<string, number>> {
  // Fetch block number from snapshot
  const blockNumber = await getBlockNumberFromSnapshot(snapshot, provider);

  const multi = new Multicaller(network, provider, abi, {
    blockTag: blockNumber
  });
  const multiEcoX = new Multicaller(network, provider, abi);

  // Setting the provider for Optimism network
  const opProvider = getProvider('10');
  const multiOp = new Multicaller('10', opProvider, abi, {
    blockTag: options.opSnapshot
  });

  // Fetch the balance of eco, stakedEcoX and opEco for each addresses
  addresses.forEach((address) => {
    multi.call(prefixes.ecoVp(address), contracts.eco, 'voteBalanceOf', [
      address
    ]);
    multi.call(prefixes.ecoxVp(address), contracts.ecox, 'balanceOf', [
      address
    ]);
    multiEcoX.call(
      prefixes.stakedEcoxVp(address),
      contracts.stakedEcox,
      'votingECOx',
      [address, blockNumber]
    );
    multiOp.call(prefixes.opEcoVp(address), contracts.opEco, 'balanceOf', [
      address
    ]);
    multiOp.call(prefixes.opEcoxVp(address), contracts.opEcox, 'balanceOf', [
      address
    ]);
  });

  // Execute all the calls
  const [ethResults, ethEcoXResults, multiOpResults] = await Promise.all([
    multi.execute(),
    multiEcoX.execute(),
    multiOp.execute()
  ]);

  // Combine all results into a single object
  const results: Record<string, BigNumberish> = {
    ...ethResults,
    ...ethEcoXResults,
    ...multiOpResults
  };

  // Compute voting power for each addresses and map it to the corresponding address
  return Object.fromEntries(
    addresses.map((address) => {
      // Ethereum (Mainnet)
      const ecoTokenBalance = results[prefixes.ecoVp(address)];
      const ecoxVotingPower = results[prefixes.ecoxVp(address)];

      // Optimism
      const opEcoTokenBalance = results[prefixes.opEcoVp(address)];
      const opEcoxVpVotingPower = results[prefixes.opEcoxVp(address)];

      // Stacked ECOx
      const stakedEcoXVotingPower = results[prefixes.stakedEcoxVp(address)];

      const totalVotingPower = calculateVotingPower(
        BigNumber.from(ecoTokenBalance).add(opEcoTokenBalance),
        BigNumber.from(stakedEcoXVotingPower)
          .add(ecoxVotingPower)
          .add(opEcoxVpVotingPower)
      );

      return [getAddress(address), parseInt(formatEther(totalVotingPower))];
    })
  );
}
