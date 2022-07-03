import strategies from '..';
import { strategy as proofOfHumanityStrategy } from '../proof-of-humanity';
import { strategy as brightIdStrategy } from '../brightid';

export const author = 'samuveth';
export const version = '0.1.0';

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  async function getProofOfHumanity() {
    if (!options?.sybil?.poh) return {};
    return await proofOfHumanityStrategy(
      space,
      '1',
      provider,
      addresses,
      { address: options.sybil.poh },
      snapshot
    );
  }

  async function getBrightId() {
    if (!options?.sybil?.brightId) return {};
    return await brightIdStrategy(
      space,
      network,
      provider,
      addresses,
      { registry: options.sybil.brightId },
      snapshot
    );
  }

  const [scores, proofOfHumanity, brightId] = await Promise.all([
    await strategies[options.strategy.name].strategy(
      space,
      network,
      provider,
      addresses,
      options.strategy.params,
      snapshot
    ),
    getProofOfHumanity(),
    getBrightId()
  ]);

  // Reduce voting power of address to zero if cybil check doesn't pass
  const cybilScores = Object.keys(scores).reduce((acc, key) => {
    if (proofOfHumanity?.[key] === 1) {
      acc[key] = scores[key];
    } else if (brightId?.[key] === 1) {
      acc[key] = scores[key];
    } else {
      acc[key] = 0;
    }
    return acc;
  }, {});

  return cybilScores;
}
