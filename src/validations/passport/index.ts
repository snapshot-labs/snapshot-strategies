import Validation from '../validation';
import { PassportVerifier } from './helper';
import { Passport } from '@gitcoinco/passport-sdk-types';

export default class extends Validation {
  public id = 'passport';
  public github = 'snapshot-labs';
  public version = '0.1.0';

  async validate(): Promise<boolean> {
    const verifier = new PassportVerifier();
    const passport: Passport | false = await verifier.verifyPassport(
      this.author
    );

    // console.log(JSON.stringify(passport));
    let score = 0;
    if (!passport) return false;
    this.params.stamps.forEach((stamp: any) => {
      const found = passport?.stamps.find((s: any) => s.provider === stamp);
      if (found?.verified) score++;
    });

    return score >= this.params.minScore;
  }
}
