import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';
import { Protocol } from '../../types';

export default class extends Validation {
  public id = 'basic';
  public github = 'bonustrack';
  public version = '0.2.0';
  public title = 'Basic';
  public description = 'Use any strategy to determine if a user can vote.';
  public supportedProtocols: Protocol[] = ['evm', 'starknet'];
  public hasInnerStrategies = true;

  protected async doValidate(): Promise<boolean> {
    const minScore = this.params.minScore;

    if (!minScore) return true;

    const scores = await getScoresDirect(
      this.space,
      this.params.strategies,
      this.network,
      getProvider(this.network),
      [this.author],
      this.snapshot || 'latest'
    );
    const totalScore: any = scores
      .map((score: any) => Object.values(score).reduce((a, b: any) => a + b, 0))
      .reduce((a, b: any) => a + b, 0);

    return totalScore >= minScore;
  }
}
