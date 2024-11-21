import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'kevin-fruitful';
export const version = '0.1.0';

const ENTITY_CONSTANT = '0x454e544954590000000000004d2ced07e3029ea0f98cff05d1444649e7860b81';

const abi = [
  'function getEntity(bytes32 _userId) external view returns (bytes32)',
  'function getStakingAmounts(bytes32 _stakerId, bytes32 _entityId) external view returns (uint256 stakedAmount_, uint256 boostedAmount_)'
];

// Helper function to convert address to userId (bytes32)
function getIdForAddress(address) {
  // Pad the address to 32 bytes with zeros on the right
  return '0x' + address.toLowerCase().slice(2).padEnd(64, '0');
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
  
  // Initialize multicaller for first batch - getting entities
  const entityMulti = new Multicaller(network, provider, abi, { blockTag });
  
  // First, get entity for each address
  addresses.forEach((address) => {
    const userId = getIdForAddress(address);
    entityMulti.call(
      address,
      options.contractAddress,
      'getEntity',
      [userId]
    );
  });
  
  const entityResults = await entityMulti.execute();
  
  // Initialize multicaller for second batch - getting staking amounts
  const stakingMulti = new Multicaller(network, provider, abi, { blockTag });
  
  // For each address, get staking amounts using their entity as stakerId
  addresses.forEach((address) => {
    const entityId = entityResults[address];
    stakingMulti.call(
      address,
      options.contractAddress,
      'getStakingAmounts',
      [entityId, ENTITY_CONSTANT]
    );
  });
  
  const stakingResults = await stakingMulti.execute();
  
  // Process results - use boostedAmount for voting power
  return Object.fromEntries(
    addresses.map((address) => {
      const result = stakingResults[address] || [BigNumber.from(0), BigNumber.from(0)];
      // Use boostedAmount (second return value) for voting power
      const votingPower = parseFloat(formatUnits(result[1], options.decimals || 18));
      return [address, votingPower];
    })
  );
}