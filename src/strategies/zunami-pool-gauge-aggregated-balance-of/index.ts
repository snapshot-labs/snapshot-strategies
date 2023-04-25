import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { call, Multicaller } from '../../utils';

export const author = 'fextr';
export const version = '1.0.0';

const zunamiSnapshotHelperAbi = [
  'function aggregatedBalanceOf(address _account) external view returns (uint256)'
];

const curveAbi = ['function get_virtual_price() view returns (uint256)'];

interface StrategyOptions {
  address: string;
  decimals: number;
  lpPriceDecimals: number;
  curvePoolAddress: string;
  blackListAddresses: string[];
}

export async function strategy(
  space,
  network,
  provider,
  addresses: string[],
  options: StrategyOptions,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const lpPrice = parseFloat(
    formatUnits(
      await call(
        provider,
        curveAbi,
        [options.curvePoolAddress, 'get_virtual_price'],
        { blockTag }
      ),
      options.lpPriceDecimals
    )
  );

  const multi = new Multicaller(network, provider, zunamiSnapshotHelperAbi, {
    blockTag
  });
  const blackListAddressesArr = Array.from(options.blackListAddresses).map(
    (address) => address.toLowerCase()
  );
  addresses
    .filter((address) => !blackListAddressesArr.includes(address.toLowerCase()))
    .forEach((address) =>
      multi.call(address, options.address, 'aggregatedBalanceOf', [address])
    );
  const result: Record<string, BigNumberish> = await multi.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, options.decimals)) * lpPrice
    ])
  );
}
