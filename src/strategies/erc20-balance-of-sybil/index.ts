import { strategy as erc20BalanceOfStrategy } from '../erc20-balance-of';
import { strategy as proofOfHumanityStrategy } from '../proof-of-humanity';

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
  const [score, proofOfHumanity] = await Promise.all([
    await erc20BalanceOfStrategy(
      space,
      network,
      provider,
      addresses,
      options,
      snapshot
    ),
    await proofOfHumanityStrategy(
      space,
      network,
      provider,
      addresses,
      { address: options.poh },
      snapshot
    )
  ]);

  // Filter score to only include addresses with proof of humanity = 1
  const scoresWithPoh = Object.keys(score).reduce((acc, key) => {
    if (proofOfHumanity[key] === 1) {
      acc[key] = score[key];
    } else {
      acc[key] = 0;
    }
    return acc;
  }, {});

  return scoresWithPoh;
}
