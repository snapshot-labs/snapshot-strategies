import { formatUnits } from '@ethersproject/units';
import { Multicaller, customFetch } from '../../utils';

export const author = 'timanrebel';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)',
  'function rewardsQuote(address stakerAddress) external view returns (uint256 rewards)',
  'function stakerData(address address) external view returns (uint64 stakedAmount, uint64 sharesEquivalent, uint96 rewardsPerShareWhenStaked, uint32 unlockTime)'
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

  const multi = new Multicaller(network, provider, abi, { blockTag });
  addresses.forEach((address) => {
    // request balance
    multi.call(`balanceOf.${address}`, options.address, 'balanceOf', [address]);

    // request balance of unclaimed staking rewards
    multi.call(`rewardsQuote.${address}`, options.address, 'rewardsQuote', [
      address
    ]);

    // request balance of staked tokens on StablePlaza
    if (options.stableplaza) {
      multi.call(`stableplaza.${address}`, options.stableplaza, 'stakerData', [
        address
      ]);
    }
  });
  const result = await multi.execute();

  const returnObject = {};

  addresses.forEach((address) => {
    if (!returnObject.hasOwnProperty(address)) {
      returnObject[address] = 0;
    }

    returnObject[address] += parseFloat(
      formatUnits(result.balanceOf[address], options.decimals)
    );
    returnObject[address] += parseFloat(
      formatUnits(result.rewardsQuote[address], options.decimals)
    );

    if (options.stableplaza) {
      returnObject[address] += parseFloat(
        formatUnits(
          result.stableplaza[address][0].mul(4294967296),
          options.decimals
        )
      ); // * 2^32
    }
  });

  // request balance on Radix
  const res = await customFetch(
    `https://radix.defiplaza.net/voting/${snapshot}`,
    {},
    8000
  );
  const radixLinks = await res.json();

  for (const wallet of radixLinks) {
    if (!returnObject.hasOwnProperty(wallet.address)) {
      returnObject[wallet.address] = 0;
    }

    returnObject[wallet.address] += parseFloat(
      formatUnits(wallet.balance, options.decimals)
    );
  }

  return returnObject;
}
