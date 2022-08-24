import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits, parseEther } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'victormer';
export const version = '0.0.1';

const tokenABI = [
  'function balanceOf(address account) external view returns (uint256)'
];

const stakingABI = [
  'function getUserBalance(address user_) external view returns (uint256)'
];

const poolABI = [
  'function totalSupply() external view returns (uint256)',
  'function getReserves() external view returns (uint112, uint112, uint32)'
]

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const multiToken = new Multicaller(network, provider, tokenABI, { blockTag });
  const multiStaking = new Multicaller(network, provider, stakingABI, { blockTag });
  const multiFarming = new Multicaller(network, provider, stakingABI, { blockTag });
  const multiPool = new Multicaller(network, provider, poolABI, { blockTag });

  addresses.forEach((address) =>
    multiToken.call(address, '0x12a34A6759c871C4C1E8A0A42CFc97e4D7Aaf68d', 'balanceOf', [address])
  );

  addresses.forEach((address) =>
    multiStaking.call(address, '0x28Caa843cB577d892A8B6eC3F24Aa682ED22Be68', 'getUserBalance', [address])
  );

  addresses.forEach((address) =>
    multiFarming.call(address, '0x57eB1b68F2ae0F77bf54F5EE6133bE80d6381d1B', 'getUserBalance', [address])
  );

  multiPool.call('totalSupply', '0x5d9AC8993B714df01D079d1B5b0b592e579Ca099', 'totalSupply', []);
  multiPool.call('reserves', '0x5d9AC8993B714df01D079d1B5b0b592e579Ca099', 'getReserves', []);

  const [
    resultToken,
    resultStaking,
    resultFarming,
    resultPool
  ] = await Promise.all([
    multiToken.execute(),
    multiStaking.execute(),
    multiFarming.execute(),
    multiPool.execute()
  ]);

  const poolRatio = resultPool.reserves[0].mul(parseEther('1')).div(resultPool.totalSupply);

  const result: Record<string, BigNumberish> = {};

  addresses.forEach((address) => {
    result[address] = resultToken[address].add(resultStaking[address]).add(resultFarming[address].mul(poolRatio).div(parseEther('1'))).toString();
  })

  return Object.fromEntries(
    Object.entries(result).map(([address, balance]) => [
      address,
      parseFloat(formatUnits(balance, 18))
    ])
  );
}
