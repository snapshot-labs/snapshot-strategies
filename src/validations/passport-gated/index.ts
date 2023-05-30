import fetch from 'cross-fetch';
import Validation from '../validation';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined

const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/`;
const GET_PASSPORT_STAMPS_URI = `https://api.scorer.gitcoin.co/registry/stamps/`;

export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

  async validate(currentAddress = this.author): Promise<boolean> {
    const THRESHOLD_NUMBER = this.params.minScore || 1;
    const requiredStamps = this.params.stamps || [];

    try {
      const [scoreResponse, stampsResponse] = await Promise.all([
        fetch(GET_PASSPORT_SCORE_URI + currentAddress, { headers }),
        fetch(GET_PASSPORT_STAMPS_URI + currentAddress, { headers })
      ]);

      const passportData = await scoreResponse.json()
      if (passportData.score) {
        const roundedScore = Math.round(passportData.score * 100) / 100
        if (roundedScore < THRESHOLD_NUMBER) {
          throw new Error(`Your passport score (${roundedScore}) is lower than the threshold score (${THRESHOLD_NUMBER}).`);
        }
      } else {
        throw new Error('You do not have a valid Gitcoin Passport. Create one by visiting https://passport.gitcoin.co/ ');
      }

      const stampsData = await stampsResponse.json();
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
     
