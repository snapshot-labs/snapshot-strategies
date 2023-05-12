// import snapshot from '@snapshot-labs/snapshot.js';
// import Validation from '../validation';
// import {
//   getPassport,
//   getVerifiedStamps,
//   hasValidIssuanceAndExpiration
// } from './helper';

// export default class extends Validation {
//   public id = 'passport-weighted';
//   public github = 'snapshot-labs';
//   public version = '0.1.0';
//   public title = 'Gitcoin Passport Weighted';
//   public description =
//     'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

//   async validate(): Promise<boolean> {
//     const passport: any = await getPassport(this.author);
//     if (!passport) return false;
//     if (!passport.stamps?.length || !this.params.stamps?.length) return false;

//     const verifiedStamps: any[] = await getVerifiedStamps(
//       passport,
//       this.author,
//       this.params.stamps
//     );
//     if (!verifiedStamps.length) return false;

//     const provider = snapshot.utils.getProvider(this.network);
//     const proposalTs = (await provider.getBlock(this.snapshot)).timestamp;

//     let weight = 0;
//     this.params.stamps.forEach((stamp: any) => {
//       const verifiedStamp = verifiedStamps.find(
//         (s: any) => s.provider === stamp.id
//       );

//       // check that the credential is still valid (created before snapshot block and not expired)
//       if (
//         verifiedStamp &&
//         hasValidIssuanceAndExpiration(verifiedStamp.credential, proposalTs)
//       )
//         weight += stamp.weight;
//     });

//     return weight >= this.params.min_weight;
//   }
// }

import snapshot from '@snapshot-labs/snapshot.js';
import fetch from 'cross-fetch';
import Validation from '../validation';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'
const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport'



const headers = API_KEY ? ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY
}) : undefined


export default class extends Validation {
  public id = 'passport-weighted';
  public github = 'snapshot-labs';
  public version = '0.1.0';
  public title = 'Gitcoin Passport Weighted';
  public description =
    'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

  const THRESHOLD_NUMBER = this.params.minScore || 20;
  console.log(THRESHOLD_NUMBER);
  
  async getSigningMessage() {
    try {
        const response = await fetch(SIGNING_MESSAGE_URI, {
        headers
        })
        const json = await response.json()
        return json
    } catch (err) {
        console.log('error: ', err)
    }
  }

  async submitPassport() {
    try {
      const { message, nonce } = await this.getSigningMessage()

      const provider = snapshot.utils.getProvider(this.network);
      const signer = await provider.getSigner()

      let signature = '';
      try {
        signature = await signer.signMessage(message);
      } catch (err) {
        console.log('Error signing message:', err);
      }
      
      const address = this.author;

      const response = await fetch(SUBMIT_PASSPORT_URI, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address,
          scorer_id: SCORER_ID,
          signature,
          nonce
        })
      })
      const data = await response.json()
      console.log('data:', data)
    } catch (err) {
      console.log('error: ', err)
    }
  }

  async validate(currentAddress = this.author): Promise<boolean> {
      const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/${currentAddress}`
      await this.getSigningMessage();
      await this.submitPassport();

      try {
        const response = await fetch(GET_PASSPORT_SCORE_URI, {
          headers
        })
        const passportData = await response.json()
        if (passportData.score) {
          console.log(passportData.score)
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
