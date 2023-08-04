import Validation from '../validation';
import { getProvider, getScoresDirect } from '../../utils';

export default class extends Validation {
  public id = 'aave';
  public github = 'pyk';
  public version = '0.1.0';
  public title = 'Aave DAO Proposal Validation';
  public description = 'Validation to determine if a user can create proposal.';
  public proposalValidationOnly = true;

  async validate(): Promise<boolean> {
    if (this.params.strategies?.length > 8)
      throw new Error(`Max number of strategies exceeded`);
    const minScore = this.params.minScore;
    const whitelist = this.params.whitelist;

    if (whitelist) {
      if (whitelist.includes(this.author)) return true;
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
