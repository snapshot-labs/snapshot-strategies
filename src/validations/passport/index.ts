import snapshot from '@snapshot-labs/snapshot.js';
import Validation from '../validation';
import {
  getPassport,
  getVerifiedStamps,
  hasValidIssuanceAndExpiration
} from './helper';

export default class extends Validation {
  public id = 'passport';
  public github = 'snapshot-labs';
  public version = '0.1.0';

  async validate(): Promise<boolean> {
    const passport: any = await getPassport(this.author);
    if (!passport) return false;
    if (!passport.stamps?.length || !this.params.stamps?.length) return false;

    const verifiedStamps: any[] = await getVerifiedStamps(
      passport,
      this.author,
      this.params.stamps
    );
    if (!verifiedStamps.length) return false;

    const provider = snapshot.utils.getProvider(this.network);
    const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;

    let weight = 0;
    this.params.stamps.forEach((stamp: any) => {
      const verifiedStamp = verifiedStamps.find(
        (s: any) => s.provider === stamp.id
      );

      // check that the credential is still valid (created before snapshot block and not expired)
      if (
        verifiedStamp &&
        hasValidIssuanceAndExpiration(verifiedStamp.credential, proposalTs)
      )
        weight += stamp.weight;
    });

    return weight >= this.params.min_weight;
  }
}
