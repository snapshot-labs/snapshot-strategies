import { BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'majkic99';
export const version = '0.1.0';

const abiStaking = ['function stakes(address) public view returns (uint256)'];
const abiProxyRegistry = [
  'function proxies(address) public view returns (address)'
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

  const proxyMulti = new Multicaller(network, provider, abiProxyRegistry, {
    blockTag
  });
  addresses.forEach((address) =>
    proxyMulti.call(address, options.proxyRegistryAddr, 'proxies', [address])
  );
  const proxyAddresses: Record<string, BigNumberish> =
    await proxyMulti.execute();

  const stakersMulti = new Multicaller(network, provider, abiStaking, {
    blockTag
  });

  addresses.forEach((address) => {
    stakersMulti.call(address, options.lqtyStakingAddr, 'stakes', [
      proxyAddresses[address]
    ]);
  });

  const result: Record<string, BigNumberish> = await stakersMulti.execute();

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 18))
    ])
  );
}
