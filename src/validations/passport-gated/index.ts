import fetch from 'cross-fetch';
import Validation from '../validation';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

const GET_PASSPORT_STAMPS_URI = `https://api.scorer.gitcoin.co/registry/stamps/`;

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

  async validate(currentAddress = this.author): Promise<boolean> {
    const requiredStamps = this.params.stamps || [];

    try {
      const stampsResponse = await fetch(GET_PASSPORT_STAMPS_URI + currentAddress, { headers });

      const stampsData = await stampsResponse.json();

      if (!stampsData || !stampsData.items) {
        throw new Error('You do not have a valid Gitcoin Passport. Create one by visiting https://passport.gitcoin.co/ ');
      }

      const userStamps = stampsData.items.map(item => item.credential.credentialSubject.provider);
      for (const stamp of requiredStamps) {
        if (!userStamps.includes(stamp)) {
          throw new Error(`You do not have the required stamp: ${stamp}`);
        }
      }
      return true;

    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
     
