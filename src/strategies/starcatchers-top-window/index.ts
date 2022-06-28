import { subgraphRequest } from '../../utils';

export const author = 'sunshinekitty';
export const version = '0.0.1';

const SC_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/sunshinekitty/starcatchers-ia1';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  if (!options.origin) {
    options.origin = 14277684; // Block at 2/25/22 2:22pm PT (DST)
  }
  if (!options.delegateLimit) {
    options.delegateLimit = 35;
  }
  if (!options.delegateDuration) {
    const bpd = 6500; // Estimated blocks produced per day.
    options.delegateDuration = 14 * bpd; // 2w
  }
  // Based on snapshot or current block height, calculates delegate cycles that
  // have passed, then determines block height for current delegate cycle.
  const blockNumber: number =
    typeof snapshot === 'number' ? snapshot : await provider.getBlockNumber();
  const cyclesPassed: number =
    ((blockNumber - Number(options.origin)) /
      Number(options.delegateDuration)) |
    0;
  const voteBlock: number =
    Number(options.origin) + cyclesPassed * Number(options.delegateDuration);

  const query = {
    voteWeights: {
      __args: {
        first: Number(options.delegateLimit),
        orderBy: 'weight',
        orderDirection: 'desc',
        block: {
          number: voteBlock
        }
      },
      id: true,
      weight: true
    }
  };
  const results = await subgraphRequest(SC_GRAPH_URL, query);
  if (!results) {
    return;
  }

  const delegates = {};
  addresses.forEach((address: string) => {
    delegates[address] = 0;
    for (let i = 0; i < Number(options.delegateLimit); i++) {
      if (results.voteWeights[i].id == address.toLowerCase()) {
        delegates[address] = 1;
      }
    }
  });
  return delegates;
}
