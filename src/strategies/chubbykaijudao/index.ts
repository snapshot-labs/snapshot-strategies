import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Multicaller } from '../../utils';

export const author = 'yosep';
export const version = '0.1.0';

const stakingAbi = [
  'function GEN1depositsOf(address account) external view returns (uint16[] memory)'
];

const tokenAbi = [
  'function balanceOf(address owner) public view returns (uint256)'
];

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  const stakingPool = new Multicaller(network, provider, stakingAbi, {
    blockTag
  });
  const tokenPool = new Multicaller(network, provider, tokenAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    stakingPool.call(address, options.staking, 'GEN1depositsOf', [address]);
    tokenPool.call(address, options.token, 'balanceOf', [address]);
  });

  const [stakingResponse, tokenResponse]: [
    Record<string, BigNumberish[]>,
    Record<string, BigNumberish>
  ] = await Promise.all([stakingPool.execute(), tokenPool.execute()]);

  return Object.fromEntries(
    addresses.map((address) => {
      const stakingCount = stakingResponse[address].length;
      const tokenCount = BigNumber.from(tokenResponse[address]).toNumber();
      return [address, stakingCount + tokenCount];
    })
  );
}
