import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';

export const author = 'waterdrops';
export const version = '0.1.0';

/**
 * Nouns RFP Strategy to measure voting and proposition power
 * --derived from aave's Governance Power Strategy.
 */

const abi = [
  'function getVotingPower(address user) view returns (uint256)',
  'function getPropositionPower(address user) view returns (uint256)'
];

const powerTypesToMethod = {
  vote: 'getVotingPower',
  proposition: 'getPropositionPower'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag =
    typeof snapshot === 'number'
      ? snapshot
      : await provider.getBlockNumber(snapshot);

  // Early return 0 voting power if governanceStrategy or powerType is not correctly set
  if (!options.governanceStrategy || !powerTypesToMethod[options.powerType]) {
    return Object.fromEntries(addresses.map((address) => [address, '0']));
  }

  const response: BigNumber[] = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [
      options.governanceStrategy,
      powerTypesToMethod[options.powerType],
      [address.toLowerCase()]
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
