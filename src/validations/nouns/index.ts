import { getProvider, getScoresDirect } from '../../utils';
import Validation from '../validation';

export default class extends Validation {
  public id = 'nouns';
  public github = 'waterdrops';
  public version = '0.1.0';
  public title = 'Nouns';
  public description =
    'Use proposition power instead of voting power for nouns-rfp-power';

  async validate(): Promise<boolean> {
    const minScore = this.params.minScore;
    const strategies = [...this.params.strategies];

    const nounsRFPStrategyIndex = strategies.findIndex(
      ({ name }) => name === 'nouns-rfp-power'
    );

    // Use the proposition power instead of voting power
    if (nounsRFPStrategyIndex >= 0) {
      strategies[nounsRFPStrategyIndex].params.powerType = 'proposition';
    }

    if (minScore) {
      const scores = await getScoresDirect(
        this.space,
        this.params.strategies,
        this.network,
        getProvider(this.network),
        [this.author],
        this.snapshot || 'latest'
      );
      const totalScore: any = scores
        .map((score: any) =>
          Object.values(score).reduce((a, b: any) => a + b, 0)
        )
        .reduce((a, b: any) => a + b, 0);
      if (totalScore < minScore) return false;
    }

    return true;
  }
}
