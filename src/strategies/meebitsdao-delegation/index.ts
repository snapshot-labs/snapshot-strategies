import { strategy as meebitsdaoStrategy } from '../meebitsdao';
import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as erc721Strategy } from '../erc721';
import { subgraphRequest, getProvider } from '../../utils';
import { getSnapshots } from '../../utils/blockfinder';

export const author = 'maikir';
export const version = '0.1.0';

const MEEBITSDAO_DELEGATION_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/maikir/meebitsdao-delegation';

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

  // console.log(blocks);

  const params = {
    delegations: {
      __args: snapshot !== 'latest' ? { block: { number: snapshot } } : {},
      id: true,
      delegator: true,
      delegate: true
    }
  }

  const result = await subgraphRequest(MEEBITSDAO_DELEGATION_SUBGRAPH_URL, params);

  const mvoxScores = await erc20BalanceOfStrategy(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[0],
    snapshot
  );

  // console.log(mvoxScores);

  const mfndScores = await meebitsdaoStrategy(
    space,
    network,
    provider,
    addresses,
    options.tokenAddresses[1],
    snapshot
  );

  // console.log(mfndScores);

  const meebitsScores = await erc721Strategy(
    space,
    options.tokenAddresses[2].network,
    getProvider(options.tokenAddresses[2].network),
    addresses,
    options.tokenAddresses[2],
    blocks[options.tokenAddresses[2].network],
  );

  // console.log(meebitsScores);

  let delegations = {};

  result.delegations.forEach((delegation) => {
    if (delegation.delegator in mvoxScores && delegation.delegator in meebitsScores) {
      const meebitsScore = Math.max(1, Math.min(20, meebitsScores[delegation.delegator]));
      const mvoxScore = mvoxScores[delegation.delegator];
      (delegation.delegate in delegations)?(delegations[delegation.delegate]+=(mvoxScore*meebitsScore)):(delegations[delegation.delegate]=(mvoxScore*meebitsScore))
    }
  });

  return Object.fromEntries(
    Object.entries(mfndScores).map((address: any) => [
      address[0],
      (address[0] in delegations) ? address[1] + delegations[address[0]] : address[1]
    ])
  );
}
