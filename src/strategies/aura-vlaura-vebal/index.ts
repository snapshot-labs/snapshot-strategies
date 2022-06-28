import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xMaharishi';
export const version = '0.1.0';

const abi = [
  'function getVotes(address account) external view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)'
];

interface Params {
  auraLocker: string;
  auraVoterProxy: string;
  votingEscrow: string;
}

interface Response {
  vlAuraTotalSupply: BigNumber;
  vlAuraVotes: Record<string, BigNumber>;
  veBalOwnedByAura: BigNumber;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options: Params,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('vlAuraTotalSupply', options.auraLocker, 'totalSupply', []);
  addresses.forEach((address) =>
    multi.call(`vlAuraVotes.${address}`, options.auraLocker, 'getVotes', [
      address
    ])
  );
  multi.call('veBalOwnedByAura', options.votingEscrow, 'balanceOf', [
    options.auraVoterProxy
  ]);
  const res: Response = await multi.execute();

  return Object.fromEntries(
    Object.entries(res.vlAuraVotes).map(([address, votes]) => [
      address,
      parseFloat(
        formatUnits(
          res.veBalOwnedByAura.mul(votes).div(res.vlAuraTotalSupply),
          18
        )
      )
    ])
  );
}
