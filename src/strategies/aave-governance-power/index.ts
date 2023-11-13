import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'kartojal';
export const version = '0.1.0';

/**
 * Aave Governance strategy to measure voting or
 */

const abi = [
  'function getPropositionPowerAt(address user, uint256 blockNumber) view returns (uint256)',
  'function getVotingPowerAt(address user, uint256 blockNumber) view returns (uint256)'
];

const powerTypesToMethod = {
  vote: 'getVotingPowerAt',
  proposition: 'getPropositionPowerAt'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Early return 0 voting power if governanceStrategy or powerType is not correctly set
  if (!options.governanceStrategy || !powerTypesToMethod[options.powerType]) {
    return Object.fromEntries(addresses.map((address) => [address, '0']));
  }

  const blockNumber =
    blockTag === 'latest' ? await provider.getBlockNumber(network) : blockTag;
  const response: BigNumber[] = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.governanceStrategy,
      powerTypesToMethod[options.powerType],
      [address.toLowerCase(), blockNumber]
    ]),
    { blockTag }
  );
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      parseFloat(formatUnits(value.toString(), options.decimals))
    ])
  );
}
