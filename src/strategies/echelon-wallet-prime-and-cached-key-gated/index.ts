import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as erc1155AllBalancesOf } from '../erc1155-all-balances-of';

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
    stakingPool.call(address, options.stakingAddress, 'cacheInfo', [
      0,
      address
    ]);
  });
  const contractResponse = await stakingPool.execute();

  const cachedKeyScore = Object.fromEntries(
    addresses.map((address) => {
      return [
        address,
        contractResponse[address][0].toNumber() * votingPowerPerKey
      ];
    })
  );

  const walletScore = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options,
    snapshot
  );

  const erc1155Options = {
    address: options.erc1155Address
  };
  const erc1155Balances = await erc1155AllBalancesOf(
    space,
    network,
    provider,
    addresses,
    erc1155Options,
    snapshot
  );

  const votingPower = Object.entries(walletScore).reduce(
    (address, [key, value]) => ({
      ...address,
      [key]: (address[key] || 0) + value
    }),
    { ...cachedKeyScore }
  );

  Object.keys(votingPower).forEach((key) => {
    const whitelistedAddress =
      options.whitelist.indexOf(key) !== -1 ||
      (key in erc1155Balances && erc1155Balances[key] > 0);
    const blacklistedAddress = options.blacklist.indexOf(key) !== -1;

    votingPower[key] =
      whitelistedAddress && !blacklistedAddress
        ? Math.sqrt(votingPower[key])
        : 0;
  });

  return votingPower;
}
