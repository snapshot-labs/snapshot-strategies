import { strategy as meebitsdaoStrategy } from '../meebitsdao';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as erc721Strategy } from '../erc721';
import { subgraphRequest, getProvider } from '../../utils';
import { getSnapshots } from '../../utils/blockfinder';

export const author = 'lightninglu10';
export const version = '0.1.0';

const MEEBITSDAO_DELEGATION_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/maikir/meebitsdao-delegation';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blocks = await getSnapshots(
    network,
    snapshot,
    provider,
    options.tokenAddresses.map((s) => s.network || network)
  );

  const params = {
    delegations: {
      __args: snapshot !== 'latest' ? { block: { number: snapshot } } : {},
      id: true,
      delegator: true,
      delegate: true
    }
  };

  const result = await subgraphRequest(
    MEEBITSDAO_DELEGATION_SUBGRAPH_URL,
    params
  );

  const mvoxAddresses: string[] = [];
  result.delegations.forEach((delegation) => {
    mvoxAddresses.push(delegation.delegator);
  });

  const mvoxScores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    mvoxAddresses,
    options.tokenAddresses[0],
    snapshot
  );

  const mfndScores = await meebitsdaoStrategy(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[1],
    snapshot
  );

  const meebitsScores = await erc721Strategy(
    space,
    options.tokenAddresses[2].network,
    getProvider(options.tokenAddresses[2].network),
    addresses,
    options.tokenAddresses[2],
    blocks[options.tokenAddresses[2].network]
  );

  const delegations = {};

  result.delegations.forEach((delegation) => {
    let meebitsScore = 0;
    let mvoxScore = 0;
    if (
      delegation.delegator in mvoxScores &&
      delegation.delegate in meebitsScores
    ) {
      meebitsScore = Math.max(1, Math.min(20, meebitsScores[delegation.delegate]));
      mvoxScore = mvoxScores[delegation.delegator];
    }

    if (delegation.delegate in delegations) {
      delegations[delegation.delegate] += mvoxScore * meebitsScore;
    } else {
      delegations[delegation.delegate] = mvoxScore * meebitsScore;
    }
  });

  return Object.fromEntries(
    Object.entries(mfndScores).map((address: any) => [
      address[0],
      Math.min(
        (address[0] in delegations
        ? Math.max(address[1], delegations[address[0]])
        : address[1]),
        1000
      )
    ])
  );
}
