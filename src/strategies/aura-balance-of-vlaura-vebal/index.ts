import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = '0xButterfield';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)'
];

interface Params {
  auraLocker: string;
  auraVoterProxy: string;
  votingEscrow: string;
}

interface Response {
  vlAuraTotalSupply: BigNumber;
  vlAuraBalance: Record<string, BigNumber>;
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
    multi.call(`vlAuraBalance.${address}`, options.auraLocker, 'balanceOf', [
      address
    ])
  );
  multi.call('veBalOwnedByAura', options.votingEscrow, 'balanceOf', [
    options.auraVoterProxy
  ]);
  const res: Response = await multi.execute();

  return Object.fromEntries(
    Object.entries(res.vlAuraBalance).map(([address, balance]) => [
      address,
      parseFloat(
        formatUnits(
          res.veBalOwnedByAura.mul(balance).div(res.vlAuraTotalSupply),
          18
        )
      )
    ])
  );
}
