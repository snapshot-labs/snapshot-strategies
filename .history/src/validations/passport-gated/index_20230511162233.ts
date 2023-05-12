/**
 * @fileoverview Passport-gated validation strategy for Snapshot. 
 * This implementation integrates with the Gitcoin API to validate 
 * whether a user is authorized to vote on a proposal. 
 * 
 * Last modified: May 11, 2023
 * 
 * NOTE: The original code used the Passport SDK to check if the user
 * has a valid passport. With the Passport API, we can simply check if
 * the user has a valid passport by looking for a score.
 * 
 * In this function, we are returning a binary score (0 or 1) depending
 * on wether the user's passport is flagged as a likely Sybil.
 * 
 */

// TODO: Ensure you have Scorer ID and API key stored in a .env root file
// - NEXT_PUBLIC_GC_API_KEY=<your-api-key>
// - NEXT_PUBLIC_GC_SCORER_ID=<your-scorer-id>

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
    public id = 'passport-gated';
    public github = 'snapshot-labs';
    public version = '0.1.0';
    public title = 'Gitcoin Passport Gated';
    public description =
      'Protect your proposals from spam and vote manipulation by requiring users to have a Gitcoin Passport.';

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
          console.log(response)
          const passportData = await response.json()
          console.log(passportData.score)
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
