import { Multicaller, subgraphRequest } from '../../utils';
import { formatUnits } from '@ethersproject/units';

export const author = 'penandlim';
export const version = '1.0.0';

const abi = [
  'function subscriptions(address user) external view returns (uint256)',
  'function endTime() external view returns (uint256)',
  'function balanceOf(address user) external view returns (uint256)',
  'function floorQuoteAmount() external view returns (uint256)',
  'function totalSubscriptions() external view returns (uint256)',
  'function totalProjectTokenAmount() external view returns (uint256)'
];

const GRAPH_BLOCK_API_URL =
  'https://subgrapher.snapshot.org/subgraph/arbitrum/9A6bkprqEG2XsZUYJ5B2XXp6ymz9fNcn4tVPxMWDztYC';

async function getNearestBlockNumberBeforeTimestamp(timestamp: number) {
  const rawData = await subgraphRequest(GRAPH_BLOCK_API_URL, {
    blocks: {
      __args: {
        first: 1,
        orderBy: 'timestamp',
        orderDirection: 'desc',
        where: {
          timestamp_lte: timestamp
        }
      },
      number: true,
      timestamp: true
    }
  });
  return Number(rawData.blocks[0].number);
}

function min(a: bigint, b: bigint) {
  return a < b ? a : b;
}

function max(a: bigint, b: bigint) {
  return a > b ? a : b;
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';

  // Get the subscription balances at the snapshot block
  // If they have claimed from the auction, this will be 0 and their amount will have been added to their wallet balance
  const multiSnapshotBlock = new Multicaller(network, provider, abi, {
    blockTag
  });
  addresses.forEach((address: any) => {
    multiSnapshotBlock.call(
      `subscriptions.${address}`,
      options.auctionAddress,
      'subscriptions',
      [address]
    );
    multiSnapshotBlock.call(
      `balanceOf.${address}`,
      options.address,
      'balanceOf',
      [address]
    );
  });
  multiSnapshotBlock.call('endTime', options.auctionAddress, 'endTime');
  multiSnapshotBlock.call(
    'totalSubscriptions',
    options.auctionAddress,
    'totalSubscriptions'
  );
  multiSnapshotBlock.call(
    'totalProjectTokenAmount',
    options.auctionAddress,
    'totalProjectTokenAmount'
  );
  multiSnapshotBlock.call(
    'floorQuoteAmount',
    options.auctionAddress,
    'floorQuoteAmount'
  );
  const multiSnapshotBlockResult = await multiSnapshotBlock.execute();
  const snapshotTimestamp = BigInt(
    (await provider.getBlock(blockTag)).timestamp
  );
  const auctionEndTimestamp = BigInt(multiSnapshotBlockResult.endTime);
  const totalSubscriptions = BigInt(
    multiSnapshotBlockResult.totalSubscriptions
  );
  const totalProjectTokenAmount = BigInt(
    multiSnapshotBlockResult.totalProjectTokenAmount
  );
  const floorQuoteAmount = BigInt(multiSnapshotBlockResult.floorQuoteAmount);

  // Get the cloest block number before the end of the auction
  const auctionEndBlock = await getNearestBlockNumberBeforeTimestamp(
    Number(auctionEndTimestamp)
  );

  // Get the subscription amounts at the end of the auction
  // This will match the subscription amounts at the snapshot block if the user has not claimed from the auction
  const multiAuctionEnd = new Multicaller(network, provider, abi, {
    blockTag: auctionEndBlock
  });
  addresses.forEach((address: any) => {
    multiAuctionEnd.call(
      `subscriptions.${address}`,
      options.auctionAddress,
      'subscriptions',
      [address]
    );
  });
  const multiAuctionEndResult = await multiAuctionEnd.execute();
  const vestingDuration = BigInt(options.vestingDuration);

  // Any amount that was bought from the auction need to be linearly vested for {options.vestingDuration} time
  return Object.fromEntries(
    addresses
      .map((address) => {
        const subscribedAmount = BigInt(
          multiAuctionEndResult.subscriptions[address]
        );
        const remainingSubscribedAmount = BigInt(
          multiSnapshotBlockResult.subscriptions[address]
        );
        const walletBalance = BigInt(
          multiSnapshotBlockResult.balanceOf[address]
        );

        if (subscribedAmount === 0n) {
          // User was not in the auction, return their wallet balance
          return [address, walletBalance];
        } else {
          // Calculate the maximum amount that should be vested
          const maxVestedAmount =
            (subscribedAmount * totalProjectTokenAmount) /
            max(totalSubscriptions, floorQuoteAmount);
          // Calculate the vested amount based on the time since the auction ended
          const timeSinceAuctionEnded = snapshotTimestamp - auctionEndTimestamp;
          const vestedAmount =
            vestingDuration > 0n
              ? (maxVestedAmount *
                  max(0n, min(timeSinceAuctionEnded, vestingDuration))) /
                vestingDuration
              : maxVestedAmount;

          // Determine the final balance based on whether the user has claimed from the auction
          const finalBalance =
            remainingSubscribedAmount === 0n
              ? walletBalance - maxVestedAmount + vestedAmount
              : walletBalance + vestedAmount;

          return [address, finalBalance];
        }
      })
      .map(([address, amount]) => [
        address,
        parseFloat(formatUnits(amount.toString(), options.decimals))
      ])
  );
}
