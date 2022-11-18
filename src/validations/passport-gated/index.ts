import snapshot from '@snapshot-labs/snapshot.js';
import Validation from '../validation';
import {
  getPassport,
  getVerifiedStamps,
  hasValidIssuanceAndExpiration
} from '../passport-weighted/helper';

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';

  async validate(): Promise<boolean> {
    const passport: any = await getPassport(this.author);
    if (!passport) return false;
    if (!passport.stamps?.length || !this.params.stamps?.length) return false;

    const verifiedStamps: any[] = await getVerifiedStamps(
      passport,
      this.author,
      this.params.stamps.map((stamp) => ({
        id: stamp
      }))
    );
    if (!verifiedStamps.length) return false;

    const provider = snapshot.utils.getProvider(this.network);
    const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;

    const operator = this.params.operator || 'AND';
    const validStamps = verifiedStamps.filter(
      (stamp) =>
        hasValidIssuanceAndExpiration(stamp.credential, proposalTs) &&
        this.params.stamps.includes(stamp.provider)
    );
    if (operator === 'AND') {
      return validStamps.length === this.params.stamps.length;
    } else if (operator === 'OR') {
      return validStamps.length > 0;
    } else {
      return false;
    }
  }
}
