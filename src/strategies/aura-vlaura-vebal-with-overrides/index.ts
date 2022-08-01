import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc20VotesWithOverrideStrategy } from '../erc20-votes-with-override';

export const author = '0xMaharishi';
export const version = '0.1.0';

const abi = [
  'function delegates(address account) external view returns (address)',
  'function getVotes(address account) external view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)'
];

interface Options {
  auraLocker: string;
  auraVoterProxy: string;
  votingEscrow: string;
  includeSnapshotDelegations?: boolean;
  delegationSpace?: string;
}

interface Response {
  vlAuraTotalSupply: BigNumber;
  veBalOwnedByAura: BigNumber;
}

/*
  Based on the `erc20-votes-with-override` strategy, with global vote scaling
  to represent the share of Aura's veBAL.
*/
export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('vlAuraTotalSupply', options.auraLocker, 'totalSupply', []);
  multi.call('veBalOwnedByAura', options.votingEscrow, 'balanceOf', [
    options.auraVoterProxy
  ]);
  const res: Response = await multi.execute();

  const scores: Record<string, number> = await erc20VotesWithOverrideStrategy(
    space,
    network,
    provider,
    addresses,
    {
      address: options.auraLocker,
      delegatesName: 'delegates',
      balanceOfName: 'balanceOf',
      getVotesName: 'getVotes',
      decimals: 18,
      includeSnapshotDelegations: options.includeSnapshotDelegations,
      delegationSpace: options.delegationSpace
    },
    snapshot
  );

  const veBalOwnedByAura = parseFloat(formatUnits(res.veBalOwnedByAura));
  const vlAuraTotalSupply = parseFloat(formatUnits(res.vlAuraTotalSupply));

  return Object.fromEntries(
    Object.entries(scores).map(([address, score]) => [
      address,
      (veBalOwnedByAura * score) / vlAuraTotalSupply
    ])
  );
}
