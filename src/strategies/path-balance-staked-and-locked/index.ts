import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';

export const author = 'PathDAO';
export const version = '0.1.0';

const constAbi = [
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
  const lockedAbi = options.methodABI;

  const stakingPool = new Multicaller(network, provider, constAbi, {
    blockTag
  });
  const tokenPool = new Multicaller(network, provider, constAbi, { blockTag });
  const lockedPool = new Multicaller(network, provider, lockedAbi, {
    blockTag
  });

  addresses.forEach((address) => {
    stakingPool.call(address, options.stakingAddress, 'balanceOf', [address]);
    tokenPool.call(address, options.tokenAddress, 'balanceOf', [address]);
  });

  addresses.forEach((address) => {
    for (let i = 0; i < options.lockedAddresses.length; i++) {
      lockedPool.call(
        `locked_${i}.${address}`,
        options.lockedAddresses[i],
        'getRemainingAmount',
        [address]
      );
    }
  });

  const [stakingResponse, tokenResponse]: [
    Record<string, BigNumberish>,
    Record<string, BigNumberish>
  ] = await Promise.all([stakingPool.execute(), tokenPool.execute()]);

  const lockedResponse = await lockedPool.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      const stakingCount = parseFloat(
        formatUnits(stakingResponse[address], options.decimals)
      );
      const tokenCount = parseFloat(
        formatUnits(tokenResponse[address], options.decimals)
      );
      let lockedCount = 0;
      for (let i = 0; i < options.lockedAddresses.length; i++) {
        const lockedMap = lockedResponse[`locked_${i}`];
        lockedCount += parseFloat(
          formatUnits(lockedMap[address], options.decimals)
        );
      }
      return [address, stakingCount + tokenCount + lockedCount];
    })
  );
}
