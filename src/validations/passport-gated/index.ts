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


export default class extends Validation {
  public id = 'passport-gated';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Gated';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

  async validate(currentAddress = this.author): Promise<boolean> {
      const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/${currentAddress}`

      try {
        const response = await fetch(GET_PASSPORT_SCORE_URI, {
          headers
        })
        const passportData = await response.json()
        if (passportData.score) {
          return true;
        } else {
          console.log('You do not have a valid Gitcoin Passport. Create one by visiting https://passport.gitcoin.co/ ')
          return false;
          }
      } catch (err) {
        console.log('error: ', err)
        return false;
      }
  }
}
