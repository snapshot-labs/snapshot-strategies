import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';

export default class extends Validation {
  public id = 'aave';
  public github = 'kartojal';
  public version = '0.2.0';

  /**
   * Aave Space Validation proposal validation uses:
   *  - Proposition power of GovernanceStrategy contract
   *  - Other active Aave Snapshot voting strategies
   *
   * The current validation implementation mutates the "strategies" field of the space
   * to be able to use proposition power instead of voting power for "aave-governance-power".
   *
   */
  async validate(): Promise<boolean> {
    const minScore = this.params.minScore;
    const strategies = this.params.strategies;

    const aaveGovernanceStrategyIndex = strategies.findIndex(
      ({ name }) => name === 'aave-governance-power'
    );

    // Use the proposition power instead of voting power
    if (aaveGovernanceStrategyIndex >= 0) {
      strategies[aaveGovernanceStrategyIndex].params.powerType = 'proposition';
    }

    if (minScore) {
      const scores = await getScoresDirect(
        this.space,
        strategies,
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
