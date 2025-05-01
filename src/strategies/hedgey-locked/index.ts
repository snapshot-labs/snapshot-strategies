import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'agentcoinorg';
export const version = '1.0.0';

const abi = [
  'function lockedBalances(address holder, address token) view returns (uint256 lockedBalance)'
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

  for (const contract of options.contracts) {
    for (const address of addresses) {
      multi.call(contract + "/" + address, contract, 'lockedBalances', [address, options.token]);
    }
  }
  
  const result: Record<string, BigNumberish> = await multi.execute();

  const scores: Record<string, BigNumber> = 
    Object.entries(result).reduce((acc, [path, value]) => {
      const [_, address] = path.split('/');
      const score = BigNumber.from(value).mul(options.multiplier);
      return {
        ...acc,
        [address]: acc[address] ? acc[address].add(score) : score
      };
    }, {});

  return Object.fromEntries(
    Object.entries(scores).map(([address, score]) => [
      address,
      parseFloat(formatUnits(score.toString(), options.decimals))
    ])
  );
}
