import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'mitesh-mutha';
export const version = '0.1.0';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
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

  const erc721 = new Multicaller(network, provider, abi, { blockTag });
  const erc20 = new Multicaller(network, provider, abi, { blockTag });

  addresses.forEach((address) => {
    erc721.call(address, options.erc721, 'balanceOf', [address])
    erc20.call(address, options.erc20, 'balanceOf', [address])
  });
  
  const [erc721Balances, erc20Balances]: [
    Record<string, BigNumberish>,
    Record<string, BigNumberish>
  ] = await Promise.all([
    erc721.execute(),
    erc20.execute()
  ]);
  
  const result = Object.fromEntries(
    addresses.map((address) => {
      const erc721Balance = erc721Balances[address];
      const erc20Balance = erc20Balances[address];
      if (erc721Balance > 0)
        return [address, parseFloat(formatUnits(erc20Balance, options.decimals))];
      return [address, 0.0];
    })
  );
  return result;
}
