import { BigNumberish, BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'altlayer';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const reAltStrategy = "0x6075546538c3eFbD607ea6aFC24149fCcFb2edF4"; // reALT Strategy Mainnet

  const balanceOfMulticaller = new Multicaller(network, provider, [
    'function balanceOf(address account) external view returns (uint256)',
  ], { blockTag });

  addresses.forEach((address) =>
    balanceOfMulticaller.call(address, options.address, 'balanceOf', [address])
  );

  const sharesMulticaller = new Multicaller(network, provider, [
    'function shares(address user) external view returns (uint256)',
  ], { blockTag });

  addresses.forEach((address) =>
    sharesMulticaller.call(address, reAltStrategy, 'shares', [address])
  );

  const [balanceOfResults, sharesResults]: [Record<string, BigNumberish>, Record<string, BigNumberish>] = await Promise.all([
    balanceOfMulticaller.execute(),
    sharesMulticaller.execute()
  ]);

  return Object.fromEntries(
    addresses.map((address) => {
      const balanceOf = balanceOfResults[address] || BigNumber.from(0);
      const shares = sharesResults[address] || BigNumber.from(0);
      const totalBalance = BigNumber.from(balanceOf).add(BigNumber.from(shares));
      return [
        address,
        parseFloat(formatUnits(totalBalance, options.decimals))
      ];
    })
  );
}
