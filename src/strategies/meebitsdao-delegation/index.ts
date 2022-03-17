import { subgraphRequest } from '../../utils';
import { getScoresDirect } from '../../utils';

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

  // console.log(result);

  const mvoxAddresses: string[] = [];
  result.delegations.forEach((delegation) => {
    mvoxAddresses.push(delegation.delegator);
  });

  const scores: {} = {};
  await Promise.all(options.strategies.map(async (strategy) => {
    const score = (
      await getScoresDirect(
        space,
        [strategy],
        network,
        provider,
        strategy.params.symbol === 'mVOX' ? mvoxAddresses : addresses,
        snapshot
      )
    ).filter((score) => Object.keys(score).length !== 0);
    scores[strategy.params.symbol] = score[0];
  }))

  const mvoxScores = scores['mVOX'];
  const mfndScores = scores['MFND'];
  const meebitsScores = scores['Meebits'];

  const delegations = {};

  result.delegations.forEach((delegation) => {
    let meebitsScore = 0;
    let mvoxScore = 0;
    if (
      delegation.delegator in mvoxScores &&
      delegation.delegate in meebitsScores
    ) {
      meebitsScore = Math.min(20, meebitsScores[delegation.delegate]);
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
      address[0] in delegations
        ? Math.max(address[1], delegations[address[0]])
        : address[1]
    ])
  );
}
