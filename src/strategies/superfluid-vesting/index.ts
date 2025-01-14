import { subgraphRequest } from '../../utils';
import { getAddress } from '@ethersproject/address';

export const author = 'd10r';
export const version = '0.1.0';

const SUBGRAPH_URL_MAP = {
  '10': 'https://subgrapher.snapshot.org/subgraph/arbitrum/6YMD95vYriDkmTJewC2vYubqVZrc6vdk3Sp3mR3YCQUw',
  '8453':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/4Zp6n8jcsJMBNa3GY9RZwoK4SLjoagwXGq6GhUQNMgSM',
  '11155420':
    'https://subgrapher.snapshot.org/subgraph/arbitrum/5UctBWuaQgr2HVSG6XtAKt5shyjg9snGvD6F424FcjMN'
};

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
): Promise<Record<string, number>> {
  const subgraphUrl = options.subgraphUrl || SUBGRAPH_URL_MAP[network];
  if (!subgraphUrl) {
    throw new Error('Subgraph URL not specified');
  }

  const query = {
    vestingSchedules: {
      __args: {
        where: {
          superToken: options.superTokenAddress,
          sender: options.vestingSenderAddress,
          endExecutedAt: null,
          failedAt: null,
          deletedAt: null
        },
        orderBy: 'cliffAndFlowDate',
        orderDirection: 'asc'
      },
      cliffAmount: true,
      cliffAndFlowDate: true,
      endDate: true,
      flowRate: true,
      cliffAndFlowExecutedAt: true,
      receiver: true,
      remainderAmount: true
    }
  };

  if (snapshot !== 'latest') {
    // @ts-ignore
    query.vestingSchedules.__args.block = { number: snapshot };
  }

  // Get block timestamp - needed for calculating the remaining amount
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const block = await provider.getBlock(blockTag);
  const timestamp = block.timestamp;

  const subgraphResult = await subgraphRequest(subgraphUrl, query);

  const processedMap = subgraphResult.vestingSchedules.map((schedule) => {
    const endDate = BigInt(schedule.endDate);
    const cliffAndFlowDate = BigInt(schedule.cliffAndFlowDate);
    const flowRate = BigInt(schedule.flowRate);
    const cliffAmount = BigInt(schedule.cliffAmount);
    const remainderAmount = BigInt(schedule.remainderAmount);

    // the initial vesting amount
    const fullAmount =
      cliffAmount + flowRate * (endDate - cliffAndFlowDate) + remainderAmount;

    // the remaining amount which hasn't yet vested
    let remainingAmount = fullAmount;
    if (schedule.cliffAndFlowExecutedAt !== null) {
      remainingAmount -=
        cliffAmount + flowRate * (BigInt(timestamp) - cliffAndFlowDate);
    }

    return {
      schedule: schedule,
      fullAmount: fullAmount,
      remainingAmount: remainingAmount
    };
  });

  // create a map of the remaining amounts
  return Object.fromEntries(
    processedMap.map((item) => [
      getAddress(item.schedule.receiver),
      // in theory remainingAmount could become negative, thus we cap at 0
      Math.max(Number(item.remainingAmount) / 1e18, 0)
    ])
  );
}
