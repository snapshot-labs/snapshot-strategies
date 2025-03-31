import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'livepeer';
export const version = '0.1.0';

// Livepeer contracts on Arbitrum
const VOTING_CHECKPOINT_CONTRACT = '0x0B9C254837E72Ebe9Fe04960C43B69782E68169A';
const ORCHESTRATOR_REGISTRY_CONTRACT =
  '0x35Bcf3c30594191d53231E4FF333E8A770453e40';
const ARBITRUM_NETWORK = '42161';
const TOKEN_DECIMALS = 18; // Standard ERC-20 decimal precision

const abi = [
  'function getVotes(address account) external view returns (uint256)',
  'function transcoderStatus(address _transcoder) external view returns (uint8)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  if (network !== ARBITRUM_NETWORK) {
    console.log('Livepeer strategy only works on Arbitrum network');
    return Object.fromEntries(addresses.map((address) => [address, 0]));
  }

  // Check which addresses are registered orchestrators
  const orchestratorStatusCalls = addresses.map((address) => [
    ORCHESTRATOR_REGISTRY_CONTRACT,
    'transcoderStatus',
    [address]
  ]);

  // Get staked LPT voting power for all addresses
  const votingPowerCalls = addresses.map((address) => [
    VOTING_CHECKPOINT_CONTRACT,
    'getVotes',
    [address]
  ]);

  const [orchestratorStatuses, votingPowers] = await Promise.all([
    multicall(network, provider, abi, orchestratorStatusCalls, { blockTag }),
    multicall(network, provider, abi, votingPowerCalls, { blockTag })
  ]);

  return Object.fromEntries(
    addresses.map((address, i) => [
      getAddress(address),
      // Only count voting power if the address is an active orchestrator (status = 1)
      orchestratorStatuses[i] && orchestratorStatuses[i][0] === 1
        ? parseFloat(formatUnits(votingPowers[i][0], TOKEN_DECIMALS))
        : 0
    ])
  );
}
