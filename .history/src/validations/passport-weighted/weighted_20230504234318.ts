/**
 * @fileoverview Passport-gated validation strategy for Snapshot. 
 * This implementation integrates with the Gitcoin API to validate 
 * whether a user is authorized to vote on a proposal. 
 * 
 * Last modified: May 4, 2023
 * 
 * NOTE: The original code used the Passport SDK to check if the user
 * has a valid passport. With the Passport API, we can simply check if
 * the user has a valid passport by looking for a score.
 * 
 * * In this function, we are returning a boolean depending on a weighted
 * threshold score between 0-100 that indicates how likely it is that a
 * passport is owned by an honest user.
 * 
 */

// TODO: Run code in Snapshot playground
// TODO: Test API endpoints

// QUESTION: Is this.author imply the users wallet already connected?

// FIXME: Currently calls locally stored environment variables

import { ethers } from 'ethers';
import snapshot from '@snapshot-labs/snapshot.js';
import provider from '@snapshot-labs/snapshot.js/dist/utils/provider';
import fetch from 'cross-fetch';
import Validation from '../validation';

// these lines read the API key and scorer ID from the .env.local file
const API_KEY = process.env.NEXT_PUBLIC_GC_API_KEY
const SCORER_ID = process.env.NEXT_PUBLIC_GC_SCORER_ID

// endpoint for getting the signing message
const SIGNING_MESSAGE_URI = 'https://api.scorer.gitcoin.co/registry/signing-message'
// endpoint for submitting passport
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

    /* get signing message from API */
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

    /* Send the signed message along with other arguments in a 
    separate API call to submit their passport */
    async submitPassport() {
        try {
          // call the API to get the signing message and the nonce
          const { message, nonce } = await this.getSigningMessage()
          
          //const provider = new ethers.BrowserProvider(window.ethereum)
          const provider = snapshot.utils.getProvider(this.network);
          const signer = await provider.getSigner()
          // ask the user to sign the message
          const signature = await signer.signMessage(message)
          // QUESTION: is this how to get the address?
          const address = this.author;
    
          // call the API, sending the signing message, the signature, and the nonce
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

    /* check the user's passport for scoring and returns true if user has a score */
    async validate(currentAddress = this.author): Promise<boolean> {
        const GET_PASSPORT_SCORE_URI = `https://api.scorer.gitcoin.co/registry/score/${SCORER_ID}/${currentAddress}`
        let score = '';
        let scoreMessage = '';

        try {
          const response = await fetch(GET_PASSPORT_SCORE_URI, {
            headers
          })
          const passportData = await response.json()
          if (passportData.score) {
            // if the user has a score, round it and set it in the local state
            const roundedScore = Math.round(passportData.score * 100) / 100
            score = roundedScore.toString()
            return true;
          } else {
            // if the user has no score, display a message letting them know to submit thier passporta
            console.log('No score available, please add stamps to your passport and then resubmit.')
            scoreMessage = 'No score available, please submit your passport after you have added some stamps.'
            return false;
            }
        } catch (err) {
          console.log('error: ', err)
        }
     return false;
    }
  }
