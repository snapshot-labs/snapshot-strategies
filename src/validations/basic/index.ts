import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';

export default class extends Validation {
  public id = 'basic';
  public github = 'bonustrack';
  public version = '0.2.0';

  async validate(): Promise<boolean> {
    const minScore = this.params.minScore;

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
