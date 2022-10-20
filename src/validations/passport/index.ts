import Validation from '../validation';
import { getPassport, getVerifiedStamps } from './helper';

export default class extends Validation {
  public id = 'passport';
  public github = 'snapshot-labs';
  public version = '0.1.0';

  async validate(): Promise<boolean> {
    const passport: any = await getPassport(this.author);
    if (!passport) return false;
    if (!passport.stamps || !this.params.stamps) return false;

    const verifiedStamps: false | any[] = await getVerifiedStamps(
      passport,
      this.author,
      this.params.stamps
    );
    if (!verifiedStamps) return false;

    let weight = 0;
    this.params.stamps.forEach((stamp: any) => {
      const found = verifiedStamps.find((s: any) => s.provider === stamp.id);
      if (found?.verified) weight += stamp.weight;
    });


    return weight >= this.params.min_weight;
  }
}
