import { Multicaller } from '../../utils';

export const author = 'brandonleung';
export const version = '1.0.0';

const cachingAbi = [
  'function cacheInfo(uint256, address) view returns (uint256 amount, int256 rewardDebt)'
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

  const stakingPool = new Multicaller(network, provider, cachingAbi, {
    blockTag
  });

  const startingBlockTimestamp = (
    await provider.getBlock(options.startingBlock)
  ).timestamp;
  const endingBlockTimestamp =
    startingBlockTimestamp + 2628288 * options.monthsToDecay;
  const currentBlockTimestamp = (await provider.getBlock(snapshot)).timestamp;

  const decayRate =
    (0 - options.baseValue) / (endingBlockTimestamp - startingBlockTimestamp);

  const votingPowerPerKey =
    options.baseValue +
    decayRate * (currentBlockTimestamp - startingBlockTimestamp);

  addresses.forEach((address) => {
    stakingPool.call(address, options.address, 'cacheInfo', [0, address]);
  });
  const response = await stakingPool.execute();

  return Object.fromEntries(
    addresses.map((address) => {
      return [
        address,
        Math.sqrt(response[address][0].toNumber() * votingPowerPerKey)
      ];
    })
  );
}
