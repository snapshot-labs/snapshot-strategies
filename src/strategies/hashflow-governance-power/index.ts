import { getAddress } from '@ethersproject/address';
import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { multicall, Multicaller } from '../../utils';

export const author = 'mib-hashflow';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function assetDetails(address token) external view returns (uint128 withdrawalLimit, uint128 cap, uint128 netPayout, uint128 timestamp, address hToken, address hTokenXChain, bool listed)',
  'function totalSupply() external view returns (uint256)'
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

  const contractData = await multicall(
    network,
    provider,
    abi,
    [
      [options.hftPool, 'assetDetails', [options.hftContract]],
      [options.hToken, 'totalSupply', []]
    ],
    { blockTag }
  );

  const netPayout: BigNumberish = contractData[0].netPayout;
  const totalSupply: BigNumberish = contractData[1][0];

  const lpTokenWeight =
    parseFloat(formatUnits(netPayout, 18)) /
    parseFloat(formatUnits(totalSupply, 18));

  const hftMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    hftMulti.call(address, options.hftContract, 'balanceOf', [address])
  );
  const hftBalances: Record<string, BigNumberish> = await hftMulti.execute();

  const lpMulti = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) =>
    lpMulti.call(address, options.hToken, 'balanceOf', [address])
  );
  const lpBalances: Record<string, BigNumberish> = await lpMulti.execute();

  return Object.fromEntries(
    Object.entries(hftBalances).map(([address, balance]) => [
      getAddress(address),
      parseFloat(formatUnits(balance, 18)) +
        lpTokenWeight * parseFloat(formatUnits(lpBalances[address], 18))
    ])
  );
}
