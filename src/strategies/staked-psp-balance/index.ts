import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'paraswap';
export const version = '0.1.0';

const abi = [
  'function PSPBalance(address _account) view returns (uint256 pspAmount_)'
];

interface StrategyOptions {
  address: string;
  symbol: string;
  decimals: number;
  SPSPs: string[];
}

export async function strategy(
  space: string,
  network: string,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot: number
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multi = new Multicaller(network, provider, abi, { blockTag });
  options.SPSPs.forEach((SPSP) => {
    addresses.forEach((address) => {
      const path = `${SPSP}_${address}`;
      // calls SPSP.PSPBalance(address)
      // and puts into {`${SPSP}_${address}`: balance} in result
      return multi.call(path, SPSP, 'PSPBalance', [address]);
    });
  });
  const result: Record<string, BigNumberish> = await multi.execute();

  const pspByAddress = Object.entries(result).reduce<Record<string, BigNumber>>(
    (accum, [path, balance]) => {
      const [, address] = path.split('_');

      if (!accum[address]) {
        accum[address] = BigNumber.from(0);
      }
      accum[address] = accum[address].add(balance);

      return accum;
    },
    {}
  );

  return Object.fromEntries(
    Object.entries(pspByAddress).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals))
    ])
  );
}
