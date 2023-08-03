import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';

export default class extends Validation {
  public id = 'strategy-zero-gated';
  public github = 'gnosis';
  public version = '0.0.1';
  public title = 'Strategy Zero Gated';
  public description =
    'If the specified strategy returns a score of 0, the user is not be allowed to vote. If no score is returned or a score greater than 0 is returned, the user should be allowed to vote.';

  async validate(currentAddress = this.author): Promise<boolean> {
    const scores = await getScoresDirect(
      this.space,
      [this.params.strategy],
      this.network,
      getProvider(this.network),
      [currentAddress],
      this.snapshot || 'latest'
    );

    if (scores == null || scores.length === 0) return true; // No score returned, allow user to vote

    const score = scores[0] as any[];

    if (score == null || score[0] == null || score.length === 0) return true; // No score returned, allow user to vote

    return score[0] !== 0; // If score is 0, do not allow user to vote, if its greater than 0 or undefined/null, allow user to vote
  }
}
