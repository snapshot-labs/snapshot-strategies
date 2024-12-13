import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { BigNumber } from '@ethersproject/bignumber';

export const author = 'divine-comedian';
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

  const supply = fetch(options.supplyApi, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json());

  const tokenMulti = new Multicaller(network, provider, abi, { blockTag });
  const stakedMulti = new Multicaller(
    network,
    provider,
    [options.methodABI.method] as string[],
    {
      blockTag
    }
  );
  addresses.forEach((address) => {
    tokenMulti.call(address, options.tokenAddress, 'balanceOf', [address]),
      stakedMulti.call(address, options.stakedAddress, options.methodABI.name, [
        address
      ]);
  });
  const tokenBalance = tokenMulti.execute();
  const stakedBalance = stakedMulti.execute();

  const [supplyResult, tokenResult, stakedResult]: [
    any,
    Record<string, BigNumber>,
    Record<string, BigNumber>
  ] = await Promise.all([supply, tokenBalance, stakedBalance]);

  const circulatingSupply = parseFloat(
    formatUnits(supplyResult[options.supplyField], options.decimals)
  );

  return Object.fromEntries(
    Object.entries(tokenResult).map(([address, tokenBalance]) => {
      const stakedBalance = stakedResult[address];
      const totalBalance = tokenBalance.add(stakedBalance);
      return [
        address,
        (parseFloat(formatUnits(totalBalance, options.decimals)) /
          circulatingSupply) *
          options.weight
      ];
    })
  );
}
